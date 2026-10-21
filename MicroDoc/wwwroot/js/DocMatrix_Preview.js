DocMatrix.prototype.InitPreview = function (options) {
    this.log('InitPreview');

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

        if (await this.HandleClick(event, false))
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
                var docName = prompt("Enter document name (without extension)");
                if (!docName.trim())
                    return;

                if (!DocParser.IsValidDocName(docName)) {
                    alert("Invalid document name. Only symbols, digits, underscore, hyphen, space allowed");
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
        this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, (event.ctrlKey || !documentContent) && isInRole("w", domain, documentId) ? "edit" : "view");
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitPreview);

// Api
DocMatrix.prototype.HandleClick = async function (event, select) {
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
            return true;
        }

        const doc = await response.json();

        documentId = doc.id;
        const documentContent = doc.content;
        const documentHtml = doc.html;
        const headingIndex = -1;

        // open document in overlay
        this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, (event.ctrlKey || !documentContent) && isInRole("w", domain, documentId) ? "edit" : "view");

        return true;
    }

    if (select) {
        // find possible clicked image
        const imageWrapper = event.target.closest("imgw");
        if (imageWrapper) {
            SelectElement(imageWrapper.querySelector("div"));
            return false;
        }

        // find & check the section
        const section = event.target.closest("section");
        if (!section)
            return false;

        // obtain section heading
        var heading = section.querySelector("h1, h2, h3");
        if (heading)
            SelectElement(heading);

        return true;
    }

    return false;
}

DocMatrix.prototype.HandleCopy = function (event, docElement) {
    // obtain document context
    var documentId = docElement.dataset.id;

    // selection should exist
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.anchorNode != selection.focusNode)
        return;

    // copy heading commit: [tag] [tag] heading
    var heading = selection.anchorNode.closest("h1,h2,h3");
    if (heading) {
        var docPath = DocParser.DocTagPath(documentId);
        event.preventDefault();
        event.clipboardData.setData("text/plain", docPath + " " + heading.innerText);
        return;
    }

    // copy image link: [tag] [tag] document+image.png
    var imageContainer = selection.anchorNode.closest("imgw");
    if (imageContainer) {
        var imagePath = imageContainer.dataset.imagepath;
        event.preventDefault();
        event.clipboardData.setData("text/plain", imagePath);
        return;
    }
}

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
    docElement.dataset.tagpath = DocParser.DocPath(documentId);
    docElement.dataset.document = DocParser.DocName(documentId);
    docElement.dataset.content = documentContent;

    docElement.querySelector(".label").textContent = DocParser.DocPath(documentId);
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