DocMatrix.prototype.InitNavigation = function (options) {
    this.debug('InitNavigation');

    this.loadDeepLevelsInput = this.element.querySelector(".load-deep-levels");

    var grid = this.grid();

    // Default event handler
    options.OnLoadDeepLevelsChanged ??= function (value) {
        this.log(`OnLoadDeepLevelsChanged '${value}'`);
    };

    this.OnLoadDeepLevelsChanged = options.OnLoadDeepLevelsChanged;

    // browse TagTree from DocMatrix - handle click on Tag in DocMatrix
    grid.addEventListener("click", event => {
        // don't navigate if user select some text in the cell
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed)
            return;

        // check click was on tag
        var tag = event.target.closest("tag");
        if (!tag)
            return;

        // select tag in tree
        this.explorer().tagTree().SelectTag(tag.dataset.id);
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitNavigation);

// Api
DocMatrix.prototype.LoadDeepLevelsChanged = function () {
    this.loadDeepLevels = this.loadDeepLevelsInput.checked;

    this.OnLoadDeepLevelsChanged(this.loadDeepLevels);

    this.Reload();
}

DocMatrix.prototype.MoveTagUp = function () {
    if (!this.selectedTag)
        return;

    // determine parent tag
    var parentTag = DocParser.TagParent(this.selectedTag);

    // select parent tag
    this.explorer().tagTree().SelectTag(parentTag);

    // collapse just selected parent tag
    this.explorer().tagTree().CollapseTag(parentTag);
}