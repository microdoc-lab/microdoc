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

        #region TagTree

        public IActionResult TagTree(string clientId, string domain, string selectedTag)
        {
            var model = LoggingHelper.Execute(_logger, nameof(TagTree), new { clientId, domain, selectedTag }, () =>
                new TagTreeViewModel
                {
                    Id = clientId,
                    Domain = _domainOptions.Find(domain),
                    SelectedTag = selectedTag,
                    Nodes = _tagTreeService.GetTagTree(domain),
                });

            return PartialView("_TagTree", model);
        }

        [HttpPost]
        public IActionResult NewTag(string domain, string selectedTag, string newTagName)
        {
            string newTagId = null;

            var status = LoggingHelper.Execute(_logger, nameof(NewTag), new { domain, selectedTag, newTagName }, () =>
                _tagTreeService.NewTag(domain, selectedTag, newTagName, out newTagId));

            if (status != ErrorCode.Ok)
                return Error(status);

            return Content(newTagId);
        }

        [HttpPost]
        public IActionResult MoveTag(string domain, string selectedTag, string targetTag)
        {
            string newTagId = null;

            var status = LoggingHelper.Execute(_logger, nameof(MoveTag), new { domain, selectedTag, targetTag }, () =>
                _tagTreeService.MoveTag(domain, selectedTag, targetTag, out newTagId));
                
            if (status != ErrorCode.Ok)
                return Error(status);

            return Content(newTagId);
        }

        [HttpPost]
        public IActionResult DeleteTag(string domain, string selectedTag)
        {
            var status = LoggingHelper.Execute(_logger, nameof(DeleteTag), new { domain, selectedTag }, () =>
            {
                if (string.IsNullOrEmpty(selectedTag))
                    return ErrorCode.RootTag;

                if (_docService.GetDocuments(domain, selectedTag).Any())
                    return ErrorCode.NestedDocumentsExists;

                return _tagTreeService.DeleteTag(domain, selectedTag);
            });

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        [HttpPost]
        public IActionResult ReorderTagsBatch(string domain, string path, string tag, string targetTag)
        {
            var status = LoggingHelper.Execute(_logger, nameof(ReorderTagsBatch), new { domain, path, tag, targetTag }, () =>
                _tagTreeService.ReorderTagsBatch(domain, path, tag, targetTag));

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        #endregion

        public IActionResult DocMatrix(string clientId, string domain, string selectedTag)
        {
            var model = LoggingHelper.Execute(_logger, nameof(DocMatrix), new { clientId, domain, selectedTag }, () =>
                new DocMatrixViewModel
                {
                    Id = clientId,
                    Domain = _domainOptions.Find(domain),
                    SelectedTag = selectedTag,
                    Rows = _docService.GetTagWithDocuments(domain, selectedTag)
                });

            return PartialView("_DocMatrix", model);
        }

        public IActionResult Explorer(string clientId, string domain, string selectedTag)
        {
            var model = LoggingHelper.Execute(_logger, nameof(Explorer), new { clientId, domain, selectedTag }, () =>
                new ExplorerViewModel
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
                });

            return PartialView("_Explorer", model);
        }

        #region Document

        public IActionResult LoadDocument(string domain, string documentId) 
        {
            DocNode doc = null;

            var status = LoggingHelper.Execute(_logger, nameof(LoadDocument), new { domain, documentId }, () =>
            {
                doc = _docService.LoadDocument(domain, documentId);
                
                if (doc == null)
                    return ErrorCode.DocumentNotFound;

                return ErrorCode.Ok;
            });

            if (status != ErrorCode.Ok)
                return Error(status);

            return Json(doc);
        }

        [HttpPost]
        public IActionResult SaveDocument(string domain, string documentId, string content)
        {
            content = content ?? string.Empty;

            var status = LoggingHelper.Execute(_logger, nameof(SaveDocument), new { domain, documentId }, () =>
                _docService.SaveDocument(domain, documentId, content));
            
            if (status != ErrorCode.Ok)
                return Error(status);

            var html = new Markup(_docService, domain, documentId).ToHtml(content);
            return Content(html);
        }

        [HttpPost]
        public IActionResult DeleteDocument(string domain, string documentId)
        {
            var status = LoggingHelper.Execute(_logger, nameof(DeleteDocument), new { domain, documentId }, () =>
                _docService.DeleteDocument(domain, documentId));

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        #endregion

        #region Images

        public IActionResult Image(string domain, string documentId, string imageName)
        {
            string filePath = null;

            var status = LoggingHelper.Execute(_logger, nameof(Image), new { domain, documentId, imageName }, () =>
            {
                filePath = _docService.GetImageFilePath(domain, documentId, imageName);

                if (!System.IO.File.Exists(filePath))
                    return ErrorCode.ImageNotFound;

                return ErrorCode.Ok;
            });

            if (status != ErrorCode.Ok)
                return Error(status);

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
            var status = await LoggingHelper.Execute(_logger, nameof(UploadImage), new { domain, documentId, imageName }, async () =>
            {
                string filePath = _docService.GetImageFilePath(domain, documentId, imageName);
                string folder = Path.GetDirectoryName(filePath);
                if (!Directory.Exists(folder))
                    return ErrorCode.TagNotFound;

                await using var stream = System.IO.File.Create(filePath);
                await image.CopyToAsync(stream);
                
                return ErrorCode.Ok;
            });

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        #endregion

        #region Domain (Background/Options)

        public IActionResult Background(string domain) 
        {
            string filePath = null;

            var status = LoggingHelper.Execute(_logger, nameof(Background), new { domain }, () =>
            {
                var options = _domainOptions.Find(domain);

                if (string.IsNullOrEmpty(options.Background))
                    return ErrorCode.ImageNotFound;

                filePath = _docService.TranslatePathToDocumentId(domain, options.Background);

                if (!System.IO.File.Exists(filePath))
                    return ErrorCode.ImageNotFound;

                return ErrorCode.Ok;
            });

            if (status != ErrorCode.Ok)
                return Error(status);

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
            var yaml = LoggingHelper.Execute(_logger, nameof(LoadDomainOptions), new { }, () =>
                DomainOptionsLoader.LoadOptionsAsText(_microDocOptions.Value.DomainOptions));

            return Content(yaml);
        }

        [HttpPost]
        public IActionResult SaveDomainOptions(string yaml)
        {
            Dictionary<string, string> domainBackgroundVersions = null;

            var status = LoggingHelper.Execute(_logger, nameof(SaveDomainOptions), new { yaml }, () =>
            {
                var domainOptions = DomainOptionsLoader.ValidateOptions(yaml);

                DomainOptionsLoader.SaveOptionsToFile(_microDocOptions.Value.DomainOptions, yaml);

                // Update singleton in container
                _domainOptions.Domains = domainOptions.Domains;

                _docService.UpdateDomainBackgroundVersions();

                domainBackgroundVersions = _domainOptions.Domains.ToDictionary(o => o.Name, o => o.BackgroundVersion);

                return ErrorCode.Ok;
            });

            if (status != ErrorCode.Ok)
                return Error(status);

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
