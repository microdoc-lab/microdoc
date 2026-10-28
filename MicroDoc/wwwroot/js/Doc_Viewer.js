Doc.prototype.InitViewer = function (options) {
    this.debug('InitViewer');

    var explorer = this.explorer();
    var docMatrix = this.docMatrix();
    var docViewer = this.docViewer();

    // intercept Ctrl+C event and perform custom copy logic
    docViewer.addEventListener("copy", event => {
        docMatrix.HandleDocumentCopy(event, this);
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

        await docMatrix.HandleDocumentClick(event, true, docViewer);

        explorer.OnDocumentActivated(this);
    });

    // remove heading selection when user starts selection
    docViewer.addEventListener("pointerdown", event => {
        const selection = window.getSelection();

        if (selection?.rangeCount && IsHeadingSelection(selection))
            selection.removeAllRanges();
    });

    // select heading and scroll it into view
    docViewer.SelectAndScroll = headingIndex => {
        SelectAndScrollViewer(docViewer, headingIndex);
        explorer.OnDocumentActivated(this);
    };
}

Doc.prototype.behaviors.push(Doc.prototype.InitViewer);

// Static functions
function SelectElement(element) {
    const range = document.createRange();
    range.selectNodeContents(element);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function IsHeadingSelection(selection) {
    const node = selection.anchorNode;

    return node?.nodeType === Node.ELEMENT_NODE &&
        /^H[1-3]$/.test(node.nodeName) &&
        selection.focusNode === node;
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

function SelectAndScrollViewer(viewer, headingIndex, container) {
    headingIndex = headingIndex ?? 0;

    // move cursor to clicked Header position
    if (headingIndex >= 0) {
        const heading = viewer.querySelectorAll("h1, h2, h3")[headingIndex];
        if (heading) {
            // put selection on heading
            SelectElement(heading);

            // scroll heading into view (if not fully visible above document viewer middle line)
            if (!IsFullyVisibleAndAboveMiddle(heading, viewer))
                heading.scrollIntoView({ behavior: "auto", block: "start" });

            // add selected class to heading (print preview TOC)
            if (container) {
                container.querySelectorAll("h1, h2, h3").forEach(heading => heading.classList.remove('selected'));
                heading.classList.add('selected');
            }
        }
    }
    else {
        // if no heading specified - scroll document to top
        viewer.scrollTo({ behavior: "auto", top: 0 });
    }
}

function GetSelectedHeadingIndex(viewer) {
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