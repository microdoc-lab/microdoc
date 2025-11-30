using YamlDotNet.Serialization;

namespace MicroDoc.Services
{
    public static class ViewConfigLoader
    {
        public static TagView LoadTagsFromFile(string path)
        {
            if (!File.Exists(path))
                return new();

            var yaml = File.ReadAllText(path);
            var deserializer = new DeserializerBuilder().Build();
            var view = deserializer.Deserialize<TagView>(yaml);
            view.Tags = view.Tags.OrderBy(t => t.Order).ToList();
            return view;
        }

        public static void SaveTagsToFile(string path, TagView view)
        {
            var serializer = new SerializerBuilder().Build();
            view.Tags = view.Tags.OrderBy(t => t.Order).ToList();
            var updatedYaml = serializer.Serialize(view);
            File.WriteAllText(path, updatedYaml);
        }
    }
}
