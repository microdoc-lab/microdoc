namespace MicroDoc.Services
{
    public class TagTreeService
    {
        internal const string ViewFileName = "view.ini";

        private readonly DomainOptions _domainOptions;
        private readonly LockManager _lockManager;

        public TagTreeService(DomainOptions domainOptions, LockManager lockManager)
        {
            _domainOptions = domainOptions;
            _lockManager = lockManager;
        }

        public List<TagNode> GetTagTree(string domain) => BuildTree(domain, path: null, recursive: true, level: 0);

        internal List<TagNode> BuildTree(string domain, string path, bool recursive, int level)
        {
            path = path ?? "";
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, path);

            // load view
            TagView view;
            using (_lockManager.Read(domain, DocumentParser.GetDocumentId(path, ViewFileName)))
            {
                var viewPath = Path.Combine(folder, ViewFileName);
                view = ViewConfigLoader.LoadTagsFromFile(viewPath);
            }

            // Load nodes
            var nodes = new List<TagNode>();

            using (_lockManager.Read(domain, path))
            {
                foreach (var dir in Directory.GetDirectories(folder))
                {
                    var tag = Path.GetFileName(dir);
                    var viewTag = view.Tags.FirstOrDefault(t => t.Tag == tag);

                    var node = new TagNode
                    {
                        Domain = domain,
                        Path = path,
                        Tag = tag,
                        Order = viewTag?.Order,
                        Level = level,
                    };

                    // load child nodes (recursively)
                    if (recursive)
                        node.Children = BuildTree(domain, node.Id, recursive: true, level + 1);

                    nodes.Add(node);
                }
            }

            // order tags by Order
            return nodes.OrderBy(n => n.Order ?? 999).ThenBy(n => n.Tag).ToList();
        }

        public ErrorCode NewTag(string domain, string selectedTag, string newTagName, out string newTagId)
        {
            selectedTag = selectedTag ?? "";
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            newTagId = DocumentParser.GetDocumentId(selectedTag, newTagName);
            var folder = Path.Combine(rootFolder, newTagId);

            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(selectedTag, newTagName)))
            {
                if (Directory.Exists(folder))
                    return ErrorCode.TagExists;

                // create directory
                Directory.CreateDirectory(folder);
            }

            // update view
            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(selectedTag, ViewFileName)))
            {
                TagView view = BuildView(domain, selectedTag);
                var viewPath = Path.Combine(rootFolder, selectedTag, ViewFileName);
                ViewConfigLoader.SaveTagsToFile(viewPath, view);
            }

            return ErrorCode.Ok;
        }

        public ErrorCode MoveTag(string domain, string selectedTag, string targetTag, out string newTagId)
        {
            selectedTag = selectedTag ?? "";
            targetTag = targetTag ?? "";
            string rootFolder = _domainOptions.Find(domain).RootFolder;

            var (parentTag, name) = DocumentParser.SplitId(selectedTag);
            newTagId = DocumentParser.GetDocumentId(targetTag, name);

            if (string.IsNullOrEmpty(selectedTag))
                return ErrorCode.RootTag;

            if (targetTag.StartsWith(selectedTag + "/"))
                return ErrorCode.MoveIntoNestedTag;

            var source = Path.Combine(rootFolder, selectedTag);
            var destination = Path.Combine(rootFolder, targetTag);
            var newPath = Path.Combine(rootFolder, newTagId);

            using (_lockManager.Write2(domain, selectedTag, newTagId))
            {
                if (!Directory.Exists(source))
                    return ErrorCode.TagNotFound;

                if (!Directory.Exists(destination))
                    return ErrorCode.TagNotFound;

                if (Directory.Exists(newPath))
                    return ErrorCode.TagExists;

                // create directory
                Directory.Move(source, newPath);
            }

            // update source parent tag view
            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(parentTag, ViewFileName)))
            {
                TagView view = BuildView(domain, parentTag);
                var viewPath = Path.Combine(rootFolder, parentTag, ViewFileName);
                ViewConfigLoader.SaveTagsToFile(viewPath, view);
            }

            // update target view
            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(targetTag, ViewFileName)))
            {
                TagView view = BuildView(domain, targetTag);
                var viewPath = Path.Combine(rootFolder, targetTag, ViewFileName);
                ViewConfigLoader.SaveTagsToFile(viewPath, view);
            }

            return ErrorCode.Ok;
        }

        public ErrorCode DeleteTag(string domain, string selectedTag)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;

            if (string.IsNullOrEmpty(selectedTag))
                return ErrorCode.RootTag;

            using (_lockManager.Write(domain, selectedTag))
            {
                var folder = Path.Combine(rootFolder, selectedTag);
                if (!Directory.Exists(folder))
                    return ErrorCode.TagNotFound;

                if (Directory.GetDirectories(folder).Any())
                    return ErrorCode.NestedTagsExists;

                // remove directory files (view.ini / images)
                foreach (var file in Directory.GetFiles(folder))
                    File.Delete(file);

                // delete directory
                Directory.Delete(folder);
            }

            // update parent tag view
            var (parentTag, _) = DocumentParser.SplitId(selectedTag);
            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(parentTag, ViewFileName)))
            {
                TagView view = BuildView(domain, parentTag);
                var viewPath = Path.Combine(rootFolder, parentTag, ViewFileName);
                ViewConfigLoader.SaveTagsToFile(viewPath, view);
            }

            return ErrorCode.Ok;
        }

        public ErrorCode ReorderTagsBatch(string domain, string path, string tag, string targetTag)
        {
            path = path ?? "";
            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(path, ViewFileName)))
            {
                string rootFolder = _domainOptions.Find(domain).RootFolder;
                TagView view = BuildView(domain, path);

                var tags = view.Tags.ToList();
                var index = tags.FindIndex(t => t.Tag == tag);
                var targetIndex = tags.FindIndex(t => t.Tag == targetTag);

                if (index == -1 || targetIndex == -1 || index == targetIndex)
                    return ErrorCode.TagNotFound;

                // Extract dragged item
                var dragged = tags[index];

                // Remove it first
                tags.RemoveAt(index);

                // Insert dragged node before target
                tags.Insert(targetIndex, dragged);

                // Update order fields (optional)
                for (int i = 0; i < tags.Count; i++)
                    tags[i].Order = i + 1;

                var viewPath = Path.Combine(rootFolder, path, ViewFileName);
                ViewConfigLoader.SaveTagsToFile(viewPath, view);
            }

            return ErrorCode.Ok;
        }

        private TagView BuildView(string domain, string path)
        {
            // load directory tags
            var tree = BuildTree(domain, path, recursive: false, level: 0);

            var list = new List<TagView.Node>();

            // reorder directory tags
            int order = 0;
            foreach (var node in tree)
                list.Add(new TagView.Node { Tag = node.Tag, Order = ++order });

            // reorder directory child tags
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
