Doc.prototype.InitToolbar = function (options) {
    this.debug('InitToolbar');

    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var docMatrix = this.docMatrix();

    // copy document path to clipboard
    this.element.querySelector(".label").addEventListener("click", async event => {
        var documentId = this.element.dataset.id;
        var docPath = DocParser.DocPath(documentId);
        await navigator.clipboard.writeText(docPath);
    });

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

        // show toolbar
        toolbar.style.visibility = "visible";
        // set toolbar context
        toolbar.dataset.domain = domain;
        toolbar.dataset.id = documentId;
        toolbar.dataset.document = DocParser.DocName(documentId);

        var mode = docElement.getAttribute("mode");
        if (mode == "view")
            toolbar.querySelector(".view img").src = "/icons/Edit.png";
        else
            toolbar.querySelector(".view img").src = "/icons/View.png";

        docElement.doc.PositionToolbar();
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
        toolbar.dataset.document = null;
    });

    // open print document dialog
    toolbar.querySelector(".print").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        // find & check docElement
        var docElement = docMatrix.docElement(domain, documentId);
        if (!docElement)
            return;

        // activate document
        if (!docElement.doc.IsDocumentSelected())
            await this.explorer().ActivateDocumentOrLoadAndOpen(documentId);

        var txtEditor = docElement.doc.txtEditor();

        var mode = docElement.getAttribute("mode")
        if (mode == "edit" && isInRole("w", domain, documentId) && txtEditor.value != docElement.dataset.content)
            await docElement.doc.SaveDocument();

        await docMatrix.OpenPrintDocument(docElement);
    });

    // open print document dialog
    toolbar.querySelector(".print-image").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        // find & check docElement
        var docElement = docMatrix.docElement(domain, documentId);
        if (!docElement)
            return;

        // activate document
        if (!docElement.doc.IsDocumentSelected())
            await this.explorer().ActivateDocumentOrLoadAndOpen(documentId);

        var span = docElement.querySelector("gallery imgw.selected span");
        if (!span)
            return;

        var docGallery = CreateSingleImageGallery(span);
        var clone = TransformGalleriesToImagePages(docGallery);

        const imageName = span.textContent;

        this.log(`PrintImage domain: ${domain}, documentId: ${documentId}, imageName: ${imageName}`);
        PrintElement(clone, imageName, event.altKey);
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

        // activate document
        if (!docElement.doc.IsDocumentSelected())
            await this.explorer().ActivateDocumentOrLoadAndOpen(documentId);

        await docElement.doc.ToggleMode();
    });

    // save document on close
    toolbar.querySelector(".delete").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        var docPath = DocParser.DocPath(documentId);

        // find & check docElement
        var docElement = docMatrix.docElement(domain, documentId);
        if (!docElement)
            return;

        // activate document
        if (!docElement.doc.IsDocumentSelected())
            await this.explorer().ActivateDocumentOrLoadAndOpen(documentId);

        if (!confirm(format(Loc.Document_DeletePrompt, docPath)))
            return;

        await docElement.doc.DeleteDocument();
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

        // activate document
        if (!docElement.doc.IsDocumentSelected())
            await this.explorer().ActivateDocumentOrLoadAndOpen(documentId);

        var txtEditor = docElement.doc.txtEditor();

        var mode = docElement.getAttribute("mode")
        if (mode == "edit" && isInRole("w", domain, documentId) && txtEditor.value != docElement.dataset.content)
            await docElement.doc.SaveDocument();

        docElement.doc.CloseDocument();
    });

    toolbar.toolbarInited = true;
}

Doc.prototype.behaviors.push(Doc.prototype.InitToolbar);

Doc.prototype.PositionToolbar = function () {
    var docElement = this.element;
    var overlay = this.overlay();
    var toolbar = this.toolbar();

    // position toolbar at the top-right corner of docElement
    const rect = docElement.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    toolbar.style.left = `${rect.left - overlayRect.left}px`;
    toolbar.style.top = `${rect.top - overlayRect.top}px`;
    toolbar.style.width = `${rect.width - 18}px`;
}

Doc.prototype.ToggleMode = async function () {
    var docElement = this.element;

    if (!isInRole("w", this.domain, docElement.dataset.id))
        return;

    var toolbar = this.toolbar();
    var docViewer = this.docViewer();
    var txtEditor = this.txtEditor();
    var toggleButtonImage = toolbar.querySelector(".view img");

    var mode = docElement.getAttribute("mode");

    const domain = this.element.dataset.domain;
    const documentId = this.element.dataset.id;
    this.log(`ToggleMode domain: ${domain}, documentId: ${documentId}, mode: ${mode}`);

    if (mode == "view") {
        const headingIndex = GetSelectedHeadingIndex(docViewer);

        docElement.setAttribute("mode", "edit");

        toggleButtonImage.src = "/icons/View.png";

        txtEditor.AdjustHeight(txtEditor);

        txtEditor.SelectAndScroll(headingIndex);
    }

    if (mode == "edit") {
        const headingIndex = GetHeadingIndexAtCursor(txtEditor);

        docElement.setAttribute("mode", "view");
        toggleButtonImage.src = "/icons/Edit.png";

        if (isInRole("w", this.domain, docElement.dataset.id) && txtEditor.value != docElement.dataset.content)
            await this.SaveDocument();

        docViewer.SelectAndScroll(headingIndex);

        AdjustImageGalleryPositionAndVisibility(docViewer);
        docElement.doc.TurnCodeBlocksContentEditable();
    }

    docElement.doc.PositionToolbar();
}