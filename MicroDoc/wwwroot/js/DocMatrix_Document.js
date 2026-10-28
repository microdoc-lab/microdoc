// Api
DocMatrix.prototype.SelectDocument = function (element) {
    var docElement = element.closest(".doc");
    if (docElement) {
        this.overlay().querySelectorAll(".doc").forEach(doc => doc.classList.remove('selected'));
        docElement.classList.add("selected");
    }
}

DocMatrix.prototype.HandleDocumentClick = async function (event, select, container, scrollOnSelect) {
    // open embeded link
    const link = event.target.closest("a");
    // link should be document-related
    if (link && link.dataset.document) {
        event.preventDefault();

        // obtain document properties
        const domain = this.domain;
        var documentId = link.getAttribute("href");

        this.log(`OpenLink domain: ${domain}, documentId: ${documentId}`);
        this.LoadAndOpenDocument(domain, documentId);

        return true;
    }

    if (select) {
        // find possible clicked image
        const imageWrapper = event.target.closest("imgw");
        if (imageWrapper) {
            var span = imageWrapper.querySelector("span");

            var docElement = imageWrapper.closest(".doc, doc");
            const domain = docElement.dataset.domain;
            const documentId = docElement.dataset.id;
            const imageName = span.textContent;

            this.log(`SelectImage domain: ${domain}, documentId: ${documentId}, imageName: ${imageName}`);
            // select image
            SelectElement(span);

            // select docElement
            this.SelectDocument(imageWrapper);

            if (container) {
                // add selected class to image
                container.querySelectorAll("imgw").forEach(imgw => imgw.classList.remove('selected'));
                imageWrapper.classList.add('selected');

                // notify SoftHover
                imageWrapper.dispatchEvent(new PointerEvent("pointerover", {
                    bubbles: true,
                    cancelable: true,
                    pointerType: "mouse"
                }));
            }
            return false;
        }

        // find & check the section
        const section = event.target.closest("section");
        if (!section)
            return false;

        // obtain section heading
        var heading = section.querySelector("h1, h2, h3");
        if (heading) {
            var docElement = heading.closest(".doc, doc");
            const domain = docElement.dataset.domain;
            const documentId = docElement.dataset.id;
            const headingText = heading.textContent;

            this.log(`SelectHeading domain: ${domain}, documentId: ${documentId}, headingText: ${headingText}`);
            // select heading
            SelectElement(heading);

            // select docElement
            this.SelectDocument(section);

            if (container) {
                // scroll to clicked heading (print preview TOC)
                if (scrollOnSelect && !IsFullyVisibleAndAboveMiddle(heading, container))
                    heading.scrollIntoView({ behavior: "auto", block: "start" });

                // add selected class to heading
                container.querySelectorAll("h1, h2, h3").forEach(heading => heading.classList.remove('selected'));
                heading.classList.add('selected');
            }

            return true;
        }
    }

    return false;
}

DocMatrix.prototype.HandleDocumentCopy = function (event, doc) {
    // obtain document context
    var documentId = doc.element.dataset.id;

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