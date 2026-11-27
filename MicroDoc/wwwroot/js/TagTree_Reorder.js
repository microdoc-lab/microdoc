TagTree.prototype.InitDragNDropReorder = function (options) {
    this.debug('InitDragNDropReorder');

    var expandTimer = null;
    var expandSummary = null;
    // expand tag on dragenter after 800ms
    this.element.querySelectorAll("summary").forEach(summary => {
        summary.addEventListener('dragenter', e => {
            if (!this.draggedNode) return;

            const details = summary.closest('details');

            if (!details || details.classList.contains("empty") || details.open)
                return;

            clearTimeout(expandTimer);

            expandTimer = setTimeout(() => {
                details.open = true;
                expandTimer = null;
                expandSummary = null;
            }, 800);
            expandSummary = summary;
        });

        summary.addEventListener('dragleave', e => {
            if (summary !== expandSummary) return;
            clearTimeout(expandTimer);
            expandTimer = null;
            expandSummary = null;
        });
    });

    this.draggedNode = null;
    this.element.querySelectorAll(".title").forEach(node => {
        node.draggable = true;

        // initialize drag and drop for title
        node.addEventListener("dragstart", e => {
            if (window.dragging) {
                e.preventDefault();
                return;
            }

            this.draggedNode = node;
            e.dataTransfer.effectAllowed = "move";
        });

        // handle dragover event on title to allow dropping tags into it
        node.addEventListener("dragover", e => {
            if (!this.draggedNode) return;

            // Only allow drop within the same parent
            if (this.draggedNode.closest(".tag-list") !== node.closest(".tag-list")) return;

            e.stopPropagation();

            // Prevent moving tag into itself
            if (this.draggedNode === node) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            node.classList.add("drop-target");
        });

        // stop dragover event on title to remove drop-target class
        node.addEventListener("dragleave", e => {
            node.classList.remove('drop-target');
        });

        // handle drop event on title to swap the dragged tag with it
        node.addEventListener("drop", async e => {
            if (!this.draggedNode) return;

            // Only allow drop within the same parent
            if (this.draggedNode.closest(".tag-list") !== node.closest(".tag-list")) return;

            e.stopPropagation();
            e.preventDefault();

            node.classList.remove('drop-target');

            clearTimeout(expandTimer);
            expandTimer = null;

            // Prevent moving tag into itself
            if (this.draggedNode === node) return;

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

    if (draggedIndex >= targetIndex) {      // Insert before target                    
        parentList.insertBefore(sender, target);
    } else if (target.nextElementSibling) { // Insert after target                    
        parentList.insertBefore(sender, target.nextElementSibling);
    } else {                                // Insert last                    
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
