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

TagTree.prototype.changeHandlers = [];
TagTree.prototype.ApplyChanges = function (change) {
    for (const handler of this.changeHandlers) {
        handler.call(this, change);
    }
}

// Api
TagTree.prototype.IsValidTagName = function (name) {
    return /^[\p{L}\p{N}_\- ]+$/u.test(name);
}

TagTree.prototype.IsValidTag = function (tag) {
    if (tag == null)
        return false;

    if (tag.trim() == "")   // root tag
        return true;

    return tag.split('/').every(part =>
        /^[\p{L}\p{N}_\- ]+$/u.test(part)
    );
}

TagTree.prototype.TagPath = function (domain, tag) {
    var tags = tag.split('/');
    var tagPath = tags.map(t => `[${t}]`).join(' ');
    return tagPath && tagPath != "[]" ? tagPath : domain;
}

TagTree.prototype.ParentTag = function (tag) {
    var tags = tag.split('/');
    tags.pop();
    var tagPath = tags.join('/');
    return tagPath;
}

TagTree.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

TagTree.prototype.Load = async function (tagId, toExpand) {
    var expandedTag = this.ExpandedTag();
    var searchText = this.searchInput.value;

    // Update model property
    this.selectedTag = tagId;

    var explorerElement = this.element.closest(".explorer");

    // Reload HTML content
    const response = await this.service.TagTree(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        this.error("TagTree request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());

    // expand expandedTag
    var tagTree = explorerElement.explorer.tagTree();
    tagTree.ExpandTag(toExpand ?? expandedTag);
    tagTree.Search(searchText);
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
