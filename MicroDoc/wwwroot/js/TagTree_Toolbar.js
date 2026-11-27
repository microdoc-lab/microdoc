TagTree.prototype.InitToolbar = function (options) {
    this.debug('InitToolbar');

    const toolbar = this.toolbar();

    // show toolbar on mouseover
    this.element.addEventListener("mouseover", event => {        
        // find & check title
        var title = event.target.closest(".title");

        // Assume root tag when moving over search button.
        if (this.searchInput.contains(event.target))
            title = this.element.querySelector(".domain.tag .title");

        if (!title)
            return;

        // find & check tag
        const tag = title.closest(".tag");
        if (!tag)
            return;

        // obtain tag context
        var domain = tag.dataset.domain;
        var tagId = tag.dataset.id;

        // show toolbar
        toolbar.style.visibility = "visible";
        // set toolbar context
        toolbar.dataset.domain = domain;
        toolbar.dataset.id = tagId;

        this.PositionToolbar(title);

        // don't show toolbar for root tag
        if (tagId == "") {
            toolbar.querySelector(".rename").style.setProperty('display', 'none', 'important');
            toolbar.querySelector(".delete").style.setProperty('display', 'none', 'important');
            toolbar.querySelector(".reload").style.removeProperty('display');
            toolbar.querySelector(".search-ph").style.removeProperty('display');
        }
        else {
            toolbar.querySelector(".rename").style.removeProperty('display');
            toolbar.querySelector(".delete").style.removeProperty('display');
            toolbar.querySelector(".reload").style.setProperty('display', 'none', 'important');
            toolbar.querySelector(".search-ph").style.setProperty('display', 'none', 'important');
        }
    });

    // hide toolbar on mouseout
    this.element.addEventListener("mouseout", event => {
        // find & check title
        const title = event.target.closest(".title");
        if (!title)
            return;

        // Don't hide when moving between elements inside the same item.
        if (title.contains(event.relatedTarget))
            return;

        // Don't hide when moving over toolbar itself.
        if (toolbar.contains(event.relatedTarget))
            return;

        // Don't hide when moving over search for root tag.
        const tag = title.closest(".tag");
        if (this.searchInput.contains(event.relatedTarget) && tag.dataset.id == "")
            return;

        // hide toolbar
        toolbar.style.visibility = "hidden";
        // reset toolbar context
        toolbar.dataset.id = null;

        // unhighlight title
        this.element.querySelectorAll(".tag .title").forEach(tag => tag.classList.remove("hover"));
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitToolbar);

// Api
TagTree.prototype.PositionToolbar = function (title) {
    var overlay = this.element;
    var toolbar = this.toolbar();

    // position toolbar at the top-right corner of title
    const rect = title.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    toolbar.style.right = `${overlayRect.right - rect.right}px`;
    toolbar.style.top = `${rect.top - overlayRect.top}px`;
    //toolbar.style.width = `${overlayRect.width - 18}px`;

    // highlight title
    this.element.querySelectorAll(".tag .title").forEach(tag => tag.classList.remove("hover"));
    title.classList.add("hover");
}

TagTree.prototype.NewTag = async function () {
    var domain = this.domain;
    var selectedTag = this.toolbar().dataset.id;

    // Prompt new tag name
    var tagPath = DocParser.TagPath(domain, selectedTag);

    var newTagName = prompt(format(Loc.TagTree_NewPrompt, tagPath));

    if (newTagName == null)
        return;

    if (!DocParser.IsValidTagName(newTagName)) {
        alert(Loc.TagTree_InvalidTagName);
        return;
    }

    this.log(`NewTag selectedTag: ${selectedTag}, newTagName: ${newTagName}`);

    // Create Tag
    const response = await this.service.NewTag(domain, selectedTag, newTagName);
    if (!response.ok) {
        this.error(format(Loc.TagTree_NewFailed, tagPath), await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    await window.domain.PublishChanges(data.changes);
}

TagTree.prototype.RenameTag = async function () {
    var domain = this.domain;
    var selectedTag = this.toolbar().dataset.id;

    // Prompt new tag name
    var tagPath = DocParser.TagPath(domain, selectedTag);
    var tagName = DocParser.TagName(selectedTag);

    var newTagName = prompt(format(Loc.TagTree_RenamePrompt, tagPath), tagName);

    if (newTagName == null)
        return;

    if (!DocParser.IsValidTagName(newTagName)) {
        alert(Loc.TagTree_InvalidTagName);
        return;
    }

    this.log(`RenameTag selectedTag: ${selectedTag}, newTagName: ${newTagName}`);

    // Rename Tag
    const response = await this.service.RenameTag(domain, selectedTag, newTagName);
    if (!response.ok) {
        this.error(format(Loc.TagTree_RenameFailed, tagPath, newTagName), await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    await window.domain.PublishChanges(data.changes);
}

TagTree.prototype.DeleteTag = async function () {
    var domain = this.domain;
    var selectedTag = this.toolbar().dataset.id;

    // Prompt new tag name
    var tagPath = DocParser.TagPath(domain, selectedTag);

    if (!confirm(format(Loc.TagTree_DeletePrompt, tagPath)))
        return;

    this.log(`DeleteTag selectedTag: ${selectedTag}`);

    // Delete Tag
    const response = await this.service.DeleteTag(domain, selectedTag);
    if (!response.ok) {
        this.error(format(Loc.TagTree_DeleteFailed, tagPath), await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    await window.domain.PublishChanges(data.changes);
}
