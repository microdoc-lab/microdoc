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
                int headingLevel = GetHeadingLevel(line);
                if (headingLevel > 0)
                {
                    EndParagraph();
                    EndList();
                    EndSection();
                    StartSection(line[(headingLevel + 1)..], headingLevel);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(line))
                {
                    EndParagraph();
                    EndList();
                    continue;
                }

                int listItemLevel = GetListLevel(line);
                if (listItemLevel >= 0)
                {
                    EndParagraph();
                    EnsureStartSection();
                    StartListItem(line, listItemLevel);
                }
                else
                {

                    EndList();
                    EnsureStartSection();
                    StartParagraph(line);
                }
            }

            EndParagraph();
            EndList();
            EndSection();

            return html.ToString();
        }
    }
}
