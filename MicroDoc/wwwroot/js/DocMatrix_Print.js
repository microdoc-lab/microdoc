DocMatrix.prototype.InitPrint = function (options) {
    this.log('InitPrint');

    var docMatrix = this;
    var modal = this.modal();
    var container = modal.querySelector(".doc-container");

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

        // obtain document context
        var domain = docElement.dataset.domain;
        var documentId = docElement.dataset.id;

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

        // open embeded link
        const link = event.target.closest("a");
        if (link && link.dataset.document) {
            event.preventDefault();

            // obtain document properties
            const domain = docElement.dataset.domain;
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
            this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, (event.ctrlKey || !documentContent) && isInRole("w", domain, documentId) ? "edit" : "view");

            return;
        }

        const dx = event.clientX - mouseDownX;
        const dy = event.clientY - mouseDownY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // treat as selection/drag, not a click
        if (distance > 5)
            return;

        // find possible clicked image
        const imageWrapper = event.target.closest("imgw");
        if (imageWrapper) {
            SelectElement(imageWrapper.querySelector("div"));
            return;
        }

        // find & check the section
        const section = event.target.closest("section");
        if (!section || !container.contains(section))
            return;

        // obtain section heading
        var heading = section.querySelector("h1, h2, h3");
        if (heading)
            SelectElement(heading);
    });

    function SelectElement(heading) {
        const range = document.createRange();
        range.selectNodeContents(heading);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitPrint);

DocMatrix.prototype.Print = function (button) {
    var document = button.closest("th").dataset.document;

    var modal = this.modal();
    var container = modal.querySelector(".doc-container");

    var html = "";
    this.grid().querySelectorAll(`tr[data-tag] td[data-document="${document}"] doc`).forEach(doc => {
        if (doc.dataset.content)
            html += doc.outerHTML;
    });

    container.dataset.document = document;
    container.innerHTML = html;
    modal.style.display = "block";

    this.modalOpened = true;
}