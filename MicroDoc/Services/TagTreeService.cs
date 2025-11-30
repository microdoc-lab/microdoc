using Microsoft.Extensions.Options;

namespace MicroDoc.Services
{
    public class TagTreeService
    {
        private readonly MicroDocOptions _options;

        public TagTreeService(IOptions<MicroDocOptions> options)
        {
            _options = options.Value;
        }

        public List<TagNode> GetTagTree() => BuildTree(path: null, recursive: true);

        private List<TagNode> BuildTree(string path, bool recursive)
        {
            var folder = Path.Combine(_options.RootFolder, path ?? "");
            var viewPath = Path.Combine(folder, "view.ini");
            var view = ViewConfigLoader.LoadTagsFromFile(viewPath);

            // Load nodes
            var nodes = new List<TagNode>();
            foreach (var dir in Directory.GetDirectories(folder))
            {
                var tag = Path.GetFileName(dir);
                var viewTag = view.Tags.FirstOrDefault(t => t.Tag == tag);

                var node = new TagNode
                {
                    Path = path == null ? tag : path + "/" + tag,
                    Tag = tag,
                    Order = viewTag?.Order,
                };

                if (recursive)
                    node.Children = BuildTree(node.Path, recursive: true);

                nodes.Add(node);
            }

            return nodes.OrderBy(n => n.Order ?? 999).ThenBy(n => n.Tag).ToList();
        }

        public bool ReorderTagsBatch(string path, string tag, string targetTag)
        {
            TagView view = BuildView(path);

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

            var viewPath = Path.Combine(_options.RootFolder, path ?? "", "view.ini");
            ViewConfigLoader.SaveTagsToFile(viewPath, view);
            return true;
        }

        private TagView BuildView(string path)
        {
            var tree = BuildTree(path, recursive: false);

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
