using System.Collections.Concurrent;

namespace MicroDoc.Services
{
    public sealed class LockManager
    {
        private readonly ConcurrentDictionary<string, ReaderWriterLockSlim> lockHash =
            new(StringComparer.Ordinal);

        public IDisposable Read(string domain, string path) =>
            Acquire(domain, path, writeTarget: false);

        public IDisposable Write(string domain, string path) =>
            Acquire(domain, path, writeTarget: true);

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

                return new Lease(acquired);
            }
            catch
            {
                Release(acquired);
                throw;
            }
        }

        private static List<string> GetLockKeys(
            string domain,
            string path)
        {
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

        private sealed class Lease(
            List<(ReaderWriterLockSlim Lock, bool Write)> acquired)
            : IDisposable
        {
            private List<(ReaderWriterLockSlim Lock, bool Write)> locks = acquired;

            public void Dispose()
            {
                var current = Interlocked.Exchange(ref locks, null);

                if (current is not null)
                    Release(current);
            }
        }
    }
}
