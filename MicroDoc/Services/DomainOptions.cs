using Microsoft.CodeAnalysis;

namespace MicroDoc.Services
{
    public class DomainOptions
    {
        public class Domain
        {
            public string Type { get; set; }
            public string Name { get; set; }
            public string RootFolder { get; set; }
            public string Background { get; set; }
            public List<string> Documents { get; set; }
            public List<DocumentOptions> DocumentOptions { get; set; } = new();

            public string GetDocumentColor(string document) => DocumentOptions.Where(o => o.Name == document).Select(o => o.Color).FirstOrDefault();

            public string GetBackgroundPath() 
            {
                if (string.IsNullOrWhiteSpace(Background))
                    return null;

                return Path.Combine(RootFolder, Background);
            }

            public string GetBackgroundVersion() 
            {
                var filePath = GetBackgroundPath();
                if (filePath == null)
                    return DateTime.MinValue.Ticks.ToString("x");

                if (!File.Exists(filePath))
                    return DateTime.MinValue.Ticks.ToString("x");

                var time = File.GetLastWriteTimeUtc(filePath);
                return time.Ticks.ToString("x");
            }
        }

        public class DocumentOptions {
            public string Name { get; set; }
            public string[] Names { get; set; }
            public string Color { get; set; }
        }

        public List<Domain> Domains { get; set; } = new();

        public Domain Find(string name) => Domains.First(d => d.Name == name);
    }
}
