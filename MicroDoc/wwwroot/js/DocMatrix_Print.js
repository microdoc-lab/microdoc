DocMatrix.prototype.InitPrint = function (options) {
    this.log('InitPrint');

    var docMatrix = this;
    var modal = this.modal();
    var container = modal.querySelector(".doc-container .scroll-area");

    // close print preview on ESC
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            if (!docMatrix.modalOpened)
                return;

            e.preventDefault();
            e.stopImmediatePropagation();

            container.dataset.document = "";
            container.innerHTML = "";
            modal.style.display = "none";

            docMatrix.modalOpened = false;
        }
    });

    // intercept Ctrl+C event and perform custom copy logic
    container.addEventListener("copy", event => {
        // selection should exist
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.anchorNode != selection.focusNode)
            return;

        var docElement = selection.anchorNode.closest("doc");
        if (!docElement)
            return;

        this.HandleCopy(event, docElement);
    });

    // capture mousedown coordinates to distinguish mouse selection from click
    let mouseDownX = 0;
    let mouseDownY = 0;

    container.addEventListener("mousedown", event => {
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    });

    // select heading when document section clicked
    container.addEventListener("click", async event => {
        const dx = event.clientX - mouseDownX;
        const dy = event.clientY - mouseDownY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // treat as selection/drag, not a click
        if (distance > 5)
            return;

        await this.HandleClick(event, true, false, container);
    });

    // synchronize absolute positioned <gallery> marginTop with document viewer scrollTop
    // manually clip absolute positioned <gallery> outside document viewer bounds
    container.addEventListener("scroll", () => AdjustImageGalleryPositionAndVisibility(container));
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitPrint);

DocMatrix.prototype.Print = function (button) {
    // detect document/column
    var document = button.closest("th").dataset.document;

    var modal = this.modal();
    var container = modal.querySelector(".doc-container .scroll-area");

    // combine HTML for all doc rows in a specified column
    var html = "";
    this.grid().querySelectorAll(`tr[data-tag] td[data-document="${document}"] doc`).forEach(doc => {
        if (doc.dataset.content)
            html += doc.outerHTML;
    });

    // update container HTML
    container.dataset.document = document;
    container.innerHTML = html;

    // number Headings
    var headingIndex = 0;
    container.querySelectorAll("h1, h2, h3").forEach(heading => {
        heading.style.setProperty('--index', headingIndex++);
        heading.setAttribute("content", heading.textContent);
        heading.title = heading.textContent;
    });

    // show container
    modal.style.display = "block";

    SelectAndScrollViewer(container, 0, container);

    AdjustImageGalleryPositionAndVisibility(container);

    this.modalOpened = true;
}