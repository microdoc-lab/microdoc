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

        private string _SelectedTag;
        public string SelectedTag
        {
            get => _SelectedTag;
            set { _SelectedTag = TagTree.SelectedTag = DocMatrix.SelectedTag = value; }
        }

        public TagTreeViewModel TagTree { get; set; } = new();
        public DocMatrixViewModel DocMatrix { get; set; } = new();
    }
}
