// HandleDocChanges
DocMatrix.prototype.HandleDocChanges = async function (change) {

    switch (change.op) {

        case "SaveDocument":
            var docElement = this.docElement(change.domain, change.documentId);
            var docInCell = this.docInCell(change.domain, change.documentId);

            if (docElement) {
                var docViewer = docElement.doc.docViewer();
                var txtEditor = docElement.doc.txtEditor();
                var mode = docElement.getAttribute("mode");
                var isFocusedEditor = txtEditor == document.activeElement;

                const headingIndexView = GetSelectedHeadingIndexViewer(docViewer);
                const headingIndexEdit = GetHeadingIndexAtCursor(txtEditor);

                if (change.external) {
                    if (mode == "edit") {                                       // external edit
                        if (confirm(`Document ${change.domain}: ${change.documentId} was changed by another user. Reload?`)) {
                            docElement.dataset.content = change.content;        // confirmed - update document in editor, focus if was focused
                            docViewer.innerHTML = change.html;
                            txtEditor.value = change.content;

                            txtEditor.AdjustHeight(txtEditor);
                            txtEditor.SelectAndScroll(headingIndexEdit, isFocusedEditor);
                        }
                        else {
                            docElement.dataset.content = change.content;        // not confirmed - update content
                            docViewer.innerHTML = change.html;
                        }
                    } else {                // external view
                        docElement.dataset.content = change.content;            // update viewer
                        docViewer.innerHTML = change.html;
                        txtEditor.value = change.content;

                        docViewer.SelectAndScroll(headingIndexView);
                    }
                } else {
                    if (mode == "edit") {   // local edit
                        docElement.dataset.content = change.content;            // update editor, no focus logic (in toggle)
                        docViewer.innerHTML = change.html;
                        txtEditor.value = change.content;

                        txtEditor.AdjustHeight(txtEditor);
                    } else {                // local view
                        docElement.dataset.content = change.content;            // update viewer, no focus logic (in toggle)
                        docViewer.innerHTML = change.html;
                        txtEditor.value = change.content;
                    }
                }
            }

            if (docInCell)
                this.UpdateDocumentInCell(docInCell, change);
            else
                this.CreateDocumentInCellMisc(change);

            break;

        case "DeleteDocument":
            var docElement = this.docElement(change.domain, change.documentId);
            var docInCell = this.docInCell(change.domain, change.documentId);
            var mode = docElement.getAttribute("mode");

            if (docElement) {
                if (mode == "edit" && change.external) {
                    if (confirm(`Document ${change.domain}: ${change.documentId} was deleted by another user. Close opened editor?`))
                        docElement.doc.CloseDocument();     // confirmed delete - close document
                    else
                        docElement.dataset.content = "";    // not confirmed - remain opened, reset content, can be re-saved
                }
                else
                    docElement.doc.CloseDocument();
            }

            if (docInCell)
                this.DeleteDocumentInCell(docInCell);

            break;
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleDocChanges);

DocMatrix.prototype.CreateDocumentInCellMisc = function (doc) {
    var tag = DocParser.TagParent(doc.documentId);
    var row = this.tagRow(tag);
    if (!row)
        return;

    var docCell = row.querySelector("td.misc");
    if (!docCell)
        return;

    var docInCell = document.createElement("doc");
    docInCell.dataset.domain = doc.domain;
    docInCell.dataset.tagpath = DocParser.DocTagPath(doc.documentId);
    docInCell.dataset.id = doc.documentId;
    docInCell.dataset.document = DocParser.DocName(doc.documentId);
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
        docInCell.dataset.content = "";
        docInCell.innerHTML = "";
    }
}