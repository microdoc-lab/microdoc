Doc.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var docElement = this.element;
    var txtEditor = this.txtEditor();

    // translate № into # (first 3 characters)
    txtEditor.addEventListener("beforeinput", function (e) {
        if (e.inputType !== "insertText" || e.data !== "№")
            return;

        const pos = this.selectionStart;
        const text = this.value;
        const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
        const index = pos - lineStart;

        if (index > 2)
            return;

        e.preventDefault();

        this.setRangeText("#", this.selectionStart, this.selectionEnd, "end");
    });

    // translate / (with Shift) into |
    txtEditor.addEventListener("keydown", function (e) {
        if (e.code !== "Backslash" || !e.shiftKey)
            return;

        if (e.ctrlKey || e.altKey || e.metaKey)
            return;

        e.preventDefault();

        this.setRangeText(
            "|",
            this.selectionStart,
            this.selectionEnd,
            "end"
        );
    });

    txtEditor.addEventListener("keydown", e => {
        // save and close document editor on ESC
        if (e.key === "Escape") {
            if (isInRole(this.domain, "w") && txtEditor.value != docElement.dataset.content)
                docElement.doc.SaveDocument();

            docElement.doc.CloseDocument();
        }

        // accept Tab in document editor
        if (e.key === "Tab") {
            e.preventDefault();

            const start = txtEditor.selectionStart;
            const end = txtEditor.selectionEnd;

            txtEditor.setRangeText("\t", start, end, "end");
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
    txtEditor.SelectAndScroll = function (headingIndex) {
        // move cursor to clicked Header position
        if (headingIndex >= 0) {
            // determine cursor position of heading; move cursor to this position
            const position = getHeadingCursorPosition(txtEditor, headingIndex);
            if (position >= 0)
                txtEditor.setSelectionRange(position, position);
            else
                txtEditor.setSelectionRange(0, 0);
        } else {
            // if no heading specified - scroll editor to top
            txtEditor.setSelectionRange(0, 0);
        }

        // scroll textarea to position cursor at the top
        scrollCursorToTop(txtEditor);

        // focus textEditor
        txtEditor.blur();
        txtEditor.focus();

        function getHeadingCursorPosition(textarea, headingIndex) {
            const text = textarea.value;
            const lines = text.split("\n");

            let index = 0;
            let position = 0;

            for (const line of lines) {
                if (/^#{1,3} /.test(line)) {
                    if (index === headingIndex)
                        return position;

                    index++;
                }

                position += line.length + 1; // +1 for "\n"
            }

            return -1;
        }

        function scrollCursorToTop(textarea) {
            const text = textarea.value;
            const cursor = textarea.selectionStart;

            const before = text.substring(0, cursor);
            const after = text.substring(cursor);

            // Let the browser calculate wrapping for text before the cursor.
            textarea.value = before;
            textarea.scrollTop = textarea.scrollHeight;

            const scrollHeight = textarea.scrollHeight;

            // Restore the complete document.
            textarea.value = before + after;
            textarea.selectionStart = textarea.selectionEnd = cursor;

            // Move the cursor's visual line to the top.
            const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
            textarea.scrollTop = scrollHeight + lineHeight;
        }
    }

    txtEditor.getHeadingIndexAtCursor = function(textarea) {
        const text = textarea.value;
        const cursor = textarea.selectionStart;
        const lines = text.split("\n");

        let position = 0;
        let headingIndex = -1;

        for (const line of lines) {
            if (position > cursor)
                break;

            if (/^#{1,3} /.test(line))
                headingIndex++;

            position += line.length + 1; // +1 for \n
        }

        return headingIndex;
    }
}

Doc.prototype.behaviors.push(Doc.prototype.InitEditor);