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

        private static IEnumerable<(string Text, int Colspan, string @class)> ParseRowAttributes(string[] cells)
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
                var text = cells[i].Trim();

                int colspan = 1;
                while (i + 1 < end && cells[i + 1].Length == 0)
                {
                    colspan++;
                    i++;
                }

                string @class = string.Empty;
                if (text.StartsWith("&gt;"))
                    text = "→" + text.Substring("&gt;".Length);

                yield return (text, colspan, @class);
            }
        }

        private void StartTableRow(string[] cells, string line)
        {
            line = line.Trim();

            if (!tableStarted)
            {
                html.Append("<table class=\"table\">\n");
                tableStarted = true;
            }

            html.Append("<tr");
            
            if (line.StartsWith("!") && line.EndsWith("!"))
                html.Append(" class=\"noborder\"");
            
            html.Append(">\n");

            var rowAttributes = ParseRowAttributes(cells).ToArray();

            foreach (var (text, colspan, @class) in rowAttributes)
            {
                html.Append("<td");

                if (colspan > 1)
                    html.Append($" colspan=\"{colspan}\"");

                if (!string.IsNullOrEmpty(@class))
                    html.Append($" class=\"{@class}\"");

                html.Append(">")
                    .Append(text)
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
