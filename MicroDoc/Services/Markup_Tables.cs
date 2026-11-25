namespace MicroDoc.Services
{
    public partial class Markup
    {
        private bool tableStarted;

        private string[] ParseTableCells(string line)
        {
            if (isCode)
                return [];

            var parts = line.Split('|', '!');

            if (parts.Length < 3)
                return [];

            if (parts.First().Trim() != string.Empty)
                return [];

            if (parts.Last().Trim() != string.Empty)
                return [];

            return parts;
        }

        private static IEnumerable<(string Text, int Colspan)> ParseRowColspans(string[] cells)
        {
            int start = 0;
            int end = cells.Length;

            // Ignore optional leading |
            if (cells[0].Length == 0)
                start++;

            // Ignore optional trailing |
            if (end > start && cells[end - 1].Length == 0)
                end--;

            for (int i = start; i < end; i++)
            {
                var text = cells[i];

                int colspan = 1;
                while (i + 1 < end && cells[i + 1].Length == 0)
                {
                    colspan++;
                    i++;
                }

                yield return (text, colspan);
            }
        }

        private void StartTableRow(string[] cells, string line)
        {
            if (!tableStarted)
            {
                html.Append("<table class=\"table\">\n");
                tableStarted = true;
            }

            line = line.Trim();
            if (line.StartsWith("!") && line.EndsWith("!"))
                html.Append("<tr class=\"noborder\">\n");
            else
                html.Append("<tr>\n");

            var rowColspans = ParseRowColspans(cells).ToArray();

            foreach (var (text, colspan) in rowColspans)
            {
                if (colspan == 1)
                    html.Append("<td>");
                else
                    html.Append($"<td colspan=\"{colspan}\">");

                html.Append(text)
                    .Append("</td>\n");
            }

            html.Append("</tr>\n");
        }

        private void EndTable()
        {
            if (!tableStarted)
                return;

            html.Append("</table>\n");
            tableStarted = false;
        }
    }
}
