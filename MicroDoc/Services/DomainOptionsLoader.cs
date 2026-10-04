using YamlDotNet.Serialization;

namespace MicroDoc.Services
{
    public static class DomainOptionsLoader
    {
        public static DomainOptions LoadOptionsFromFile(string path)
        {
            if (!File.Exists(path))
                return new();

            var yaml = File.ReadAllText(path);
            var deserializer = new DeserializerBuilder().Build();
            var options = deserializer.Deserialize<DomainOptions>(yaml);
            return options;
        }

        public static string LoadOptionsAsText(string path)
        {
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
            File.WriteAllText(path, yaml);
        }
    }
}
