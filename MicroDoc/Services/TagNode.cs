namespace MicroDoc.Services
{
    public class TagNode
    {
        public string Domain { get; set; }
        public string TagId { get; set; }
        public string Tag { get; set; }
        public string TagPath => DocumentParser.GetTagPath(Id);
        public string Id => DocumentParser.GetDocumentId(TagId, Tag);
        public string Color { get; set; }
        public int? Order { get; set; }
        public int Level { get; set; }
        public bool IsDomain { get; set; }

        public List<TagNode> Children { get; set; } = new();
        public List<DocNode> Documents { get; set; } = new();

        public override string ToString() => $"{Id} - {Order ?? 999}";
    }
}
