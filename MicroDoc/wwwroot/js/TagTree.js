function TagTree(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.tagTree = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`TagTree #${this.id}: ${text}`); }

    if (options.style)
        element.setAttribute('style', options.style);

    this.service = new TagTreeService();
}

TagTree.prototype.behaviors = [];

TagTree.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

// Api
TagTree.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

TagTree.prototype.Load = async function (tagId) {
    // Update model property
    this.selectedTag = tagId;

    // Reload HTML content
    const response = await this.service.TagTree(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        console.error("TagTree request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

// Service methods
function TagTreeService() { }

TagTreeService.prototype.TagTree = function (clientId, domain, selectedTag) {
    return fetch(`/Home/TagTree?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}`);
}
