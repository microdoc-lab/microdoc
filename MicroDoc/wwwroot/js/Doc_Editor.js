Doc.prototype.InitEditor = function (options) {
    this.debug('InitEditor');

    var docElement = this.element;
    var explorer = this.explorer();
    var docMatrix = this.docMatrix();
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
        const domain = this.element.dataset.domain;
        const documentId = this.element.dataset.id;

        this.log(`SelectAndScrollEditor domain: ${domain}, documentId: ${documentId}, headingIndex: ${headingIndex}, focus: ${focus}`);
        SelectAndScrollEditor(txtEditor, headingIndex, focus);
        explorer.OnDocumentActivated(this);
        docMatrix.SelectDocument(this.element);
    }

    // activate document when editor got focus
    txtEditor.addEventListener("focus", e => {
        explorer.OnDocumentActivated(this);
        docMatrix.SelectDocument(this.element);
    });

    // update selectedHeadingIndex in cookie
    txtEditor.addEventListener('select', e => explorer.OnDocumentEditorSelectionChanged(this));
    txtEditor.addEventListener('keyup', e => explorer.OnDocumentEditorSelectionChanged(this));
    txtEditor.addEventListener('click', e => explorer.OnDocumentEditorSelectionChanged(this));
}

Doc.prototype.behaviors.push(Doc.prototype.InitEditor);

// Static functions
function SelectAndScrollEditor(editor, headingIndex, focus = true) {
    // move cursor to clicked Header position
    if (headingIndex >= 0) {
        // determine cursor position of heading; move cursor to this position
        const position = getHeadingCursorPosition(editor, headingIndex);
        if (position >= 0)
            editor.setSelectionRange(position, position);
        else
            editor.setSelectionRange(0, 0);
    } else {
        // if no heading specified - scroll editor to top
        editor.setSelectionRange(0, 0);
    }

    // scroll textarea to position cursor at the top
    scrollCursorToTop(editor);

    // focus textEditor
    if (focus) {
        editor.blur();
        editor.focus();
    }

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

function GetHeadingIndexAtCursor(textarea) {
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