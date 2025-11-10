using MicroDoc.Models;
using Microsoft.AspNetCore.Mvc;

namespace MicroDoc.Controllers
{
    public class MicroDocController : Controller
    {
        private readonly MicroDocService _microDocService;

        public MicroDocController(MicroDocService microDocService)
        {
            _microDocService = microDocService;
        }

        public IActionResult TagTree()
        {
            var model = _microDocService.GetTagTree();
            return PartialView("_TagTree", model);
        }
    }
}
