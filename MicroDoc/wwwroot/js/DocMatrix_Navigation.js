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

    if (this.selectedTag != change.path)
        return;

    var sender = this.element.querySelector(`.grid tr[data-tag='${this.DocId(change.path, change.tag)}']`);
    var target = this.element.querySelector(`.grid tr[data-tag='${this.DocId(change.path, change.targetTag)}']`);

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

// HandleNewTag
DocMatrix.prototype.HandleNewTag = function (change) {
    if (change.op != "NewTag")
        return;

    if (this.selectedTag == change.selectedTag)
        this.Reload();
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleNewTag);

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