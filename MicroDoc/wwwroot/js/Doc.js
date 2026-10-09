function Doc(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.doc = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`Doc #${this.id}: ${text}`); }
    this.error = function (text, error) { console.error(text, error); alert(text + "\n\n" + error); }

    if (options.style)
        element.setAttribute('style', options.style);

    this.service = new DocService();
}

Doc.prototype.behaviors = [];

Doc.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

// Api
Doc.prototype.explorer = function () { return this.element.closest(".explorer").explorer; }
Doc.prototype.docMatrix = function () { return this.element.closest(".explorer").querySelector(".docmatrix").docMatrix; }
Doc.prototype.overlay = function () { return this.element.closest(".explorer").querySelector(".overlay"); }
Doc.prototype.toolbar = function () { return this.element.closest(".explorer").querySelector(".overlay .toolbar"); }

Doc.prototype.docViewer = function () { return this.element.querySelector(".viewer"); }
Doc.prototype.txtEditor = function () { return this.element.querySelector(".editor"); }

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

Doc.prototype.SaveDocument = async function (close) {
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

    if (close)
        this.CloseDocument();

    // update cell in grid
    var formattedContent = await response.text();

    // update cell after save
    var docInCell = docMatrix.docInCell(domain, documentId);
    if (docInCell) {
        docInCell.dataset.content = content;
        docInCell.innerHTML = formattedContent;
    }

    return formattedContent;
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

    this.CloseDocument();

    // clear cell after save
    var docInCell = docMatrix.docInCell(domain, documentId);
    if (docInCell) {
        // remove document from MISC column
        if (docInCell.closest("td").classList.contains("nameonly")) {
            docInCell.remove();
        }
        else {
            // clear single-document cell
            docInCell.dataset.content = null;
            docInCell.innerHTML = null;
        }
    }
}

// Service methods
function DocService() { }

DocService.prototype.SaveDocument = function (domain, documentId, content) {
    return fetch("/Home/SaveDocument", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            documentId: documentId,
            content: content
        })
    });
}

DocService.prototype.DeleteDocument = function (domain, documentId) {
    return fetch("/Home/DeleteDocument", {
        method: "POST",
        body: new URLSearchParams({
            domain: domain,
            documentId: documentId
        })
    });
}

DocService.prototype.UploadImage = function (domain, documentId, imageName, image) {
    const formData = new FormData();
    formData.append("domain", domain);
    formData.append("documentId", documentId);
    formData.append("imageName", imageName);
    formData.append("image", image);

    return fetch("/Home/UploadImage", {
        method: "POST",
        body: formData
    });
}