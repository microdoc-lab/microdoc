using static MicroDoc.Services.TagView;

namespace MicroDoc.Services
{
    public class TagService
    {
        private const string ViewFileName = "view.ini";

        private readonly DomainOptions _domainOptions;
        private readonly LockManager _lockManager;
        private readonly TagMoveService _tagMoveService;

        public TagService(DomainOptions domainOptions, LockManager lockManager, TagMoveService tagMoveService)
        {
            _domainOptions = domainOptions;
            _lockManager = lockManager;
            _tagMoveService = tagMoveService;
        }

        public ErrorCode ValidateDomainDirectory(string domain)
        {
            var domainCfg = _domainOptions.Find(domain);
            if (domainCfg == null)
                return ErrorCode.DomainNotFound;

            if (!Directory.Exists(domainCfg.RootFolder))
                return ErrorCode.DomainDirectoryNotFound;

            return ErrorCode.Ok;
        }

        public List<TagNode> GetTagTree(string domain) => BuildTree(domain, tagId: "", recursive: true, level: 0);

        internal List<TagNode> BuildTree(string domain, string tagId, bool recursive, int level)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            var folder = Path.Combine(rootFolder, tagId);

            // load view
            TagView view = LoadView(domain, tagId);

            // Load nodes
            var nodes = new List<TagNode>();

            using (_lockManager.Read(domain, tagId))
            {
                foreach (var dir in Directory.GetDirectories(folder))
                {
                    var tag = Path.GetFileName(dir);
                    var viewTag = view.Tags.FirstOrDefault(t => t.Tag == tag);

                    var node = new TagNode
                    {
                        Domain = domain,
                        TagId = tagId,
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

        public ErrorCode NewTag(string domain, string selectedTag, string newTagName, out string newTag)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;
            newTag = DocumentParser.GetDocumentId(selectedTag, newTagName);
            var folder = Path.Combine(rootFolder, newTag);

            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(selectedTag, newTagName)))
            {
                if (Directory.Exists(folder))
                    return ErrorCode.TagExists;

                // create directory
                Directory.CreateDirectory(folder);
            }

            UpdateView(domain, selectedTag);

            return ErrorCode.Ok;
        }

        public ErrorCode RenameTag(string domain, string selectedTag, string newTagName, out string parentTag, out string newTag)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;

            (parentTag, var name) = DocumentParser.SplitId(selectedTag);
            newTag = DocumentParser.GetDocumentId(parentTag, newTagName);

            if (string.IsNullOrEmpty(selectedTag))
                return ErrorCode.RootTag;

            var source = Path.Combine(rootFolder, selectedTag);
            var newPath = Path.Combine(rootFolder, newTag);

            using (_lockManager.Write2(domain, selectedTag, newTag))
            {
                if (!Directory.Exists(source))
                    return ErrorCode.TagNotFound;

                if (Directory.Exists(newPath))
                    return ErrorCode.TagExists;

                // create directory
                Directory.Move(source, newPath);
            }

            UpdateView(domain, parentTag, view => {
                var tag = view.Tags.FirstOrDefault(t => t.Tag == name);
                if (tag == null)
                    return ErrorCode.TagNotFound;

                tag.Tag = newTagName;
                return ErrorCode.Ok;
            });

            if (_domainOptions.Find(domain).TrackTagMoves)
                _tagMoveService.Move(domain, selectedTag, newTag);

            return ErrorCode.Ok;
        }

        public ErrorCode MoveTag(string domain, string selectedTag, string targetTag, out string parentTag, out string newTag)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;

            (parentTag, var name) = DocumentParser.SplitId(selectedTag);
            newTag = DocumentParser.GetDocumentId(targetTag, name);

            if (string.IsNullOrEmpty(selectedTag))
                return ErrorCode.RootTag;

            if (targetTag.StartsWith(selectedTag + "/"))
                return ErrorCode.MoveIntoNestedTag;

            var source = Path.Combine(rootFolder, selectedTag);
            var destination = Path.Combine(rootFolder, targetTag);
            var newPath = Path.Combine(rootFolder, newTag);

            using (_lockManager.Write2(domain, selectedTag, newTag))
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

            UpdateView(domain, parentTag);
            UpdateView(domain, targetTag);

            if (_domainOptions.Find(domain).TrackTagMoves)
                _tagMoveService.Move(domain, selectedTag, newTag);

            return ErrorCode.Ok;
        }

        public ErrorCode DeleteTag(string domain, string selectedTag, out string parentTag)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;

            (parentTag, _) = DocumentParser.SplitId(selectedTag);

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

            UpdateView(domain, parentTag);

            return ErrorCode.Ok;
        }

        public ErrorCode SwapTags(string domain, string parentTag, string tagName, string targetTagName)
        {
            var status = UpdateView(domain, parentTag, view =>
            {
                var tags = view.Tags.ToList();
                var index = tags.FindIndex(t => t.Tag == tagName);
                var targetIndex = tags.FindIndex(t => t.Tag == targetTagName);

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

                return ErrorCode.Ok;
            });

            return status;
        }

        private TagView BuildView(string domain, string tagId)
        {
            // load directory tags
            var tree = BuildTree(domain, tagId, recursive: false, level: 0);

            // build view
            var list = tree.Select((node, index) => new Node { Tag = node.Tag, Order = index + 1 }).ToList();

            return new TagView { Tags = list };
        }

        private TagView LoadView(string domain, string tagId)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;

            using (_lockManager.Read(domain, DocumentParser.GetDocumentId(tagId, ViewFileName)))
            {
                var viewPath = Path.Combine(rootFolder, tagId, ViewFileName);
                return TagViewLoader.LoadTagsFromFile(viewPath);
            }
        }

        private ErrorCode UpdateView(string domain, string tagId, Func<TagView, ErrorCode> modifyView = null)
        {
            string rootFolder = _domainOptions.Find(domain).RootFolder;

            using (_lockManager.Write(domain, DocumentParser.GetDocumentId(tagId, ViewFileName)))
            {
                // Load view if modification function provided, otherwise - rebuild view
                var view = modifyView != null 
                    ? LoadView(domain, tagId) 
                    : BuildView(domain, tagId);

                var status = ErrorCode.Ok;

                // apply modification function
                if (modifyView != null)
                    status = modifyView(view);

                // save view anyway
                var viewPath = Path.Combine(rootFolder, tagId, ViewFileName);
                TagViewLoader.SaveTagsToFile(viewPath, view);

                if (status != ErrorCode.Ok)
                    return status;
            }

            return ErrorCode.Ok;
        }
    }
}
