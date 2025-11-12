namespace MicroDoc.Models
{
    public class TagView
    {
        public class Node 
        { 
            public string Tag { get; set; }
            public string Group { get; set; }
            public int Order { get; set; }

            public override string ToString() => $"{Group} / {Tag} - {Order}";
        }

        public List<Node> Tags { get; set; } = new();
    }
}
