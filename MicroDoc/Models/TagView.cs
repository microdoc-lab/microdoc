namespace MicroDoc.Models
{
    public class TagView
    {
        public class Node 
        { 
            public string Tag { get; set; }
            public int Order { get; set; }

            public override string ToString() => $"{Tag} - {Order}";
        }

        public List<Node> Tags { get; set; } = new();
    }
}
