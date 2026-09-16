DocMatrix.prototype.InitReload = function (options) {
    this.log('InitReload');
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitReload);

// Api
DocMatrix.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

DocMatrix.prototype.Load = async function (tagId) {
    // Update model property
    this.selectedTag = tagId;

    // Reload HTML content
    const response = await this.service.DocMatrix(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        console.error("DocMatrix request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

// Service methods
DocMatrixService.prototype.DocMatrix = function(docMatrixId, domain, tagId) {
    return fetch(`/Home/DocMatrix?docMatrixId=${docMatrixId}&domain=${domain}&tagId=${tagId}`);
}