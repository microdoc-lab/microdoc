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

            var version = _docService.GetImageVersion(domain, documentId, imageName);
            var onlyName = Path.GetFileNameWithoutExtension(imageName);

            html.Append($"<imgw title=\"{onlyName}\">")
                .Append("<imgc>")
                .Append($"<img src=\"Home/Image?domain={domain}&documentId={documentId}&imageName={imageName}&v={version}\" title=\"{onlyName}\">")
                .Append("</imgc>")
                .Append("</imgw>\n");
        }

        private void EndImageGallery()
        {
            if (!imageGalleryStarted)
                return;

            html.Append("</gallery>\n");
            imageGalleryStarted = false;
        }
    }
}
