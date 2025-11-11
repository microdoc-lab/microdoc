namespace MicroDoc.Models
{
    public static class TagTreeBuilder
    {
        public static List<TagNode> BuildTree(string rootFolder, string id = null)
        {
            var viewPath = Path.Combine(rootFolder, "VIEW.ini");
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
                    Name = "[" + name + "]",
                    Group = tag?.Group,
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
                        Order = tag?.Order ?? 0,
                    };
                    nodes.Add(groupNode);
                }

                foreach (var node in group)
                {
                    groupNode.Children.Add(node);
                    nodes.Remove(node);
                }
            }

            return nodes.OrderBy(n => n.Order).ThenBy(n => n.Name).ToList();
        }
    }
}
