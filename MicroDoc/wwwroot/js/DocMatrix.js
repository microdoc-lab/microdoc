var docMatrixInstanceId = 0;

function DocMatrix(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    this.instanceId = ++docMatrixInstanceId;
    this.element = element;
    this.options = options;
    this.id = element.id;
    this.element.docMatrix = this;

    if (options.style)
        element.setAttribute('style', options.style);

    this.service = new DocMatrixService();

    this.log(`new instance #${this.instanceId}`);
}

// Logging
DocMatrix.prototype.debug = function (text) { console.debug(`DocMatrix #${this.id}: ${text}`); }
DocMatrix.prototype.info = function (text) { console.info(`DocMatrix #${this.id}: ${text}`); }
DocMatrix.prototype.log = function (text) { console.log(`DocMatrix #${this.id}: ${text}`); }
DocMatrix.prototype.warn = function (text) { console.warn(`DocMatrix #${this.id}: ${text}`); }
DocMatrix.prototype.error = function (text, error) { console.error(`DocMatrix #${this.id}: ${text}`, error); alert(text + "\n\n" + error); }

DocMatrix.prototype.behaviors = [];
DocMatrix.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

DocMatrix.prototype.changeHandlers = [];
DocMatrix.prototype.ApplyChanges = async function (change) {
    for (const handler of this.changeHandlers) {
        await handler.call(this, change);
    }
}

// Api
DocMatrix.prototype.explorer = function () { return this.element.closest(".explorer").explorer; }
DocMatrix.prototype.overlay = function () { return this.element.closest(".explorer").querySelector(".overlay"); }
DocMatrix.prototype.modal = function () { return this.element.closest(".explorer").querySelector(".modal"); }
DocMatrix.prototype.grid = function () { return this.element.querySelector(".grid"); }

DocMatrix.prototype.tagRow = function (tag) { return this.element.querySelector(`.grid tr[data-tag="${tag}"]`); }
DocMatrix.prototype.docElement = function (domain, documentId) { return this.element.closest(".explorer").querySelector(`.overlay .doc[data-domain="${domain}"][data-id="${documentId}"]`); }
DocMatrix.prototype.docInCell = function (domain, documentId) { return this.element.querySelector(`.grid td doc[data-domain="${domain}"][data-id="${documentId}"]`); }

DocMatrix.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

DocMatrix.prototype.Load = async function (tagId) {
    // Update model property
    this.selectedTag = tagId;

    // Reload HTML content
    const response = await this.service.DocMatrix(this.id, this.domain, this.selectedTag, this.loadDeepLevels);
    if (!response.ok) {
        this.error("DocMatrix request failed", await response.text());
        return;
    }

    const parentElement = this.element.parentElement;
    ReplaceInnerHtml(parentElement, await response.text());
    UpdateCanonicalInstance(this, parentElement.firstElementChild.docMatrix);
    this.element.docMatrix = this;
}

// Service methods
function DocMatrixService() { }

DocMatrixService.prototype.DocMatrix = function (clientId, domain, selectedTag, loadDeepLevels) {
    return apiFetch(`/Home/DocMatrix?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}&loadDeepLevels=${loadDeepLevels}`);
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