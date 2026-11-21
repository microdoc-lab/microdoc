using System.Text;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private StringBuilder paragraph;
        private string paragraphCallout;
        private int paragraphStart;
        private bool isCodeParagraph;

        private void StartParagraph(string line) {
            if (paragraph.Length == 0 && paragraphCallout == null) {

                // parse callout
                var callout = isCodeSection ? "code" : ExtractCallout(ref line);
                callout = ToCssClass(callout);
                isCodeParagraph = callout == "code";

                paragraphCallout = callout;
                paragraphStart = lineIndex;

                if (!string.IsNullOrEmpty(callout) && string.IsNullOrWhiteSpace(line))
                    return;
            }

            if (paragraph.Length > 0)
                paragraph.Append(isCode ? "\n" : "<br>");

            line = UnescapeLine(line);

            paragraph.Append(line);
        }

        private string UnescapeLine(string line)
        {
            if (line.StartsWith("/"))
            {
                var tail = line.TrimStart('/').TrimStart(' ');
                if (tail.StartsWith("#") || tail.StartsWith("-") || tail.StartsWith("|"))
                    return line.TrimStart('/');
            }

            return line;
        }

        private void EndParagraph()
        {
            if (paragraph.Length == 0 && paragraphCallout == null)
                return;

            string text = paragraph.ToString();
            string callout = paragraphCallout;

            var @class = callout != null ? $" class=\"callout {callout}\" callout=\"({callout})\" title=\"{callout}\"" : null;

            html.Append($"<p linestart={paragraphStart} lineend={lineIndex - 1}").Append(@class).Append(">")
                .Append(text)
                .Append("</p>");

            paragraph.Clear();
            paragraphCallout = null;
            paragraphStart = -1;
            isCodeParagraph = false;
        }
    }
}
