using OneImage;

namespace MicroDoc.Services
{
    public static class ImageHelper
    {
        public static byte[] ThumbnailPng(string filePath, int dimension)
        {
            using var output = new MemoryStream();

            Image.Load(filePath)
                .Resize(width: dimension, height: dimension, fit: Fit.Contain)
                .Save(output, PngFormat.Instance);

            return output.ToArray();
        }
    }
}
