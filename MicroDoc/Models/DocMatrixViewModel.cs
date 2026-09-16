using MicroDoc.Services;

namespace MicroDoc.Models
{
    public class DocMatrixViewModel
    {
        public string Id { get; set; }
        public DomainOptions.Domain Domain { get; set; }
        public List<TagNode> Rows { get; set; } = new();
    }
}
