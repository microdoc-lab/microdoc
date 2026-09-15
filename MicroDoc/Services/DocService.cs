using Microsoft.Extensions.Options;

namespace MicroDoc.Services
{
    public class DocService
    {
        private readonly MicroDocOptions _options;

        public DocService(IOptions<MicroDocOptions> options)
        {
            _options = options.Value;
        }

        public List<DocNode> GetDocuments(string path)
        {
            var folder = Path.Combine(_options.RootFolder, path ?? "");

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
