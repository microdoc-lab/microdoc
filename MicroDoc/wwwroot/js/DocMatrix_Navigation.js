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
DocMatrix.prototype.HandleChanges = function (change) {
    var selectedTag = this.selectedTag;

    switch (change.op) {
        case "SwapTags":
            if (selectedTag == change.parentTag)
                this.SwapRows(change.parentTag, change.tagName, change.targetTagName);  // if selected tag is parent tag - swap grid rows
            break;

        case "NewTag":
            if (selectedTag == change.selectedTag)      // if selected tag is parent of new tag - reload grid (to see newly created tag in it)
                this.Load(selectedTag);
            break;

        case "RenameTag":
            if (change.external) {
                if (selectedTag == change.selectedTag)
                    this.Load(change.newTag);           // if selected tag is a renamed tag - switch grid to renamed tag
                else
                    this.Load(selectedTag);             // reload grid
            } else
                this.Load(change.newTag);               // switch grid to renamed tag
            break;

        case "MoveTag":
            if (change.external) {
                if (selectedTag == change.selectedTag)
                    this.Load(change.parentTag);        // if selected tag is a moved tag - switch grid to parent tag (to see tag gone)
                if (selectedTag == change.targetTag || selectedTag == change.parentTag)
                    this.Load(selectedTag);             // if selected tag is target/parent - reload grid (to see tag gone)
            } else
                this.Load(change.newTag);               // switch grid to moved tag
            break;

        case "DeleteTag":
            if (selectedTag == change.selectedTag || selectedTag == change.parentTag)   // if selected tag is deleting tag/parent - switch grid to parent tag
                this.Load(change.parentTag);
            break;
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleChanges);

DocMatrix.prototype.SwapRows = function (parentTag, tagName, targetTagName) {
    var sender = this.tagRow(DocParser.DocId(parentTag, tagName));
    var target = this.tagRow(DocParser.DocId(parentTag, targetTagName));

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

// Api
DocMatrix.prototype.MoveTagUp = function () {
    if (!this.selectedTag)
        return;

    // determine parent tag
    var parentTag = DocParser.TagParent(this.selectedTag);

    // select parent tag
    this.explorer().tagTree().SelectTag(parentTag);

    // collapse just selected parent tag
    this.explorer().tagTree().CollapseTag(parentTag);
}