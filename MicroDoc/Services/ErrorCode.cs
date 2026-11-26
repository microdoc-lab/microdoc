namespace MicroDoc.Services
{
    public enum ErrorCode
    {
        Ok,

        Exception,

        DomainNotFound,
        DomainDirectoryNotFound,

        TagNotFound,
        TagExists,
        RootTag,
        MoveIntoNestedTag,
        NestedTagsExists,
        NestedDocumentsExists,

        DocumentNotFound,
        ImageNotFound,

        TagNotClosed,

        InvalidImageName,
        InvalidDomainName,
        InvalidParameters,

        NotImplemented,

        SimpleLoginNotSupported,
        SimpleLoginNotAllowed,
        SimpleLoginEmptyEmail,
        SimpleLoginUnknownEmail,
    }
}
