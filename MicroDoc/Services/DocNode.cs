namespace MicroDoc.Services
{
    public class DocNode
    {
        public string Path { get; set; }
        public string Name { get; set; }
        public string Id => string.IsNullOrEmpty(Path) ? Name : Path + "/" + Name;
        public string Content { get; set; }
    }
}
