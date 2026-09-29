using System.IO;

namespace MicroDoc.Services
{
    public class DocService
    {
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
                var node = new TagNode
                {
                    Domain = domain,
                    Path = Path.GetDirectoryName(path ?? ""),
                    Tag = Path.GetFileName(path),
                    Documents = GetDocuments(domain, path)
                };

                nodes.Add(node);

                if (!string.IsNullOrEmpty(path))
                {
                    var children = _tagTreeService.BuildTree(domain, path, false);
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

                string content = null;
                if (extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase))
                    content = File.ReadAllText(file);

                var node = new DocNode
                {
                    Domain = domain,
                    Path = path ?? "",
                    Name = name,
                    Extension = extension,
                    Content = content,
                    Html = Markup.ToHtml(content)
                };

                nodes.Add(node);
            }

            nodes = nodes.OrderBy(d => d.Extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase) ? 0 : 1).ToList();
            return nodes;
        }

        public void SaveDocument(string domain, string documentId, string content)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var path = Path.Combine(rootFolder, documentId);
            File.WriteAllText(path, content);
        }
    }
}
