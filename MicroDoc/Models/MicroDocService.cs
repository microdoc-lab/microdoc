using Microsoft.Extensions.Options;

namespace MicroDoc.Models
{
    public class MicroDocService
    {
        private readonly string _rootFolder;

        public MicroDocService(IOptions<MicroDocOptions> options)
        {
            _rootFolder = options.Value.RootFolder;
        }

        public List<TagNode> GetTagTree()
        {
            return TagTreeBuilder.BuildTree(_rootFolder);
        }
    }
}
