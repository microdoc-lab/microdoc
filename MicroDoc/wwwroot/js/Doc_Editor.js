Doc.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var docElement = this.element;
    var txtEditor = this.txtEditor();

    // save and close document editor on ESC
    txtEditor.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            if (isInRole("w", this.domain, docElement.dataset.id) && txtEditor.value != docElement.dataset.content)
                docElement.doc.SaveDocument();

            docElement.doc.CloseDocument();
        }
    });

    // adjust textEditor height
    txtEditor.AdjustHeight = function (o) {
        o.style.height = "1px";
        o.style.height = (o.scrollHeight) + "px";
    }

    txtEditor.addEventListener("input", () => { txtEditor.AdjustHeight(txtEditor); });
    txtEditor.AdjustHeight(txtEditor);

    // select heading line and scroll it into view
    txtEditor.SelectAndScroll = (headingIndex, focus = true) => {
        SelectAndScrollEditor(txtEditor, headingIndex, focus);
        this.OnActivation();
    }

    // activate document when editor got focus
    txtEditor.addEventListener("focus", e => this.OnActivation());
}

Doc.prototype.behaviors.push(Doc.prototype.InitEditor);