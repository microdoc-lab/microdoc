using System.Text;

namespace MicroDoc.Services
{
    public partial class Markup
    {
        private static string ExtractCallout(ref string text)
        {
            if (!text.StartsWith('/'))
                return null;

            int separator = text.IndexOf(':');

            if (separator <= 1)
                return null;

            string callout = text[1..separator];

            if (!callout.All(c => char.IsLetterOrDigit(c) || c == '-'))
                return null;

            text = text[(separator + 1)..].TrimStart();

            return callout;
        }

        private static string ToCssClass(string callout)
        {
            if (callout == null)
                return null;

            var sb = new StringBuilder(callout.Length);

            foreach (char c in callout)
            {
                if (char.IsAsciiLetterOrDigit(c) || c == '-' || c == '_')
                    sb.Append(c);
                else
                    sb.Append('-');
            }

            return sb.ToString();
        }
    }
}
