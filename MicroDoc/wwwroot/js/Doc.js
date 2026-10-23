var docInstanceId = 0;

function Doc(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.doc = this;

    this.instanceId = ++docInstanceId;

    this.element = element;
    this.options = options;

    this.id = element.id;

    this.debug = function (text) { console.debug(`Doc #${this.id}: ${text}`); }
    this.info = function (text) { console.info(`Doc #${this.id}: ${text}`); }
    this.log = function (text) { console.log(`Doc #${this.id}: ${text}`); }
    this.warn = function (text) { console.warn(`Doc #${this.id}: ${text}`); }
    this.error = function (text, error) { console.error(`Doc #${this.id}: ${text}`, error); alert(text + "\n\n" + error); }

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
Doc.prototype.ApplyChanges = async function (change) {
    for (const handler of this.changeHandlers) {
        await handler.call(this, change);
    }
}

// Api
Doc.prototype.explorer = function () { return this.element.closest(".explorer").explorer; }
Doc.prototype.docMatrix = function () { return this.element.closest(".explorer").querySelector(".docmatrix").docMatrix; }
Doc.prototype.overlay = function () { return this.element.closest(".explorer").querySelector(".overlay"); }
Doc.prototype.toolbar = function () { return this.element.closest(".explorer").querySelector(".overlay .toolbar"); }

Doc.prototype.docViewer = function () { return this.element.querySelector(".viewer"); }
Doc.prototype.txtEditor = function () { return this.element.querySelector(".editor"); }

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