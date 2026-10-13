// HandleCRUD
TagTree.prototype.HandleCRUD = async function (change) {
    var selectedTag = this.selectedTag;

    switch (change.op) {
        case "NewTag":
            if (change.external)
                await this.Load(selectedTag);
            else
                await this.Load(selectedTag, selectedTag);              // reload tree, expand selected tag (to see newly created tag in it)
            break;

        case "MoveTag":
            if (change.external)
                if (selectedTag == change.selectedTag)
                    await this.Load(change.parentTag);                  // if selected tag is a moved tag - switch tree to parent tag (to see tag gone)
                if (selectedTag == change.targetTag || selectedTag == change.parentTag)
                    await this.Load(selectedTag);                       // if selected tag is target/parent - reload tree (to see tag gone)
            else
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

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleCRUD);

// Api
TagTree.prototype.NewTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = this.TagPath(domain, selectedTag);

    var newTagName = prompt(`Create new Tag in ${tagPath}? Enter new tag name`);
    if (!newTagName || !newTagName.trim())
        return;

    if (!this.IsValidTagName(newTagName)) {
        alert("Invalid tag name. Only symbols, digits, underscore, hyphen, space allowed");
        return;
    }

    // Create Tag
    const response = await this.service.NewTag(domain, selectedTag, newTagName);
    if (!response.ok) {
        this.error(`Create new Tag in ${tagPath} failed`, await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    window.domain.PublishChanges(data.changes);
}

TagTree.prototype.MoveTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = this.TagPath(domain, selectedTag);

    var targetTag = prompt(`Move Tag ${tagPath}? Enter target tag name`);
    if (!targetTag || !targetTag.trim())
        return;

    if (!this.IsValidTag(targetTag)) {
        alert("Invalid tag. Only symbols, digits, underscore, hyphen, space (/ separated) allowed");
        return;
    }

    // Create Tag
    const response = await this.service.MoveTag(domain, selectedTag, targetTag);
    if (!response.ok) {
        this.error(`Move Tag ${tagPath} to ${targetTag} failed`, await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    window.domain.PublishChanges(data.changes);
}

TagTree.prototype.DeleteTag = async function () {
    var domain = this.domain;
    var selectedTag = this.selectedTag;

    // Prompt new tag name
    var tagPath = this.TagPath(domain, selectedTag);

    if (!confirm(`Delete tag ${tagPath} ?`))
        return;

    // Delete Tag
    const response = await this.service.DeleteTag(domain, selectedTag);
    if (!response.ok) {
        this.error(`Delete tag ${tagPath} failed`, await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    window.domain.PublishChanges(data.changes);
}
