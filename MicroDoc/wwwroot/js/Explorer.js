var explorerInstanceId = 0;

function Explorer(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    this.instanceId = ++explorerInstanceId;
    this.options = options;
    this.service = new ExplorerService();

    this.UpdateElement(element);

    this.debug(`new instance #${this.instanceId}`);
}

Explorer.prototype.UpdateElement = function (element) {
    this.id = element.id;
    this.element = element;
    this.element.explorer = this;
    if (this.options.style)
        this.element.setAttribute('style', this.options.style);
}

// Logging
Explorer.prototype.debug = function (text) { console.debug(`Explorer #${this.id}: ${text}`); }
Explorer.prototype.info = function (text) { console.info(`Explorer #${this.id}: ${text}`); }
Explorer.prototype.log = function (text) { console.log(`Explorer #${this.id}: ${text}`); }
Explorer.prototype.warn = function (text) { console.warn(`Explorer #${this.id}: ${text}`); }
Explorer.prototype.error = function (text, error) { console.error(`Explorer #${this.id}: ${text}`, error); alert(text + "\n\n" + LocalizeError(error)); }

Explorer.prototype.behaviors = [];
Explorer.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

Explorer.prototype.changeHandlers = [];
Explorer.prototype.ApplyChanges = async function (change) {
    for (const handler of this.changeHandlers) {
        await handler.call(this, change);
    }

    try {
        this.disableTagTreeDocMatrixSync = true;
        await this.tagTree().ApplyChanges(change);
        await this.docMatrix().ApplyChanges(change);
    }
    finally {
        this.disableTagTreeDocMatrixSync = false;
    }

    for (const docElement of this.element.querySelectorAll(".overlay .doc"))
        await docElement.doc.ApplyChanges(change);
}

// Api
Explorer.prototype.docPanel = function () { return this.element.querySelector('.doc-panel'); }
Explorer.prototype.tagTree = function () { return document.getElementById(this.tagTreeId).tagTree; }
Explorer.prototype.docMatrix = function () { return document.getElementById(this.docMatrixId).docMatrix; }

Explorer.prototype.Reload = async function () {
    return await this.Load(this.selectedTag);
}

Explorer.prototype.Load = async function (selectedTag) {
    this.log(`Load selectedTag: ${selectedTag}`);

    // Update model property
    this.selectedTag = selectedTag;

    // Reload HTML content
    const response = await this.service.Explorer(this.id, this.domain, this.selectedTag, this.loadDeepLevels);
    if (!response.ok) {
        this.error(Loc.Explorer_LoadFailed, await response.text());
        return false;
    }

    const parentElement = this.element.parentElement;
    ReplaceInnerHtml(parentElement, await response.text());

    return true;
}

// Service methods
function ExplorerService() { }

ExplorerService.prototype.Explorer = function (clientId, domain, selectedTag, loadDeepLevels) {
    return apiFetch(`/Home/Explorer?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}&loadDeepLevels=${loadDeepLevels}`);
}