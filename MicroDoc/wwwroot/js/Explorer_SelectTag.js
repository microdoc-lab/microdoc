Explorer.prototype.InitSelectTag = function (options) {
    this.log('InitSelectTag');

    var explorer = this;

    // synchronize DocMatrix with selected tag in TagTree
    this.tagTree().options.OnNodeSelected = this.tagTree().OnNodeSelected = function (tagId) {
        explorer.docMatrix().Load(tagId);
    };
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitSelectTag);

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
    if (docElement)
        docElement.doc.OnActivation(true);
    else
        docMatrix.LoadDocumentAndOpen(this.domain, activeDocumentId);
}