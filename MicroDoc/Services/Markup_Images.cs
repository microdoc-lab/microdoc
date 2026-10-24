namespace MicroDoc.Services
{
    public partial class Markup
    {
        private bool imageGalleryStarted;

        private static string TryParseImage(string line)
        {
            if (line.StartsWith("/image:") && line.Length > "/image:".Length)
                return line["/image:".Length..];
            
            return null;
        }

        private void StartImage(string imageName)
        {
            if (!imageGalleryStarted)
            {
                html.Append("<gallery>\n");
                imageGalleryStarted = true;
            }

            // parse image name
            var status = DocumentParser.TryParseImagePath(imageName, out var tags, out var parsedDocument, out var parsedImageName);
            if (status != ErrorCode.Ok) {
                html.Append($"<error>{imageName} - {status}</error>");
                return;
            }

            var parsedDocumentId = documentId;

            // full image path specified
            if (tags.Any())
                parsedDocumentId = DocumentParser.GetDocumentId(tags, parsedDocument + ".txt");

            var imageLink = DocumentParser.GetImagePath(parsedDocumentId, parsedImageName);
            var onlyName = Path.GetFileNameWithoutExtension(parsedImageName);
            var version = _docService.GetImageFileVersion(domain, parsedDocumentId, parsedImageName);

            html.Append($"<imgw data-imagepath=\"{imageLink}\" title=\"{onlyName}\">")
                .Append("<imgc>")
                .Append($"<img src=\"/Home/Image?domain={domain}&documentId={parsedDocumentId}&imageName={parsedImageName}&v={version}\">")
                .Append("</imgc>")
                .Append($"<span>{onlyName}</span>")
                .Append("</imgw>");
        }

        private void EndImageGallery()
        {
            if (!imageGalleryStarted)
                return;

            html.Append("</gallery>");
            imageGalleryStarted = false;
        }
    }
}
