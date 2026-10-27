TagTree.prototype.InitDragNDropReorder = function (options) {
    this.debug('InitDragNDropReorder');

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

            const response = await this.service.SwapTags(sender.dataset.domain, sender.dataset.tagid, sender.dataset.tag, target.dataset.tag);
            if (!response.ok) {
                console.error(Loc.TagTree_SwapTagsFailed, await response.text());
                return;
            }

            // PublishChanges
            var data = await response.json();
            await window.domain.PublishChanges(data.changes);
        });
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitDragNDropReorder);

// HandleSwapTags
TagTree.prototype.HandleSwapTags = async function(change) {
    if (change.op == "SwapTags")
        this.SwapTags(change.parentTag, change.tagName, change.targetTagName);
}

TagTree.prototype.changeHandlers.push(TagTree.prototype.HandleSwapTags);

// Api
TagTree.prototype.SwapTags = function (parentTag, tagName, targetTagName) {
    var sender = this.element.querySelector(`.tag[data-tagid='${parentTag}'][data-tag='${tagName}']`);
    var target = this.element.querySelector(`.tag[data-tagid='${parentTag}'][data-tag='${targetTagName}']`);

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

// Service methods
TagTreeService.prototype.SwapTags = function(domain, parentTag, tagName, targetTagName) {
    return apiFetch("/Home/SwapTags", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            parentTag: parentTag,
            tagName: tagName,
            targetTagName: targetTagName
        })
    });
}
