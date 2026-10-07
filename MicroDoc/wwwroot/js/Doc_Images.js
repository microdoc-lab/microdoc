Doc.prototype.InitImages = function (options) {
    this.log('InitImages');

    var docMatrix = this.docMatrix();
    var docElement = this.element;
    var docViewer = this.docViewer();
    var txtEditor = this.txtEditor();
    var service = this.service;

    // move gallery synchronously with vertical scroller
    docViewer.addEventListener("scroll", () => {
        const scrollTop = docViewer.scrollTop;
        const viewerRect = docViewer.getBoundingClientRect();

        docViewer.querySelectorAll("gallery").forEach(gallery => {
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
        });
    });

    txtEditor.addEventListener("paste", async function (e) {

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

            var imageName = docMatrix.DocName(image.name);
            var imageType = docMatrix.DocType(image.name);

            imageName = prompt("Enter image name", imageName);

            if (!imageName)
                return;

            imageName = imageName + imageType;

            const response = await service.UploadImage(domain, documentId, imageName, image);
            if (!response.ok) {
                this.error(`Upload image ${docPath} failed`, await response.text());
                return;
            }

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