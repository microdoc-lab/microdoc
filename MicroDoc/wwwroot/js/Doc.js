function Doc(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.doc = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`Doc #${this.id}: ${text}`); }
    this.error = function (text, error) { console.error(text, error); alert(text + "\n\n" + error); }

    if (options.style)
        element.setAttribute('style', options.style);

    this.service = new DocService();
}

Doc.prototype.behaviors = [];
Doc.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

Doc.prototype.changeHandlers = [];
Doc.prototype.ApplyChanges = function (change) {
    for (const handler of this.changeHandlers) {
        handler.call(this, change);
    }
}

// Api
Doc.prototype.explorer = function () { return this.element.closest(".explorer").explorer; }
Doc.prototype.docMatrix = function () { return this.element.closest(".explorer").querySelector(".docmatrix").docMatrix; }
Doc.prototype.overlay = function () { return this.element.closest(".explorer").querySelector(".overlay"); }
Doc.prototype.toolbar = function () { return this.element.closest(".explorer").querySelector(".overlay .toolbar"); }

Doc.prototype.docViewer = function () { return this.element.querySelector(".viewer"); }
Doc.prototype.txtEditor = function () { return this.element.querySelector(".editor"); }

Doc.prototype.OnActivation = function (restore) {
    // update document title
    document.title = `${this.element.dataset.domain} ${this.element.dataset.tagpath}`;

    var mode = this.element.getAttribute("mode");
    var explorer = this.explorer();

    if (!restore) {
        // capture active document context
        explorer.activeDocumentId = this.element.dataset.id;
        if (mode == "view")
            explorer.selectedHeadingIndex = GetSelectedHeadingIndex(this.docViewer());

        // put document URL in history
        history.replaceState(null, "", `/${this.element.dataset.domain}/${this.element.dataset.id}`);
    }
    else {
        // restore active document
        if (mode == "view")
            this.docViewer().SelectAndScroll(explorer.selectedHeadingIndex);
        if (mode == "edit")
            this.txtEditor().focus();
    }
}

// Service methods
function DocService() { }

DocService.prototype.SaveDocument = function (domain, documentId, content) {
    return apiFetch("/Home/SaveDocument", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            documentId: documentId,
            content: content
        })
    });
}

DocService.prototype.DeleteDocument = function (domain, documentId) {
    return apiFetch("/Home/DeleteDocument", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            documentId: documentId
        })
    });
}

DocService.prototype.UploadImage = function (domain, documentId, imageName, image) {
    const formData = new FormData();
    formData.append("domain", domain);
    formData.append("documentId", documentId);
    formData.append("imageName", imageName);
    formData.append("image", image);

    return apiFetch("/Home/UploadImage", {
        method: "POST",
        body: formData
    });
}