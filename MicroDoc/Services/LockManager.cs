using System.Collections.Concurrent;
using System.Diagnostics;

namespace MicroDoc.Services
{
    public sealed class LockManager
    {
        private readonly ConcurrentDictionary<string, ReaderWriterLockSlim> lockHash =
            new(StringComparer.Ordinal);

        private readonly ILogger<LockManager> _logger;
        private readonly DomainOptions _domainOptions;

        private static readonly TimeSpan SlowLockThreshold =
            TimeSpan.FromSeconds(1);

        public LockManager(ILogger<LockManager> logger, DomainOptions domainOptions)
        {
            _logger = logger;
            _domainOptions = domainOptions;
        }

        public IDisposable Read(string domain, string path) =>
            Acquire(domain, path, writeTarget: false);

        public IDisposable Write(string domain, string path) =>
            Acquire(domain, path, writeTarget: true);

        public IDisposable Write2(string domain, string source, string destination) =>
            Acquire(domain, source, destination);

        public IDisposable WriteFolder(string domain, string folderId) =>
            Acquire(domain, folderId, writeTarget: true);

        private IDisposable Acquire(
            string domain,
            string path,
            bool writeTarget)
        {
            ValidateDomain(domain);
            ValidatePath(path);

            var keys = GetLockKeys(domain, path);
            var acquired = new List<(ReaderWriterLockSlim Lock, bool Write)>();

            string mode = writeTarget ? "Write" : "Read";
            var waitTimer = Stopwatch.StartNew();

            try
            {
                for (int i = 0; i < keys.Count; i++)
                {
                    var rwLock = lockHash.GetOrAdd(
                        keys[i],
                        static _ => new ReaderWriterLockSlim(
                            LockRecursionPolicy.SupportsRecursion));

                    bool useWriteLock = writeTarget && i == keys.Count - 1;

                    if (useWriteLock)
                        rwLock.EnterWriteLock();
                    else
                        rwLock.EnterReadLock();

                    acquired.Add((rwLock, useWriteLock));
                }

                waitTimer.Stop();

                if (_logger.IsEnabled(LogLevel.Trace))
                {
                    _logger.LogTrace(
                        "Document lock acquired: Mode={Mode}, Domain={Domain}, " +
                        "{Path}, WaitMs={WaitMs}",
                        mode, domain, path, waitTimer.ElapsedMilliseconds);
                }

                if (waitTimer.Elapsed >= SlowLockThreshold)
                {
                    _logger.LogWarning(
                        "Slow document lock acquisition: Mode={Mode}, Domain={Domain}, " +
                        "{Path}, WaitMs={WaitMs}",
                        mode, domain, path, waitTimer.Elapsed.TotalMilliseconds);
                }

                return new Lease(
                    acquired,
                    _logger,
                    mode,
                    domain,
                    path,
                    waitTimer.Elapsed);
            }
            catch
            {
                Release(acquired);
                throw;
            }
        }

        private List<string> GetLockKeys(
            string domain,
            string path)
        {
            if (!_domainOptions.Find(domain).IsCaseSensitive)
            { 
                domain = domain.ToLowerInvariant();
                path = path.ToLowerInvariant();
            }

            var keys = new List<string> { domain + ":" };

            if (path.Length == 0)
                return keys;

            string current = domain + ":";

            foreach (string part in path.Split('/'))
            {
                current += part;
                keys.Add(current);
                current += "/";
            }

            return keys;
        }

        private IDisposable Acquire(
            string domain,
            string source,
            string destination)
        {
            ValidateDomain(domain);
            ValidatePath(source);
            ValidatePath(destination);

            var lockModes = new Dictionary<string, bool>(StringComparer.Ordinal);

            AddPathLocks(lockModes, domain, source, writeTarget: true);
            AddPathLocks(lockModes, domain, destination, writeTarget: true);

            var acquired = new List<(ReaderWriterLockSlim Lock, bool Write)>();

            string mode = "Write2";
            var waitTimer = Stopwatch.StartNew();

            try
            {
                foreach (var entry in lockModes.OrderBy(x => x.Key, StringComparer.Ordinal))
                {
                    var rwLock = lockHash.GetOrAdd(
                        entry.Key,
                        static _ => new ReaderWriterLockSlim(
                            LockRecursionPolicy.SupportsRecursion));

                    bool write = entry.Value;

                    if (write)
                        rwLock.EnterWriteLock();
                    else
                        rwLock.EnterReadLock();

                    acquired.Add((rwLock, write));
                }

                waitTimer.Stop();

                if (_logger.IsEnabled(LogLevel.Trace))
                {
                    _logger.LogTrace(
                        "Document lock acquired: Mode={Mode}, Domain={Domain}, " +
                        "{Source} | {Destination}, WaitMs={WaitMs}",
                        mode, domain, source, destination, waitTimer.ElapsedMilliseconds);
                }

                if (waitTimer.Elapsed >= SlowLockThreshold)
                {
                    _logger.LogWarning(
                        "Slow document lock acquisition: Mode={Mode}, Domain={Domain}, " +
                        "{Source} | {Destination}, WaitMs={WaitMs}",
                        mode, domain, source, destination, waitTimer.Elapsed.TotalMilliseconds);
                }

                return new Lease(
                    acquired,
                    _logger,
                    mode,
                    domain,
                    source + " | " + destination,
                    waitTimer.Elapsed);
            }
            catch
            {
                Release(acquired);
                throw;
            }
        }

        private void AddPathLocks(
            Dictionary<string, bool> lockModes,
            string domain,
            string path,
            bool writeTarget)
        {
            var keys = GetLockKeys(domain, path);

            for (int i = 0; i < keys.Count; i++)
            {
                bool write = writeTarget && i == keys.Count - 1;

                if (!lockModes.TryGetValue(keys[i], out bool existingWrite))
                    lockModes.Add(keys[i], write);
                else if (write && !existingWrite)
                    lockModes[keys[i]] = true;
            }
        }

        private static void ValidateDomain(string domain)
        {
            if (string.IsNullOrWhiteSpace(domain) ||
                domain.Contains(':') ||
                domain.Contains('/') ||
                domain.Contains('\\'))
            {
                throw new ArgumentException(
                    "Invalid domain name.", nameof(domain));
            }
        }

        private static void ValidatePath(string path)
        {
            if (path is null)
                throw new ArgumentNullException(nameof(path));

            if (path.Length == 0)
                return; // Domain root, for folder-level operations.

            if (path.StartsWith('/') ||
                path.Contains('\\') ||
                path.Split('/').Any(
                    part => part.Length == 0 || part == "." || part == ".."))
            {
                throw new ArgumentException(
                    "Path must be a canonical relative path.",
                    nameof(path));
            }
        }

        private static void Release(
            List<(ReaderWriterLockSlim Lock, bool Write)> acquired)
        {
            for (int i = acquired.Count - 1; i >= 0; i--)
            {
                var (rwLock, write) = acquired[i];

                if (write)
                    rwLock.ExitWriteLock();
                else
                    rwLock.ExitReadLock();
            }
        }

        private sealed class Lease : IDisposable
        {
            private List<(ReaderWriterLockSlim Lock, bool Write)> _locks;
            private readonly ILogger _logger;
            private readonly string _mode;
            private readonly string _domain;
            private readonly string _path;
            private readonly TimeSpan _waitTime;
            private readonly Stopwatch _holdTimer = Stopwatch.StartNew();

            public Lease(
                List<(ReaderWriterLockSlim Lock, bool Write)> locks,
                ILogger logger,
                string mode,
                string domain,
                string path,
                TimeSpan waitTime)
            {
                _locks = locks;
                _logger = logger;
                _mode = mode;
                _domain = domain;
                _path = path;
                _waitTime = waitTime;
            }

            public void Dispose()
            {
                var locks = Interlocked.Exchange(ref _locks, null);
                if (locks is null)
                    return;

                _holdTimer.Stop();

                try
                {
                    Release(locks);
                }
                finally
                {
                    if (_logger.IsEnabled(LogLevel.Trace))
                    {
                        _logger.LogTrace(
                            "Document lock released: Mode={Mode}, Domain={Domain}, " +
                            "{Path}, WaitMs={WaitMs}, HeldMs={HeldMs}",
                            _mode,
                            _domain,
                            _path,
                            _waitTime.TotalMilliseconds,
                            _holdTimer.Elapsed.TotalMilliseconds);
                    }
                }
            }
        }
    }
}
