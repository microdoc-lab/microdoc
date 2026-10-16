using Microsoft.CodeAnalysis;

namespace MicroDoc.Services
{
    public class DomainOptions
    {
        #region Domain

        public sealed  class Domain
        {
            public string Type { get; set; }
            public string Name { get; set; }
            public string RootFolder { get; set; }
            public string Background { get; set; }
            public string BackgroundVersion { get; set; }
            public bool IsCaseSensitive { get; set; }
            public bool TrackTagMoves { get; set; }
            public string[] Documents { get; set; }
            public DocumentOptions[] DocumentOptions { get; set; } = [];
            public bool DocumentLevelSecurity { get; set; }

            public string GetDocumentColor(string document) => DocumentOptions.Where(o => o.Name == document).Select(o => o.Color).FirstOrDefault();
        }

        public class DocumentOptions {
            public string Name { get; set; }
            public string Title { get; set; }
            public string Color { get; set; }
        }

        public Domain[] Domains { get; set; } = [];

        public Domain Find(string name) => Domains.First(d => d.Name == name);

        #endregion

        #region Security

        public sealed class UserAccess
        {
            public string Email { get; set; } = "";
            public string Roles { get; set; } = "";
            public string Domain { get; set; }
            public string Document { get; set; }
            public string[] Documents { get; set; }

        }

        public bool SimpleLogin { get; set; }
        public bool DomainLevelSecurity { get; set; }
        public UserAccess[] Users { get; set; } = [];

        #endregion
    }
}
