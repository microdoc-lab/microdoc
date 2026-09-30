Doc.prototype.InitViewer = function (options) {
    this.log('InitViewer');

    var docViewer = this.docViewer();

    // select heading when document section clicked
    docViewer.addEventListener("click", event => {
        // don't select section if user select some text in the cell
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed)
            return;

        // find & check the section
        const section = event.target.closest("section");
        if (!section || !docViewer.contains(section))
            return;

        // obtain section heading
        var heading = section.querySelector("h1, h2, h3");
        if (heading)
            SelectHeading(heading);
    });

    // select heading and scroll it into view
    docViewer.SelectAndScroll = function (headingIndex) {
        // move cursor to clicked Header position
        if (headingIndex >= 0) {
            const heading = docViewer.querySelectorAll("h1, h2, h3")[headingIndex];
            if (heading) {
                // scroll heading into view
                heading.scrollIntoView({ behavior: "auto", block: "start" });
                // put selection on heading
                SelectHeading(heading);
            }
        }
        else {
            // if no heading specified - scroll document to top
            container.scrollTo({ behavior: "auto", top: 0 });
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

    function SelectHeading(heading) {
        const range = document.createRange();
        range.selectNodeContents(heading);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

Doc.prototype.behaviors.push(Doc.prototype.InitViewer);