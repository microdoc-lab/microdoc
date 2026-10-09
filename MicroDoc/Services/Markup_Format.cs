using System.Text.RegularExpressions;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private static string FormatText(string text)
        {
            // /link:[tag] [tag] document.txt
            text = FormatLinks(text);

            // https://example.com/page?id=10
            text = FormatInternetLinks(text);

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
