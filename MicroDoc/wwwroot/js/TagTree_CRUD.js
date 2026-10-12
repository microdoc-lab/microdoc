// HandleCRUD
TagTree.prototype.HandleCRUD = async function (change) {
    var selectedTag = this.selectedTag;

    switch (change.op) {
        case "NewTag":
            if (change.external)
                await this.Load(selectedTag);
            else
                await this.Load(selectedTag, selectedTag);
            break;

        case "MoveTag":
            if (change.external)
                await this.Load(selectedTag);
            else
                await this.Load(change.newTag, change.newTag);
            break;

        case "DeleteTag":
            if (selectedTag != change.selectedTag)
                await this.Load(selectedTag);
            else
                await this.Load(change.parentTag, change.parentTag);
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
