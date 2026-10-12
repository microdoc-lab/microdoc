using MicroDoc.Models;
using MicroDoc.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
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
        private readonly TagService _tagService;
        private readonly DocService _docService;
        private readonly TagMoveService _tagMoveService;

        public HomeController(ILogger<HomeController> logger, IOptions<MicroDocOptions> microDocOptions, DomainOptions domainOptions, TagService tagService, DocService docService, TagMoveService tagMoveService)
        {
            _logger = logger;
            _microDocOptions = microDocOptions;
            _domainOptions = domainOptions;
            _tagService = tagService;
            _docService = docService;
            _tagMoveService = tagMoveService;
        }

        #region TagTree

        [Authorize(Roles = "r")]
        public IActionResult TagTree(string clientId, string domain, string selectedTag)
        {
            if (!IsInRole(domain, "r"))
                return Forbid();

            var model = LoggingHelper.Execute(_logger, nameof(TagTree), new { clientId, domain, selectedTag }, () =>
                new TagTreeViewModel
                {
                    Id = clientId,
                    Domain = _domainOptions.Find(domain),
                    SelectedTag = selectedTag,
                    Nodes = _tagService.GetTagTree(domain),
                });

            return PartialView("_TagTree", model);
        }

        [HttpPost]
        [Authorize(Roles = "w")]
        public IActionResult NewTag(string domain, string selectedTag, string newTagName)
        {
            if (!IsInRole(domain, "w"))
                return Forbid();

            string newTagId = null;

            var status = LoggingHelper.Execute(_logger, nameof(NewTag), new { domain, selectedTag, newTagName }, () =>
                _tagService.NewTag(domain, selectedTag, newTagName, out newTagId));

            if (status != ErrorCode.Ok)
                return Error(status);

            return Content(newTagId);
        }

        [HttpPost]
        [Authorize(Roles = "w")]
        public IActionResult MoveTag(string domain, string selectedTag, string targetTag)
        {
            if (!IsInRole(domain, "w"))
                return Forbid();
            
            string newTagId = null;

            var status = LoggingHelper.Execute(_logger, nameof(MoveTag), new { domain, selectedTag, targetTag }, () =>
                _tagService.MoveTag(domain, selectedTag, targetTag, out newTagId));
                
            if (status != ErrorCode.Ok)
                return Error(status);

            return Content(newTagId);
        }

        [HttpPost]
        [Authorize(Roles = "w")]
        public IActionResult DeleteTag(string domain, string selectedTag)
        {
            if (!IsInRole(domain, "w"))
                return Forbid();
            
            var status = LoggingHelper.Execute(_logger, nameof(DeleteTag), new { domain, selectedTag }, () =>
            {
                if (string.IsNullOrEmpty(selectedTag))
                    return ErrorCode.RootTag;

                if (_docService.GetDocuments(domain, selectedTag).Any())
                    return ErrorCode.NestedDocumentsExists;

                return _tagService.DeleteTag(domain, selectedTag);
            });

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        [HttpPost]
        [Authorize(Roles = "w")]
        public IActionResult ReorderTagsBatch(string domain, string path, string tag, string targetTag)
        {
            if (!IsInRole(domain, "w"))
                return Forbid();

            path = path ?? string.Empty;

            var status = LoggingHelper.Execute(_logger, nameof(ReorderTagsBatch), new { domain, path, tag, targetTag }, () =>
                _tagService.ReorderTagsBatch(domain, path, tag, targetTag));

            if (status != ErrorCode.Ok)
                return Error(status);

            return Json(new 
            { 
                changes = new[] { new { op = "SwapTags", domain, path, tag, targetTag } }
            });
        }

        #endregion

        [Authorize(Roles = "r")]
        public IActionResult DocMatrix(string clientId, string domain, string selectedTag)
        {
            if (!IsInRole(domain, "r"))
                return Forbid();

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

        [Authorize(Roles = "r")]
        public IActionResult Explorer(string clientId, string domain, string selectedTag)
        {
            if (!IsInRole(domain, "r"))
                return Forbid();

            var model = LoggingHelper.Execute(_logger, nameof(Explorer), new { clientId, domain, selectedTag }, () =>
                new ExplorerViewModel
                {
                    Id = clientId,
                    Domain = _domainOptions.Find(domain),
                    SelectedTag = selectedTag,
                    TagTree = {
                        Nodes = _tagService.GetTagTree(domain),
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

        [Authorize(Roles = "r")]
        public IActionResult LoadDocument(string domain, string documentId) 
        {
            if (!IsInRole(domain, "r"))
                return Forbid();

            DocNode doc = null;

            var status = LoggingHelper.Execute(_logger, nameof(LoadDocument), new { domain, documentId }, () =>
            {
                doc = _docService.LoadDocument(domain, documentId);

                if (doc == null)
                {
                    // try resolve documentId over TagMoveService
                    var movedDocumentId = _tagMoveService.ResolveDocument(domain, documentId);

                    if (string.IsNullOrEmpty(movedDocumentId))
                        return ErrorCode.DocumentNotFound;

                    doc = _docService.LoadDocument(domain, movedDocumentId);

                    if (doc == null)
                        return ErrorCode.DocumentNotFound;
                    
                    return ErrorCode.Ok;
                }

                return ErrorCode.Ok;
            });

            if (status != ErrorCode.Ok)
                return Error(status);

            return Json(doc);
        }

        [HttpPost]
        [Authorize(Roles = "w")]
        public IActionResult SaveDocument(string domain, string documentId, string content)
        {
            if (!IsInRole(domain, "w"))
                return Forbid();

            content = content ?? string.Empty;

            var status = LoggingHelper.Execute(_logger, nameof(SaveDocument), new { domain, documentId }, () =>
                _docService.SaveDocument(domain, documentId, content));
            
            if (status != ErrorCode.Ok)
                return Error(status);

            var html = new Markup(_docService, domain, documentId).ToHtml(content);
            return Content(html);
        }

        [HttpPost]
        [Authorize(Roles = "w")]
        public IActionResult DeleteDocument(string domain, string documentId)
        {
            if (!IsInRole(domain, "w"))
                return Forbid();

            var status = LoggingHelper.Execute(_logger, nameof(DeleteDocument), new { domain, documentId }, () =>
                _docService.DeleteDocument(domain, documentId));

            if (status != ErrorCode.Ok)
                return Error(status);

            return Ok();
        }

        #endregion

        #region Images

        [Authorize(Roles = "r")]
        public IActionResult Image(string domain, string documentId, string imageName)
        {
            if (!IsInRole(domain, "r"))
                return Forbid();

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
        [Authorize(Roles = "w")]
        public async Task<IActionResult> UploadImage(string domain, string documentId, string imageName, IFormFile image)
        {
            if (!IsInRole(domain, "w"))
                return Forbid();

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

        [Authorize(Roles = "r")]
        public IActionResult Background(string domain) 
        {
            if (!IsInRole(domain, "r"))
                return Forbid();

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

        [Authorize(Roles = "a")]
        public IActionResult LoadDomainOptions() 
        {
            var yaml = LoggingHelper.Execute(_logger, nameof(LoadDomainOptions), new { }, () =>
                DomainOptionsLoader.LoadOptionsAsText(_microDocOptions.Value.DomainOptions));

            return Content(yaml);
        }

        [HttpPost]
        [Authorize(Roles = "a")]
        public IActionResult SaveDomainOptions(string yaml)
        {
            Dictionary<string, string> domainBackgroundVersions = null;

            var status = LoggingHelper.Execute(_logger, nameof(SaveDomainOptions), new { yaml }, () =>
            {
                var domainOptions = DomainOptionsLoader.ValidateOptions(yaml);

                DomainOptionsLoader.SaveOptionsToFile(_microDocOptions.Value.DomainOptions, yaml);

                // Update singleton in container
                _domainOptions.Domains = domainOptions.Domains;
                _domainOptions.Users = domainOptions.Users;

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

        private bool IsInRole(string domain, string role) => User.IsInRole(domain + ":" + role);

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
