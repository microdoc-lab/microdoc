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
        public IActionResult ReorderTagsBatch(string path, string tag, string targetTag)
        {
            if (!_tagTreeService.ReorderTagsBatch(path, tag, targetTag))
                return NotFound();

            return Ok();
        }
    }
}
