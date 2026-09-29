function DocMatrix(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.docMatrix = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`DocMatrix #${this.id}: ${text}`); }

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

// Api
DocMatrix.prototype.explorer = function () { return this.element.closest(".explorer"); }
DocMatrix.prototype.overlay = function () { return this.explorer().querySelector(".overlay"); }
DocMatrix.prototype.toolbar = function () { return this.overlay().querySelector(".toolbar"); }
DocMatrix.prototype.grid = function () { return this.element.querySelector(".grid"); }

DocMatrix.prototype.docElement = function (domain, documentId) { return this.overlay().querySelector(`.doc[data-domain="${domain}"][data-id="${documentId}"]`); }
DocMatrix.prototype.txtEditor = function (domain, documentId) { return this.overlay().querySelector(`.doc[data-domain="${domain}"][data-id="${documentId}"] .editor`); }
DocMatrix.prototype.docCell = function (domain, documentId) { return this.grid().querySelector(`td[data-domain="${domain}"][data-id="${documentId}"]`); }

DocMatrix.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

DocMatrix.prototype.Load = async function (tagId) {
    // Update model property
    this.selectedTag = tagId;

    // Reload HTML content
    const response = await this.service.DocMatrix(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        console.error("DocMatrix request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

// Service methods
function DocMatrixService() { }

DocMatrixService.prototype.DocMatrix = function (clientId, domain, selectedTag) {
    return fetch(`/Home/DocMatrix?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}`);
}