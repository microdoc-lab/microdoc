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
            document = null;
            imageName = text;

            var status = TryParseDocumentPath(text, out tags, out var parsedName);

            // full image Id specified
            if (tags.Any())
            {
                var parts = parsedName.Split('+');
                if (parts.Length != 2)
                    return ErrorCode.WrongImageName;

                document = parts[0];
                imageName = parts[1];
                return ErrorCode.Ok;
            }
            
            return ErrorCode.Ok;
        }

        public static string GetDocumentId(string[] tags, string document)
        {
            return string.Join("/", tags) + "/" + document + ".txt";
        }

        public static string GetImagePath(string documentId, string imageName)
        {
            var parts = documentId.Split('/');
            string document = Path.GetFileNameWithoutExtension(documentId);
            return string.Join(" ", parts[..^1].Select(t => $"[{t}]")) + " " + document + "+" + imageName;
        }

        public static string GetImageId(string documentId, string imageName)
        {
            var parts = documentId.Split('/');
            string document = Path.GetFileNameWithoutExtension(documentId);
            return string.Join("/", parts[..^1]) + "/" + document + "+" + imageName;
        }
    }
}
