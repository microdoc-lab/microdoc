function TagTree(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.tagTree = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`TagTree #${this.id}: ${text}`); }
    this.error = function (text, error) { console.error(text, error); alert(text + "\n\n" + error); }

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
        this.error("TagTree request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

TagTree.prototype.New = async function () {
    // Prompt new tag name
    var newTagName = prompt("Enter new Tag name");
    if (!newTagName || !newTagName.trim())
        return;

    // Create Tag
    const response = await this.service.NewTag(this.domain, this.selectedTag, newTagName);
    if (!response.ok) {
        this.error("NewTag request failed", await response.text());
        return;
    }

    var explorerElement = this.element.closest(".explorer");

    // reload tree and select new tag
    await this.Load(this.selectedTag);

    // reload docMatrix
    if (explorerElement)
        explorerElement.explorer.docMatrix().Reload();
}

// Service methods
function TagTreeService() { }

TagTreeService.prototype.NewTag = function (domain, selectedTag, newTagName) {
    return fetch("/Home/NewTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag,
            newTagName: newTagName
        })
    });
}

TagTreeService.prototype.TagTree = function (clientId, domain, selectedTag) {
    return fetch(`/Home/TagTree?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}`);
}
