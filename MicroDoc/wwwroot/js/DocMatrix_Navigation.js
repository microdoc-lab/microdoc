DocMatrix.prototype.InitNavigation = function (options) {
    this.log('InitNavigation');

    var grid = this.grid();

    grid.addEventListener("click", event => {
        // don't navigate if user select some text in the cell
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed)
            return;

        // check click was on tag
        var tag = event.target.closest("tag");
        if (!tag)
            return;

        this.explorer().tagTree().SelectTag(tag.dataset.id);
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitNavigation);

// Api
DocMatrix.prototype.MoveTagUp = function () {
    if (!this.selectedTag)
        return;

    var tags = this.selectedTag.split('/');
    tags.pop();
    var parentTag = tags.join('/');

    this.explorer().tagTree().SelectTag(parentTag);
    this.explorer().tagTree().CollapseTag(parentTag);
}