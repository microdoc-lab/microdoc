using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.Versioning;

namespace MicroDoc.Services
{
    public static class ImageHelper
    {
        [SupportedOSPlatform("windows")]
        public static byte[] ThumbnailPng(string filePath, int dimension)
        {
            using var source = Image.FromFile(filePath);

            double scale = Math.Min(
                (double)dimension / source.Width,
                (double)dimension / source.Height);

            int width = Math.Max(1, (int)Math.Round(source.Width * scale));
            int height = Math.Max(1, (int)Math.Round(source.Height * scale));

            using var thumbnail = new Bitmap(width, height);

            using (var graphics = Graphics.FromImage(thumbnail))
            {
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

                graphics.DrawImage(source, 0, 0, width, height);
            }

            using var stream = new MemoryStream();
            thumbnail.Save(stream, ImageFormat.Png);
            stream.Position = 0;

            return stream.ToArray();
        }
    }
}
