Explorer.prototype.InitSelectTag = function (options) {
    this.log('InitSelectTag');

    var explorer = this;
    var tagTree = this.tagTree();

    tagTree.OnNodeSelected = async function (tagId) {
        const response = await LoadTagDocuments(explorer.docMatrixId, explorer.domain, tagId);
        if (!response.ok) {
            console.error("ReorderTagsBatch failed", await response.text());
            return;
        }

        explorer.element.querySelector(".doc-panel").innerHTML = await response.text();
    };
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitSelectTag);

// Service methods
function LoadTagDocuments(docMatrixId, domain, tagId) {
    return fetch(`/Home/LoadTagDocuments?docMatrixId=${docMatrixId}&domain=${domain}&tagId=${tagId}`);
}