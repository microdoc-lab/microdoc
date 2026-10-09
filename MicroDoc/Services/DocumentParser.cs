namespace MicroDoc.Services
{
    public static class DocumentParser
    {
        public static ErrorCode TryParseDocumentPath(string path, out string[] tags, out string name)
        {
            var parsedTags = new List<string>();
            int position = 0;

            while (position < path.Length && path[position] == '[')
            {
                int end = path.IndexOf(']', position + 1);

                if (end < 0 || end == position + 1)
                {
                    tags = [];
                    name = path;
                    return ErrorCode.TagNotClosed;
                }

                parsedTags.Add(path[(position + 1)..end]);
                position = end + 1;

                while (position < path.Length && path[position] == ' ')
                    position++;
            }

            tags = parsedTags.ToArray();
            name = path[position..];

            return ErrorCode.Ok;
        }

        public static ErrorCode TryParseImagePath(string text, out string[] tags, out string document, out string imageName)
        {
            // Embeded case: imageName.png
            document = null;
            imageName = text;

            var status = TryParseDocumentPath(text, out tags, out var parsedName);

            // Full case: [tag1] [tag2] document+imageName.png
            if (tags.Any())
            {
                var parts = parsedName.Split('+');
                if (parts.Length != 2)
                    return ErrorCode.WrongImageName;

                document = parts[0];
                imageName = parts[1];
            }
            else 
            {
                var parts = parsedName.Split('+');

                if (parts.Length > 2)
                    return ErrorCode.WrongImageName;

                // Local case: document+imageName.png
                if (parts.Length == 2) {
                    document = parts[0];
                    imageName = parts[1];
                }
            }

            return ErrorCode.Ok;
        }

        public static (string Parent, string Name) SplitId(string tagId)
        {
            if (string.IsNullOrEmpty(tagId))
                return ("", "");
            
            string[] parts = (tagId ?? "").Split('/');
            string parent = string.Join("/", parts[..^1]);
            string name = parts.Last();
            return (parent, name);
        }

        public static string GetDocumentId(string path)
        {
            var status = TryParseDocumentPath(path, out var tags, out var name);
            if (status != ErrorCode.Ok)
                return null;

            var documentId = GetDocumentId(tags, name);
            return documentId;
        }

        public static string GetDocumentId(string tags, string document)
        {
            return !string.IsNullOrEmpty(tags) ? tags + "/" + document : document;
        }

        public static string GetDocumentId(string[] tags, string document)
        {
            return tags.Length > 0 ? string.Join("/", tags) + "/" + document : document;
        }

        public static string GetImagePath(string documentId, string imageName)
        {
            var parts = documentId.Split('/');
            string document = Path.GetFileNameWithoutExtension(documentId);
            return string.Join(" ", parts[..^1].Select(t => $"[{t}]")) + " " + document + "+" + imageName;
        }

        public static string GetImageId(string documentId, string imageName)
        {
            var (parent, name) = SplitId(documentId);
            string document = Path.GetFileNameWithoutExtension(name);
            string imageId = GetDocumentId(parent, document + "+" + imageName);
            return imageId;
        }
    }
}
