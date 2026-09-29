DocMatrix.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var docMatrix = this;
    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var grid = this.grid();

    // open document in overlay by click
    grid.addEventListener("click", event => {
        // don't open document if user select some text in the cell
        const selection = window.getSelection();

        if (selection && !selection.isCollapsed)
            return;

        // find & check the cell
        const docCell = event.target.closest("td");
        if (!docCell || !grid.contains(docCell))
            return;

        var domain = docCell.dataset.domain;
        var documentId = docCell.dataset.id;
        var documentContent = docCell.dataset.content;

        this.OpenDocument(domain, documentId, documentContent);
    });

    // save document on close
    toolbar.querySelector(".close").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        await this.SaveDocument(domain, documentId);
    });

    //#region Reorder docs with Drag-n-Drop
    let draggedDoc = null;

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

        draggedDoc = docElement;
    });

    grip.addEventListener("dragend", () => {
        draggedDoc = null;
    });

    this.initDragDrop = function(docElement) {
        docElement.addEventListener("dragover", e => {
            if (!draggedDoc)
                return;

            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        docElement.addEventListener("drop", e => {
            if (!draggedDoc)
                return;

            e.preventDefault();

            const sender = draggedDoc;
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
    }

    //#endregion

    //#region Show/hide toolbar

    // show toolbar on mouseover
    overlay.addEventListener("mouseover", event => {
        // find & check docElement
        const docElement = event.target.closest(".doc");
        if (!docElement || !overlay.contains(docElement))
            return;

        // obtain document context
        var domain = docElement.dataset.domain;
        var documentId = docElement.dataset.id;

        // position toolbar at the top-right corner of docElement
        const rect = docElement.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();

        toolbar.style.left = `${rect.right - overlayRect.left - toolbar.offsetWidth - 5}px`;
        toolbar.style.top = `${rect.top - overlayRect.top + toolbar.offsetHeight - 12}px`;

        // show toolbar
        toolbar.style.visibility = "visible";
        // set toolbar context
        toolbar.dataset.domain = domain;
        toolbar.dataset.id = documentId;
    });

    // hide toolbar on mouseout
    overlay.addEventListener("mouseout", event => {
        // find & check docElement
        const docElement = event.target.closest(".doc");
        if (!docElement)
            return;

        // Don't hide when moving between elements inside the same item.
        if (docElement.contains(event.relatedTarget))
            return;

        // Don't hide when moving over toolbar itself.
        if (toolbar.contains(event.relatedTarget))
            return;

        // hide toolbar
        toolbar.style.visibility = "hidden";
        // reset toolbar context
        toolbar.dataset.id = null;
    });

    //#endregion
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitEditor);

// Api
DocMatrix.prototype.OpenDocument = function(domain, documentId, documentContent) {
    var overlay = this.overlay();

    // if document already opened - just focus it
    var txtEditor = this.txtEditor(domain, documentId);
    if (txtEditor) {
        txtEditor.focus();
        return false;
    }

    // open new document
    var docElement = document.createElement("div");
    docElement.className = "doc";
    docElement.dataset.domain = domain;
    docElement.dataset.id = documentId;

    txtEditor = document.createElement("textarea");
    txtEditor.className = "editor";
    txtEditor.value = documentContent;
    docElement.appendChild(txtEditor);

    overlay.appendChild(docElement);

    // additional initialization (drag-n-drop)
    this.initDragDrop(docElement);

    // adjust textEditor height
    function textAreaAdjust(o) {
        o.style.height = "1px";
        o.style.height = (o.scrollHeight) + "px";
    }

    txtEditor.addEventListener("input", () => { textAreaAdjust(txtEditor); });
    textAreaAdjust(txtEditor);

    // focus textEditor
    txtEditor.focus();
    return true;
}

DocMatrix.prototype.SaveDocument = async function (domain, documentId) {
    var overlay = this.overlay();
    var toolbar = this.toolbar();

    // find & check docElement
    var docElement = this.docElement(domain, documentId);
    if (!docElement)
        return;

    // find & check txtEditor
    var txtEditor = docElement.querySelector(".editor");
    if (!txtEditor)
        return;

    var content = txtEditor.value;

    // save document
    const response = await this.service.SaveDocument(domain, documentId, content);
    if (!response.ok) {
        console.error("SaveDocument request failed", await response.text());
        return;
    }

    // remove docElement
    overlay.removeChild(docElement);
    // hide toolbar
    toolbar.style.visibility = "hidden";
    // reset toolbar context
    toolbar.dataset.domain = null;
    toolbar.dataset.id = null;

    // update cell in grid
    var formattedContent = await response.text();

    // find & check cell
    var docCell = this.docCell(domain, documentId);
    if (!docCell)
        return;

    docCell.dataset.content = content;
    docCell.innerHTML = formattedContent;
}

// Service methods
DocMatrixService.prototype.SaveDocument = function (domain, documentId, content) {
    return fetch("/Home/SaveDocument", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            documentId: documentId,
            content: content
        })
    });
}