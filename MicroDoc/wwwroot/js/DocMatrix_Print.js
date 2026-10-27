DocMatrix.prototype.InitPrint = function (options) {
    this.debug('InitPrint');

    var docMatrix = this;
    var container = this.printContainer();

    // close print preview on ESC
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            if (!docMatrix.modalOpened)
                return;

            e.preventDefault();
            e.stopImmediatePropagation();

            docMatrix.ClosePrint();
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

        this.HandleDocumentCopy(event, docElement.doc);
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

        await this.HandleDocumentClick(event, true, container, true);
    });

    // remove heading selection when user starts selection
    container.addEventListener("pointerdown", event => {
        const selection = window.getSelection();

        if (selection?.rangeCount && IsHeadingSelection(selection))
            selection.removeAllRanges();
    });

    // synchronize absolute positioned <gallery> marginTop with document viewer scrollTop
    // manually clip absolute positioned <gallery> outside document viewer bounds
    container.addEventListener("scroll", () => AdjustImageGalleryPositionAndVisibility(container));
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitPrint);

DocMatrix.prototype.OpenPrintColumn = function (document) {
    // remove hover style
    window.document.querySelectorAll(".hover").forEach(el => el.classList.remove("hover"));

    var modal = this.modal();
    var container = this.printContainer();
    var printTitle = this.printTitle();

    // combine HTML for all doc rows in a specified column
    var html = "";
    this.grid().querySelectorAll(`tr[data-tag] td[data-document="${document}"] doc`).forEach(doc => {
        const style = getComputedStyle(doc.closest("tr"));
        const isVisible = style.display !== "none";

        if (isVisible && doc.dataset.content)
            html += doc.outerHTML;
    });

    // update title
    printTitle.textContent = document + ".txt";
    printTitle.dataset.document = document;

    // update container HTML
    container.innerHTML = html;

    // remove preview class
    container.querySelectorAll("doc").forEach(doc => {
        doc.classList.remove("preview");
        doc.dataset.content = "";
    });

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

    this.explorer().OnColumnPrintDialogOpened(document);
}

DocMatrix.prototype.OpenPrintDocument = function (docElement) {
    // remove hover style
    window.document.querySelectorAll(".hover").forEach(el => el.classList.remove("hover"));

    var modal = this.modal();
    var container = this.printContainer();
    var printTitle = this.printTitle();

    // get doc HTML
    var html = docElement.doc.docViewer().innerHTML;

    // update title
    printTitle.textContent = DocParser.DocPath(docElement.dataset.id);
    printTitle.dataset.document = docElement.dataset.document;

    // update container HTML
    container.innerHTML = `<doc>${html}</doc>`;

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

    this.explorer().OnDocumentPrintDialogOpened(docElement.doc);
}

DocMatrix.prototype.ClosePrint = function () {
    if (!this.modalOpened)
        return;

    var modal = this.modal();
    var container = this.printContainer();

    container.dataset.document = "";
    container.innerHTML = "";
    modal.style.display = "none";

    this.modalOpened = false;

    // activate recent document
    this.explorer().ActivateRecentDocument();
}

DocMatrix.prototype.CopyPrint = async function () {
    if (!this.modalOpened)
        return;

    var container = this.printContainer();

    await CopyFormatted(container);
}

DocMatrix.prototype.DialogPrint = async function (event) {
    if (!this.modalOpened)
        return;

    var container = this.printContainer();
    var printTitle = this.printTitle();

    PrintElement(container, printTitle.textContent, event.altKey);
}

DocMatrix.prototype.DialogPrintImages = async function (event) {
    if (!this.modalOpened)
        return;

    var container = this.printContainer();
    var printTitle = this.printTitle();

    var clone = TransformGalleriesToImagePages(container);

    PrintElement(clone, printTitle.textContent + " images", event.altKey);
}