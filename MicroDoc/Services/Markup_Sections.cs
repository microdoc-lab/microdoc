namespace MicroDoc.Services
{
    public partial class Markup
    {
        private bool sectionStarted = false;

        static private (int Level, string Heading) TryParseHeading(string line)
        {
            if (line.StartsWith("### "))
                return (3, line["### ".Length..]);

            if (line.StartsWith("## "))
                return (2, line["## ".Length..]);

            if (line.StartsWith("# "))
                return (1, line["# ".Length..]);

            return (0, null);
        }

        private void EnsureStartSection() {
            if (!sectionStarted)
                StartSection("(no header)", 1);
        }

        private void StartSection(string heading, int level)
        {
            EndSection();

            html.Append("<section>")
                .Append("<h").Append(level).Append(">")
                .Append(heading)
                .Append("</h").Append(level).Append(">\n")
                .Append("<content>");

            sectionStarted = true;
        }

        private void EndSection()
        {
            if (sectionStarted)
            {
                html.Append("</content>\n");     // content
                html.Append("</section>\n");
            }
        }
    }
}
