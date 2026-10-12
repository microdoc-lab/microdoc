function Explorer(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.explorer = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`Explorer #${this.id}: ${text}`); }
    this.error = function (text, error) { console.error(text, error); alert(text + "\n\n" + error); }

    if (options.style)
        element.setAttribute('style', options.style);

    this.service = new ExplorerService();
}

Explorer.prototype.behaviors = [];
Explorer.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

Explorer.prototype.changeHandlers = [];
Explorer.prototype.ApplyChanges = function (change) {
    for (const handler of this.changeHandlers) {
        handler.call(this, change);
    }

    this.tagTree().ApplyChanges(change);
    this.docMatrix().ApplyChanges(change);
    for (const docElement of this.element.querySelectorAll(".overlay .doc"))
        docElement.doc.ApplyChanges(change);
}

// Api
Explorer.prototype.tagTree = function () { return document.getElementById(this.tagTreeId).tagTree; }
Explorer.prototype.docMatrix = function () { return document.getElementById(this.docMatrixId).docMatrix; }

Explorer.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

Explorer.prototype.Load = async function (tagId) {
    // Update model property
    this.selectedTag = tagId;

    // Reload HTML content
    const response = await this.service.Explorer(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        this.error("Explorer request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

// Service methods
function ExplorerService() { }

ExplorerService.prototype.Explorer = function (clientId, domain, selectedTag) {
    return fetch(`/Home/Explorer?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}`);
}