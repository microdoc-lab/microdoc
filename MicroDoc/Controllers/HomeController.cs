using MicroDoc.Models;
using MicroDoc.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Security.Claims;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats;

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
        private readonly IHubContext<ChangeHub> _changeHub;

        public HomeController(ILogger<HomeController> logger, 
            IOptions<MicroDocOptions> microDocOptions, DomainOptions domainOptions, 
            TagService tagService, DocService docService, TagMoveService tagMoveService, 
            IHubContext<ChangeHub> changeHub)
        {
            _logger = logger;
            _microDocOptions = microDocOptions;
            _domainOptions = domainOptions;
            _tagService = tagService;
            _docService = docService;
            _tagMoveService = tagMoveService;
            _changeHub = changeHub;
        }

        private string ClientUID => HttpContext.Items["ClientUID"]?.ToString();

        #region TagTree

        [Authorize]
        public IActionResult TagTree(string clientId, string domain, string selectedTag)
        {
            if (!User.IsInRole(_domainOptions, "r", domain))
                return Forbid();

            selectedTag = selectedTag ?? string.Empty;

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
        [Authorize]
        public async Task<IActionResult> NewTag(string domain, string selectedTag, string newTagName)
        {
            if (!User.IsInRole(_domainOptions, "w", domain))
                return Forbid();

            selectedTag = selectedTag ?? string.Empty;

            string newTag = null;

            var status = LoggingHelper.Execute(_logger, nameof(NewTag), new { domain, selectedTag, newTagName }, () =>
                _tagService.NewTag(domain, selectedTag, newTagName, out newTag));

            if (status != ErrorCode.Ok)
                return Error(status);

            var result = new
            {
                ClientUID,
                newTag,
                changes = new[] { new { op = nameof(NewTag), domain, selectedTag, newTagName, newTag } },
            };

            await _changeHub.Clients.All.SendAsync("Changes", result);

            return Json(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> RenameTag(string domain, string selectedTag, string newTagName)
        {
            if (!User.IsInRole(_domainOptions, "w", domain))
                return Forbid();

            selectedTag = selectedTag ?? string.Empty;

            string parentTag = null;
            string newTag = null;

            var status = LoggingHelper.Execute(_logger, nameof(NewTag), new { domain, selectedTag, newTagName }, () =>
                _tagService.RenameTag(domain, selectedTag, newTagName, out parentTag, out newTag));

            if (status != ErrorCode.Ok)
                return Error(status);

            var result = new
            {
                ClientUID,
                newTag,
                changes = new[] { new { op = nameof(RenameTag), domain, selectedTag, newTagName, parentTag, newTag } },
            };

            await _changeHub.Clients.All.SendAsync("Changes", result);

            return Json(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> MoveTag(string domain, string selectedTag, string targetTag)
        {
            if (!User.IsInRole(_domainOptions, "w", domain))
                return Forbid();

            selectedTag = selectedTag ?? string.Empty;
            targetTag = targetTag ?? string.Empty;

            string parentTag = null;
            string newTag = null;

            var status = LoggingHelper.Execute(_logger, nameof(MoveTag), new { domain, selectedTag, targetTag }, () =>
                _tagService.MoveTag(domain, selectedTag, targetTag, out parentTag, out newTag));

            if (status != ErrorCode.Ok)
                return Error(status);

            var result = new
            {
                ClientUID,
                newTag,
                changes = new[] { new { op = nameof(MoveTag), domain, selectedTag, targetTag, parentTag, newTag } },
            };

            await _changeHub.Clients.All.SendAsync("Changes", result);

            return Json(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> DeleteTag(string domain, string selectedTag)
        {
            if (!User.IsInRole(_domainOptions, "w", domain))
                return Forbid();

            selectedTag = selectedTag ?? string.Empty;

            string parentTag = null;

            var status = LoggingHelper.Execute(_logger, nameof(DeleteTag), new { domain, selectedTag }, () =>
            {
                if (string.IsNullOrEmpty(selectedTag))
                    return ErrorCode.RootTag;

                if (_docService.GetDocuments(domain, selectedTag).Any())
                    return ErrorCode.NestedDocumentsExists;

                return _tagService.DeleteTag(domain, selectedTag, out parentTag);
            });

            if (status != ErrorCode.Ok)
                return Error(status);

            var result = new
            {
                ClientUID,
                changes = new[] { new { op = nameof(DeleteTag), domain, selectedTag, parentTag } },
            };
            
            await _changeHub.Clients.All.SendAsync("Changes", result);

            return Json(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SwapTags(string domain, string parentTag, string tagName, string targetTagName)
        {
            if (!User.IsInRole(_domainOptions, "w", domain))
                return Forbid();

            parentTag = parentTag ?? string.Empty;

            var status = LoggingHelper.Execute(_logger, nameof(SwapTags), new { domain, parentTag, tagName, targetTagName }, () =>
                _tagService.SwapTags(domain, parentTag, tagName, targetTagName));

            if (status != ErrorCode.Ok)
                return Error(status);

            var result = new
            {
                ClientUID,
                changes = new[] { new { op = nameof(SwapTags), domain, parentTag, tagName, targetTagName } },
            };

            await _changeHub.Clients.All.SendAsync("Changes", result);

            return Json(result);
        }

        #endregion

        #region DocMatrix/Explorer

        [Authorize]
        public IActionResult DocMatrix(string clientId, string domain, string selectedTag, bool loadDeepLevels = false)
        {
            if (!User.IsInRole(_domainOptions, "r", domain))
                return Forbid();

            selectedTag = selectedTag ?? string.Empty;

            var model = LoggingHelper.Execute(_logger, nameof(DocMatrix), new { clientId, domain, selectedTag }, () =>
                new DocMatrixViewModel
                {
                    Id = clientId,
                    Domain = _domainOptions.Find(domain),
                    SelectedTag = selectedTag,
                    LoadDeepLevels = loadDeepLevels,
                    Rows = _docService.GetTagWithDocuments(domain, selectedTag, loadDeepLevels)
                });

            return PartialView("_DocMatrix", model);
        }

        [Authorize]
        public IActionResult Explorer(string clientId, string domain, string selectedTag, bool loadDeepLevels = false)
        {
            if (!User.IsInRole(_domainOptions, "r", domain))
                return Forbid();

            selectedTag = selectedTag ?? string.Empty;

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
                        LoadDeepLevels = loadDeepLevels,
                        Rows = _docService.GetTagWithDocuments(domain, selectedTag, loadDeepLevels)
                    },
                    TemplateDoc = {
                        Mode = "view",
                        Doc = new DocNode { }
                    }
                });

            return PartialView("_Explorer", model);
        }

        #endregion

        #region Document

        [Authorize]
        public IActionResult LoadDocument(string domain, string documentId) 
        {
            if (!User.IsInRole(_domainOptions, "r", domain, documentId))
                return Forbid();

            DocNode doc = null;

            var status = LoggingHelper.Execute(_logger, nameof(LoadDocument), new { domain, documentId }, () =>
            {
                doc = _docService.LoadDocument(domain, documentId);

                // try resolve documentId over TagMoveService
                if (doc == null && _domainOptions.Find(domain).TrackTagMoves)
                {
                    var movedDocumentId = _tagMoveService.ResolveDocument(domain, documentId);

                    if (!string.IsNullOrEmpty(movedDocumentId))
                        doc = _docService.LoadDocument(domain, movedDocumentId);
                }

                if (doc == null)
                    return ErrorCode.DocumentNotFound;

                return ErrorCode.Ok;
            });

            if (status != ErrorCode.Ok)
                return Error(status);

            return Json(doc);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SaveDocument(string domain, string documentId, string content)
        {
            if (!   User.IsInRole(_domainOptions, "w", domain, documentId))
                return Forbid();

            content = content ?? string.Empty;

            var status = LoggingHelper.Execute(_logger, nameof(SaveDocument), new { domain, documentId }, () =>
                _docService.SaveDocument(domain, documentId, content));
            
            if (status != ErrorCode.Ok)
                return Error(status);

            var html = new Markup(_docService, domain, documentId).ToHtml(content);

            var result = new
            {
                ClientUID,
                changes = new[] { new { op = nameof(SaveDocument), domain, documentId, content, html } },
            };

            await _changeHub.Clients.All.SendAsync("Changes", result);

            return Json(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> DeleteDocument(string domain, string documentId)
        {
            if (!User.IsInRole(_domainOptions, "w", domain))
                return Forbid();

            var status = LoggingHelper.Execute(_logger, nameof(DeleteDocument), new { domain, documentId }, () =>
                _docService.DeleteDocument(domain, documentId));

            if (status != ErrorCode.Ok)
                return Error(status);

            var result = new
            {
                ClientUID,
                changes = new[] { new { op = nameof(DeleteDocument), domain, documentId } },
            };

            await _changeHub.Clients.All.SendAsync("Changes", result);

            return Json(result);
        }

        #endregion

        #region Images

        const int ThumbImageDimension = 100;

        [Authorize]
        public async Task<IActionResult> Image(string domain, string documentId, string imageName, bool thumb = false)
        {
            if (!User.IsInRole(_domainOptions, "r", domain))
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

            if (thumb)
            {
                Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
            }
            else
            {
                Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            }

            if (thumb)
            {
                using var image = await SixLabors.ImageSharp.Image.LoadAsync(filePath);

                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Size = new Size(ThumbImageDimension, ThumbImageDimension),
                    Mode = ResizeMode.Max
                }));

                using var stream = new MemoryStream();
                await image.SaveAsPngAsync(stream);
                stream.Position = 0;

                return File(stream.ToArray(), "image/png");
            }

            return PhysicalFile(filePath, contentType);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> UploadImage(string domain, string documentId, string imageName, IFormFile image)
        {
            if (!User.IsInRole(_domainOptions, "w", domain))
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

        [Authorize]
        public IActionResult Background(string domain) 
        {
            if (!User.IsInRole(_domainOptions, "r", domain))
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


        #region Misc
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult LandingPage()
        {
            ViewData["domain"] = "--landing--page--";
            return View("Index");
        }

        [HttpGet("/{domain:regex(^(?i:((?!Home$).)+)$)}")]
        public IActionResult Domain(string domain)
        {
            ViewData["domain"] = domain;
            return View("Index");
        }

        [HttpGet("/{domain:regex(^(?i:((?!Home$).)+)$)}/{**documentId}")]
        public IActionResult Document(string domain, string documentId)
        {
            ViewData["domain"] = domain;
            ViewData["documentId"] = documentId;
            return View("Index");
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

        #region Security

        [HttpPost]
        public async Task<IActionResult> SimpleLogin(string email)
        {
            if (!_domainOptions.SimpleLogin)
                return BadRequest(new { error = "Simple login not supported" });

            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { error = "Empty email" });

            // Find user or *
            var user = _domainOptions.Users.FirstOrDefault(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase))
                ?? _domainOptions.Users.FirstOrDefault(u => u.Email == "*");

            if (user == null)
                return BadRequest(new { error = "Unknown user email" });

            // sign-in user
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, email),
                new Claim(ClaimTypes.Email, email),
            };

            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity));

            return Ok(new { success = true });
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

        #endregion
    }
}
