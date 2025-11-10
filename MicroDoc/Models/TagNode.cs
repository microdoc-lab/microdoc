namespace MicroDoc.Models
{
    public class TagNode
    {
        public string Name { get; set; }
        public string Display { get; set; }
        public string Color { get; set; }
        public string Description { get; set; }
        public int Order { get; set; }

        public List<TagNode> Children { get; set; } = new();
    }
}
