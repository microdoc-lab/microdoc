DocMatrix.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var explorer = this.element.closest(".explorer");
    var overlay = explorer.querySelector(".overlay");
    var toolbar = overlay.querySelector(".toolbar");

    var grid = this.element.querySelector(".grid");

    // open document in overlay by click
    grid.addEventListener("click", event => {
        // don't open document if user select some text in the cell
        const selection = window.getSelection();

        if (selection && !selection.isCollapsed)
            return;

        // find & check the cell
        const cell = event.target.closest("td");
        if (!cell || !grid.contains(cell))
            return;

        var domain = cell.dataset.domain;
        var documentId = cell.dataset.id;
        var documentContent = cell.dataset.content;

        // if document already opened - just focus it
        var txtEditor = overlay.querySelector(`.doc[data-id="${documentId}"] .editor`);

        if (txtEditor) {
            txtEditor.focus();
            return;
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

        function textAreaAdjust(o) {
            o.style.height = "1px";
            o.style.height = (o.scrollHeight) + "px";
        }

        txtEditor.addEventListener("input", () => { textAreaAdjust(txtEditor); });
        textAreaAdjust(txtEditor);

        txtEditor.focus();
    });

    /* Toolbar */

    // init toolbar handlers
    toolbar.querySelector(".close").addEventListener("click", async event => {
        // obtain document context
        var documentId = toolbar.dataset.id;

        // find & check docElement
        var docElement = overlay.querySelector(`.doc[data-id="${documentId}"]`);
        if (!docElement)
            return;

        // find & check txtEditor
        var txtEditor = docElement.querySelector(".editor");
        if (!txtEditor)
            return;

        // obtain document context
        var domain = docElement.dataset.domain;
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
        toolbar.dataset.id = null;

        // update cell in grid
        var formattedContent = await response.text();

        // find & check cell
        var grid = explorer.querySelector(".docmatrix .grid");
        var cell = grid.querySelector(`td[data-id="${documentId}"]`);
        if (!cell)
            return;

        cell.dataset.content = content;
        cell.innerHTML = formattedContent;
    });

    // show toolbar on mouseover
    overlay.addEventListener("mouseover", event => {
        // find & check docElement
        const docElement = event.target.closest(".doc");
        if (!docElement || !overlay.contains(docElement))
            return;

        // obtain document context
        var documentId = docElement.dataset.id;

        // position toolbar at the top-right corner of docElement
        const rect = docElement.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();

        toolbar.style.left = `${rect.right - overlayRect.left - toolbar.offsetWidth - 5}px`;
        toolbar.style.top = `${rect.top - overlayRect.top + toolbar.offsetHeight - 12}px`;

        // show toolbar
        toolbar.style.visibility = "visible";
        // set toolbar context
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
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitEditor);

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