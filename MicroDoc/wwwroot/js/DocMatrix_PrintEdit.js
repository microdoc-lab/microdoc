DocMatrix.prototype.InitPrintEdit = function (options) {
    this.debug('InitPrintEdit');

    var docMatrix = this;
    var modal = this.modal();
    var container = this.printContainer();

    // restore modal from background on click
    modal.addEventListener("click", async event => {
        if (!docMatrix.isModalOpened())
            return;

        if (!this.isModalBackground())
            return;

        // obtain restore contect
        const domain = modal.restoreInfo.domain;
        const documentId = modal.restoreInfo.documentId;
        const headingIndex = modal.restoreInfo.headingIndex;

        // save editing document
        const docElement = docMatrix.docElement(domain, documentId);
        if (docElement) {
            const mode = docElement.getAttribute("mode");
            if (mode == "edit")
                await docElement.doc.ToggleMode();
        }

        // restore modal from background
        modal.classList.remove("background");

        // locate doc in modal
        const docInReport = this.docInReport(domain, documentId);
        if (!docInReport)
            return;

        // locate heading to select
        const headings = docInReport.querySelectorAll("h1, h2, h3");
        const heading = headingIndex < headings.length ? headings[headingIndex] : headings[0];

        if (!heading)
            return;

        // select heading
        SelectElement(heading);

        // scroll to clicked heading (print preview TOC)
        if (!IsFullyVisibleAndAboveMiddle(heading, container))
            heading.scrollIntoView({ behavior: "auto", block: "start" });

        modal.scrollTo({ behavior: 'auto', top: 0 });

        // add selected class to heading
        container.querySelectorAll("h1, h2, h3").forEach(heading => heading.classList.remove('selected'));
        heading.classList.add('selected');

        // update browser URL
        modal.restoreCallback();
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitPrintEdit);

DocMatrix.prototype.EditPrintDocument = async function () {
    this.log("EditPrintDocument");

    if (!this.isModalOpened())
        return;

    var container = this.printContainer();

    var selectedHeading = container.querySelector("doc :is(h1, h2, h3).selected");

    if (!selectedHeading)
        return;

    var docInReport = selectedHeading.closest("doc");

    // obtain document context
    const domain = docInReport.dataset.domain;
    const documentId = docInReport.dataset.id;

    // find selected heading index
    const headings = docInReport.querySelectorAll("h1, h2, h3");
    const headingIndex = [...headings].indexOf(selectedHeading);

    // open document
    var result = await this.LoadAndOpenDocument(domain, documentId, headingIndex);
    if (!result)
        return;

    var modal = this.modal();

    // init modal restore info (domain, documentId, headingIndex)
    modal.restoreInfo = { domain: domain, documentId: documentId, headingIndex: headingIndex };

    // send modal to background
    modal.classList.add("background");

    // locate opened document
    const docElement = this.docElement(domain, documentId);
    if (!docElement)
        return;

    // switch to edit mode
    const mode = docElement.getAttribute("mode");
    if (mode == "view")
        docElement.doc.ToggleMode();
}

// HandleDocChangesPrint
DocMatrix.prototype.HandleDocChangesPrint = async function (change) {

    var modal = this.modal();
    var container = this.printContainer();

    switch (change.op) {

        case "SaveDocument":
            // handle only own changes
            if (!change.external) {
                // locate doc in modal
                var docInReport = this.docInReport(change.domain, change.documentId);
                if (!docInReport)
                    return;

                // update doc HTML
                docInReport.innerHTML = change.html;

                // refresh docInReport
                docInReport = this.docInReport(change.domain, change.documentId);

                // remove hover style
                container.querySelectorAll(".hover").forEach(el => el.classList.remove("hover"));

                // remove selected style
                container.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));

                // number Headings
                var index = 0;
                container.querySelectorAll("h1, h2, h3").forEach(heading => {
                    heading.style.setProperty('--index', index++);
                    heading.setAttribute("content", heading.textContent);
                    heading.title = heading.textContent;
                });

                // locate heading to select
                const headingIndex = modal.restoreInfo.headingIndex;
                const headings = docInReport.querySelectorAll("h1, h2, h3");
                const heading = headingIndex < headings.length ? headings[headingIndex] : headings[0];

                // select heading
                if (heading) {
                    SelectElement(heading);
                    heading.classList.add('selected');
                }
            }

            break;

        case "DeleteDocument":
            // handle only own changes
            if (!change.external) {
                // locate doc in modal
                var docInReport = this.docInReport(change.domain, change.documentId);
                if (!docInReport)
                    return;

                // remove document element
                docInReport.remove();

                // reset docInReport
                docInReport = null;

                // number Headings
                var index = 0;
                container.querySelectorAll("h1, h2, h3").forEach(heading => {
                    heading.style.setProperty('--index', index++);
                    heading.setAttribute("content", heading.textContent);
                    heading.title = heading.textContent;
                });
            }

            break;
    }
}

DocMatrix.prototype.changeHandlers.push(DocMatrix.prototype.HandleDocChangesPrint);