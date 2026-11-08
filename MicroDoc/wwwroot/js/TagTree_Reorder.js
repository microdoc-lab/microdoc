TagTree.prototype.InitDragNDropReorder = function (options) {
    this.debug('InitDragNDropReorder');

    this.draggedNode = null;
    this.element.querySelectorAll(".title").forEach(node => {
        node.draggable = true;

        node.addEventListener("dragstart", e => {
            if (window.dragging) {
                e.preventDefault();
                return;
            }

            this.draggedNode = node;
            e.dataTransfer.effectAllowed = "move";
        });

        node.addEventListener("dragover", e => {
            e.stopPropagation();

            if (!this.draggedNode) return;

            // Prevent moving tag into itself
            if (this.draggedNode === node) return;

            // Only allow drop within the same parent
            if (this.draggedNode.closest(".tag-list") !== node.closest(".tag-list")) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        node.addEventListener("drop", async e => {
            e.stopPropagation();
            e.preventDefault();

            if (!this.draggedNode) return;

            // Prevent moving tag into itself
            if (this.draggedNode === node) return;

            // Only allow drop within the same parent
            if (this.draggedNode.closest(".tag-list") !== node.closest(".tag-list")) return;

            const sender = this.draggedNode.closest(".tag");
            const target = node.closest(".tag");

            // Extract tag context
            const domain = sender.dataset.domain;
            const parentTag = sender.dataset.tagid;
            const tagName = sender.dataset.tag;
            const targetTagName = target.dataset.tag;

            this.log(`SwapTags parentTag: ${parentTag}, tagName: ${tagName}, targetTagName: ${targetTagName}`);

            // Reorder Tags
            const response = await this.service.SwapTags(domain, parentTag, tagName, targetTagName);
            if (!response.ok) {
                console.error(Loc.TagTree_SwapTagsFailed, await response.text());
                return;
            }

            // PublishChanges
            var data = await response.json();
            await window.domain.PublishChanges(data.changes);
        });

        node.addEventListener("dragend", () => {
            this.draggedNode = null;
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
