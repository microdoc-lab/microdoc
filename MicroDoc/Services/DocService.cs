namespace MicroDoc.Services
{
    public class DocService
    {
        private static readonly string[] ServiceExtensions =
        { 
            ".ini"
        };

        private static readonly string[] ImageExtensions =
        { 
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
            ".svg",
        };

        private readonly DomainOptions _domainOptions;
        private readonly LockManager _lockManager;
        private readonly TagService _tagService;

        public DocService(DomainOptions domainOptions, LockManager lockManager, TagService tagService)
        {
            _domainOptions = domainOptions;
            _lockManager = lockManager;
            _tagService = tagService;
        }

        public List<TagNode> GetTagWithDocuments(string domain, string path, bool loadDeepLevels = false)
        {
            path = path ?? "";
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, path);

            var nodes = new List<TagNode>();

            using (_lockManager.Read(domain, path))
            {
                if (Directory.Exists(folder))
                {
                    var (parent, tag) = DocumentParser.SplitId(path);

                    // load requested tag with documents
                    var node = new TagNode
                    {
                        Domain = domain,
                        Path = parent,
                        Tag = tag,
                        Level = 0,
                        IsDomain = string.IsNullOrEmpty(tag)
                    };

                    // load child tags (1 level or all)
                    var children = _tagService.BuildTree(domain, path, recursive: loadDeepLevels, level: 1);
                    node.Children.AddRange(children);

                    // load recursively tags documents
                    Action<TagNode> loadDocuments = null;
                    loadDocuments = tag =>
                    {
                        tag.Documents = GetDocuments(domain, tag.Id);
                        nodes.Add(tag);

                        if (tag.Children != null)
                            foreach (var child in tag.Children)
                                loadDocuments(child);
                    };
                    
                    loadDocuments(node);
                }
            }

            return nodes;
        }

        public List<DocNode> GetDocuments(string domain, string path)
        {
            path = path ?? "";
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, path);

            var nodes = new List<DocNode>();
            using (_lockManager.Read(domain, path))
            {
                foreach (var file in Directory.GetFiles(folder))
                {
                    string name = Path.GetFileNameWithoutExtension(file);
                    string extension = Path.GetExtension(file);

                    // skip .ini
                    if (ServiceExtensions.Any(ext => extension.Equals(ext, StringComparison.InvariantCultureIgnoreCase)))
                        continue;

                    // skip images
                    if (ImageExtensions.Any(ext => extension.Equals(ext, StringComparison.InvariantCultureIgnoreCase)))
                        continue;

                    string documentId = file.Substring(rootFolder.Length).TrimStart('\\').Replace("\\", "/");

                    DocNode node;
                    using (_lockManager.Read(domain, documentId))
                    {
                        node = new DocNode
                        {
                            Domain = domain,
                            Path = path,
                            Name = name,
                            Extension = extension,
                        };

                        // load content only for .txt files
                        string content = "";
                        if (extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase))
                            content = File.ReadAllText(file);

                        node.Content = content;
                    }

                    // convert content to HTML
                    node.Html = new Markup(this, node.Domain, node.Id).ToHtml(node.Content);

                    nodes.Add(node);
                }
            }

            // order .txt files first
            nodes = nodes.OrderBy(d => d.Extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase) ? 0 : 1).ToList();
            return nodes;
        }

        public DocNode LoadDocument(string domain, string documentId)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            string filePath = Path.Combine(rootFolder, documentId);

            var (parent, name) = DocumentParser.SplitId(documentId);
            string document = Path.GetFileNameWithoutExtension(name);
            string extension = Path.GetExtension(name);

            DocNode node;
            using (_lockManager.Read(domain, documentId))
            {
                if (!File.Exists(filePath))
                    return null;

                node = new DocNode
                {
                    Domain = domain,
                    Path = parent,
                    Name = document,
                    Extension = extension,
                    Content = "",
                };

                // load content only for .txt files
                string content = "";
                if (extension.Equals(".txt", StringComparison.InvariantCultureIgnoreCase))
                    content = File.ReadAllText(filePath);
    
                node.Content = content;
            }

            // convert content to HTML
            node.Html = new Markup(this, node.Domain, node.Id).ToHtml(node.Content);

            return node;
        }

        public ErrorCode SaveDocument(string domain, string documentId, string content)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var path = Path.Combine(rootFolder, documentId);

            using (_lockManager.Write(domain, documentId))
            {
                var folder = Path.GetDirectoryName(path);
                if (!Directory.Exists(folder))
                    return ErrorCode.TagNotFound;

                File.WriteAllText(path, content);
            }

            return ErrorCode.Ok;
        }

        public ErrorCode DeleteDocument(string domain, string documentId)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var path = Path.Combine(rootFolder, documentId);

            using (_lockManager.Write(domain, documentId))
            {
                var folder = Path.GetDirectoryName(path);
                if (!Directory.Exists(folder))
                    return ErrorCode.TagNotFound;

                if (!File.Exists(path))
                    return ErrorCode.Ok;

                File.Delete(path);
            }

            return ErrorCode.Ok;
        }

        public string TranslatePathToDocumentId(string domain, string path) 
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            string documentId = DocumentParser.GetDocumentId(path);
            string filePath = Path.Combine(rootFolder, documentId);
            return filePath;
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

        public void UpdateDomainBackgroundVersions()
        {
            foreach (var domainOptions in _domainOptions.Domains)
            {
                domainOptions.BackgroundVersion = null;

                if (!string.IsNullOrEmpty(domainOptions.Background))
                {
                    string filePath = TranslatePathToDocumentId(domainOptions.Name, domainOptions.Background);

                    if (filePath == null)
                        continue;

                    var time = File.GetLastWriteTimeUtc(filePath);
                    domainOptions.BackgroundVersion = time.Ticks.ToString("x");
                }
            }
        }
    }
}
