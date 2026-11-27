// HandleTagChanges
TagTree.prototype.HandleTagChanges = async function (change) {
    var selectedTag = this.selectedTag;
    var expandedTag = this.ExpandedTag();

    switch (change.op) {
        case "NewTag":
            if (change.external)
                await this.Load(selectedTag);
            else
                await this.Load(selectedTag, expandedTag);              // reload tree, expand selected tag (to see newly created tag in it)
            break;

        case "RenameTag":
            this.RenameItem(change.selectedTag, change.newTag);
            break;

        case "MoveTag":
            if (change.external) {
                if (selectedTag == change.selectedTag)
                    await this.Load(change.parentTag);                  // if selected tag is a moved tag - switch tree to parent tag (to see tag gone)
                else if (selectedTag == change.targetTag || selectedTag == change.parentTag)
                    await this.Load(selectedTag);                       // if selected tag is target/parent - reload tree (to see tag gone)
                else
                    await this.Load(selectedTag);                       // reload tree
            } else
                await this.Load(change.newTag, change.newTag);          // switch tree to moved tag, expand moved tag
            break;

        case "DeleteTag":
            this.RemoveItem(change.selectedTag);
            break;
    }
}

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleTagChanges);

TagTree.prototype.RenameItem = function (tag, newTag) {
    const tagItem = this.tagItem(tag);
    if (!tagItem)
        return;

    const newTagName = DocParser.TagName(newTag);

    // update item dataset
    tagItem.dataset.id = newTag;
    tagItem.dataset.tag = newTagName;

    // update item title
    const title = tagItem.querySelector(".title");
    title.textContent = `[${newTagName}]`;
}

TagTree.prototype.RemoveItem = function (tag, toExpand) {
    const tagItem = this.tagItem(tag);
    if (!tagItem)
        return;

    const details = tagItem.closest("details");
    const list = tagItem.closest("ul");

    // remove deleted tag from tree
    tagItem.remove();

    // hide toolbar if it was on deleted tag
    const toolbar = this.toolbar();
    if (toolbar.dataset.id == tag) {
        // hide toolbar
        toolbar.style.visibility = "hidden";
        // reset toolbar context
        toolbar.dataset.id = null;
    }

    if (!details)
        return;

    // if no more children - mark parent tag as empty
    if (list.querySelectorAll('li').length === 0) {
        details.classList.add("empty");
        details.open = false;
    }
    else if (this.selectedTag == tag) {
        // if selected tag is deleting tag - expand parent tag
        const parentTag = DocParser.TagParent(tag);
        this.SelectTag(parentTag);
        this.ExpandTag(parentTag);
    }
}