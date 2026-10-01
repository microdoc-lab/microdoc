using System.Text;

namespace MicroDoc.Services
{
    public static class Markup
    {
        public static string ToHtml(string text)
        {
            var lines = text.Replace("\r\n", "\n").Split('\n');

            var html = new StringBuilder();
            var paragraph = new StringBuilder();
            bool sectionStarted = false;

            void EndParagraph()
            {
                if (paragraph.Length == 0)
                    return;

                html.Append("<p>")
                    .Append(paragraph)
                    .Append("</p>\n");

                paragraph.Clear();
            }

            void EndSection()
            {
                EndParagraph();

                if (sectionStarted)
                {
                    html.Append("</content>\n");     // content
                    html.Append("</section>\n");
                }
            }

            void StartSection(int level, string title)
            {
                EndSection();

                html.Append("<section>")
                    .Append("<h").Append(level).Append(">")
                    .Append(title)
                    .Append("</h").Append(level).Append(">\n")
                    .Append("<content>");

                sectionStarted = true;
            }

            foreach (var line in lines)
            {
                int level = GetHeaderLevel(line);

                if (level > 0)
                {
                    StartSection(level, line[(level + 1)..]);
                }
                else if (string.IsNullOrWhiteSpace(line))
                {
                    EndParagraph();
                }
                else
                {
                    if (!sectionStarted)
                        StartSection(1, "(no header)");

                    if (paragraph.Length > 0)
                        paragraph.Append("<br>");

                    paragraph.Append(line);
                }
            }

            EndSection();

            return html.ToString();
        }

        private static int GetHeaderLevel(string line)
        {
            if (line.StartsWith("### "))
                return 3;

            if (line.StartsWith("## "))
                return 2;

            if (line.StartsWith("# "))
                return 1;

            return 0;
        }
    }
}
