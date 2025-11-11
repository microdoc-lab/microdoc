using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace MicroDoc.Models
{
    public static class ViewConfigLoader
    {
        public static TagView LoadTagsFromFile(string path)
        {
            if (!File.Exists(path))
                return new();

            var yaml = File.ReadAllText(path);
            var deserializer = new DeserializerBuilder()
                .Build();

            var data = deserializer.Deserialize<TagView>(yaml);

            return data;
        }
    }
}
