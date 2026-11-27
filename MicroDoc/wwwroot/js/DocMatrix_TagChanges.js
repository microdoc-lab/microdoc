// HandleTagChanges
DocMatrix.prototype.HandleTagChanges = async function (change) {
    var selectedTag = this.selectedTag;

    switch (change.op) {
        case "SwapTags":
            if (selectedTag == change.parentTag || this.loadDeepLevels)
                this.SwapRows(change.parentTag, change.tagName, change.targetTagName);  // if selected tag is parent tag - swap grid rows
            break;

        case "NewTag":
            if (selectedTag == change.selectedTag || this.loadDeepLevels)      // if selected tag is parent of new tag - reload grid (to see newly created tag in it)
                await this.Load(selectedTag);
            break;

        case "RenameTag":
            if (selectedTag == change.selectedTag)
                await this.Load(change.newTag);           // if selected tag is a renamed tag - switch grid to renamed tag
            else
                await this.Load(selectedTag);             // reload grid
            break;

        case "MoveTag":
            if (change.external) {
                if (selectedTag == change.selectedTag)
                    await this.Load(change.parentTag);        // if selected tag is a moved tag - switch grid to parent tag (to see tag gone)
                else if (selectedTag == change.targetTag || selectedTag == change.parentTag || this.loadDeepLevels)
                    await this.Load(selectedTag);             // if selected tag is target/parent - reload grid (to see tag gone)
            } else
                await this.Load(change.newTag);               // switch grid to moved tag
            break;

        case "DeleteTag":
            this.RemoveRow(change.selectedTag);

            // if (selectedTag == change.selectedTag)            // if selected tag is deleting tag - switch grid to parent tag
            //     await this.Load(change.parentTag);
            // else if (selectedTag == change.parentTag || this.loadDeepLevels)
            //     await this.Load(selectedTag);
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

    var senderNodes = GetChildNodes(sender);
    if (draggedIndex >= targetIndex) {          // Insert before target                    
        senderNodes.forEach(n => parentList.insertBefore(n, target));
    } else {
        var targetNodes = GetChildNodes(target);
        var lastTarget = targetNodes.at(-1);
        if (lastTarget.nextElementSibling) {    // Insert after target                    
            const lastTargetSibling = lastTarget.nextElementSibling;
            senderNodes.forEach(n => parentList.insertBefore(n, lastTargetSibling));
        } else {                                // Insert last                    
            senderNodes.forEach(n => parentList.appendChild(n));
        }
    }

    function GetChildNodes(parent) {
        var nodes = [];
        nodes.push(parent);

        let current = parent.nextElementSibling;
        while (current && current.dataset.tag.startsWith(parent.dataset.tag + "/")) {
            nodes.push(current);
            current = current.nextElementSibling;
        }

        return nodes;
    }
}

DocMatrix.prototype.RemoveRow = function (tag) {
    const row = this.tagRow(tag);
    if (!row)
        return;

    row.remove();
}