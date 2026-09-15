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
    }
}
