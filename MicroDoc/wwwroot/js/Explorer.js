var explorerInstanceId = 0;

function Explorer(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    this.instanceId = ++explorerInstanceId;
    this.options = options;
    this.service = new ExplorerService();

    this.UpdateElement(element);

    this.log(`new instance #${this.instanceId}`);
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

    await this.tagTree().ApplyChanges(change);
    await this.docMatrix().ApplyChanges(change);

    for (const docElement of this.element.querySelectorAll(".overlay .doc"))
        await docElement.doc.ApplyChanges(change);
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
    const response = await this.service.Explorer(this.id, this.domain, this.selectedTag, this.loadDeepLevels);
    if (!response.ok) {
        this.error(Loc.Explorer_LoadFailed, await response.text());
        return;
    }

    const parentElement = this.element.parentElement;
    ReplaceInnerHtml(parentElement, await response.text());
}

// Service methods
function ExplorerService() { }

ExplorerService.prototype.Explorer = function (clientId, domain, selectedTag, loadDeepLevels) {
    return apiFetch(`/Home/Explorer?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}&loadDeepLevels=${loadDeepLevels}`);
}