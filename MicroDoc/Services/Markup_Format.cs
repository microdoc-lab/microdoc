using System.Text.RegularExpressions;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private string FormatText(string text)
        {
            if (isCode)
                return text;

            // Code: `text`
            text = Regex.Replace(
                text,
                @"(?<!\w)`([^`\r\n]+)`(?!\w)",
                "<code>$1</code>");

            // protect <code> blocks
            var codeBlocks = new List<string>();
            text = Regex.Replace(text, @"<code>.*?</code>", m =>
            {
                codeBlocks.Add(m.Value);
                return $"{{CODE{codeBlocks.Count - 1}}}";
            }, RegexOptions.Singleline);

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

            // Status: /status/
            text = Regex.Replace(
                text,
                @"(?<![\w/:])/([^/\s]+)/(?![\w/])",
                "<status class=\"$1\">$1</status>");

            // /link:[tag] [tag] document.txt
            text = FormatLinks(text);

            // https://example.com/page?id=10
            text = FormatInternetLinks(text);

            // restore <code> blocks
            text = Regex.Replace(text, @"\{CODE(\d+)\}", m =>
                codeBlocks[int.Parse(m.Groups[1].Value)]);

            return text;
        }
    }
}
