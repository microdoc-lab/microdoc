namespace MicroDoc.Services
{
    public class DocNode
    {
        public string Domain { get; set; }
        public string TagId { get; set; }
        public string Name { get; set; }
        public string Extension { get; set; }
        public string Id => DocumentParser.GetDocumentId(TagId, Name + Extension);
        public string TagPath => string.IsNullOrEmpty(TagId) ? Domain : string.Join(" ", TagId.Split("/").Select(p => $"[{p}]"));
        public string Content { get; set; }
        public string Html { get; set; }
    }
}
