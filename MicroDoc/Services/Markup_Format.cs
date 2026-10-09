using System.Text;
using System.Text.RegularExpressions;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private static readonly string[] LinkExtensions =
        [
            ".txt",
        ];

        private static string FormatText(string text)
        {
            // /link:[tag] [tag] document.txt
            text = FormatLinks(text);

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

        private static string FormatLinks(string text)
        {
            var result = new StringBuilder();
            int position = 0;

            while (position < text.Length)
            {
                int start = text.IndexOf("/link:", position,
                    StringComparison.OrdinalIgnoreCase);

                if (start < 0)
                {
                    result.Append(text, position, text.Length - position);
                    break;
                }

                // Preserve the text before the link.
                result.Append(text, position, start - position);

                if (!TryParseLink(text, start,
                    out int length, out string[] tags, out string name))
                {
                    // Not a valid link: preserve its original text.
                    result.Append("/link:");
                    position = start + "/link:".Length;
                    continue;
                }

                string documentId = DocumentParser.GetDocumentId(tags, name);
                string documentPath = DocumentParser.GetDocumentPath(tags, name);

                result.Append("<a href=\"");
                result.Append(System.Net.WebUtility.HtmlEncode(documentId));
                result.Append("\">");
                result.Append(System.Net.WebUtility.HtmlEncode(documentPath));
                result.Append("</a>");

                position = start + length;
            }

            return result.ToString();
        }

        private static bool TryParseLink(
            string text,
            int startIndex,
            out int length,
            out string[] tags,
            out string name)
        {
            length = 0;
            tags = [];
            name = "";

            const string prefix = "/link:";

            if (startIndex < 0 ||
                startIndex + prefix.Length > text.Length ||
                !text.AsSpan(startIndex).StartsWith(
                    prefix, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            int position = startIndex + prefix.Length;
            SkipSpaces(text, ref position);

            var parsedTags = new List<string>();

            while (position < text.Length && text[position] == '[')
            {
                int end = text.IndexOf(']', position + 1);

                if (end < 0 || end == position + 1)
                    return false;

                parsedTags.Add(text[(position + 1)..end]);

                position = end + 1;
                SkipSpaces(text, ref position);
            }

            int nameStart = position;

            while (position < text.Length)
            {
                int nextDot = text.IndexOf('.', position);

                if (nextDot < 0)
                    return false;

                foreach (string extension in LinkExtensions)
                {
                    if (nextDot + extension.Length > text.Length)
                        continue;

                    if (!text.AsSpan(nextDot, extension.Length)
                        .Equals(extension, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    int end = nextDot + extension.Length;

                    if (!IsLinkTargetBoundary(text, end))
                        continue;

                    name = text[nameStart..end].TrimEnd();

                    if (name.Length == 0)
                        return false;

                    tags = parsedTags.ToArray();
                    length = end - startIndex;
                    return true;
                }

                position = nextDot + 1;
            }

            return false;
        }

        private static void SkipSpaces(string text, ref int position)
        {
            while (position < text.Length && text[position] == ' ')
                position++;
        }

        private static bool IsLinkTargetBoundary(string text, int position)
        {
            if (position >= text.Length)
                return true;

            char c = text[position];

            if (char.IsWhiteSpace(c) ||
                c is ',' or ';' or ':' or '!' or '?' or ')' or ']')
            {
                return true;
            }

            // Allow a sentence-ending period, but not another filename
            // extension component such as ".tar.gz".
            return c == '.' &&
                   (position + 1 == text.Length ||
                    char.IsWhiteSpace(text[position + 1]) ||
                    ",;:!?)]".Contains(text[position + 1]));
        }
    }
}
