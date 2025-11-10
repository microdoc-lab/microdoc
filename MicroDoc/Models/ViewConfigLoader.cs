using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace MicroDoc.Models
{
    public static class ViewConfigLoader
    {
        public static List<TagNode> LoadTagsFromFile(string path)
        {
            if (!File.Exists(path))
                return new();

            var yaml = File.ReadAllText(path);
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .Build();

            dynamic data = deserializer.Deserialize<dynamic>(yaml);
            var tags = new List<TagNode>();

            foreach (var tag in data["Tags"])
            {
                tags.Add(new TagNode
                {
                    Name = tag["Tag"],
                    Display = tag["Display"],
                    Order = Convert.ToInt32(tag["Order"]),
                    Color = tag["Color"],
                    Description = tag["Description"]
                });
            }

            return tags.OrderBy(t => t.Order).ToList();
        }
    }
}
