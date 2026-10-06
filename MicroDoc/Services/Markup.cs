using System.Text;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private StringBuilder html;

        public string ToHtml(string text)
        {
            html = new StringBuilder();
            sectionStarted = false;
            paragraph = new StringBuilder();
            listLevel = -1;

            var lines = text.Replace("\r\n", "\n").Split('\n');

            foreach (var line in lines)
            {
                var heading = TryParseHeading(line);
                if (heading.Level > 0)
                {
                    EndParagraph();
                    EndList();
                    EndSection();
                    StartSection(heading.Heading, heading.Level);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(line))
                {
                    EndParagraph();
                    EndList();
                    continue;
                }

                var listItem = TryParseListItem(line);
                if (listItem.Level >= 0)
                {
                    EndParagraph();
                    EnsureStartSection();
                    var formatted = FormatText(listItem.Item);
                    StartListItem(formatted, listItem.Level);
                }
                else
                {

                    EndList();
                    EnsureStartSection();
                    var formatted = FormatText(line);
                    StartParagraph(formatted);
                }
            }

            EndParagraph();
            EndList();
            EndSection();

            return html.ToString();
        }
    }
}
