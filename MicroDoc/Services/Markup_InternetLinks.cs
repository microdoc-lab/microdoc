using System.Text.RegularExpressions;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private static readonly Regex InternetLinkRegex = new(
            @"https?://[^\s<>""']+",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static string FormatInternetLinks(string text)
        {
            return InternetLinkRegex.Replace(text, match =>
            {
                string url = match.Value;
                string trailing = "";

                // Keep common sentence punctuation outside the link.
                while (url.Length > 0 &&
                       ".,;:!?)]}".Contains(url[^1]))
                {
                    trailing = url[^1] + trailing;
                    url = url[..^1];
                }

                if (url.Length == 0)
                    return match.Value;

                string encodedUrl =
                    System.Net.WebUtility.HtmlEncode(url);

                string encodedText =
                    System.Net.WebUtility.HtmlEncode(url);

                return $"<a href=\"{encodedUrl}\" target=\"_blank\" " +
                       $"rel=\"noopener noreferrer\">{encodedText}</a>{trailing}";
            });
        }
    }
}
