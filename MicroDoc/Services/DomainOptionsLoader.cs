using YamlDotNet.Serialization;
using static MicroDoc.Services.DocumentParser;

namespace MicroDoc.Services
{
    public static class DomainOptionsLoader
    {
        private const string TemplatePath = "~/DomainOptions.template.ini";

        public static string ContentRootPath { get; set; }

        public static DomainOptions LoadOptionsFromFile(string path)
        {
            path = ResolvePath(path);

            if (!File.Exists(path))
                path = ResolvePath(TemplatePath);

            if (!File.Exists(path))
                return new();

            var yaml = File.ReadAllText(path);
            var deserializer = new DeserializerBuilder().Build();
            var options = deserializer.Deserialize<DomainOptions>(yaml);
            InitOptions(options);
            return options;
        }

        public static string LoadOptionsAsText(string path)
        {
            path = ResolvePath(path);

            if (!File.Exists(path))
                path = ResolvePath(TemplatePath);

            if (!File.Exists(path))
                return "";

            var yaml = File.ReadAllText(path);
            return yaml;
        }

        public static ErrorCode ValidateOptions(string yaml, out DomainOptions options)
        {
            var deserializer = new DeserializerBuilder().Build();
            options = deserializer.Deserialize<DomainOptions>(yaml);

            if (options.Domains.Any(d => !IsValidDomain(d.Name)))
                return ErrorCode.InvalidDomainName;

            if (options.Domains.Where(d => !string.IsNullOrWhiteSpace(d.Background)).Any(d => !ValidateBackground(d.Background)))
                return ErrorCode.InvalidImageName;

            InitOptions(options);
            return ErrorCode.Ok;
        }

        private static bool ValidateBackground(string domainBackground)
        {
            var status = TryParseImagePath(domainBackground, out var tags, out var document, out var imageName);
            if (status != ErrorCode.Ok)
                return false;

            if (!tags.All(IsValidTagName) || !IsValidDocumentName(document) || !IsValidImageName(Path.GetFileNameWithoutExtension(imageName)))
                return false;

            return true;
        }

        public static void SaveOptionsToFile(string path, string yaml)
        {
            path = ResolvePath(path);
            File.WriteAllText(path, yaml);
        }

        private static void InitOptions(DomainOptions options) 
        {
            if (options.Domains == null)
                options.Domains = [];

            if (options.Users == null)
                options.Users = [];

            foreach (var domain in options.Domains)
            {
                // Init root folder
                domain.RootFolder = ResolvePath(domain.RootFolder);

                if (domain.Documents == null)
                    domain.Documents = [];

                if (domain.DocumentOptions == null)
                    domain.DocumentOptions = [];
            }

            // Init user documents
            foreach (var user in options.Users.Where(u => !string.IsNullOrWhiteSpace(u.Domain) && u.Documents != null && u.Documents.All(d => d == "*")))
            {
                var domain = options.Find(user.Domain);
                user.Documents = domain.KnownDocuments();
            }

            foreach (var user in options.Users.Where(u => !string.IsNullOrWhiteSpace(u.Domain)))
            {
                if (user.Documents == null)
                    user.Documents = [];
            }
        }

        private static string ResolvePath(string configuredPath)
        {
            if (string.IsNullOrWhiteSpace(configuredPath))
                return configuredPath;

            string absolutePath = configuredPath;

            if (configuredPath.StartsWith("~/") || configuredPath.StartsWith("~\\"))
            {
                string relativePath = configuredPath.Substring(2);
                absolutePath = Path.Combine(ContentRootPath, relativePath);
            }

            return absolutePath;
        }
    }
}
