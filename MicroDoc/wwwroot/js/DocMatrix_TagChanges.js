// HandleTagChanges
DocMatrix.prototype.HandleTagChanges = async function (change) {
    var selectedTag = this.selectedTag;

    switch (change.op) {
        case "SwapTags":
            if (selectedTag == change.parentTag)
                this.SwapRows(change.parentTag, change.tagName, change.targetTagName);  // if selected tag is parent tag - swap grid rows
            break;

        case "NewTag":
            if (selectedTag == change.selectedTag)      // if selected tag is parent of new tag - reload grid (to see newly created tag in it)
                await this.Load(selectedTag);
            break;

        case "RenameTag":
            if (change.external) {
                if (selectedTag == change.selectedTag)
                    await this.Load(change.newTag);           // if selected tag is a renamed tag - switch grid to renamed tag
                else
                    await this.Load(selectedTag);             // reload grid
            } else
                await this.Load(change.newTag);               // switch grid to renamed tag
            break;

        case "MoveTag":
            if (change.external) {
                if (selectedTag == change.selectedTag)
                    await this.Load(change.parentTag);        // if selected tag is a moved tag - switch grid to parent tag (to see tag gone)
                if (selectedTag == change.targetTag || selectedTag == change.parentTag)
                    await this.Load(selectedTag);             // if selected tag is target/parent - reload grid (to see tag gone)
            } else
                await this.Load(change.newTag);               // switch grid to moved tag
            break;

        case "DeleteTag":
            if (selectedTag == change.selectedTag || selectedTag == change.parentTag)   // if selected tag is deleting tag/parent - switch grid to parent tag
                await this.Load(change.parentTag);
            break;
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleTagChanges);

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