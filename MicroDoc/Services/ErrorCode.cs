namespace MicroDoc.Services
{
    public enum ErrorCode
    {
        Ok,

        TagNotFound,
        RootTag,
        NestedTagsExists,
        NestedDocumentsExists,

        DocumentNotFound,

        TagNotClosed,
        WrongImageName,
    }
}
