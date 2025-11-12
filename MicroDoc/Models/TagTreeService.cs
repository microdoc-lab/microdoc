using Microsoft.Extensions.Options;

namespace MicroDoc.Models
{
    public class TagTreeService
    {
        private readonly MicroDocOptions _options;

        public TagTreeService(IOptions<MicroDocOptions> options)
        {
            _options = options.Value;
        }

        public List<TagNode> GetTagTree() => BuildTree(_options.RootFolder, parentId: null, recursive: true);

        private static List<TagNode> BuildTree(string path, string parentId, bool recursive)
        {
            var viewPath = Path.Combine(path, "view.ini");
            var view = ViewConfigLoader.LoadTagsFromFile(viewPath);

            // Load nodes
            var nodes = new List<TagNode>();
            foreach (var dir in Directory.GetDirectories(path))
            {
                var name = Path.GetFileName(dir);
                var tag = view.Tags.FirstOrDefault(t => t.Tag == name);

                var node = new TagNode
                {
                    Id = parentId == null ? name : parentId + "/" + name,
                    Name = name,
                    DisplayName = "[" + name + "]",
                    Group = (tag?.Group ?? "").Trim(),
                    Order = tag?.Order,
                };

                if (recursive)
                    node.Children = BuildTree(dir, parentId: node.Id, recursive: true);

                nodes.Add(node);
            }

            // Transform tree
            foreach (var group in nodes
                .Where(n => !string.IsNullOrWhiteSpace(n.Group))
                .Where(n => n.Name != n.Group)
                .GroupBy(n => n.Group)
                .ToList())
            {
                var groupNode = nodes.FirstOrDefault(n => n.Name == group.Key);
                if (groupNode == null)
                {
                    var tag = view.Tags.FirstOrDefault(t => t.Tag == group.Key);
                    groupNode = new TagNode
                    {
                        Name = group.Key,
                        DisplayName = group.Key,
                        Order = tag?.Order,
                    };
                    nodes.Add(groupNode);
                }

                foreach (var node in group)
                {
                    groupNode.Children.Add(node);
                    nodes.Remove(node);
                }

                groupNode.Children = groupNode.Children.OrderBy(n => n.Order ?? 999).ThenBy(n => n.Name).ToList();
            }

            return nodes.OrderBy(n => n.Order ?? 999).ThenBy(n => n.Name).ToList();
        }

        public bool ReorderTag(string path, string group, string tag, bool up)
        {
            var viewPath = Path.Combine(_options.RootFolder, path ?? "", "view.ini");

            var nodePath = Path.Combine(_options.RootFolder, path ?? "");
            var tree = BuildTree(nodePath, parentId: null, recursive: false);

            var list = new List<TagView.Node>();

            int order = 0;
            foreach (var node in tree)
                list.Add(new TagView.Node { Tag = node.Name, Group = node.Group, Order = ++order });

            foreach (var node in tree)
            {
                order = 0;
                foreach (var child in node.Children)
                    list.Add(new TagView.Node { Tag = child.Name, Group = child.Group, Order = ++order });
            }

            var view = new TagView { Tags = list };

            var tags = view.Tags.Where(t => t.Group == group).ToList();
            var index = tags.FindIndex(t => t.Tag == tag);
            // add missing tag
            if (index == -1)
                return false;

            if (up && index > 0)
                (tags[index - 1].Order, tags[index].Order) = (tags[index].Order, tags[index - 1].Order);
            else if (!up && index < tags.Count - 1)
                (tags[index + 1].Order, tags[index].Order) = (tags[index].Order, tags[index + 1].Order);

            ViewConfigLoader.SaveTagsToFile(viewPath, view);
            return true;
        }
    }
}
