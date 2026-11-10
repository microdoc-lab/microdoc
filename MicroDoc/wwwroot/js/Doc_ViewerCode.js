Doc.prototype.InitEditorCode = function (options) {
    this.debug('InitEditorCode');

    const docViewer = this.docViewer();

    // accept Tab in contentEditable
    docViewer.addEventListener("keydown", e => {
        if (e.key !== "Tab" || !e.target.isContentEditable ||
            e.ctrlKey || e.altKey || e.metaKey)
            return;

        e.preventDefault();

        if (!e.shiftKey) {
            document.execCommand("insertText", false, "\t");
            return;
        }

        const selection = window.getSelection();

        if (!selection.isCollapsed || !selection.rangeCount)
            return;

        const range = selection.getRangeAt(0);
        const node = range.startContainer;

        if (node.nodeType !== Node.TEXT_NODE || range.startOffset === 0)
            return;

        const offset = range.startOffset;
        const text = node.textContent;

        if (text[offset - 1] === "\t") {
            range.setStart(node, offset - 1);
            range.deleteContents();
        }
        else if (text.substring(Math.max(0, offset - 2), offset) === "  ") {
            range.setStart(node, offset - 2);
            range.deleteContents();
        }
    });

    docViewer.addEventListener("focusout", async e => {
        if (e.target.isContentEditable) {
            const newSection = e.target.innerText;

            if (newSection == e.target.dataset.content)
                return;

            const headingIndex = Number(e.target.getAttribute("headingindex"));

            // obtain document context
            const domain = this.element.dataset.domain;
            const documentId = this.element.dataset.id;
            var content = this.element.dataset.content;

            this.log(`UpdateEditableSection domain: ${domain}, documentId: ${documentId}, headingIndex: ${headingIndex}`);

            // replace document section
            content = DocParser.ReplaceDocumentSection(content, headingIndex, newSection);

            var docPath = DocParser.DocPath(documentId);

            // save document on server
            const response = await this.service.SaveDocument(domain, documentId, content);
            if (!response.ok) {
                this.error(format(Loc.Document_SaveFailed, docPath), await response.text());
                return;
            }

            // PublishChanges
            var data = await response.json();
            // mark change contentEditable
            data.changes.forEach(change => change.contentEditable = true);
            await window.domain.PublishChanges(data.changes);

            // update documentElement
            e.target.dataset.content = newSection;
        }
    });
}

Doc.prototype.behaviors.push(Doc.prototype.InitEditorCode);

Doc.prototype.TurnCodeBlocksContentEditable = function () {
    const domain = this.element.dataset.domain;
    const documentId = this.element.dataset.id;

    if (!isInRole("w", domain, documentId))
        return;

    const docViewer = this.docViewer();
    docViewer.querySelectorAll("section content").forEach((content, index) => {
        if (content.firstElementChild && content.firstElementChild.tagName.toLowerCase() === "p") {
            const p = content.firstElementChild;
            if (p.closest("section").classList.contains("code")) {
                p.contentEditable = "plaintext-only";
                p.setAttribute("headingindex", index);
                p.dataset.content = p.innerText;
            }
        }
    });
}