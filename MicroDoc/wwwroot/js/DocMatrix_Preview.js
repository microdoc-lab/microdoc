DocMatrix.prototype.InitPreview = function (options) {
    this.log('InitPreview');

    var grid = this.grid();

    // open document by click in grid
    grid.addEventListener("click", async event => {

        // open embeded link
        const link = event.target.closest("a");
        // link should be document-related
        if (link && link.dataset.document) {
            event.preventDefault();

            // obtain document properties
            const domain = this.domain;
            var documentId = link.getAttribute("href");

            const docPath = link.textContent;

            // load document content
            const response = await this.service.LoadDocument(domain, documentId);
            if (!response.ok) {
                this.error(`Load document ${docPath} failed`, await response.text());
                return;
            }

            const doc = await response.json();

            documentId = doc.id;
            const documentContent = doc.content;
            const documentHtml = doc.html;
            const headingIndex = -1;

            // open document in overlay
            this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, (event.ctrlKey || !documentContent) && isInRole(domain, "w") ? "edit" : "view");

            return;
        }


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
                if (!isInRole(this.domain, "w"))
                    return;

                // click was made on MISC cell - create MISC document with custom name
                var docName = prompt("Enter document name (without extension)");
                if (!docName.trim())
                    return;

                if (!this.IsValidFileName(docName)) {
                    alert("Invalid file name. Only symbols, digits, underscore, hyphen, space allowed");
                    return;
                }

                docInCell = docCell.querySelector(`doc[data-document="${docName}"]`);
                if (!docInCell) {
                    var domain = this.domain;
                    var documentId = this.DocId(docCell.closest("tr").dataset.tag, docName + ".txt");

                    var docPath = this.DocPath(domain, documentId);

                    // Save NEW empty document
                    const response = await this.service.SaveDocument(domain, documentId, "");
                    if (!response.ok) {
                        this.error(`Save document ${docPath} failed`, await response.text());
                        return;
                    }

                    // PublishChanges
                    var data = await response.json();
                    window.domain.PublishChanges(data.changes);

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
        this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, (event.ctrlKey || !documentContent) && isInRole(domain, "w") ? "edit" : "view");
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitPreview);

// Api
DocMatrix.prototype.OpenDocument = function (domain, documentId, documentContent, documentHtml, headingIndex, mode) {
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

        return false;
    }

    // clone doc element from template
    var template = document.getElementById(explorer.templateDocId);
    docElement = template.cloneNode(true);

    // bind doc properties
    docElement.setAttribute("mode", mode);
    docElement.dataset.domain = domain;
    docElement.dataset.id = documentId;
    docElement.dataset.tagpath = this.DocPath(domain, documentId);
    docElement.dataset.document = this.DocName(documentId);
    docElement.dataset.content = documentContent;

    docElement.querySelector(".label").textContent = this.DocPath(domain, documentId);
    docElement.querySelector(".viewer").innerHTML = documentHtml;
    docElement.querySelector(".editor").value = documentContent;

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
    if (mode == "view")
        docElement.doc.docViewer().SelectAndScroll(headingIndex);

    if (mode == "edit")
        docElement.doc.txtEditor().SelectAndScroll(headingIndex);
}