DocMatrix.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var grid = this.element.querySelector(".grid");
    var overlay = this.element.querySelector(".overlay");
    var toolbar = this.element.querySelector(".toolbar");

    // open document in overlay by click
    grid.addEventListener("click", event => {
        // don't open document if user select some text in the cell
        const selection = window.getSelection();

        if (selection && !selection.isCollapsed)
            return;

        // check the cell
        const cell = event.target.closest("td");

        if (!cell || !grid.contains(cell))
            return;

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
        docElement.dataset.id = documentId;

        txtEditor = document.createElement("textarea");
        txtEditor.className = "editor";
        txtEditor.textContent = documentContent;
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
    toolbar.querySelector(".close").addEventListener("click", event => {
        var documentId = toolbar.dataset.id;

        var docElement = overlay.querySelector(`.doc[data-id="${documentId}"]`);

        overlay.removeChild(docElement);

        // hide toolbar
        toolbar.style.visibility = "hidden";

        // reset toolbar context
        toolbar.dataset.id = null;
    });

    // show toolbar on mouseover
    overlay.addEventListener("mouseover", event => {
        const docElement = event.target.closest(".doc");

        if (!docElement || !overlay.contains(docElement))
            return;

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