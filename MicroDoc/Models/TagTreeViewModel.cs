using MicroDoc.Services;

namespace MicroDoc.Models
{
    public class TagTreeViewModel
    {
        public string Id { get; set; }
        public List<TagNode> Nodes { get; set; } = new();
        public string SelectedNode { get; set; }
    }
}