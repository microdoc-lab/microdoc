Explorer.prototype.InitSoftHover = function (options) {
    this.debug('InitSoftHover');

    enableSoftHover("tree",
        `#${this.id} .tree-panel .tag-tree .domain.title`, `#${this.id} .tree-panel .tag-tree`, 700, 500);

    enableSoftHover("grid",
        `#${this.id} .docmatrix .grid tr:nth-child(1)`, `#${this.id} .docmatrix .grid`, 700, 500);

    enableSoftHover("grid td",
        `#${this.id} .docmatrix .grid td`, null, 300, 600);

    enableSoftHover("grid td doc",
        `#${this.id} .docmatrix .grid td:not(.misc) doc section`, null, 600, 100);

    enableSoftHover("imgw",
        `#${this.id} .docmatrix .grid td:not(.misc) doc gallery imgw, ` +
        `#${this.id} .overlay .doc gallery imgw.selected, ` +
        `#${this.id} .modal doc gallery imgw.selected`, null, 700, 500);
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitSoftHover);

Explorer.prototype.TryCloseSoftHover = function (event) {
    const docMatrix = this.docMatrix();

    // skip if modal window opened
    if (docMatrix.isModalOpened()) {
        // try close Image preview
        const imageWrapper = docMatrix.modal().querySelector("gallery imgw.selected.hover");
        if (imageWrapper) {
            // notify SoftHover to collapse image preview
            pointeroutRaise(imageWrapper);

            event.stopImmediatePropagation();
            return true;
        }

        return true;
    }

    // try close Grid
    const grid = this.element.querySelector(".grid.hover");
    if (grid) {
        // notify SoftHover to collapse grid preview
        pointeroutRaise(grid);
        return true;
    }

    // try close Tree
    const tree = this.element.querySelector(".tag-tree.hover");
    if (tree) {
        // notify SoftHover to collapse tree preview
        pointeroutRaise(tree);

        return true;
    }

    var docElement = this.GetSelectedDocumentViewer();
    if (docElement != null) {
        // try close Image preview
        const imageWrapper = docElement.querySelector("gallery imgw.selected.hover");
        if (imageWrapper) {
            // notify SoftHover to collapse image preview
            pointeroutRaise(imageWrapper);

            event.stopImmediatePropagation();
            return true;
        }
    }

    return false;
}

Explorer.prototype.GetSelectedDocumentViewer = function () {
    // current document viewer can be determined by having selection in it
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed)
        return null;

    // locate and check viewer
    const viewer = selection.anchorNode.closest(".viewer");
    if (!viewer)
        return null;

    // locate and check doc
    const docElement = viewer.closest(".doc");
    if (!docElement)
        return null;

    return docElement;
}