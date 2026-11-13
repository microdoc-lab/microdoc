using System.Net;
using System.Text;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private readonly DocService _docService;
        private readonly string domain;
        private readonly string documentId;

        public Markup(DocService docService, string domain, string documentId)
        {
            _docService = docService;
            this.domain = domain;
            this.documentId = documentId;
        }

        private StringBuilder html;
        private int lineIndex;
        private bool isCode => isCodeSection || isCodeParagraph;

        public string ToHtml(string text)
        {
            html = new StringBuilder();
            sectionStarted = false;
            paragraph = new StringBuilder();
            paragraphCallout = null;
            paragraphStart = -1;
            listLevel = -1;
            imageGalleryStarted = false;
            lineIndex = -1;

            var lines = text.Replace("\r\n", "\n").Split('\n')
                .Select(WebUtility.HtmlEncode)
                .ToArray();

            foreach (var line in lines)
            {
                lineIndex++;

                var (headingLevel, heading) = TryParseHeading(line);
                if (headingLevel > 0)
                {
                    EndParagraph();
                    EndList();
                    EndTable();
                    EndImageGallery();
                    EndSection();
                    StartSection(headingLevel, heading);
                    continue;
                }

                if (!isCodeSection && string.IsNullOrWhiteSpace(line))
                {
                    EndParagraph();
                    EndList();
                    EndTable();
                    EndImageGallery();
                    continue;
                }

                var (listLevel, listItem) = TryParseListItem(line);
                if (listLevel >= 0)
                {
                    EndParagraph();
                    EndTable();
                    EndImageGallery();
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
                    EndImageGallery();
                    EnsureStartSection();
                    var formatted = tableCells.Select(FormatText).ToArray();
                    StartTableRow(formatted);
                    continue;
                }

                var imageName = TryParseImage(line);
                if (imageName != null)
                {
                    EndParagraph();
                    EndList();
                    EndTable();
                    EnsureStartSection();

                    StartImage(imageName);
                    continue;
                }

                {
                    EndList();
                    EndTable();
                    EndImageGallery();
                    EnsureStartSection();
                    var formatted = FormatText(line);
                    StartParagraph(formatted);
                }
            }

            lineIndex++;
            EndParagraph();
            EndList();
            EndTable();
            EndImageGallery();
            EndSection();

            return html.ToString();
        }
    }
}
