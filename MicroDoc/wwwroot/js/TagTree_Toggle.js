TagTree.prototype.InitToggle = function (options) {
    this.log('InitToggle');

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
    var elements = this.element.querySelectorAll(`details[open]`);
    var details = elements.length ? elements[elements.length - 1] : null;
    if (details)
        return details.closest(".tag").dataset.id;
    return null;
}

TagTree.prototype.ExpandTag = function (tag) {
    var details = this.element.querySelector(`.tag[data-id="${tag}"] details`);
    while (details) {
        if (!details.classList.contains("empty"))
            details.open = true;
        details = details.parentElement.closest("details");
    }
}

TagTree.prototype.CollapseTag = function (tag) {
    var details = this.element.querySelector(`.tag[data-id="${tag}"] details`);
    if (details)
        details.open = false;
}