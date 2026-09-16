Explorer.prototype.InitSelectTag = function (options) {
    this.log('InitSelectTag');

    var tagTree = this.tagTree();

    tagTree.OnNodeSelected = this.LoadDocuments.bind(this);
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitSelectTag);

// Api
Explorer.prototype.LoadDocuments = async function (tagId) {
    var explorer = this;

    const response = await LoadTagDocuments(explorer.docMatrixId, explorer.domain, tagId);
    if (!response.ok) {
        console.error("LoadTagDocuments failed", await response.text());
        return;
    }

    explorer.element.querySelector(".doc-panel").innerHTML = await response.text();
}

// Service methods
function LoadTagDocuments(docMatrixId, domain, tagId) {
    return fetch(`/Home/LoadTagDocuments?docMatrixId=${docMatrixId}&domain=${domain}&tagId=${tagId}`);
}