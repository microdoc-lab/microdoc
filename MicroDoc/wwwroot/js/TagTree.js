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
        const detailsElements = this.element.querySelectorAll("details");
        detailsElements.forEach(details => {
            const summary = details.querySelector("summary");

            summary.addEventListener("click", (event) => {
                // Check relative X position
                const rect = summary.getBoundingClientRect();
                const relativeX = event.clientX - rect.left;

                if (relativeX < 14) {
                    // allow toggle
                    details.open = !details.open;
                }

                event.preventDefault(); // prevent default toggle for other clicks
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