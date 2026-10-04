namespace MicroDoc.Services
{
    public class TagNode
    {
        public string Domain { get; set; }
        public string Path { get; set; }
        public string Tag { get; set; }
        public string Id => string.IsNullOrEmpty(Path) ? Tag : Path + "/" + Tag;
        public string Color { get; set; }
        public int? Order { get; set; }
        public int Level { get; set; }
        public bool IsDomain { get; set; }

        public List<TagNode> Children { get; set; } = new();
        public List<DocNode> Documents { get; set; } = new();

        public override string ToString() => $"{Id} - {Order ?? 999}";
    }
}
