TagTree.prototype.InitSelection = function (options) {
    this.debug('InitSelection');

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
    if (tagName != null) {
        var tagNode = this.element.querySelector(`.tag[data-id="${tagName}"]`);
        if (tagNode) {
            // select tag
            this.InternalSelectTag(tagNode);

            // expand details chain up to selected tag (don't expand last node)
            var lastTag = true;
            while (tagNode) {
                var details = tagNode.querySelector("details");
                if (details && !details.classList.contains("empty") && !lastTag)
                    details.open = true;

                tagNode = tagNode.parentElement.closest(".tag");
                lastTag = false;
            }
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
        this.selectedTag = "";

        // Call user-provided callback
        this.OnNodeSelected(null);
    }
}