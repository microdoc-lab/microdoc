Explorer.prototype.InitNavigation = function (options) {
    this.debug('InitNavigation');

    var tagTree = this.tagTree();
    var docMatrix = this.docMatrix();

    // synchronize DocMatrix with selected tag in TagTree
    tagTree.options.OnNodeSelected = tagTree.OnNodeSelected = tagId => docMatrix.Load(tagId);

    enableSoftHover(`#${this.id} .tree-panel .tag-tree, #${this.id} .docmatrix .grid`);
    enableSoftHover(`#${this.id} .docmatrix .grid td`);
    enableSoftHover(`#${this.id} .docmatrix .grid td:not(.misc) doc section`);
    enableSoftHover(`#${this.id} .docmatrix .grid td:not(.misc) doc gallery imgw, #${this.id} .overlay .doc gallery imgw, #${this.id} .modal doc gallery imgw`);
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitNavigation);

Explorer.prototype.ActivateDocument = function (activeDocumentId) {
    var docMatrix = this.docMatrix();

    // update domain title
    document.title = `${this.domain}`;

    // put domain URL in history
    history.replaceState(null, "", `/${this.domain}`);

    if (activeDocumentId == null)
        activeDocumentId = this.activeDocumentId;

    if (!activeDocumentId)
        return;

    // activate document or load document and open
    var docElement = docMatrix.docElement(this.domain, activeDocumentId);
    if (docElement) {
        this.OnDocumentActivated(docElement.doc, true);

        const mode = docElement.getAttribute("mode");

        // restore active document
        if (mode == "view")
            docElement.doc.docViewer().SelectAndScroll(this.selectedHeadingIndex);
        if (mode == "edit")
            docElement.doc.txtEditor().focus();
    }
    else
        docMatrix.LoadAndOpenDocument(this.domain, activeDocumentId);
}

Explorer.prototype.OnDocumentActivated = function (doc, restore) {
    // capture document context
    const domain = doc.element.dataset.domain;
    const documentId = doc.element.dataset.id;
    const tagpath = doc.element.dataset.tagpath;

    if (!restore) {
        const mode = doc.element.getAttribute("mode");

        // capture active document context
        this.activeDocumentId = documentId;

        if (mode == "view")
            this.selectedHeadingIndex = GetSelectedHeadingIndex(doc.docViewer());
    }

    // update document title
    document.title = `${domain} ${tagpath}`;

    // put document URL in history
    history.replaceState(null, "", `/${domain}/${documentId}`);
}

Explorer.prototype.OnDocumentClosed = function (doc) {
    // reset active document context
    this.activeDocumentId = null;
    this.selectedHeadingIndex = -1;

    // update domain title
    document.title = `${this.domain}`;

    // put domain URL in history
    history.replaceState(null, "", `/${this.domain}`);
}