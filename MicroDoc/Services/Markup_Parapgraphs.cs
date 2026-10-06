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

            html.Append("<p>")
                .Append(paragraph)
                .Append("</p>\n");

            paragraph.Clear();
        }
    }
}
