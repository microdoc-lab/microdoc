namespace MicroDoc.Models
{
    public class TagNode
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public string Color { get; set; }
        public string Group { get; set; }
        public int Order { get; set; }

        public List<TagNode> Children { get; set; } = new();

        public override string ToString() => $"#{Id} {Name}; Group: {Group}; Order: {Order}";
    }
}
