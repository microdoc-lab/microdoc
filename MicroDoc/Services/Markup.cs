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
                    EndTable();
                    EndSection();
                    StartSection(heading.Heading, heading.Level);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(line))
                {
                    EndParagraph();
                    EndList();
                    EndTable();
                    continue;
                }

                var listItem = TryParseListItem(line);
                if (listItem.Level >= 0)
                {
                    EndParagraph();
                    EndTable();
                    EnsureStartSection();
                    var formatted = FormatText(listItem.Item);
                    StartListItem(formatted, listItem.Level);
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
