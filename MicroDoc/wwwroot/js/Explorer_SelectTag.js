Explorer.prototype.InitSelectTag = function (options) {
    this.log('InitSelectTag');

    var explorer = this;
    this.tagTree().options.OnNodeSelected = this.tagTree().OnNodeSelected = function (tagId) {
        explorer.docMatrix().Load(tagId);
    };
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitSelectTag);