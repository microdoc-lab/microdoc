using MicroDoc.Services;

namespace MicroDoc.Models
{
    public class DocViewModel
    {
        public string Id { get; set; }
        public DomainOptions.Domain Domain { get; set; }
        public string Mode { get; set; }
        public DocNode Doc { get; set; }
    }
}
