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
            this.MoveItem(change.selectedTag, change.newTag);

            const isSelectedTagMoved = selectedTag == change.selectedTag || selectedTag.startsWith(change.selectedTag + "/");
            const newSelectedTag = isSelectedTagMoved ? selectedTag.replace(change.selectedTag, change.newTag) : selectedTag;
            const newParentTag = DocParser.TagParent(newSelectedTag);
            // select tag if it was previously selected
            if (isSelectedTagMoved)
                this.SelectTag(newSelectedTag);

            // collapse moving tag
            this.CollapseTag(change.newTag);

            // expand new tag if it was previously expanded
            if (expandedTag == change.selectedTag)
                this.ExpandTag(change.newTag);
            // expand new parent tag if local update or selected tag was moved
            else if (!change.external || isSelectedTagMoved)
                this.ExpandTag(newParentTag);
            break;

        case "DeleteTag":

            this.RemoveItem(change.selectedTag);

            // if selected tag is deleting tag - select and expand parent tag
            if (selectedTag == change.selectedTag) {
                this.SelectTag(change.parentTag);
                this.ExpandTag(change.parentTag);
            }

            break;
    }
}

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleTagChanges);

TagTree.prototype.AddItem = function (parentTag, tagItem) {
    const parentItem = this.tagItem(parentTag);
    if (!parentItem)
        return;

    const details = parentItem.querySelector("details");
    var list = parentItem.querySelector(".tag-list");

    if (!list && parentTag == "")
        list = this.element.querySelector(".tag-list"); 

    list.appendChild(tagItem);

    // mark parent tag as non-empty
    if (details)
        details.classList.remove("empty");

    // update tag classes
    const tagLevel = DocParser.TagLevel(tagItem.dataset.id);
    switch (tagLevel) {
        case 0:
            // mark tag as module
            tagItem.classList.remove("part");
            tagItem.classList.add("module");
            break;
        default:
            // mark tag as part
            tagItem.classList.remove("module");
            tagItem.classList.add("part");
            break;
    }
}

TagTree.prototype.MoveItem = function (tag, newTag) {
    const tagItem = this.tagItem(tag);
    if (!tagItem)
        return;

    // remove tag from old position in tree
    this.RemoveItem(tag);

    // update item dataset
    const newParentTag = DocParser.TagParent(newTag);

    tagItem.dataset.id = newTag;
    tagItem.dataset.tagid = newParentTag;

    // update nested items dataset
    const nestedItems = tagItem.querySelectorAll(".tag");
    nestedItems.forEach(item => {
        item.dataset.id = item.dataset.id.replace(tag, newTag);
        item.dataset.tagid = item.dataset.tagid.replace(tag, newTag);
    });

    // add item to new parent
    this.AddItem(newParentTag, tagItem);
}

TagTree.prototype.RenameItem = function (tag, newTag) {
    const tagItem = this.tagItem(tag);
    if (!tagItem)
        return;

    const newTagName = DocParser.TagName(newTag);

    // update item dataset
    tagItem.dataset.id = newTag;
    tagItem.dataset.tag = newTagName;

    // update nested items dataset
    const nestedItems = tagItem.querySelectorAll(".tag");
    nestedItems.forEach(item => {
        item.dataset.id = item.dataset.id.replace(tag, newTag);
        item.dataset.tagid = item.dataset.tagid.replace(tag, newTag);
    });

    // update item title
    const title = tagItem.querySelector(".title");
    title.textContent = `[${newTagName}]`;
}

TagTree.prototype.RemoveItem = function (tag, expand) {
    const tagItem = this.tagItem(tag);
    if (!tagItem)
        return;

    const details = tagItem.closest("details");
    const list = tagItem.closest(".tag-list");

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
}