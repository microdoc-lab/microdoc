namespace MicroDoc.Services
{
    public class DocService
    {
        private readonly DomainOptions _domainOptions;

        public DocService(DomainOptions domainOptions)
        {
            _domainOptions = domainOptions;
        }

        public List<DocNode> GetDocuments(string domain, string path)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, path ?? "");

            var nodes = new List<DocNode>();
            foreach (var file in Directory.GetFiles(folder))
            {
                string name = Path.GetFileName(file);
                string extension = Path.GetExtension(file);

                if (name.Equals(TagTreeService.ViewFileName, StringComparison.InvariantCultureIgnoreCase))
                    continue;

                string content = null;
                if (extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase))
                    content = File.ReadAllText(file);

                var node = new DocNode
                {
                    Domain = domain,
                    Path = path ?? "",
                    Name = name,
                    Content = content
                };

                nodes.Add(node);
            }

            return nodes;
        }
    }
}
