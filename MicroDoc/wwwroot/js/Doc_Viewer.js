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
        await docMatrix.HandleClick(event, true);
    });

    // select heading and scroll it into view
    docViewer.SelectAndScroll = function (headingIndex) {
        // move cursor to clicked Header position
        if (headingIndex >= 0) {
            const heading = docViewer.querySelectorAll("h1, h2, h3")[headingIndex];
            if (heading) {
                // scroll heading into view (if not fully visible above document viewer middle line)
                if (!IsFullyVisibleAndAboveMiddle(heading, docViewer))
                    heading.scrollIntoView({ behavior: "auto", block: "start" });

                // put selection on heading
                SelectElement(heading);
            }
        }
        else {
            // if no heading specified - scroll document to top
            docViewer.scrollTo({ behavior: "auto", top: 0 });
        }
    }

    docViewer.getSelectedHeadingIndex = function (viewer) {
        const selection = window.getSelection();

        if (!selection.rangeCount || selection.isCollapsed)
            return -1;

        const range = selection.getRangeAt(0);

        if (!viewer.contains(range.commonAncestorContainer))
            return -1;

        const headings = [...viewer.querySelectorAll("h1, h2, h3")];

        for (let i = 0; i < headings.length; i++) {
            if (range.intersectsNode(headings[i]))
                return i;
        }

        return -1;
    }

    function SelectElement(heading) {
        const range = document.createRange();
        range.selectNodeContents(heading);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function IsFullyVisibleAndAboveMiddle(element, container) {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const top = containerRect.top + container.clientTop;
        const bottom = top + container.clientHeight;
        const middle = (top + bottom) / 2;

        return rect.top >= top
            && rect.bottom <= bottom
            && rect.top < middle;
    }
}

Doc.prototype.behaviors.push(Doc.prototype.InitViewer);