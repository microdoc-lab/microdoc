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
