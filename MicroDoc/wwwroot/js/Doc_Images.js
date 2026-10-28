Doc.prototype.InitImages = function (options) {
    this.debug('InitImages');

    var docElement = this.element;
    var docViewer = this.docViewer();
    var txtEditor = this.txtEditor();
    var service = this.service;

    // synchronize absolute positioned <gallery> marginTop with document viewer scrollTop
    // manually clip absolute positioned <gallery> outside document viewer bounds
    docViewer.addEventListener("scroll", () => AdjustImageGalleryPositionAndVisibility(docViewer));

    // paste image from clipboard
    txtEditor.addEventListener("paste", async function (e) {

        // obtain document context
        var domain = docElement.dataset.domain;
        var documentId = docElement.dataset.id;

        const items = e.clipboardData.items;

        for (const item of items) {
            if (!item.type.startsWith("image/"))
                continue;

            e.preventDefault();

            const image = item.getAsFile();
            if (!image)
                continue;

            var imageName = DocParser.DocName(image.name);
            var imageType = DocParser.DocType(image.name);

            // prompt image name
            imageName = prompt(Loc.DocMatrix_NewImagePrompt, imageName);

            if (imageName == null)
                return;

            if (!imageName.trim())
                return;

            if (!DocParser.IsValidImageName(imageName)) {
                alert(Loc.DocMatrix_InvalidImageName);
                return;
            }

            imageName = imageName + imageType;

            // upload image on server
            const response = await service.UploadImage(domain, documentId, imageName, image);
            if (!response.ok) {
                this.error(format(Loc.Document_UploadImageFailed, docPath), await response.text());
                return;
            }

            // insert image tag into document editor
            InsertImage(txtEditor, imageName);
        }
    });

    function InsertImage(editor, imagePath) {
        const imageMarkup = "/image:" + imagePath;

        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const text = editor.value;

        const before = text.slice(0, start);
        const after = text.slice(end);

        let prefix = "";
        let suffix = "";

        // Image must start on a new line.
        if (before.length > 0 && !before.endsWith("\n"))
            prefix = "\n";

        // Image must end on a new line.
        if (after.length > 0 && !after.startsWith("\n"))
            suffix = "\n";

        editor.setRangeText(
            prefix + imageMarkup + suffix,
            start,
            end,
            "end"
        );
    }
}

Doc.prototype.behaviors.push(Doc.prototype.InitImages);

// Static functions
function AdjustImageGalleryPositionAndVisibility(container) {
    const scrollTop = container.scrollTop;
    const viewerRect = container.getBoundingClientRect();

    container.querySelectorAll("gallery").forEach(gallery => {
        // scroll gallery manually
        gallery.style.marginTop = `${-scrollTop}px`;

        const rect = gallery.getBoundingClientRect();
        const galleryCenter = (rect.top + rect.bottom) / 2;

        // control gallery visibility
        gallery.style.visibility =
            galleryCenter >= viewerRect.top &&
                galleryCenter <= viewerRect.bottom
                ? "visible"
                : "hidden";

        if (rect.top + rect.height / 2 > window.innerHeight / 2)
            gallery.classList.add("belowMiddle");
        else
            gallery.classList.remove("belowMiddle");
    });
}