using YamlDotNet.Serialization;

namespace MicroDoc.Services
{
    public static class DomainOptionsLoader
    {
        public static string ContentRootPath { get; set; }

        public static DomainOptions LoadOptionsFromFile(string path)
        {
            path = ResolvePath(path);

            if (!File.Exists(path))
                return new();

            var yaml = File.ReadAllText(path);
            var deserializer = new DeserializerBuilder().Build();
            var options = deserializer.Deserialize<DomainOptions>(yaml);
            return options;
        }

        public static string LoadOptionsAsText(string path)
        {
            path = ResolvePath(path);
            var yaml = File.ReadAllText(path);
            return yaml;
        }

        public static DomainOptions ValidateOptions(string yaml)
        {
            var deserializer = new DeserializerBuilder().Build();
            var options = deserializer.Deserialize<DomainOptions>(yaml);
            return options;
        }

        public static void SaveOptionsToFile(string path, string yaml)
        {
            path = ResolvePath(path);
            File.WriteAllText(path, yaml);
        }

        private static string ResolvePath(string configuredPath)
        {
            string absolutePath = configuredPath;

            if (configuredPath.StartsWith("~/"))
            {
                string relativePath = configuredPath.Substring(2);
                absolutePath = Path.Combine(ContentRootPath, relativePath);
            }

            return absolutePath;
        }
    }
}
