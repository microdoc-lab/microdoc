DocMatrix.prototype.InitNavigation = function (options) {
    this.log('InitNavigation');

    var grid = this.grid();

    // browse TagTree from DocMatrix - handle click on Tag in DocMatrix
    grid.addEventListener("click", event => {
        // don't navigate if user select some text in the cell
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed)
            return;

        // check click was on tag
        var tag = event.target.closest("tag");
        if (!tag)
            return;

        // select tag in tree
        this.explorer().tagTree().SelectTag(tag.dataset.id);
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitNavigation);

// HandleSwapTags
DocMatrix.prototype.HandleSwapTags = function (change) {
    if (change.op != "SwapTags")
        return;

    if (this.selectedTag != change.parentTag)
        return;

    var sender = this.element.querySelector(`.grid tr[data-tag='${this.DocId(change.parentTag, change.tagName)}']`);
    var target = this.element.querySelector(`.grid tr[data-tag='${this.DocId(change.parentTag, change.targetTagName)}']`);

    if (!sender)
        return;

    if (!target)
        return;

    // Reorder DOM
    const parentList = sender.parentElement;
    const nodes = Array.from(parentList.children);
    const draggedIndex = nodes.indexOf(sender);
    const targetIndex = nodes.indexOf(target);

    if (draggedIndex === -1 || targetIndex === -1) return;

    if (draggedIndex >= targetIndex) {  // Insert before target                    
        parentList.insertBefore(sender, target);
    } else if (target.nextSibling) {    // Insert after target                    
        parentList.insertBefore(sender, target.nextSibling);
    } else {                            // Insert last                    
        parentList.appendChild(sender);
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleSwapTags);

//#region NewTag
DocMatrix.prototype.HandleNewTag = function (change) {
    if (change.op != "NewTag")
        return;

    if (this.selectedTag == change.selectedTag)
        this.Reload();
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleNewTag);
//#endregion

//#region MoveTag
DocMatrix.prototype.HandleMoveTag = function (change) {
    if (change.op != "MoveTag")
        return;

    if (change.external) {
        // reload docMatrix on currently selected tag (if change came from other user)
        if (this.selectedTag == change.selectedTag)
            this.Reload();
    } else {
        // reload docMatrix on moved tag (if change initiated by current user)
        this.selectedTag = change.newTag;
        this.Reload();
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleMoveTag);
//#endregion

//#region DeleteTag
DocMatrix.prototype.HandleDeleteTag = function (change) {
    if (change.op != "DeleteTag")
        return;

    if (this.selectedTag == change.selectedTag || this.selectedTag == change.parentTag) {
        // reload docMatrix on moved tag (if change initiated by current user)
        this.selectedTag = change.parentTag;
        this.Reload();
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleDeleteTag);
//#endregion

// Api
DocMatrix.prototype.MoveTagUp = function () {
    if (!this.selectedTag)
        return;

    // determine parent tag
    var parentTag = this.TagParent(this.selectedTag);

    // select parent tag
    this.explorer().tagTree().SelectTag(parentTag);

    // collapse just selected parent tag
    this.explorer().tagTree().CollapseTag(parentTag);
}