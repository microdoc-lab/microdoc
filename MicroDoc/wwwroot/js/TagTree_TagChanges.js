// HandleTagChanges
TagTree.prototype.HandleTagChanges = async function (change) {
    var selectedTag = this.selectedTag;
    var expandedTag = this.ExpandedTag();

    switch (change.op) {
        case "NewTag":
            if (change.external)
                await this.Load(selectedTag);
            else
                await this.Load(selectedTag, selectedTag);              // reload tree, expand selected tag (to see newly created tag in it)
            break;

        case "RenameTag":
            var toExpand = expandedTag == change.selectedTag ? change.newTag : null;
            if (selectedTag == change.selectedTag)
                await this.Load(change.newTag, toExpand);           // if selected tag is a renamed tag - switch tree to renamed tag
            else
                await this.Load(selectedTag, toExpand);             // reload tree
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
            if (selectedTag == change.selectedTag)
                await this.Load(change.parentTag, change.parentTag);    // if selected tag is deleting tag - switch tree to parent tag, expand parent tag
            else
                await this.Load(selectedTag);
            break;
    }
}

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleTagChanges);