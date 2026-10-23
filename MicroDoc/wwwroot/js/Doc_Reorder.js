Doc.prototype.InitReorder = function (options) {
    this.debug('InitReorder');

    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var docMatrix = this.docMatrix();

    var docElement = this.element;

    docElement.addEventListener("dragover", e => {
        if (!overlay.draggedDoc)
            return;

        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    });

    docElement.addEventListener("drop", e => {
        if (!overlay.draggedDoc)
            return;

        e.preventDefault();

        const sender = overlay.draggedDoc;
        const target = docElement;

        // Reorder DOM
        const parentList = overlay;
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

    var grip = this.element.querySelector(".label");
    grip.draggable = true;

    grip.addEventListener("dragstart", e => {
        if (window.dragging) {
            e.preventDefault();
            return;
        }

        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        var docElement = docMatrix.docElement(domain, documentId);
        if (!docElement) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", documentId);
        e.dataTransfer.setData("application/x-drag-type", "Doc");

        overlay.draggedDoc = docElement;
    });

    grip.addEventListener("dragend", () => {
        overlay.draggedDoc = null;
    });
}

Doc.prototype.behaviors.push(Doc.prototype.InitReorder);