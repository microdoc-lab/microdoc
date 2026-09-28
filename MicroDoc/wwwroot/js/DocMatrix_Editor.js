DocMatrix.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var grid = this.element.querySelector(".grid");
    var overlay = this.element.querySelector(".overlay");
    var toolbar = this.element.querySelector(".toolbar");

    // open document in overlay by click
    grid.addEventListener("click", event => {
        const cell = event.target.closest("td");

        if (!cell || !grid.contains(cell))
            return;

        var editor = overlay.querySelector(`.doc[data-id="${cell.dataset.id}"] .editor`);

        if (editor) {
            editor.focus();
            return;
        }

        var doc = document.createElement("div");
        doc.className = "doc";
        doc.dataset.id = cell.dataset.id;

        var editor = document.createElement("textarea");
        editor.className = "editor";
        editor.textContent = cell.dataset.content;
        doc.appendChild(editor);

        overlay.appendChild(doc);

        function textAreaAdjust(o) {
            o.style.height = "1px";
            o.style.height = (o.scrollHeight) + "px";
        }

        editor.addEventListener("input", () => { textAreaAdjust(editor); });
        textAreaAdjust(editor)

        editor.focus();
    });

    /* Toolbar */

    // init toolbar handlers
    toolbar.querySelector(".close").addEventListener("click", event => {
        var doc = overlay.querySelector(`.doc[data-id="${toolbar.dataset.id}"]`);
        overlay.removeChild(doc);
        toolbar.style.visibility = "hidden";
    });

    // show toolbar on mouseover
    overlay.addEventListener("mouseover", event => {
        const doc = event.target.closest(".doc");

        if (!doc || !overlay.contains(doc))
            return;

        const rect = doc.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();

        toolbar.style.left = `${rect.right - overlayRect.left - toolbar.offsetWidth - 5}px`;
        toolbar.style.top = `${rect.top - overlayRect.top + toolbar.offsetHeight - 12}px`;
        toolbar.style.visibility = "visible";

        toolbar.dataset.id = doc.dataset.id;
    });

    // hide toolbar on mouseout
    overlay.addEventListener("mouseout", event => {
        const doc = event.target.closest(".doc");

        if (!doc)
            return;

        // Don't hide when moving between elements inside the same item.
        if (doc.contains(event.relatedTarget))
            return;

        // Don't hide when moving over toolbar itself.
        if (toolbar.contains(event.relatedTarget))
            return;

        toolbar.style.visibility = "hidden";
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitEditor);