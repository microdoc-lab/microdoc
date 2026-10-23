TagTree.prototype.InitToggle = function (options) {
    this.debug('InitToggle');

    // Prevent toggle by clicking on Title
    const titleElements = this.element.querySelectorAll(".title");
    titleElements.forEach(details => {
        details.addEventListener("click", (event) => {
            event.preventDefault(); // prevent default toggle for other clicks
        });
    });

    // Collapse all nested nodes when a node is collapsed
    this.element.querySelectorAll('details').forEach(details => {
        details.addEventListener('toggle', () => {
            if (!details.open) {
                details.querySelectorAll('details[open]').forEach(child => {
                    child.open = false;
                });
            }
        });
    });

    // When expanding a node, collapse its siblings
    this.element.querySelectorAll('details').forEach(details => {
        details.addEventListener('toggle', () => {
            if (details.open) {
                var level = details.closest(".tag-list");
                level
                    .querySelectorAll('details')
                    .forEach(sibling => {
                        if (sibling !== details && sibling.closest('.tag-list') == level) {
                            sibling.open = false;
                        }
                    });
            }
        });
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitToggle);

TagTree.prototype.ExpandedTag = function () {
    // find all expanded tags
    var elements = this.element.querySelectorAll(`details[open]`);
    // take the last expanded tag (deepest node)
    var details = elements.length ? elements[elements.length - 1] : null;
    if (details)
        return details.closest(".tag").dataset.id;
    return null;
}

TagTree.prototype.ExpandTag = function (tag) {
    // find tag node details
    var details = this.element.querySelector(`.tag[data-id="${tag}"] details`);
    // expand nodes up to the root
    while (details) {
        if (!details.classList.contains("empty"))
            details.open = true;
        details = details.parentElement.closest("details");
    }
}

TagTree.prototype.CollapseTag = function (tag) {
    // find tag node details
    var details = this.element.querySelector(`.tag[data-id="${tag}"] details`);
    // collapse tag
    if (details)
        details.open = false;
}