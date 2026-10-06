namespace MicroDoc.Services
{
    public partial class Markup
    {
        private int listLevel = -1;

        static private int GetListLevel(string line)
        {
            int spaces = 0;

            while (spaces < line.Length && line[spaces] == ' ')
                spaces++;

            if (spaces >= line.Length || !line.AsSpan(spaces).StartsWith("- "))
                return -1;

            return spaces;
        }

        static private string GetListText(string line, int level)
        {
            return line[(level + 2)..];
        }

        private void StartListItem(string line, int level)
        {
            if (listLevel < 0)
            {
                html.Append("<ul>\n")
                    .Append("<li>")
                    .Append(GetListText(line, level));

                listLevel = level;
                return;
            }

            if (level > listLevel)
            {
                html.Append("<ul>\n")
                    .Append("<li>")
                    .Append(GetListText(line, level));

                listLevel = level;
            }
            else if (level == listLevel)
            {
                html.Append("</li>\n")
                    .Append("<li>")
                    .Append(GetListText(line, level));
            }
            else
            {
                html.Append("</li>\n");

                for (int i = listLevel; i > level; i--)
                    html.Append("</ul>\n</li>\n");

                html.Append("<li>")
                    .Append(GetListText(line, level));

                listLevel = level;
            }
        }

        private void EndList()
        {
            if (listLevel < 0)
                return;

            html.Append("</li>\n");

            for (int i = listLevel; i >= 0; i--)
            {
                html.Append("</ul>\n");

                if (i > 0)
                    html.Append("</li>\n");
            }

            listLevel = -1;
        }
    }
}
