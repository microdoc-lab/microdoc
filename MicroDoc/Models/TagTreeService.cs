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

        public List<TagNode> GetTagTree() => BuildTree(_options.RootFolder, null);

        private static List<TagNode> BuildTree(string rootFolder, string id)
        {
            var viewPath = Path.Combine(rootFolder, "view.ini");
            var view = ViewConfigLoader.LoadTagsFromFile(viewPath);

            // Load nodes
            var nodes = new List<TagNode>();
            foreach (var dir in Directory.GetDirectories(rootFolder))
            {
                var name = Path.GetFileName(dir);
                var tag = view.Tags.FirstOrDefault(t => t.Tag == name);

                var node = new TagNode
                {
                    Id = id == null ? name : id + "/" + name,
                    Name = name,
                    DisplayName = "[" + name + "]",
                    Group = (tag?.Group ?? "").Trim(),
                    Order = tag?.Order ?? 999,
                };
                node.Children = BuildTree(dir, node.Id);

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
                        Order = tag?.Order ?? 0,
                    };
                    nodes.Add(groupNode);
                }

                foreach (var node in group)
                {
                    groupNode.Children.Add(node);
                    nodes.Remove(node);
                }

                groupNode.Children = groupNode.Children.OrderBy(n => n.Order).ThenBy(n => n.Name).ToList();
            }

            return nodes.OrderBy(n => n.Order).ThenBy(n => n.Name).ToList();
        }

        public bool ReorderTag(string path, string group, string tag, bool up)
        {
            var viewPath = Path.Combine(_options.RootFolder, path ?? "", "view.ini");
            var view = ViewConfigLoader.LoadTagsFromFile(viewPath);

            var tags = view.Tags.Where(t => t.Group == group).ToList();
            var index = tags.FindIndex(t => t.Tag == tag);
            if (index == -1)
            {
                var newTag = new TagView.Node
                {
                    Tag = tag,
                    Group = group,
                    Order = (tags.Max(t => (int?)t.Order) ?? 0) + 1
                };
                view.Tags.Add(newTag);
            }
            else
            {
                if (up && index > 0)
                    (tags[index - 1].Order, tags[index].Order) = (tags[index].Order, tags[index - 1].Order);
                else if (!up && index < tags.Count - 1)
                    (tags[index + 1].Order, tags[index].Order) = (tags[index].Order, tags[index + 1].Order);
            }

            ViewConfigLoader.SaveTagsToFile(viewPath, view);
            return true;
        }
    }
}
