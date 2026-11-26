Doc.prototype.CloseDocument = function () {
    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var docElement = this.element;
    var explorer = this.explorer();
    var docMatrix = this.docMatrix();

    var domain = docElement.dataset.domain;
    var documentId = docElement.dataset.id;

    this.log(`CloseDocument domain: ${domain}, documentId: ${documentId}`);

    // remove docElement
    overlay.removeChild(docElement);
    // hide toolbar
    toolbar.style.visibility = "hidden";
    // reset toolbar context
    toolbar.dataset.domain = null;
    toolbar.dataset.id = null;

    docMatrix.UnselectDocument(docElement);
    explorer.OnDocumentClosed(this);
}

Doc.prototype.SaveDocument = async function () {
    var docElement = this.element;
    var txtEditor = this.txtEditor();

    // obtain document context
    var domain = docElement.dataset.domain;
    var documentId = docElement.dataset.id;
    var content = txtEditor.value;

    var docPath = DocParser.DocPath(documentId);

    this.log(`SaveDocument domain: ${domain}, documentId: ${documentId}`);

    // save document
    const response = await this.service.SaveDocument(domain, documentId, content);
    if (!response.ok) {
        this.error(format(Loc.Document_SaveFailed, docPath), await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    await window.domain.PublishChanges(data.changes);
}

Doc.prototype.DeleteDocument = async function () {
    var docElement = this.element;

    // obtain document context
    var domain = docElement.dataset.domain;
    var documentId = docElement.dataset.id;

    var docPath = DocParser.DocPath(documentId);

    this.log(`DeleteDocument domain: ${domain}, documentId: ${documentId}`);

    // save document
    const response = await this.service.DeleteDocument(domain, documentId);
    if (!response.ok) {
        this.error(format(Loc.Document_DeleteFailed, docPath), await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    await window.domain.PublishChanges(data.changes);
}