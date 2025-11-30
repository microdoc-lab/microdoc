using MicroDoc.Models;
using MicroDoc.Services;
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
        public IActionResult ReorderTagsBatch([FromBody] ReorderTagsBatchRequest request)
        {
            if (!_tagTreeService.ReorderTagsBatch(request.Path, request.Tag, request.TargetTag))
                return NotFound();

            return Ok();
        }

        public class ReorderTagsBatchRequest
        {
            public string Path { get; set; }
            public string Tag { get; set; }
            public string TargetTag { get; set; }
        }
    }
}
