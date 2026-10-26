var DocParser = {};

DocParser.IsValidDocName = function (name) {
    if (name == null)
        return false;

    return /^[\p{L}\p{N}_\- ]+$/u.test(name);
}

DocParser.IsValidTagName = function (name) {
    if (name == null)
        return false;

    return /^[\p{L}\p{N}_\- ]+$/u.test(name);
}

DocParser.IsValidTag = function (tag) {
    if (tag == null)
        return false;

    if (tag.trim() == "")   // root tag
        return true;

    return tag.split('/').every(part =>
        /^[\p{L}\p{N}_\- ]+$/u.test(part)
    );
}

DocParser.TagParent = function (tag) {
    var tags = tag.split('/');
    tags.pop();
    var parentTag = tags.join('/');
    return parentTag;
}

DocParser.DocTagPath = function (documentId) {
    var tags = documentId.split('/');
    tags.pop();
    var tagPath = tags.map(t => `[${t}]`).join(' ');
    return (tagPath ? tagPath : "");
}

DocParser.TagPath = function (domain, tag) {
    var tags = tag.split('/');
    var tagPath = tags.map(t => `[${t}]`).join(' ');
    return tagPath && tagPath != "[]" ? tagPath : domain;
}

DocParser.DocId = function (tags, document) {
    return tags ? tags + "/" + document : document;
}

DocParser.DocPath = function (documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    var tagPath = tags.map(t => `[${t}]`).join(' ');
    return tagPath ? tagPath + " " + docName : docName;
}

DocParser.DocName = function (documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    const index = docName.lastIndexOf(".");
    return index > 0 ? docName.substring(0, index) : docName;
}

DocParser.DocType = function (documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    const index = docName.lastIndexOf(".");
    return index > 0 ? docName.substring(index) : "";
}

DocParser.IsDocPrint = function (documentId) {
    const isPrint = documentId.endsWith(".print");

    if (isPrint)
        documentId = documentId.slice(0, -".print".length);

    return { documentId, isPrint };
}