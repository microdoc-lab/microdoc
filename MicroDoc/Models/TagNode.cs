namespace MicroDoc.Models
{
    public class TagNode
    {
        public string Path { get; set; }
        public string Tag { get; set; }
        public string Color { get; set; }
        public int? Order { get; set; }

        public List<TagNode> Children { get; set; } = new();

        public override string ToString() => $"{Path ?? Tag} - {Order ?? 999}";
    }
}
