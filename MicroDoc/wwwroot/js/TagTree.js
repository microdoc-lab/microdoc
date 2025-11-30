function TagTree(element, options = {}) {
    if (!element) return;

    this.element = element;

    // User can provide their own handler
    this.onNodeSelected = options.onNodeSelected || function (tagName) {
        console.log("Selected node:", tagName);
    };

    // Initialization function
    this.init = function () {
        const treeNodes = this.element.querySelectorAll(".tree-node");

        // Node click for selection
        treeNodes.forEach(node => {
            node.addEventListener("click", (event) => {
                event.stopPropagation(); // prevent parent triggers

                // Highlight selected node
                this.clearSelection();
                node.classList.add("selected");

                // Call user-provided callback
                this.onNodeSelected(node.dataset.tag);
            });
        });

        // Handle toggle for <details>
        const detailsElements = this.element.querySelectorAll("details summary .tree-node");
        detailsElements.forEach(details => {
            details.addEventListener("click", (event) => {
                event.preventDefault(); // prevent default toggle for other clicks
            });
        });

        // DragNDrop to Reorder
        let draggedNode = null;
        this.element.querySelectorAll(".tree-node").forEach(node => {
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
                const parentList = draggedNode.closest("ul");

                // Only allow drop within the same parent
                if (!draggedNode || parentList !== targetNode.closest("ul") || draggedNode === targetNode) return;

                const draggedItem = draggedNode.closest("li");
                const targetItem = targetNode.closest("li");
                const context = draggedItem.querySelector(".toolbar");
                const path = context.dataset.path;
                const tag = context.dataset.tag;

                const targetContext = targetItem.querySelector(".toolbar");
                const targetTag = targetContext.dataset.tag;
                
                const res = await fetch("/MicroDoc/ReorderTagsBatch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path, tag, targetTag })
                });

                if (res.ok) {
                    // Reorder DOM
                    const nodes = Array.from(parentList.children);
                    const draggedIndex = nodes.indexOf(draggedItem);
                    const targetIndex = nodes.indexOf(targetItem);

                    if (draggedIndex === -1 || targetIndex === -1) return;

                    if (draggedIndex < targetIndex) {
                        // Insert after target
                        if (targetItem.nextSibling) {
                            parentList.insertBefore(draggedItem, targetItem.nextSibling);
                        } else {
                            parentList.appendChild(draggedItem); // target is last element
                        }
                    } else {
                        // Insert before target
                        parentList.insertBefore(draggedItem, targetItem);
                    }
                } else {
                    console.error("Reorder failed", await res.text());
                }
            });
        });
    };

    this.selectNode = function (tagName) {
        const node = this.element.querySelector(`.tree-node[data-tag="${tagName}"]`);
        if (node) node.click();
    };

    this.clearSelection = function () {
        this.element.querySelectorAll(".tree-node.selected").forEach(n => n.classList.remove("selected"));
    };

    // Run initialization immediately
    this.init();
}