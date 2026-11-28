// HandleTagChanges
DocMatrix.prototype.HandleTagChanges = async function (change) {
    var selectedTag = this.selectedTag;

    switch (change.op) {
        case "SwapTags":
            if (selectedTag == change.parentTag || this.loadDeepLevels)
                this.SwapRows(change.parentTag, change.tagName, change.targetTagName);
            break;

        case "NewTag":
            if (selectedTag == change.selectedTag || this.loadDeepLevels)
                await this.Load(selectedTag);
            break;

        case "RenameTag":
            this.RenameRow(change.selectedTag, change.newTag);
            break;

        case "MoveTag":
            if (this.loadDeepLevels)
                this.MoveRow(change.selectedTag, change.newTag);
            else
                await this.Load(selectedTag);
            break;

        case "DeleteTag":
            this.RemoveRow(change.selectedTag);
            break;
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleTagChanges);

// Api
DocMatrix.prototype.GetTagRowWithChildren = function (tagRow) {
    var nodes = [];
    nodes.push(tagRow);

    let current = tagRow.nextElementSibling;
    while (current && (tagRow.dataset.tag == "" || current.dataset.tag.startsWith(tagRow.dataset.tag + "/"))) {
        nodes.push(current);
        current = current.nextElementSibling;
    }

    return nodes;
}

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

    var senderNodes = this.GetTagRowWithChildren(sender);
    if (draggedIndex >= targetIndex) {          // Insert before target                    
        senderNodes.forEach(n => parentList.insertBefore(n, target));
    } else {
        var targetRows = this.GetTagRowWithChildren(target);
        var lastTargetRow = targetRows.at(-1);
        if (lastTargetRow.nextElementSibling) {    // Insert after target                    
            const lastTargetSibling = lastTargetRow.nextElementSibling;
            senderNodes.forEach(n => parentList.insertBefore(n, lastTargetSibling));
        } else {                                // Insert last                    
            senderNodes.forEach(n => parentList.appendChild(n));
        }
    }
}

DocMatrix.prototype.RenameRow = function (tag, newTag) {
    const tagRow = this.tagRow(tag);
    if (!tagRow)
        return;

    const rows = this.GetTagRowWithChildren(tagRow);
    rows.forEach(row => {
        // update row dataset
        row.dataset.tag = row.dataset.tag.replace(tag, newTag);

        // update row title
        const title = row.querySelector("th tag");
        if (title.dataset.id == tag)
            title.textContent = `[${DocParser.TagName(newTag)}]`;
        title.dataset.id = title.dataset.id.replace(tag, newTag);

        // update row documents
        row.querySelectorAll("td doc").forEach(doc => {
            doc.dataset.id = doc.dataset.id.replace(tag, newTag);
            doc.dataset.tagpath = DocParser.DocTagPath(doc.dataset.id);
        });
    });
}

DocMatrix.prototype.MoveRow = function (tag, newTag) {
    const tagRow = this.tagRow(tag);
    if (!tagRow)
        return;

    const newParentTag = DocParser.TagParent(newTag);
    const parentRow = this.tagRow(newParentTag);
    if (!parentRow)
        return;

    const parentList = tagRow.parentElement;
    const targetRows = this.GetTagRowWithChildren(parentRow);
    const lastTargetRow = targetRows.at(-1);

    // move rows in Grid
    const rows = this.GetTagRowWithChildren(tagRow);
    rows.forEach(row => {
        if (lastTargetRow.nextElementSibling) {    // Insert after target                    
            const lastTargetSibling = lastTargetRow.nextElementSibling;
            rows.forEach(n => parentList.insertBefore(n, lastTargetSibling));
        } else {                                // Insert last                    
            rows.forEach(n => parentList.appendChild(n));
        }
    });

    // update rows dataset
    rows.forEach(row => {
        // update row dataset
        row.dataset.tag = row.dataset.tag.replace(tag, newTag);

        // update row title
        const title = row.querySelector("th tag");
        if (title.dataset.id == tag)
            title.textContent = `[${DocParser.TagName(newTag)}]`;
        title.dataset.id = title.dataset.id.replace(tag, newTag);

        // update header tag-level
        const th = row.querySelector("th");
        th.dataset.tagLevel = DocParser.TagLevel(row.dataset.tag) + 1;
        th.style.setProperty('--tag-level', th.dataset.tagLevel);

        // update row documents
        row.querySelectorAll("td doc").forEach(doc => {
            doc.dataset.id = doc.dataset.id.replace(tag, newTag);
            doc.dataset.tagpath = DocParser.DocTagPath(doc.dataset.id);
        });
    });
}

DocMatrix.prototype.RemoveRow = function (tag) {
    const row = this.tagRow(tag);
    if (!row)
        return;

    row.remove();
}