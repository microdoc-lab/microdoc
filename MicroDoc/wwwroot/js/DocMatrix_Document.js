// Api
DocMatrix.prototype.HandleDocumentClick = async function (event, select, scrollContainer) {
    // open embeded link
    const link = event.target.closest("a");
    // link should be document-related
    if (link && link.dataset.document) {
        event.preventDefault();

        // obtain document properties
        const domain = this.domain;
        var documentId = link.getAttribute("href");

        this.LoadAndOpenDocument(domain, documentId);

        return true;
    }

    if (select) {
        // find possible clicked image
        const imageWrapper = event.target.closest("imgw");
        if (imageWrapper) {
            // select image
            SelectElement(imageWrapper.querySelector("div"));
            return false;
        }

        // find & check the section
        const section = event.target.closest("section");
        if (!section)
            return false;

        // obtain section heading
        var heading = section.querySelector("h1, h2, h3");
        if (heading) {
            // select heading
            SelectElement(heading);

            // scroll to clicked heading (print preview TOC)
            if (scrollContainer) {
                // scroll heading into view
                if (!IsFullyVisibleAndAboveMiddle(heading, scrollContainer))
                    heading.scrollIntoView({ behavior: "auto", block: "start" });

                // add selected class to heading
                scrollContainer.querySelectorAll("h1, h2, h3").forEach(heading => heading.classList.remove('selected'));
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