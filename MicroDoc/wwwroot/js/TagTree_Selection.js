TagTree.prototype.InitSelection = function (options) {
    this.log('InitSelection');

    // Node click for selection
    const treeNodes = this.element.querySelectorAll(".title");
    treeNodes.forEach(node => {
        node.addEventListener("click", (event) => {
            event.stopPropagation(); // prevent parent triggers
            const clickedNode = node;
            const sender = clickedNode.closest(".tag");

            // Highlight selected node
            this.ClearSelection();
            sender.classList.add("selected");

            // Call user-provided callback
            this.OnNodeSelected(sender.dataset.id);
        });
    });

    // Default event handler
    this.OnNodeSelected = function (tagName) {
        this.log(`OnNodeSelected '${tagName}'`);
    };

    if (options.OnNodeSelected)
        this.OnNodeSelected = options.OnNodeSelected;
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitSelection);

// Api
TagTree.prototype.SelectedNode = function () {
    var selected = this.element.querySelector(".tag.selected");
    if (selected)
        return selected.dataset.id;
    return null;
}

TagTree.prototype.SelectNode = function (tagName) {
    const node = this.element.querySelector(`.tag[data-id="${tagName}"] .title`);
    if (node) {
        var details = node.closest("details");
        while (details) {
            details.open = true;
            details = details.parentElement.closest("details");
        }
        node.click();
    }
}

TagTree.prototype.ClearSelection = function () {
    this.element.querySelectorAll(".tag.selected").forEach(n => n.classList.remove("selected"));
}