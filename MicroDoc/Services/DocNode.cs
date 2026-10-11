namespace MicroDoc.Services
{
    public class DocNode
    {
        public string Domain { get; set; }
        public string Path { get; set; }
        public string Name { get; set; }
        public string Extension { get; set; }
        public string Id => DocumentParser.GetDocumentId(Path, Name + Extension);
        public string TagPath => string.IsNullOrEmpty(Path) ? Domain : string.Join(" ", Path.Split("/").Select(p => $"[{p}]"));
        public string Content { get; set; }
        public string Html { get; set; }
    }
}
