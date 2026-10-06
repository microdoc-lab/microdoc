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
                var (headingLevel, heading) = TryParseHeading(line);
                if (headingLevel > 0)
                {
                    EndParagraph();
                    EndList();
                    EndTable();
                    EndSection();
                    StartSection(headingLevel, heading);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(line))
                {
                    EndParagraph();
                    EndList();
                    EndTable();
                    continue;
                }

                var (listLevel, listItem) = TryParseListItem(line);
                if (listLevel >= 0)
                {
                    EndParagraph();
                    EndTable();
                    EnsureStartSection();
                    var formatted = FormatText(listItem);
                    StartListItem(listLevel, formatted);
                    continue;
                }

                var tableCells = ParseTableCells(line);
                if (tableCells.Length > 1) 
                {
                    EndParagraph();
                    EndList();
                    EnsureStartSection();
                    var formatted = tableCells.Select(FormatText).ToArray();
                    StartTableRow(formatted);
                    continue;
                }

                {

                    EndList();
                    EndTable();
                    EnsureStartSection();
                    var formatted = FormatText(line);
                    StartParagraph(formatted);
                }
            }

            EndParagraph();
            EndList();
            EndTable();
            EndSection();

            return html.ToString();
        }
    }
}
