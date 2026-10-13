function DocMatrix(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.docMatrix = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`DocMatrix #${this.id}: ${text}`); }
    this.error = function (text, error) { console.error(text, error); alert(text + "\n\n" + error); }

    if (options.style)
        element.setAttribute('style', options.style);

    this.service = new DocMatrixService();
}

DocMatrix.prototype.behaviors = [];
DocMatrix.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

DocMatrix.prototype.changeHandlers = [];
DocMatrix.prototype.ApplyChanges = function (change) {
    for (const handler of this.changeHandlers) {
        handler.call(this, change);
    }
}

// Api
DocMatrix.prototype.explorer = function () { return this.element.closest(".explorer").explorer; }
DocMatrix.prototype.overlay = function () { return this.element.closest(".explorer").querySelector(".overlay"); }
DocMatrix.prototype.grid = function () { return this.element.querySelector(".grid"); }

DocMatrix.prototype.tagRow = function (tag) { return this.element.querySelector(`.grid tr[data-tag="${tag}"]`); }
DocMatrix.prototype.docElement = function (domain, documentId) { return this.element.closest(".explorer").querySelector(`.overlay .doc[data-domain="${domain}"][data-id="${documentId}"]`); }
DocMatrix.prototype.docInCell = function (domain, documentId) { return this.element.querySelector(`.grid td doc[data-domain="${domain}"][data-id="${documentId}"]`); }

DocMatrix.prototype.IsValidFileName = function(name) {
    return /^[\p{L}\p{N}_\- ]+$/u.test(name);
}

DocMatrix.prototype.TagParent = function (tag) {
    var tags = tag.split('/');
    tags.pop();
    var parentTag = tags.join('/');
    return parentTag;
}

DocMatrix.prototype.TagPath = function (domain, documentId) {
    var tags = documentId.split('/');
    tags.pop();
    var tagPath = tags.map(t => `[${t}]`).join(' ');
    return (tagPath ? tagPath : domain);
}

DocMatrix.prototype.DocId = function (tags, document) {
    return tags ? tags + "/" + document : document;
}

DocMatrix.prototype.DocPath = function (domain, documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    var tagPath = tags.map(t => `[${t}]`).join(' ');
    return tagPath ? tagPath + " " + docName : docName;
}

DocMatrix.prototype.DocName = function (documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    const index = docName.lastIndexOf(".");
    return index > 0 ? docName.substring(0, index) : docName;
}

DocMatrix.prototype.DocType = function (documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    const index = docName.lastIndexOf(".");
    return index > 0 ? docName.substring(index) : "";
}

DocMatrix.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

DocMatrix.prototype.Load = async function (tagId) {
    // Update model property
    this.selectedTag = tagId;

    // Reload HTML content
    const response = await this.service.DocMatrix(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        this.error("DocMatrix request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

// Service methods
function DocMatrixService() { }

DocMatrixService.prototype.DocMatrix = function (clientId, domain, selectedTag) {
    return apiFetch(`/Home/DocMatrix?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}`);
}

DocMatrixService.prototype.LoadDocument = function (domain, documentId) {
    return apiFetch(`/Home/LoadDocument?domain=${domain}&documentId=${documentId}`);
}

DocMatrixService.prototype.SaveDocument = function (domain, documentId, content) {
    return apiFetch("/Home/SaveDocument", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            documentId: documentId,
            content: content
        })
    });
}