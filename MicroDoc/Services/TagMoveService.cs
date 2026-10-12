using System.Collections.Concurrent;
using YamlDotNet.Serialization;

namespace MicroDoc.Services
{
    public class TagMoveService
    {
        internal static string MoveFileName = "move.ini";

        class TagMove 
        { 
            public string Old { get; set; }
            public string New { get; set; }
        }

        private readonly DomainOptions _domainOptions;
        private readonly LockManager _lockManager;

        private readonly ConcurrentDictionary<string, List<TagMove>> hash = new();

        public TagMoveService(DomainOptions domainOptions, LockManager lockManager)
        {
            _domainOptions = domainOptions;
            _lockManager = lockManager;
        }

        public string ResolveDocument(string domain, string documentId)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var filePath = Path.Combine(rootFolder, documentId);

            if (File.Exists(filePath))
                return documentId;

            var moves = hash.GetOrAdd(domain, LoadMoves);
            // get copy of domain's moves collection
            using (_lockManager.Read(domain, DocumentParser.GetDocumentId("", MoveFileName)))
                moves = moves.ToList();

            var movedDocumentId = documentId;

            foreach (var move in moves)
            {
                if (!movedDocumentId.StartsWith(move.Old + "/"))
                    continue;

                movedDocumentId = move.New + movedDocumentId.Substring(move.Old.Length);
            }

            var movedFilePath = Path.Combine(rootFolder, movedDocumentId);
            if (File.Exists(movedFilePath))
                return movedDocumentId;

            return null;
        }

        public void Move(string domain, string selectedTag, string newTag)
        {
            var moves = hash.GetOrAdd(domain, LoadMoves);

            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var filePath = Path.Combine(rootFolder, MoveFileName);

            string line = $"- {{ Old: \"{selectedTag}\", New: \"{newTag}\" }}\n";

            // append line to moves file
            using (_lockManager.Write(domain, DocumentParser.GetDocumentId("", MoveFileName)))
            {
                File.AppendAllText(filePath, line);
                moves.Add(new TagMove { Old = selectedTag, New = newTag });
            }
        }

        private List<TagMove> LoadMoves(string domain)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var filePath = Path.Combine(rootFolder, MoveFileName);

            var deserializer = new DeserializerBuilder().Build();

            // read moves file
            using (_lockManager.Read(domain, DocumentParser.GetDocumentId("", MoveFileName)))
            {
                if (!File.Exists(filePath))
                    return new List<TagMove>();
                
                string yaml = File.ReadAllText(filePath);
                var moves = deserializer.Deserialize<TagMove[]>(yaml);
                return moves.ToList();
            }
        }
    }
}
