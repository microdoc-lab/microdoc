namespace MicroDoc.Services
{
    public enum ErrorCode
    {
        Ok,

        TagNotFound,
        TagExists,
        RootTag,
        MoveIntoNestedTag,
        NestedTagsExists,
        NestedDocumentsExists,

        DocumentNotFound,

        TagNotClosed,
        WrongImageName,
    }
}
