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

        // Reorder buttons handlers
        this.element.querySelectorAll(".reorder-buttons button").forEach(btn => {
            btn.addEventListener("click", async e => {
                const context = e.target.closest(".reorder-buttons");
                const path = context.dataset.path;
                const group = context.dataset.group;
                const tag = context.dataset.tag;
                const direction = e.target.dataset.dir;
                const button = e.target.closest("button");
                const node = button.closest("li"); // current node element
                const parentList = node.parentElement;

                const res = await fetch("/MicroDoc/ReorderTag", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path, group, tag, direction })
                });

                if (res.ok) {
                    if (direction === "up" && node.previousElementSibling) {
                        parentList.insertBefore(node, node.previousElementSibling);
                    } else if (direction === "down" && node.nextElementSibling) {
                        parentList.insertBefore(node.nextElementSibling, node);
                    }                    
                } else {
                    console.error("Reorder failed", await res.text());
                }
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
                const context = draggedItem.querySelector(".reorder-buttons");
                const path = context.dataset.path;
                const group = context.dataset.group;
                const tag = context.dataset.tag;

                const targetContext = targetItem.querySelector(".reorder-buttons");
                const targetTag = targetContext.dataset.tag;
                
                const res = await fetch("/MicroDoc/ReorderTagsBatch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path, group, tag, targetTag })
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