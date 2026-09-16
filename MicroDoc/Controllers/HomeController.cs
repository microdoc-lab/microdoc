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

        public IActionResult Index(string domain = "microdoc.doc", string selectedTag = "Services")
        {
            var model = new IndexViewModel
            {
                Explorer = new ExplorerViewModel
                {
                    Id = "explorer",
                    Domain = _domainOptions.Find(domain),
                    TagTree = {
                        Nodes = _tagTreeService.GetTagTree(domain),
                        SelectedNode = selectedTag,
                    }
                }
            };

            return View(model);
        }

        [HttpPost]
        public IActionResult ReorderTagsBatch(string domain, string path, string tag, string targetTag)
        {
            if (!_tagTreeService.ReorderTagsBatch(domain, path, tag, targetTag))
                return NotFound();

            return Ok();
        }

        public IActionResult LoadTagDocuments(string domain, string tagId)
        {
            var model = new ExplorerViewModel
            {
                Id = "explorer",
                Domain = _domainOptions.Find(domain),
            };

            return PartialView("_DocMatrix", model.DocMatrix);
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
