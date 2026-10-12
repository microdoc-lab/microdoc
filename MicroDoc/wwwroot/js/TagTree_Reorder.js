TagTree.prototype.InitDragNDropReorder = function (options) {
    this.log('InitDragNDropReorder');

    let draggedNode = null;
    this.element.querySelectorAll(".title").forEach(node => {
        node.draggable = true;

        node.addEventListener("dragstart", e => {
            if (window.dragging) {
                e.preventDefault();
                return;
            }

            draggedNode = node;
            e.dataTransfer.effectAllowed = "move";
        });

        node.addEventListener("dragover", e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        node.addEventListener("drop", async e => {
            e.preventDefault();
            const targetNode = node;

            // Only allow drop within the same parent
            if (!draggedNode || draggedNode === targetNode || draggedNode.closest(".tag-list") !== targetNode.closest(".tag-list")) return;

            const sender = draggedNode.closest(".tag");
            const target = targetNode.closest(".tag");

            const response = await this.service.ReorderTagsBatch(sender.dataset.domain, sender.dataset.path, sender.dataset.tag, target.dataset.tag);
            if (!response.ok) {
                console.error("ReorderTagsBatch request failed", await response.text());
                return;
            }

            var data = await response.json();

            window.domain.PublishChanges(data.changes);
        });
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitDragNDropReorder);

TagTree.prototype.HandleSwapTags = function(change) {
    if (change.op != "SwapTags")
        return;

    var sender = this.element.querySelector(`.tag[data-path='${change.path}'][data-tag=${change.tag}]`);
    var target = this.element.querySelector(`.tag[data-path='${change.path}'][data-tag=${change.targetTag}]`);

    if (!sender)
        return;

    if (!target)
        return;

    // Reorder DOM
    const parentList = sender.closest(".tag-list");
    const nodes = Array.from(parentList.children);
    const draggedIndex = nodes.indexOf(sender);
    const targetIndex = nodes.indexOf(target);

    if (draggedIndex === -1 || targetIndex === -1) return;

    if (draggedIndex >= targetIndex) {  // Insert before target                    
        parentList.insertBefore(sender, target);
    } else if (target.nextSibling) {    // Insert after target                    
        parentList.insertBefore(sender, target.nextSibling);
    } else {                            // Insert last                    
        parentList.appendChild(sender);
    }
}

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleSwapTags);

// Service methods
TagTreeService.prototype.ReorderTagsBatch = function(domain, path, tag, targetTag) {
    return fetch("/Home/ReorderTagsBatch", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            path: path ?? "",
            tag: tag,
            targetTag: targetTag
        })
    });
}
