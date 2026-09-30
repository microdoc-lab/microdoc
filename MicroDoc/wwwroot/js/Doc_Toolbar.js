Doc.prototype.InitToolbar = function (options) {
    this.log('InitToolbar');

    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var docMatrix = this.docMatrix().docMatrix;

    if (toolbar.toolbarInited)
        return;

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

        toolbar.style.left = `${rect.right - overlayRect.left - toolbar.offsetWidth}px`;
        toolbar.style.top = `${rect.top - overlayRect.top}px`;

        // show toolbar
        toolbar.style.visibility = "visible";
        // set toolbar context
        toolbar.dataset.domain = domain;
        toolbar.dataset.id = documentId;

        var mode = docElement.getAttribute("mode");
        if (mode == "view")
            toolbar.querySelector(".view img").src = "/icons/Edit.png";
        else
            toolbar.querySelector(".view img").src = "/icons/View.png";
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

    // save document on close
    toolbar.querySelector(".close").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        // find & check docElement
        var docElement = docMatrix.docElement(domain, documentId);
        if (!docElement)
            return;

        await docElement.doc.SaveDocument(true);
    });

    // toggle view/edit mode
    toolbar.querySelector(".view").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        // find & check docElement
        var docElement = docMatrix.docElement(domain, documentId);
        if (!docElement)
            return;

        await docElement.doc.ToggleMode();
    });

    toolbar.toolbarInited = true;
}

Doc.prototype.behaviors.push(Doc.prototype.InitToolbar);

Doc.prototype.ToggleMode = async function () {
    var docElement = this.element;
    var toolbar = this.toolbar();
    var docViewer = this.docViewer();
    var txtEditor = this.txtEditor();
    var toggleButtonImage = toolbar.querySelector(".view img");

    var mode = docElement.getAttribute("mode");

    if (mode == "view") {
        const headingIndex = docViewer.getSelectedHeadingIndex(docViewer);

        docElement.setAttribute("mode", "edit");

        txtEditor.AdjustHeight(txtEditor);

        txtEditor.SelectAndScroll(headingIndex);

        toggleButtonImage.src = "/icons/View.png";
    }

    if (mode == "edit") {
        const headingIndex = txtEditor.getHeadingIndexAtCursor(txtEditor);

        var documentHtml = await this.SaveDocument(false);

        docElement.setAttribute("mode", "view");

        docViewer.innerHTML = documentHtml;

        docViewer.SelectAndScroll(headingIndex);

        toggleButtonImage.src = "/icons/Edit.png";
    }
}