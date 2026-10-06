using System.Text.RegularExpressions;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private static string FormatText(string text)
        {
            // Bold: *text*
            text = Regex.Replace(
                text,
                @"(?<!\w)\*([^*\r\n]+)\*(?!\w)",
                "<strong>$1</strong>");

            // Underline: _text_
            text = Regex.Replace(
                text,
                @"(?<!\w)_([^_\r\n]+)_(?!\w)",
                "<u>$1</u>");

            return text;
        }
    }
}
