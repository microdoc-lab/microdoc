using System.Text;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private StringBuilder paragraph;

        private void StartParagraph(string line) {
            if (paragraph.Length > 0)
                paragraph.Append("<br>");

            paragraph.Append(line);
        }

        private void EndParagraph()
        {
            if (paragraph.Length == 0)
                return;

            string text = paragraph.ToString();
            var callout = ExtractCallout(ref text);
            callout = ToCssClass(callout);

            var @class = callout != null ? $" class=\"callout {callout}\" callout=\"({callout})\" title=\"{callout}\"" : null;

            html.Append("<p").Append(@class).Append(">")
                .Append(text)
                .Append("</p>");

            paragraph.Clear();
        }
    }
}
