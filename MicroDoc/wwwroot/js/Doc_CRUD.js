Doc.prototype.CloseDocument = function () {
    var overlay = this.overlay();
    var toolbar = this.toolbar();
    var docElement = this.element;

    // remove docElement
    overlay.removeChild(docElement);
    // hide toolbar
    toolbar.style.visibility = "hidden";
    // reset toolbar context
    toolbar.dataset.domain = null;
    toolbar.dataset.id = null;
}

Doc.prototype.SaveDocument = async function () {
    var docMatrix = this.docMatrix();
    var docElement = this.element;
    var txtEditor = this.txtEditor();

    // obtain document context
    var domain = docElement.dataset.domain;
    var documentId = docElement.dataset.id;
    var content = txtEditor.value;

    var docPath = docMatrix.DocPath(domain, documentId);

    // save document
    const response = await this.service.SaveDocument(domain, documentId, content);
    if (!response.ok) {
        this.error(`Save document ${docPath} failed`, await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    window.domain.PublishChanges(data.changes);
}

Doc.prototype.DeleteDocument = async function () {
    var docMatrix = this.docMatrix();
    var docElement = this.element;

    // obtain document context
    var domain = docElement.dataset.domain;
    var documentId = docElement.dataset.id;

    var docPath = docMatrix.DocPath(domain, documentId);

    // save document
    const response = await this.service.DeleteDocument(domain, documentId);
    if (!response.ok) {
        this.error(`Delete document ${docPath} failed`, await response.text());
        return;
    }

    // PublishChanges
    var data = await response.json();
    window.domain.PublishChanges(data.changes);
}