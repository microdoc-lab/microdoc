var tagTreeInstanceId = 0;

function TagTree(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    this.instanceId = ++tagTreeInstanceId;
    this.options = options;
    this.service = new TagTreeService();

    this.UpdateElement(element);

    this.debug(`new instance #${this.instanceId}`);
}

TagTree.prototype.UpdateElement = function (element) {
    this.id = element.id;
    this.element = element;
    this.element.tagTree = this;
    if (this.options.style)
        this.element.setAttribute('style', this.options.style);
}

TagTree.prototype.debug = function (text) { console.debug(`TagTree #${this.id}: ${text}`); }
TagTree.prototype.info = function (text) { console.info(`TagTree #${this.id}: ${text}`); }
TagTree.prototype.log = function (text) { console.log(`TagTree #${this.id}: ${text}`); }
TagTree.prototype.warn = function (text) { console.warn(`TagTree #${this.id}: ${text}`); }
TagTree.prototype.error = function (text, error) { console.error(`TagTree #${this.id}: ${text}`, error); alert(text + "\n\n" + LocalizeError(error)); }

TagTree.prototype.behaviors = [];
TagTree.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

TagTree.prototype.changeHandlers = [];
TagTree.prototype.ApplyChanges = async function (change) {
    for (const handler of this.changeHandlers) {
        await handler.call(this, change);
    }
}

// Api
TagTree.prototype.explorer = function () { return this.element.closest(".explorer").explorer; }
TagTree.prototype.toolbar = function () { return this.element.querySelector(".toolbar"); }

TagTree.prototype.tagItem = function (tag) { return this.element.querySelector(`.tag[data-id="${tag}"]`); }

TagTree.prototype.Reload = async function () {
    return await this.Load(this.selectedTag);
}

TagTree.prototype.Load = async function (selectedTag, toExpand) {
    this.log(`Load selectedTag: ${selectedTag}, toExpand: ${toExpand}`);

    // capture state
    var expandedTag = this.ExpandedTag();
    var searchText = this.searchInput.value;

    // Update model property
    this.selectedTag = selectedTag;

    // Reload HTML content
    const response = await this.service.TagTree(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        this.error(TagTree_LoadFailed, await response.text());
        return false;
    }

    const parentElement = this.element.parentElement;
    ReplaceInnerHtml(parentElement, await response.text());

    // restore state
    this.ExpandTag(toExpand ?? expandedTag);
    this.Search(searchText);

    return true;
}

// Service methods
function TagTreeService() { }

TagTreeService.prototype.NewTag = function (domain, selectedTag, newTagName) {
    return apiFetch("/Home/NewTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag,
            newTagName: newTagName
        })
    });
}

TagTreeService.prototype.RenameTag = function (domain, selectedTag, newTagName) {
    return apiFetch("/Home/RenameTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag,
            newTagName: newTagName
        })
    });
}

TagTreeService.prototype.MoveTag = function (domain, selectedTag, targetTag) {
    return apiFetch("/Home/MoveTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag,
            targetTag: targetTag
        })
    });
}


TagTreeService.prototype.DeleteTag = function (domain, selectedTag) {
    return apiFetch("/Home/DeleteTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag
        })
    });
}

TagTreeService.prototype.TagTree = function (clientId, domain, selectedTag) {
    return apiFetch(`/Home/TagTree?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag}`);
}
