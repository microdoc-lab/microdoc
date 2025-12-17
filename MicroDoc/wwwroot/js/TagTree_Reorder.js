TagTree.prototype.InitDragNDropReorder = function (options) {
    this.log('InitDragNDropReorder');

    let draggedNode = null;
    this.element.querySelectorAll(".title").forEach(node => {
        node.draggable = true;

        node.addEventListener("dragstart", e => {
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

            const response = await ReorderTagsBatch(sender, target);
            if (!response.ok) {
                console.error("ReorderTagsBatch failed", await response.text());
                return;
            }

            // Reorder DOM
            const parentList = draggedNode.closest(".tag-list");
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
        });
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitDragNDropReorder);

// Service methods
function ReorderTagsBatch(sender, target) {
    return fetch("/MicroDoc/ReorderTagsBatch", {
        method: "POST",
        body: new URLSearchParams({
            path: sender.dataset.path,
            tag: sender.dataset.tag,
            targetTag: target.dataset.tag
        })
    });
}
