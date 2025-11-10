namespace MicroDoc.Models
{
    public static class TagTreeBuilder
    {
        public static List<TagNode> BuildTree(string rootFolder)
        {
            var viewPath = Path.Combine(rootFolder, "VIEW.ini");
            var tags = ViewConfigLoader.LoadTagsFromFile(viewPath);

            var nodes = new List<TagNode>();
            foreach (var dir in Directory.GetDirectories(rootFolder))
            {
                var name = Path.GetFileName(dir);
                var tag = tags.FirstOrDefault(t => t.Name == name);

                var node = new TagNode
                {
                    Name = name,
                    Display = name,
                    Color = tag?.Color,
                    Description = tag?.Description,
                    Order = tag?.Order ?? 999,
                    Children = BuildTree(dir)
                };

                nodes.Add(node);
            }

            return nodes.OrderBy(n => n.Order).ToList();
        }
    }
}
