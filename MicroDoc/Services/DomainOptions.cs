namespace MicroDoc.Services
{
    public class DomainOptions
    {
        public class Domain
        {
            public string Type { get; set; }
            public string Name { get; set; }
            public string RootFolder { get; set; }
            public List<string> Documents { get; set; }
        }

        public List<Domain> Domains { get; set; } = new();

        public Domain Find(string name) => Domains.First(d => d.Name == name);
    }
}
