DocMatrix.prototype.InitPreview = function (options) {
    this.debug('InitPreview');

    var grid = this.grid();

    // capture mousedown coordinates to distinguish mouse selection from click
    let mouseDownX = 0;
    let mouseDownY = 0;

    grid.addEventListener("mousedown", event => {
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    });

    // open document by click in grid
    grid.addEventListener("click", async event => {
        const dx = event.clientX - mouseDownX;
        const dy = event.clientY - mouseDownY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // treat as selection/drag, not a click
        if (distance > 5)
            return;

        if (await this.HandleDocumentClick(event))
            return;

        // don't open document if user select some text in the cell
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed)
            return;

        // check click was on doc
        var docInCell = event.target.closest("doc");

        // if clicked not on doc - check table cell
        if (!docInCell) {
            // find & check cell
            const docCell = event.target.closest("td");
            if (!docCell || !grid.contains(docCell))
                return;

            // obtain first doc in cell
            if (!docCell.classList.contains("misc"))
                docInCell = docCell.querySelector("doc");
            else {
                if (!isInRole("w", this.domain))
                    return;

                // click was made on MISC cell - create MISC document with custom name
                var docName = prompt(Loc.DocMatrix_NewPrompt);

                if (docName == null)
                    return;

                if (!docName.trim())
                    return;

                if (!DocParser.IsValidDocName(docName)) {
                    alert(Loc.DocMatrix_InvalidDocumentName);
                    return;
                }

                docInCell = docCell.querySelector(`doc[data-document="${docName}"]`);
                if (!docInCell) {
                    var domain = this.domain;
                    var documentId = DocParser.DocId(docCell.closest("tr").dataset.tag, docName + ".txt");

                    var docPath = DocParser.DocPath(documentId);

                    // Save NEW empty document
                    const response = await this.service.SaveDocument(domain, documentId, "");
                    if (!response.ok) {
                        this.error(format(Loc.Document_SaveFailed, docPath), await response.text());
                        return;
                    }

                    // PublishChanges
                    var data = await response.json();
                    await window.domain.PublishChanges(data.changes);

                    docInCell = docCell.querySelector(`doc[data-document="${docName}"]`);
                }
            }
        }

        if (!docInCell)
            return;

        // obtain document context
        var domain = docInCell.dataset.domain;
        var documentId = docInCell.dataset.id;
        var documentContent = docInCell.dataset.content;
        var documentHtml = docInCell.innerHTML;

        // find clicked heading index
        var headingIndex = -1;
        const section = event.target.closest("section");
        if (section) {
            // obtain section heading
            var heading = section.querySelector("h1, h2, h3");

            // detect clicked heading index
            const headings = docInCell.querySelectorAll("h1, h2, h3");
            headingIndex = [...headings].indexOf(heading);
        }

        // open document in overlay
        this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, (event.ctrlKey || !documentContent) && isInRole("w", domain, documentId) ? "edit" : "view");
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitPreview);

// Api
DocMatrix.prototype.OpenDocument = function (domain, documentId, documentContent, documentHtml, headingIndex, mode) {
    this.log(`OpenDocument domain: ${domain}, documentId: ${documentId}, headingIndex: ${headingIndex}, mode: ${mode}`);
    var explorer = this.explorer();
    var overlay = this.overlay();

    // if document already opened - just focus it
    var docElement = this.docElement(domain, documentId);
    if (docElement) {
        // select and scroll viewer/editor depending on current mode
        var currentMode = docElement.getAttribute("mode");
        if (currentMode == "view")
            docElement.doc.docViewer().SelectAndScroll(headingIndex);

        if (currentMode == "edit")
            docElement.doc.txtEditor().SelectAndScroll(headingIndex);

        // switch view to edit
        if (currentMode == "view" && mode == "edit")
            docElement.doc.ToggleMode();
        return false;
    }

    // clone doc element from template
    var template = document.getElementById(explorer.templateDocId);
    docElement = template.cloneNode(true);

    // bind doc properties
    docElement.setAttribute("mode", mode);
    docElement.dataset.domain = domain;
    docElement.dataset.id = documentId;
    docElement.dataset.tagpath = DocParser.DocTagPath(documentId);
    docElement.dataset.document = DocParser.DocName(documentId);
    docElement.dataset.content = documentContent;

    docElement.querySelector(".label").textContent = DocParser.DocPath(documentId);
    docElement.querySelector(".viewer").innerHTML = documentHtml;
    docElement.querySelector(".editor").value = documentContent;

    // remove hover style
    docElement.querySelector(".viewer").querySelectorAll(".hover").forEach(el => el.classList.remove("hover"));

    // setup client component
    var options = {};
    const doc = new Doc(docElement, options);
    doc.domain = domain;
    doc.documentId = documentId;

    // add component to DOM
    overlay.appendChild(docElement);

    // init component behaviors
    doc.InitBehaviors();

    // select and scroll viewer/editor depending on specified mode
    if (mode == "view") {
        var docViewer = docElement.doc.docViewer();
        docViewer.SelectAndScroll(headingIndex);
        AdjustImageGalleryPositionAndVisibility(docViewer);
    }

    if (mode == "edit") {
        var  txtEditor = docElement.doc.txtEditor();
        txtEditor.SelectAndScroll(headingIndex);
    }
}

DocMatrix.prototype.LoadAndOpenDocument = async function (domain, documentId, headingIndex, silentError) {
    this.log(`LoadAndOpenDocument domain: ${domain}, documentId: ${documentId}, headingIndex: ${headingIndex}, silentError: ${silentError}`);

    var docPath = DocParser.DocPath(documentId);

    // load document content
    const response = await this.service.LoadDocument(domain, documentId);
    if (!response.ok) {
        if (silentError)
            return false;

        this.error(format(Loc.Document_LoadFailed, docPath), await response.text());
        return false;
    }

    const doc = await response.json();

    documentId = doc.id;
    const documentContent = doc.content;
    const documentHtml = doc.html;

    // open document in overlay
    this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, !documentContent && isInRole("w", domain, documentId) ? "edit" : "view");
    return true;
}