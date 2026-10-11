using MicroDoc.Models;
using MicroDoc.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace MicroDoc.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IOptions<MicroDocOptions> _microDocOptions;
        private readonly DomainOptions _domainOptions;
        private readonly TagTreeService _tagTreeService;
        private readonly DocService _docService;

        public HomeController(ILogger<HomeController> logger, IOptions<MicroDocOptions> microDocOptions, DomainOptions domainOptions, TagTreeService tagTreeService, DocService docService)
        {
            _logger = logger;
            _microDocOptions = microDocOptions;
            _domainOptions = domainOptions;
            _tagTreeService = tagTreeService;
            _docService = docService;
        }

        public IActionResult TagTree(string clientId, string domain, string selectedTag)
        {
            var model = new TagTreeViewModel
            {
                Id = clientId,
                Domain = _domainOptions.Find(domain),
                SelectedTag = selectedTag,
                Nodes = _tagTreeService.GetTagTree(domain),
            };

            return PartialView("_TagTree", model);
        }

        [HttpPost]
        public IActionResult NewTag(string domain, string selectedTag, string newTagName)
        {
            var status = _tagTreeService.NewTag(domain, selectedTag, newTagName, out string newTagId);
                
            if (status != ErrorCode.Ok)
                return Error(status);

            return Content(newTagId);
        }

        [HttpPost]
        public IActionResult MoveTag(string domain, string selectedTag, string targetTag)
        {
            var status = _tagTreeService.MoveTag(domain, selectedTag, targetTag, out string newTagId);
                
            if (status != ErrorCode.Ok)
                return Error(status);

            return Content(newTagId);
        }

        [HttpPost]
        public IActionResult DeleteTag(string domain, string selectedTag)
        {
            if (string.IsNullOrEmpty(selectedTag))
                return Error(ErrorCode.RootTag);

            if (_docService.GetDocuments(domain, selectedTag).Any())
                return Error(ErrorCode.NestedDocumentsExists);

            var status = _tagTreeService.DeleteTag(domain, selectedTag);

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        [HttpPost]
        public IActionResult ReorderTagsBatch(string domain, string path, string tag, string targetTag)
        {
            if (!_tagTreeService.ReorderTagsBatch(domain, path, tag, targetTag))
                return NotFound();

            return Ok();
        }

        public IActionResult DocMatrix(string clientId, string domain, string selectedTag)
        {
            var model = new DocMatrixViewModel
            {
                Id = clientId,
                Domain = _domainOptions.Find(domain),
                SelectedTag = selectedTag,
                Rows = _docService.GetTagWithDocuments(domain, selectedTag)
            };

            return PartialView("_DocMatrix", model);
        }

        public IActionResult Explorer(string clientId, string domain, string selectedTag)
        {
            var model = new ExplorerViewModel
            {
                Id = clientId,
                Domain = _domainOptions.Find(domain),
                SelectedTag = selectedTag,
                TagTree = {
                    Nodes = _tagTreeService.GetTagTree(domain),
                },
                DocMatrix = {
                    Rows = _docService.GetTagWithDocuments(domain, selectedTag)
                },
                TemplateDoc = { 
                    Mode = "view",
                    Doc = new DocNode { }
                }
            };

            return PartialView("_Explorer", model);
        }

        public IActionResult LoadDocument(string domain, string documentId) 
        { 
            var doc = _docService.LoadDocument(domain, documentId);
            if (doc == null)
                return Error(ErrorCode.DocumentNotFound);

            return Json(doc);
        }

        [HttpPost]
        public IActionResult SaveDocument(string domain, string documentId, string content)
        {
            content = content ?? string.Empty;

            var status = _docService.SaveDocument(domain, documentId, content);
            
            if (status != ErrorCode.Ok)
                return Error(status);

            var html = new Markup(_docService, domain, documentId).ToHtml(content);
            return Content(html);
        }

        [HttpPost]
        public IActionResult DeleteDocument(string domain, string documentId)
        {
            var status = _docService.DeleteDocument(domain, documentId);

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        #region Images

        public IActionResult Image(string domain, string documentId, string imageName)
        {
            string filePath = _docService.GetImageFilePath(domain, documentId, imageName);

            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var contentType = Path.GetExtension(filePath).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                _ => "application/octet-stream"
            };

            Response.Headers.CacheControl = "public, max-age=31536000, immutable";

            return PhysicalFile(filePath, contentType);
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage(string domain, string documentId, string imageName, IFormFile image)
        {
            string filePath = _docService.GetImageFilePath(domain, documentId, imageName);
            string folder = Path.GetDirectoryName(filePath);
            if (!Directory.Exists(folder))
                return Error(ErrorCode.TagNotFound);

            await using var stream = System.IO.File.Create(filePath);
            await image.CopyToAsync(stream);

            return Ok();
        }

        #endregion

        #region Domain (Background/Options)

        public IActionResult Background(string domain) 
        {
            var options = _domainOptions.Find(domain);
            if (options == null)
                return NotFound();

            if (string.IsNullOrEmpty(options.Background))
                return NotFound();

            string filePath = _docService.TranslatePathToDocumentId(domain, options.Background);

            if (filePath == null)
                return NotFound();

            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var contentType = Path.GetExtension(filePath).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                _ => "application/octet-stream"
            };

            Response.Headers.CacheControl = "public, max-age=31536000, immutable";

            return PhysicalFile(filePath, contentType);
        }

        public IActionResult LoadDomainOptions() 
        {
            var yaml = DomainOptionsLoader.LoadOptionsAsText(_microDocOptions.Value.DomainOptions);

            return Content(yaml);
        }

        [HttpPost]
        public IActionResult SaveDomainOptions(string yaml)
        {
            var domainOptions = DomainOptionsLoader.ValidateOptions(yaml);

            DomainOptionsLoader.SaveOptionsToFile(_microDocOptions.Value.DomainOptions, yaml);

            // Update singleton in container
            _domainOptions.Domains = domainOptions.Domains;

            _docService.UpdateDomainBackgroundVersions();

            var domainBackgroundVersions = _domainOptions.Domains.ToDictionary(o => o.Name, o => o.BackgroundVersion);

            return Json(new { domainBackgroundVersions });
        }

        #endregion

        private IActionResult Error(ErrorCode code) => NotFound($"{code}");

        #region Misc
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
        #endregion
    }
}
