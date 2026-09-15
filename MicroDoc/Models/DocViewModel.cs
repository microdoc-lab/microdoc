using MicroDoc.Services;

namespace MicroDoc.Models
{
    public class DocViewModel
    {
        public string Id { get; set; }

        public DomainOptions.Domain Domain { get; set; }

        public List<Row> Rows { get; set; } = new();

        public class Row
        { 
            public TagNode Tag { get; set; }
            public Dictionary<string, Cell> Cells { get; set; } = new();
        }

        public class Cell 
        { 
            public DocNode Doc { get; set; }
        }
    }
}
