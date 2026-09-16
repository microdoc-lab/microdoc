using MicroDoc.Services;

namespace MicroDoc.Models
{
    public class ExplorerViewModel
    {
        private string _Id;
        public string Id 
        {
            get => _Id;
            set { 
                _Id = value;
                TagTree.Id = Id + "TagTree";
                DocMatrix.Id = Id + "DocMatrix";
            }
        }

        private DomainOptions.Domain _Domain;
        public DomainOptions.Domain Domain 
        {
            get => _Domain;
            set { _Domain = TagTree.Domain = DocMatrix.Domain = value; }
        }
        
        public TagTreeViewModel TagTree { get; set; } = new();
        public DocMatrixViewModel DocMatrix { get; set; } = new();
    }
}
