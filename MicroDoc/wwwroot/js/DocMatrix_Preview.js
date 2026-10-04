DocMatrix.prototype.InitPreview = function (options) {
    this.log('InitPreview');

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

        // obtain document context
        var domain = docCell.dataset.domain;
        var documentId = docCell.dataset.id;
        var tagpath = docCell.dataset.tagpath;
        var documentContent = docCell.dataset.content;
        var documentHtml = docCell.querySelector("doc").innerHTML;

        // find clicked heading index
        var headingIndex = -1;
        const section = event.target.closest("section");
        if (section) {
            // obtain section heading
            var heading = section.querySelector("h1, h2, h3");

            // detect clicked heading index
            const headings = docCell.querySelector("doc").querySelectorAll("h1, h2, h3");
            headingIndex = [...headings].indexOf(heading);
        }

        this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, event.ctrlKey ? "edit" : "view");
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

    // determine doc color
    var docColor = this.DocColor(documentId);
    if (docColor)
        docElement.style.setProperty("--doc-color", docColor);

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

    if (mode == "view")
        docElement.doc.docViewer().SelectAndScroll(headingIndex);

    if (mode == "edit")
        docElement.doc.txtEditor().SelectAndScroll(headingIndex);
}

DocMatrix.prototype.DocPath = function(domain, documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    var tagPath = tags.map(t => `[${t}]`).join(' ');
    return (tagPath ? tagPath : domain) + " " + docName;
}

DocMatrix.prototype.DocColor = function (documentId) {
    var tags = documentId.split('/');
    var docName = tags.pop();
    var docNameNoExt = docName.replace(/\.[^.]*$/, "");
    return this.options.DocumentColors[docNameNoExt];
}