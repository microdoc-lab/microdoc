DocMatrix.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var docMatrix = this;
    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var grid = this.grid();

    // open document in overlay by click
    grid.addEventListener("click", event => {
        // don't open document if user select some text in the cell
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed)
            return;

        // find & check the cell
        const docCell = event.target.closest("td");
        if (!docCell || !grid.contains(docCell))
            return;

        if (!event.target.matches("h1, h2, h3, doc, clip, td"))
            return;

        var domain = docCell.dataset.domain;
        var documentId = docCell.dataset.id;
        var documentContent = docCell.dataset.content;
        var documentHtml = docCell.querySelector("doc").innerHTML;

        const headings = docCell.querySelector("doc").querySelectorAll("h1, h2, h3");
        const headingIndex = [...headings].indexOf(event.target);

        this.OpenDocument(domain, documentId, documentContent, documentHtml, headingIndex, event.ctrlKey ? "edit" : "view");
    });

    // toggle view/edit mode
    toolbar.querySelector(".view").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        // find & check docElement
        var docElement = this.docElement(domain, documentId);
        if (!docElement)
            return;

        var mode = docElement.getAttribute("mode");

        if (mode == "view") {
            var docViewer = this.docViewer(domain, documentId);
            const headingIndex = getSelectedHeadingIndex(docViewer);

            docElement.setAttribute("mode", "edit");

            var txtEditor = this.txtEditor(domain, documentId);
            txtEditor.AdjustHeight(txtEditor);

            txtEditor.FocusAndSelect(headingIndex);

            toolbar.querySelector(".view img").src = "/icons/View.png";

            function getSelectedHeadingIndex(viewer) {
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
        }
        else {
            var txtEditor = this.txtEditor(domain, documentId);
            const headingIndex = getHeadingIndexAtCursor(txtEditor);

            var documentHtml = await this.SaveDocument(domain, documentId, false);
            docElement.setAttribute("mode", "view");

            var docViewer = this.docViewer(domain, documentId);
            docViewer.innerHTML = documentHtml;
            docViewer.FocusAndSelect(headingIndex);

            toolbar.querySelector(".view img").src = "/icons/Edit.png";

            function getHeadingIndexAtCursor(textarea) {
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
    });

    // save document on close
    toolbar.querySelector(".close").addEventListener("click", async event => {
        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        await this.SaveDocument(domain, documentId, true);
    });

    //#region Reorder docs with Drag-n-Drop
    let draggedDoc = null;

    var grip = toolbar.querySelector(".grip");
    grip.draggable = true;

    grip.addEventListener("dragstart", e => {
        if (window.dragging) {
            e.preventDefault();
            return;
        }

        // obtain document context
        var domain = toolbar.dataset.domain;
        var documentId = toolbar.dataset.id;

        var docElement = docMatrix.docElement(domain, documentId);
        if (!docElement) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", documentId);
        e.dataTransfer.setData("application/x-drag-type", "Doc");

        draggedDoc = docElement;
    });

    grip.addEventListener("dragend", () => {
        draggedDoc = null;
    });

    this.initDragDrop = function(docElement) {
        docElement.addEventListener("dragover", e => {
            if (!draggedDoc)
                return;

            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        docElement.addEventListener("drop", e => {
            if (!draggedDoc)
                return;

            e.preventDefault();

            const sender = draggedDoc;
            const target = docElement;

            // Reorder DOM
            const parentList = overlay;
            const nodes = Array.from(parentList.children);
            const draggedIndex = nodes.indexOf(sender);
            const targetIndex = nodes.indexOf(target);

            if (draggedIndex === -1 || targetIndex === -1) return;

            if (draggedIndex >= targetIndex) {  // Insert before target                    
                parentList.insertBefore(sender, target);
            } else if (target.nextSibling) {    // Insert after target                    
                parentList.insertBefore(sender, target.nextSibling);
            } else {                            // Insert last                    
                parentList.appendChild(sender);
            }
        });
    }

    //#endregion

    //#region Show/hide toolbar

    // show toolbar on mouseover
    overlay.addEventListener("mouseover", event => {
        // find & check docElement
        const docElement = event.target.closest(".doc");
        if (!docElement || !overlay.contains(docElement))
            return;

        // obtain document context
        var domain = docElement.dataset.domain;
        var documentId = docElement.dataset.id;

        // position toolbar at the top-right corner of docElement
        const rect = docElement.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();

        toolbar.style.left = `${rect.right - overlayRect.left - toolbar.offsetWidth}px`;
        toolbar.style.top = `${rect.top - overlayRect.top}px`;

        // show toolbar
        toolbar.style.visibility = "visible";
        // set toolbar context
        toolbar.dataset.domain = domain;
        toolbar.dataset.id = documentId;

        var mode = docElement.getAttribute("mode");
        if (mode == "view")
            toolbar.querySelector(".view img").src = "/icons/Edit.png";
        else
            toolbar.querySelector(".view img").src = "/icons/View.png";
    });

    // hide toolbar on mouseout
    overlay.addEventListener("mouseout", event => {
        // find & check docElement
        const docElement = event.target.closest(".doc");
        if (!docElement)
            return;

        // Don't hide when moving between elements inside the same item.
        if (docElement.contains(event.relatedTarget))
            return;

        // Don't hide when moving over toolbar itself.
        if (toolbar.contains(event.relatedTarget))
            return;

        // hide toolbar
        toolbar.style.visibility = "hidden";
        // reset toolbar context
        toolbar.dataset.id = null;
    });

    //#endregion
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitEditor);

// Api
DocMatrix.prototype.OpenDocument = function (domain, documentId, documentContent, documentHtml, headingIndex, mode) {
    var overlay = this.overlay();
    var toolbar = this.toolbar();

    // if document already opened - just focus it
    var docElement = this.docElement(domain, documentId);
    if (docElement) {
        var currentMode = docElement.getAttribute("mode");
        if (currentMode == "view") {
            var docViewer = this.docViewer(domain, documentId);
            docViewer.FocusAndSelect(headingIndex);
        }

        if (currentMode == "edit") {
            var txtEditor = this.txtEditor(domain, documentId);
            txtEditor.FocusAndSelect(headingIndex);
        }

        return false;
    }

    // open new document
    docElement = document.createElement("div");
    docElement.className = "doc";
    docElement.setAttribute("mode", mode);
    docElement.dataset.domain = domain;
    docElement.dataset.id = documentId;

    docViewer = document.createElement("div");
    docViewer.className = "viewer";
    docViewer.innerHTML = documentHtml;
    docElement.appendChild(docViewer);

    txtEditor = document.createElement("textarea");
    txtEditor.className = "editor";
    txtEditor.value = documentContent;
    docElement.appendChild(txtEditor);

    overlay.appendChild(docElement);

    // additional initialization (drag-n-drop)
    this.initDragDrop(docElement);

    // select header on click in viewer
    docViewer.addEventListener("click", event => {
        // don't open document if user select some text in the cell
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed)
            return;

        // find & check the section
        const section = event.target.closest("section");
        if (!section || !docViewer.contains(section))
            return;

        var heading = section.querySelector("h1, h2, h3");
        if (heading) {
            const range = document.createRange();
            range.selectNodeContents(heading);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    // save and close on Esc in text editor
    txtEditor.addEventListener("keydown", e => {
        if (e.key === "Escape")
            toolbar.querySelector(".close").click();
    });

    // adjust textEditor height
    txtEditor.AdjustHeight = function(o) {
        o.style.height = "1px";
        o.style.height = (o.scrollHeight) + "px";
    }

    txtEditor.addEventListener("input", () => { txtEditor.AdjustHeight(txtEditor); });
    txtEditor.AdjustHeight(txtEditor);

    // focus and select
    docViewer.FocusAndSelect = function (headingIndex) {
        // move cursor to clicked Header position
        if (headingIndex >= 0) {
            const heading = docViewer.querySelectorAll("h1, h2, h3")[headingIndex];
            if (heading) {
                heading.scrollIntoView({ behavior: "auto", block: "start" });

                const range = document.createRange();
                range.selectNodeContents(heading);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    txtEditor.FocusAndSelect = function (headingIndex) {
        // move cursor to clicked Header position
        if (headingIndex >= 0) {
            const position = getCursorPositionAtHeading(txtEditor, headingIndex);
            if (position >= 0)
                txtEditor.setSelectionRange(position, position);
            else
                txtEditor.setSelectionRange(0, 0);

            scrollCursorToTop(txtEditor);
        }

        // focus textEditor
        txtEditor.blur();
        txtEditor.focus();

        function getCursorPositionAtHeading(textarea, headingIndex) {
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

    if (mode == "view")
        docViewer.FocusAndSelect(headingIndex);

    if (mode == "edit")
        txtEditor.FocusAndSelect(headingIndex);

    return true;
}

DocMatrix.prototype.SaveDocument = async function (domain, documentId, close) {
    var overlay = this.overlay();
    var toolbar = this.toolbar();

    // find & check docElement
    var docElement = this.docElement(domain, documentId);
    if (!docElement)
        return;

    // find & check txtEditor
    var txtEditor = docElement.querySelector(".editor");
    if (!txtEditor)
        return;

    var content = txtEditor.value;

    // save document
    const response = await this.service.SaveDocument(domain, documentId, content);
    if (!response.ok) {
        this.error("SaveDocument request failed", await response.text());
        return;
    }

    if (close) {
        // remove docElement
        overlay.removeChild(docElement);
        // hide toolbar
        toolbar.style.visibility = "hidden";
        // reset toolbar context
        toolbar.dataset.domain = null;
        toolbar.dataset.id = null;
    }

    // update cell in grid
    var formattedContent = await response.text();

    // find & check cell
    var docCell = this.docCell(domain, documentId);
    if (docCell) {
        docCell.dataset.content = content;
        docCell.querySelector("doc").innerHTML = formattedContent;
    }

    return formattedContent;
}

// Service methods
DocMatrixService.prototype.SaveDocument = function (domain, documentId, content) {
    return fetch("/Home/SaveDocument", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            documentId: documentId,
            content: content
        })
    });
}