Doc.prototype.InitEditorList = function (options) {
    this.log('InitEditorList');

    var txtEditor = this.txtEditor();

    // start new list item on Enter
    txtEditor.addEventListener("keydown", e => {
        if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.altKey)
            return;

        const start = txtEditor.selectionStart;
        const end = txtEditor.selectionEnd;
        const value = txtEditor.value;
        const isScrollBottom = txtEditor.scrollHeight - txtEditor.scrollTop - txtEditor.clientHeight < 20;

        // Don't handle multiline selections.
        if (/[\r\n]/.test(value.substring(start, end)))
            return;

        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEndIndex = value.indexOf("\n", start);
        const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
        const line = value.substring(lineStart, lineEnd);

        const match = line.match(/^([ ]*-[ ]+)/);
        if (!match)
            return;

        e.preventDefault();

        const prefix = match[1];
        const itemTextBeforeCaret = value.substring(lineStart + prefix.length, start);

        // Empty item before the caret: exit the list.
        if (!itemTextBeforeCaret.trim()) {
            txtEditor.setSelectionRange(lineStart, start);
            document.execCommand("insertText", false, "\n");
            txtEditor.AdjustHeight(txtEditor);
            if (isScrollBottom)
                txtEditor.scrollTop += 2 * parseFloat(getComputedStyle(txtEditor).lineHeight);
            return;
        }

        // Split the item and continue the list at the same level.
        txtEditor.setSelectionRange(start, end);
        document.execCommand("insertText", false, "\n" + prefix);

        txtEditor.AdjustHeight(txtEditor);
        if (isScrollBottom)
            txtEditor.scrollTop += 2*parseFloat(getComputedStyle(txtEditor).lineHeight);
    });

    // change list-item indentation on Tab/Shift+Tab
    txtEditor.addEventListener("keydown", e => {
        if (e.key !== "Tab")
            return;

        const start = txtEditor.selectionStart;
        const end = txtEditor.selectionEnd;
        const value = txtEditor.value;

        const firstLineStart = value.lastIndexOf("\n", start - 1) + 1;

        let lastLinePosition = end;
        if (end > start && value[end - 1] === "\n")
            lastLinePosition--;

        const lineEndIndex = value.indexOf("\n", lastLinePosition);
        const blockEnd = lineEndIndex === -1
            ? value.length
            : lineEndIndex;

        const lines = value.substring(firstLineStart, blockEnd).split("\n");

        // Handle list blocks only.
        if (!lines.some(line => /^ *- /.test(line)))
            return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const updatedLines = lines.map(line => {
            if (!/^ *- /.test(line))
                return line;

            if (e.shiftKey) {
                // Remove up to two leading spaces.
                const spaces = line.match(/^ */)[0].length;
                return line.substring(Math.min(2, spaces));
            }

            return "  " + line;
        });

        const replacement = updatedLines.join("\n");

        // Replace the whole block as a native editing operation.
        txtEditor.setSelectionRange(firstLineStart, blockEnd);
        document.execCommand("insertText", false, replacement);

        // Restore the selection, accounting for the changed indentation.
        const delta = replacement.length - (blockEnd - firstLineStart);
        const newStart = start +
            updatedLines[0].length - lines[0].length;
        const newEnd = Math.max(newStart, end + delta);

        txtEditor.setSelectionRange(newStart, newEnd);
    });
}

Doc.prototype.behaviors.push(Doc.prototype.InitEditorList);