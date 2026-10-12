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
TagTree.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

TagTree.prototype.Load = async function (tagId) {
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
    tagTree.ExpandTag(expandedTag);
    tagTree.Search(searchText);
}

TagTree.prototype.NewTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = this.TagPath(domain, selectedTag);

    var newTagName = prompt(`Create new Tag in ${tagPath}? Enter new tag name`);
    if (!newTagName || !newTagName.trim())
        return;

    // Create Tag
    const response = await this.service.NewTag(domain, selectedTag, newTagName);
    if (!response.ok) {
        this.error(`Create new Tag in ${tagPath} failed`, await response.text());
        return;
    }

    var data = await response.json();
    window.domain.PublishChanges(data.changes);
}

TagTree.prototype.HandleNewTag = async function (change) {
    if (change.op != "NewTag")
        return;

    var selectedTag = this.selectedTag;
    var explorerElement = this.element.closest(".explorer");

    // reload tree with currently selected tag
    await this.Load(selectedTag);

    if (selectedTag == change.selectedTag)
        explorerElement.explorer.tagTree().ExpandTag(selectedTag);
}

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleNewTag);

TagTree.prototype.MoveTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = this.TagPath(domain, selectedTag);

    var targetTag = prompt(`Move Tag ${tagPath}? Enter target tag name`);
    if (!targetTag || !targetTag.trim())
        return;

    // Create Tag
    const response = await this.service.MoveTag(domain, selectedTag, targetTag);
    if (!response.ok) {
        this.error(`Move Tag ${tagPath} to ${targetTag} failed`, await response.text());
        return;
    }

    var newTag = await response.text();

    var explorerElement = this.element.closest(".explorer");

    // reload tree and select moved tag
    await this.Load(newTag);

    // expand selectedTag
    explorerElement.explorer.tagTree().ExpandTag(newTag);

    // reload docMatrix
    if (explorerElement) {
        var docMatrix = explorerElement.explorer.docMatrix();
        docMatrix.selectedTag = newTag;
        docMatrix.Reload();
    }
}

TagTree.prototype.DeleteTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = this.TagPath(domain, selectedTag);
    var parentTag = this.ParentTag(selectedTag);

    if (!confirm(`Delete tag ${tagPath} ?`))
        return;

    // Delete Tag
    const response = await this.service.DeleteTag(domain, selectedTag);
    if (!response.ok) {
        this.error(`Delete tag ${tagPath} failed`, await response.text());
        return;
    }

    var explorerElement = this.element.closest(".explorer");

    // reload tree and select parent tag
    await this.Load(parentTag);

    // expand parentTag
    explorerElement.explorer.tagTree().ExpandTag(parentTag);

    // reload docMatrix
    if (explorerElement) {
        var docMatrix = explorerElement.explorer.docMatrix();
        docMatrix.selectedTag = parentTag;
        docMatrix.Reload();
    }
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

// Service methods
function TagTreeService() { }

TagTreeService.prototype.NewTag = function (domain, selectedTag, newTagName) {
    return fetch("/Home/NewTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag ?? "",
            newTagName: newTagName
        })
    });
}

TagTreeService.prototype.MoveTag = function (domain, selectedTag, targetTag) {
    return fetch("/Home/MoveTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag ?? "",
            targetTag: targetTag
        })
    });
}


TagTreeService.prototype.DeleteTag = function (domain, selectedTag) {
    return fetch("/Home/DeleteTag", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            selectedTag: selectedTag ?? ""
        })
    });
}

TagTreeService.prototype.TagTree = function (clientId, domain, selectedTag) {
    return fetch(`/Home/TagTree?clientId=${clientId}&domain=${domain}&selectedTag=${selectedTag ?? ""}`);
}
