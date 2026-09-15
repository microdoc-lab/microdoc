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

        public IActionResult Index(string domain = "microdoc.doc")
        {
            var model = new IndexViewModel
            {
                Explorer = new ExplorerViewModel
                {
                    Id = "explorer",
                    TagTree = {
                        Domain = _domainOptions.Find(domain),
                        Nodes = _tagTreeService.GetTagTree(),
                        SelectedNode = "Services",
                    },
                    Doc = { 
                        Domain = _domainOptions.Find(domain)
                    }
                }
            };

            return View(model);
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
