Doc.prototype.InitEditorCode = function (options) {
    this.debug('InitEditorCode');

    const docViewer = this.docViewer();
    const txtEditor = this.txtEditor();

    // accept Tab in contentEditable
    docViewer.addEventListener("keydown", e => {
        if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey && e.target.isContentEditable) {
            e.preventDefault();

            e.preventDefault(); // Stop focus from moving out of the element

            document.execCommand("insertText", false, "\t");
        }
    });

    docViewer.addEventListener("focusout", async e => {
        if (e.target.contentEditable == "true") {
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
            content = replaceSection(content, headingIndex, newSection);

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

    function replaceSection(document, headingIndex, newContent) {
        // split document on sections
        const sections = splitDocumentOnSections(document);

        // replace section
        return sections.map((s, i) => {
            if (i == headingIndex && /^#{1,3}\s/.test(s[0]))
                return s[0] + '\n' + newContent;

            if (i == headingIndex)
                return newContent;

            return s.join('\n');
        }).join('\n');
    }

    function splitDocumentOnSections(document) {
        const lines = document.split('\n');

        const sections = [];
        var section = null;

        lines.forEach(line => {
            if (/^#{1,3}\s/.test(line) || !section) {
                if (section)
                    sections.push(section);

                section = [];
            }

            section.push(line);
        });

        if (section)
            sections.push(section);

        return sections;
    }
}

Doc.prototype.behaviors.push(Doc.prototype.InitEditorCode);

Doc.prototype.TurnCodeBlocksContentEditable = function () {
    const domain = this.element.dataset.domain;
    const documentId = this.element.dataset.id;

    if (!isInRole("w", domain, documentId))
        return;

    const docViewer = this.docViewer();
    docViewer.querySelectorAll("section content p:first-child").forEach((p, index) => {
        if (p.closest("section").classList.contains("code")) {
            p.contentEditable = true;
            p.setAttribute("headingindex", index);
            p.dataset.content = p.innerText;
        }
    });
}