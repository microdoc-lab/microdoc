Explorer.prototype.InitSelectTag = function (options) {
    this.log('InitSelectTag');

    var explorer = this;

    this.tagTree.OnNodeSelected = async function (tagId) {
        const response = await LoadTagDocuments(explorer.domain, tagId);
        if (!response.ok) {
            console.error("ReorderTagsBatch failed", await response.text());
            return;
        }

        explorer.element.querySelector(".doc-panel").innerHTML = await response.text();
        explorer.docMatrix = window[explorer.docMatrixId];
    };
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitSelectTag);

// Service methods
function LoadTagDocuments(domain, tagId) {
    return fetch(`/Home/LoadTagDocuments?domain=${domain}&tagId=${tagId}`);
}