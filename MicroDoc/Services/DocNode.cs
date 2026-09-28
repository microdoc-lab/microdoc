namespace MicroDoc.Services
{
    public class DocNode
    {
        public string Domain { get; set; }
        public string Path { get; set; }
        public string Name { get; set; }
        public string Extension { get; set; }
        public string Id => string.IsNullOrEmpty(Path) ? Name : Path + "/" + Name + Extension;
        public string Content { get; set; }
    }
}
