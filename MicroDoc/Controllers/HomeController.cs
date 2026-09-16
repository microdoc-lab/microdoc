using MicroDoc.Models;
using MicroDoc.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace MicroDoc.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly DomainOptions _domainOptions;
        private readonly TagTreeService _tagTreeService;
        private readonly DocService _docService;

        public HomeController(ILogger<HomeController> logger, DomainOptions domainOptions, TagTreeService tagTreeService, DocService docService)
        {
            _logger = logger;
            _domainOptions = domainOptions;
            _tagTreeService = tagTreeService;
            _docService = docService;
        }

        public IActionResult Explorer(string explorerId, string domain, string selectedTag)
        {
            var model = new ExplorerViewModel
            {
                Id = explorerId,
                Domain = _domainOptions.Find(domain),
                SelectedTag = selectedTag,
                TagTree = {
                    Nodes = _tagTreeService.GetTagTree(domain),
                }
            };

            return PartialView("_Explorer", model);
        }

        [HttpPost]
        public IActionResult ReorderTagsBatch(string domain, string path, string tag, string targetTag)
        {
            if (!_tagTreeService.ReorderTagsBatch(domain, path, tag, targetTag))
                return NotFound();

            return Ok();
        }

        public IActionResult DocMatrix(string docMatrixId, string domain, string tagId)
        {
            var model = new DocMatrixViewModel
            {
                Id = docMatrixId,
                Domain = _domainOptions.Find(domain),
                SelectedTag = tagId,
                Rows = _docService.GetTagWithDocuments(domain, tagId)
            };

            return PartialView("_DocMatrix", model);
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Login()
        {
            return Challenge(new AuthenticationProperties { RedirectUri = "/" }, 
                GoogleDefaults.AuthenticationScheme);
        }

        public IActionResult Logout()
        {
            return SignOut(new AuthenticationProperties { RedirectUri = "/" },
                CookieAuthenticationDefaults.AuthenticationScheme);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
