Explorer.prototype.InitSelectTag = function (options) {
    this.log('InitSelectTag');

    var explorer = this;
    this.tagTree().OnNodeSelected = function (tagId) {
        explorer.docMatrix().LoadDocuments(tagId);
    };
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitSelectTag);