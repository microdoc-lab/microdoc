using YamlDotNet.Serialization;

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

        public static DomainOptions ValidateOptions(string yaml)
        {
            var deserializer = new DeserializerBuilder().Build();
            var options = deserializer.Deserialize<DomainOptions>(yaml);
            InitOptions(options);
            return options;
        }

        public static void SaveOptionsToFile(string path, string yaml)
        {
            path = ResolvePath(path);
            File.WriteAllText(path, yaml);
        }

        private static void InitOptions(DomainOptions options) 
        {
            // Init root folder
            foreach (var domain in options.Domains)
                domain.RootFolder = ResolvePath(domain.RootFolder);

            foreach (var user in options.Users.Where(u => !string.IsNullOrWhiteSpace(u.Domain) && u.Document == "*"))
            {
                var domain = options.Find(user.Domain);
                user.Documents = domain.KnownDocuments();
                user.Document = null;
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
