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

            html.Append($"<img src=\"Home/Image?domain={domain}&documentId={documentId}&imageName={imageName}\" title=\"{imageName}\">\n");
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
