function TagTree(element, options = {}) {
    if (!element) return;

    this.element = element;
    this.options = options;

    this.InitToggle = function () {
        // Handle toggle for <details>
        const detailsElements = this.element.querySelectorAll(".title");
        detailsElements.forEach(details => {
            details.addEventListener("click", (event) => {
                event.preventDefault(); // prevent default toggle for other clicks
            });
        });
    }

    this.InitSelection = function () {
        // Api
        this.SelectNode = function (tagName) {
            const node = this.element.querySelector(`.tag[data-id="${tagName}"] .title`);
            if (node) node.click();
        };

        this.ClearSelection = function () {
            this.element.querySelectorAll(".tag.selected").forEach(n => n.classList.remove("selected"));
        };

        // Events
        this.OnNodeSelected = this.options.OnNodeSelected || function (tagName) {
            console.log("Selected node: ", tagName);
        };

        // Node click for selection
        const treeNodes = this.element.querySelectorAll(".title");
        treeNodes.forEach(node => {
            node.addEventListener("click", (event) => {
                event.stopPropagation(); // prevent parent triggers
                const clickedNode = node;
                const sender = clickedNode.closest(".tag");

                // Highlight selected node
                this.ClearSelection();
                sender.classList.add("selected");

                // Call user-provided callback
                this.OnNodeSelected(sender.dataset.id);
            });
        });
    }

    this.InitDragNDropReorder = function () {
        let draggedNode = null;
        this.element.querySelectorAll(".title").forEach(node => {
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

    // Run initialization
    this.InitToggle();
    this.InitSelection();
    this.InitDragNDropReorder();

    // Service methods ---------------------------------------------------------------------
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
}