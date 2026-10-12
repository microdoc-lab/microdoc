// HandleCRUD
DocMatrix.prototype.HandleCRUD = async function (change) {

    switch (change.op) {

        case "SaveDocument":
            var docElement = this.docElement(change.domain, change.documentId);
            var docInCell = this.docInCell(change.domain, change.documentId);

            if (docElement)
                docElement.doc.UpdateDocument(change);

            if (docInCell)
                this.UpdateDocumentInCell(docInCell, change);
            else
                this.CreateDocumentInCellMisc(change);

            break;

        case "DeleteDocument":
            var docElement = this.docElement(change.domain, change.documentId);
            var docInCell = this.docInCell(change.domain, change.documentId);

            if (docElement)
                docElement.doc.CloseDocument();

            if (docInCell)
                this.DeleteDocumentInCell(docInCell);

            break;
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleCRUD);

DocMatrix.prototype.CreateDocumentInCellMisc = function (doc) {
    var tag = this.TagParent(doc.documentId);
    var row = this.tagRow(tag);
    if (!row)
        return;

    var docCell = row.querySelector("td.misc");
    if (!docCell)
        return;

    var docInCell = document.createElement("doc");
    docInCell.dataset.domain = doc.domain;
    docInCell.dataset.id = doc.documentId;
    docInCell.dataset.document = this.DocName(doc.documentId);
    docInCell.dataset.name = docInCell.dataset.document + ".txt";

    docInCell.dataset.content = doc.content;
    docInCell.innerHTML = doc.html;

    docCell.querySelector("clip").appendChild(docInCell);
}

DocMatrix.prototype.UpdateDocumentInCell = function (docInCell, doc) {
    docInCell.dataset.content = doc.content;
    docInCell.innerHTML = doc.html;
}

DocMatrix.prototype.DeleteDocumentInCell = function(docInCell) {
    // remove document from MISC column
    if (docInCell.closest("td").classList.contains("misc")) {
        docInCell.remove();
    }
    else {
        // clear single-document cell
        docInCell.dataset.content = null;
        docInCell.innerHTML = null;
    }
}