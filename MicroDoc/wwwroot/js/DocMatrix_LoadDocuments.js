DocMatrix.prototype.InitLoadDocuments = function (options) {
    this.log('InitLoadDocuments');
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitLoadDocuments);

// Api
DocMatrix.prototype.ReloadDocuments = async function () {
    await this.LoadDocuments(this.selectedTag);
}

DocMatrix.prototype.LoadDocuments = async function (tagId) {
    this.selectedTag = tagId;
    const response = await LoadTagDocuments(this.id, this.domain, tagId);
    if (!response.ok) {
        console.error("LoadTagDocuments failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

// Service methods
function LoadTagDocuments(docMatrixId, domain, tagId) {
    return fetch(`/Home/LoadTagDocuments?docMatrixId=${docMatrixId}&domain=${domain}&tagId=${tagId}`);
}