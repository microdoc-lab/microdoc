Doc.prototype.InitReorder = function (options) {
    this.log('InitReorder');

    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var docMatrix = this.docMatrix();

    var docElement = this.element;

    docElement.addEventListener("dragover", e => {
        if (!docMatrix.draggedDoc)
            return;

        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    });

    docElement.addEventListener("drop", e => {
        if (!docMatrix.draggedDoc)
            return;

        e.preventDefault();

        const sender = docMatrix.draggedDoc;
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

    if (toolbar.reorderInited)
        return;

    var grip = toolbar.querySelector(".grip");
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

        docMatrix.draggedDoc = docElement;
    });

    grip.addEventListener("dragend", () => {
        docMatrix.draggedDoc = null;
    });

    toolbar.reorderInited = true;
}

Doc.prototype.behaviors.push(Doc.prototype.InitReorder);