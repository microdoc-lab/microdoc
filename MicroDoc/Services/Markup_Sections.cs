namespace MicroDoc.Services
{
    public partial class Markup
    {
        private bool sectionStarted = false;

        static private int GetHeadingLevel(string line)
        {
            if (line.StartsWith("### "))
                return 3;

            if (line.StartsWith("## "))
                return 2;

            if (line.StartsWith("# "))
                return 1;

            return 0;
        }

        private void EnsureStartSection() {
            if (!sectionStarted)
                StartSection("(no header)", 1);
        }

        private void StartSection(string title, int headingLevel)
        {
            EndSection();

            html.Append("<section>")
                .Append("<h").Append(headingLevel).Append(">")
                .Append(title)
                .Append("</h").Append(headingLevel).Append(">\n")
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
