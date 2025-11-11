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