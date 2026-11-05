namespace MicroDoc.Services
{
    public partial class Markup
    {
        private int listLevel = -1;

        private (int level, string item) TryParseListItem(string line)
        {
            if (isCode)
                return (-1, null);

            int spaces = 0;

            while (spaces < line.Length && line[spaces] == ' ')
                spaces++;

            if (spaces >= line.Length || !line.AsSpan(spaces).StartsWith("- "))
                return (-1, null);

            return (spaces / 2, line[(spaces + 2)..]);
        }

        private void StartListItem(int level, string item)
        {
            if (level > listLevel)
            {
                for (int i = listLevel; i < level; i++)
                    html.Append("<ul>\n<li>");

                html.Append(item);

                listLevel = level;
            }
            else if (level == listLevel)
            {
                html.Append("</li>\n")
                    .Append("<li>")
                    .Append(item);
            }
            else
            {
                for (int i = listLevel; i > level; i--)
                    html.Append("</li>\n</ul>\n");

                html.Append("<li>")
                    .Append(item);

                listLevel = level;
            }
        }

        private void EndList()
        {
            for (int i = listLevel; i > -1; i--)
                html.Append("</li>\n</ul>\n");

            listLevel = -1;
        }
    }
}
