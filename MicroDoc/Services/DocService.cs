using System.IO;

namespace MicroDoc.Services
{
    public class DocService
    {
        private static readonly string[] ImageExtensions = new[] 
        { 
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
            ".svg",
        };

        private readonly DomainOptions _domainOptions;
        private readonly TagTreeService _tagTreeService;

        public DocService(DomainOptions domainOptions, TagTreeService tagTreeService)
        {
            _domainOptions = domainOptions;
            _tagTreeService = tagTreeService;
        }

        public List<TagNode> GetTagWithDocuments(string domain, string path) => GetTagWithDocuments(domain, path, recursive: true);

        private List<TagNode> GetTagWithDocuments(string domain, string path, bool recursive)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, path ?? "");

            var nodes = new List<TagNode>();

            if (Directory.Exists(folder))
            {
                var (parent, tag) = DocumentParser.SplitId(path);
                var node = new TagNode
                {
                    Domain = domain,
                    Path = parent,
                    Tag = tag,
                    Documents = GetDocuments(domain, path),
                    Level = 0,
                    IsDomain = string.IsNullOrEmpty(tag)
                };

                nodes.Add(node);

                // if (!string.IsNullOrEmpty(path))
                {
                    var children = _tagTreeService.BuildTree(domain, path, recursive: false, level: 1);
                    foreach (var child in children)
                        child.Documents = GetDocuments(domain, child.Id);
                    nodes.AddRange(children);
                }
            }

            return nodes;
        }

        public List<DocNode> GetDocuments(string domain, string path)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, path ?? "");

            var nodes = new List<DocNode>();
            foreach (var file in Directory.GetFiles(folder))
            {
                string name = Path.GetFileNameWithoutExtension(file);
                string extension = Path.GetExtension(file);

                if ((name + extension).Equals(TagTreeService.ViewFileName, StringComparison.InvariantCultureIgnoreCase))
                    continue;

                if (ImageExtensions.Any(ext => extension.Equals(ext, StringComparison.InvariantCultureIgnoreCase)))
                    continue;

                string content = "";
                if (extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase))
                    content = File.ReadAllText(file);

                var node = new DocNode
                {
                    Domain = domain,
                    Path = path ?? "",
                    Name = name,
                    Extension = extension,
                    Content = content,
                };

                node.Html = new Markup(this, node.Domain, node.Id).ToHtml(content);

                nodes.Add(node);
            }

            nodes = nodes.OrderBy(d => d.Extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase) ? 0 : 1).ToList();
            return nodes;
        }

        public ErrorCode SaveDocument(string domain, string documentId, string content)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var path = Path.Combine(rootFolder, documentId);

            var folder = Path.GetDirectoryName(path);
            if (!Directory.Exists(folder))
                return ErrorCode.TagNotFound;

            File.WriteAllText(path, content);

            return ErrorCode.Ok;
        }

        public ErrorCode DeleteDocument(string domain, string documentId)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var path = Path.Combine(rootFolder, documentId);

            var folder = Path.GetDirectoryName(path);
            if (!Directory.Exists(folder))
                return ErrorCode.TagNotFound;

            if (!File.Exists(path))
                return ErrorCode.Ok;

            File.Delete(path);

            return ErrorCode.Ok;
        }

        public string GetImageFilePath(string domain, string documentId, string imageName)
        {
            var imageId = DocumentParser.GetImageId(documentId, imageName);
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            string filePath = Path.Combine(rootFolder, imageId);
            return filePath;
        }

        public string GetImageFileVersion(string domain, string documentId, string imageName)
        {
            var filePath = GetImageFilePath(domain, documentId, imageName);
            var time = File.GetLastWriteTimeUtc(filePath);
            return time.Ticks.ToString("x");
        }
    }
}
