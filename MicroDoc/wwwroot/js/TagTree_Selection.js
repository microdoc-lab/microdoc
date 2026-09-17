TagTree.prototype.InitSelection = function (options) {
    this.log('InitSelection');

    // Node click for selection
    const treeNodes = this.element.querySelectorAll(".title");
    treeNodes.forEach(titleNode => {
        titleNode.addEventListener("click", (event) => {
            event.stopPropagation(); // prevent parent triggers
            const tagNode = titleNode.closest(".tag");
            this.InternalSelectTag(tagNode);
        });
    });

    // Default event handler
    options.OnNodeSelected ??= function (tagName) {
        this.log(`OnNodeSelected '${tagName}'`);
    };

    this.OnNodeSelected = options.OnNodeSelected;
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitSelection);

// Api
TagTree.prototype.SelectTag = function (tagName) {
    if (tagName) {
        const titleNode = this.element.querySelector(`.tag[data-id="${tagName}"] .title`);
        if (titleNode) {
            var details = titleNode.closest("details");
            while (details) {
                details.open = true;
                details = details.parentElement.closest("details");
            }

            const tagNode = titleNode.closest(".tag");
            this.InternalSelectTag(tagNode);
        }
    }
    else {
        this.InternalSelectTag(null);
    }
}

TagTree.prototype.InternalSelectTag = function (tagNode) {
    if (tagNode) {
        // Highlight selected node
        this.element.querySelectorAll(".tag.selected").forEach(n => n.classList.remove("selected"));
        tagNode.classList.add("selected");

        // Update model property
        this.selectedTag = tagNode.dataset.id;

        // Call user-provided callback
        this.OnNodeSelected(tagNode.dataset.id);
    }
    else {
        // Remove selection
        this.element.querySelectorAll(".tag.selected").forEach(n => n.classList.remove("selected"));

        // Update model property
        this.selectedTag = null;

        // Call user-provided callback
        this.OnNodeSelected(null);
    }
}