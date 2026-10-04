namespace MicroDoc.Services
{
    public class TagTreeService
    {
        internal const string ViewFileName = "view.ini";

        private readonly DomainOptions _domainOptions;

        public TagTreeService(DomainOptions domainOptions)
        {
            _domainOptions = domainOptions;
        }

        public List<TagNode> GetTagTree(string domain) => BuildTree(domain, path: null, recursive: true, level: 0);

        internal List<TagNode> BuildTree(string domain, string path, bool recursive, int level)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, path ?? "");
            var viewPath = Path.Combine(folder, ViewFileName);
            var view = ViewConfigLoader.LoadTagsFromFile(viewPath);

            // Load nodes
            var nodes = new List<TagNode>();
            foreach (var dir in Directory.GetDirectories(folder))
            {
                var tag = Path.GetFileName(dir);
                var viewTag = view.Tags.FirstOrDefault(t => t.Tag == tag);

                var node = new TagNode
                {
                    Domain = domain,
                    Path = path ?? "",
                    Tag = tag,
                    Order = viewTag?.Order,
                    Level = level,
                };

                if (recursive)
                    node.Children = BuildTree(domain, node.Id, recursive: true, level + 1);

                nodes.Add(node);
            }

            return nodes.OrderBy(n => n.Order ?? 999).ThenBy(n => n.Tag).ToList();
        }

        public bool NewTag(string domain, string selectedTag, string newTagName, out string newTagId)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            newTagId = string.IsNullOrEmpty(selectedTag) ? newTagName : selectedTag + "/" + newTagName;
            var folder = Path.Combine(rootFolder, newTagId);
            
            if (Directory.Exists(folder))
                return false;

            Directory.CreateDirectory(folder);

            TagView view = BuildView(domain, selectedTag);
            var viewPath = Path.Combine(rootFolder, selectedTag ?? "", ViewFileName);
            ViewConfigLoader.SaveTagsToFile(viewPath, view);

            return true;
        }

        public bool DeleteTag(string domain, string selectedTag)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            
            if (string.IsNullOrEmpty(selectedTag))
                return false;

            var folder = Path.Combine(rootFolder, selectedTag);
            if (!Directory.Exists(folder))
                return false;

            if (Directory.GetDirectories(folder).Any())
                return false;

            Directory.Delete(folder);

            var parentTag = Path.GetDirectoryName(selectedTag);

            TagView view = BuildView(domain, parentTag);
            var viewPath = Path.Combine(rootFolder, parentTag ?? "", ViewFileName);
            ViewConfigLoader.SaveTagsToFile(viewPath, view);

            return true;
        }

        public bool ReorderTagsBatch(string domain, string path, string tag, string targetTag)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            TagView view = BuildView(domain, path);

            var tags = view.Tags.ToList();
            var index = tags.FindIndex(t => t.Tag == tag);
            var targetIndex = tags.FindIndex(t => t.Tag == targetTag);

            if (index == -1 || targetIndex == -1 || index == targetIndex)
                return false;

            // Extract dragged item
            var dragged = tags[index];

            // Remove it first
            tags.RemoveAt(index);

            // Insert dragged node before target
            tags.Insert(targetIndex, dragged);

            // Update order fields (optional)
            for (int i = 0; i < tags.Count; i++)
                tags[i].Order = i + 1;

            var viewPath = Path.Combine(rootFolder, path ?? "", ViewFileName);
            ViewConfigLoader.SaveTagsToFile(viewPath, view);
            return true;
        }

        private TagView BuildView(string domain, string path)
        {
            var tree = BuildTree(domain, path, recursive: false, level: 0);

            var list = new List<TagView.Node>();

            int order = 0;
            foreach (var node in tree)
                list.Add(new TagView.Node { Tag = node.Tag, Order = ++order });

            foreach (var node in tree)
            {
                order = 0;
                foreach (var child in node.Children)
                    list.Add(new TagView.Node { Tag = child.Tag, Order = ++order });
            }

            var view = new TagView { Tags = list };
            return view;
        }
    }
}
