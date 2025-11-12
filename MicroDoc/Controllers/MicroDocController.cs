using MicroDoc.Models;
using Microsoft.AspNetCore.Mvc;

namespace MicroDoc.Controllers
{
    public class MicroDocController : Controller
    {
        private readonly TagTreeService _tagTreeService;

        public MicroDocController(TagTreeService tagTreeService)
        {
            _tagTreeService = tagTreeService;
        }

        [HttpPost]
        public IActionResult ReorderTag([FromBody] ReorderTagRequest request)
        {
            if (!_tagTreeService.ReorderTag(request.Path, request.Group, request.Tag, request.Direction == "up"))
                return NotFound();

            return Ok();
        }

        [HttpPost]
        public IActionResult ReorderTagsBatch([FromBody] ReorderTagsBatchRequest request)
        {
            if (!_tagTreeService.ReorderTagsBatch(request.Path, request.Group, request.Tag, request.TargetTag))
                return NotFound();

            return Ok();
        }

        public class ReorderTagRequest
        {
            public string Path { get; set; }
            public string Group { get; set; }
            public string Tag { get; set; }
            public string Direction { get; set; }
        }

        public class ReorderTagsBatchRequest
        {
            public string Path { get; set; }
            public string Group { get; set; }
            public string Tag { get; set; }
            public string TargetTag { get; set; }
        }
    }
}
