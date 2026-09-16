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
                DocMatrix.Id = Id + "Doc";
            }
        }

        public TagTreeViewModel TagTree { get; set; } = new();
        public DocMatrixViewModel DocMatrix { get; set; } = new();
    }
}
