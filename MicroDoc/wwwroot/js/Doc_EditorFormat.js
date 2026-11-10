Doc.prototype.InitEditorFormat = function (options) {
    this.debug('InitEditorFormat');

    var txtEditor = this.txtEditor();

    // set bold with ctrl+b
    txtEditor.addEventListener("keydown", e => {
        if (!e.ctrlKey || e.code !== "KeyB" && e.code !== "KeyU")
            return;

        e.preventDefault();

        var char;
        switch (e.code) {
            case "KeyB": char = "*"; break;
            case "KeyU": char = "_"; break;
        }

        let start = txtEditor.selectionStart;
        let end = txtEditor.selectionEnd;

        if (start === end)
            return;

        const value = txtEditor.value;
        const selected = value.substring(start, end);

        // Only handle selections within a single line.
        if (/[\r\n]/.test(selected))
            return;

        const trimmed = selected.trim();

        if (!trimmed)
            return;

        // Shrink the selection to exclude surrounding whitespace.
        start += selected.indexOf(trimmed);
        end = start + trimmed.length;

        let replacement;
        let selectionLength;

        if (trimmed.length >= 2 &&
            trimmed.startsWith(char) &&
            trimmed.endsWith(char)) {

            // Already bold: remove the surrounding stars.
            replacement = trimmed.slice(1, -1);
            selectionLength = replacement.length;
        } else {
            // Not bold: add surrounding stars.
            replacement = `${char}${trimmed}${char}`;
            selectionLength = replacement.length;
        }

        txtEditor.setSelectionRange(start, end);
        document.execCommand("insertText", false, replacement);

        // Select the result, including stars when bold.
        txtEditor.setSelectionRange(start, start + selectionLength);
    });

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

        const start = txtEditor.selectionStart;
        const end = txtEditor.selectionEnd;

        txtEditor.setSelectionRange(start, end);
        document.execCommand("insertText", false, "#");
    });

    // translate / (with Shift) into |
    txtEditor.addEventListener("keydown", function (e) {
        if (e.code !== "Backslash" || !e.shiftKey)
            return;

        if (e.ctrlKey || e.altKey || e.metaKey)
            return;

        e.preventDefault();

        const start = txtEditor.selectionStart;
        const end = txtEditor.selectionEnd;

        txtEditor.setSelectionRange(start, end);
        document.execCommand("insertText", false, "|");
    });

    // Accept Tab / Shift+Tab in document editor
    txtEditor.addEventListener("keydown", e => {
        if (e.key !== "Tab" || e.ctrlKey || e.altKey || e.metaKey)
            return;

        e.preventDefault();

        const start = txtEditor.selectionStart;
        const end = txtEditor.selectionEnd;
        const text = txtEditor.value;

        if (!e.shiftKey) {
            txtEditor.setRangeText("\t", start, end, "end");
        }
        else if (start === end && start > 0 && text[start - 1] === "\t") {
            txtEditor.setRangeText("", start - 1, start, "end");
        }
    });
}

Doc.prototype.behaviors.push(Doc.prototype.InitEditorFormat);