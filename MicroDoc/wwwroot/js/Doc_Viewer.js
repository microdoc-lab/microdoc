Doc.prototype.InitViewer = function (options) {
    this.log('InitViewer');

    var docViewer = this.docViewer();

    // intercept Ctrl+C event and perform custom copy logic
    docViewer.addEventListener("copy", event => {
        const docElement = this.element;

        var docMatrix = this.docMatrix();
        docMatrix.HandleCopy(event, docElement);
    });

    // capture mousedown coordinates to distinguish mouse selection from click
    let mouseDownX = 0;
    let mouseDownY = 0;

    docViewer.addEventListener("mousedown", event => {
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    });

    // select heading when document section clicked
    docViewer.addEventListener("click", async event => {
        const dx = event.clientX - mouseDownX;
        const dy = event.clientY - mouseDownY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // treat as selection/drag, not a click
        if (distance > 5)
            return;

        var docMatrix = this.docMatrix();
        await docMatrix.HandleClick(event, true, true);
    });

    // select heading and scroll it into view
    docViewer.SelectAndScroll = headingIndex => {
        SelectAndScrollViewer(docViewer, headingIndex);
        this.OnActivation();
    };
}

Doc.prototype.behaviors.push(Doc.prototype.InitViewer);