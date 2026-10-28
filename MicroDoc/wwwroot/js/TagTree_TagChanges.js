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
            if (change.external) {
                var toExpand = expandedTag == change.selectedTag ? change.newTag : null;
                if (selectedTag == change.selectedTag)
                    await this.Load(change.newTag, toExpand);           // if selected tag is a renamed tag - switch tree to renamed tag
                else
                    await this.Load(selectedTag, toExpand);             // reload tree
            } else
                await this.Load(change.newTag, change.newTag);          // switch tree to renamed tag, expand renamed tag
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
            if (selectedTag != change.selectedTag)
                await this.Load(selectedTag);
            else
                await this.Load(change.parentTag, change.parentTag);    // if selected tag is deleting tag - switch tree to parent tag, expand parent tag
            break;
    }
}

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleTagChanges);

// Api
TagTree.prototype.NewTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

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
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = DocParser.TagPath(domain, selectedTag);

    var newTagName = prompt(format(Loc.TagTree_RenamePrompt, tagPath));

    if (newTagName == null)
        return;

    if (!DocParser.IsValidTagName(newTagName)) {
        alert(Loc.TagTree_InvalidTagName);
        return;
    }

    this.log(`RenameTag selectedTag: ${selectedTag}, newTagName: ${newTagName}`);

    // Rename Tag
    const response = await this.service.Rename(domain, selectedTag, newTagName);
    if (!response.ok) {
        this.error(format(Loc.TagTree_RenameFailed, tagPath, newTagName), await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    await window.domain.PublishChanges(data.changes);
}

TagTree.prototype.MoveTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = DocParser.TagPath(domain, selectedTag);

    var targetTag = prompt(format(Loc.TagTree_MovePrompt, tagPath));

    if (targetTag == null)
        return;

    if (!DocParser.IsValidTagId(targetTag)) {
        alert(Loc.TagTree_InvalidTag);
        return;
    }

    this.log(`MoveTag selectedTag: ${selectedTag}, targetTag: ${targetTag}`);

    // Move Tag
    const response = await this.service.MoveTag(domain, selectedTag, targetTag);
    if (!response.ok) {
        this.error(format(Loc.TagTree_MoveFailed, tagPath, targetTag), await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    await window.domain.PublishChanges(data.changes);
}

TagTree.prototype.DeleteTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

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
