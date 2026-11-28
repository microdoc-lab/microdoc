Explorer.prototype.InitNavigation = function (options) {
    this.debug('InitNavigation');

    var tagTree = this.tagTree();
    var docMatrix = this.docMatrix();

    this.disableTagTreeDocMatrixSync = false;

    // synchronize DocMatrix with selected tag in TagTree
    // store selectedTag in cookie
    tagTree.options.OnTagSelected = tagTree.OnTagSelected = tagId => {
        this.selectedTag = tagId;
        this.SetCookieTag(this.selectedTag, this.search, this.loadDeepLevels);

        if (this.disableTagTreeDocMatrixSync)
            docMatrix.selectedTag = tagId;
        else {
            if (this.loadDeepLevels)
                docMatrix.ScrollToSelectedRow(tagId);
            else
                docMatrix.Load(tagId, this.loadDeepLevels);
        }
    };

    // store search in cookie
    tagTree.options.OnSearchChanged = tagTree.OnSearchChanged = value => {
        this.search = value;
        this.SetCookieTag(this.selectedTag, this.search, this.loadDeepLevels);
    };

    // store loadDeepLevels in cookie
    docMatrix.options.OnLoadDeepLevelsChanged = docMatrix.OnLoadDeepLevelsChanged = value => {
        this.loadDeepLevels = value;
        this.SetCookieTag(this.selectedTag, this.search, this.loadDeepLevels);
    };

    // store loadDeepLevels in cookie
    docMatrix.options.OnSearchChanged = docMatrix.OnSearchChanged = value => {
        this.SetCookieGridFilter(value);
    };

    // scroll docMatrix to selected tag
    if (this.loadDeepLevels)
        setTimeout(() => docMatrix.ScrollToSelectedRow(), 0);
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitNavigation);

Explorer.prototype.ActivateRecentDocument = async function () {
    var activeDocumentId = this.GetCookieRecentDocument();
    this.ActivateDocumentOrLoadAndOpen(activeDocumentId);
}

Explorer.prototype.ActivateDocumentOrLoadAndOpen = async function (documentId, isActiveDocument) {
    this.log(`ActivateDocumentOrLoadAndOpen documentId: ${documentId}`);

    var docMatrix = this.docMatrix();

    if (docMatrix.isModalOpened() && !docMatrix.isModalBackground())
        docMatrix.ClosePrint();

    if (!documentId) {
        if (!this.docMatrix().docSelected()) {
            // update domain title
            document.title = `${this.domain}`;

            // put domain URL in history
            window.domain.HistoryNavigate(`/${this.domain}`);
        }

        return;
    }

    ({ documentId, isDeep, isPrint } = DocParser.IsDocPrint(documentId));

    // try open column print dialog
    if (isPrint && !DocParser.DocType(documentId)) {
        const docTag = DocParser.TagParent(documentId);
        const document = DocParser.DocName(documentId);
        const { tag, search } = DocParser.ParseTagAndFilter(docTag);

        // navigate docMatrix to tag
        if (this.selectedTag != tag || this.loadDeepLevels != isDeep)
            await docMatrix.Load(tag, isDeep);

        // setup docMatrix filters
        if (search) {
            var filter = DocParser.ParseCookieGridFilterUrl(search);
            docMatrix.Search(filter);
        }

        await docMatrix.OpenPrintColumn(document);
        return;
    }

    var selectedHeadingIndex = this.GetCookieDocumentHeadingIndex(documentId);

    // activate document or load document and open
    var docElement = docMatrix.docElement(this.domain, documentId);
    if (docElement) {
        this.OnDocumentActivated(docElement.doc, true);

        const mode = docElement.getAttribute("mode");

        // restore active document
        if (mode == "view")
            docElement.doc.docViewer().SelectAndScroll(selectedHeadingIndex);
        if (mode == "edit")
            docElement.doc.txtEditor().focus();
    }
    else {
        const result = await docMatrix.LoadAndOpenDocument(this.domain, documentId, selectedHeadingIndex, true);
        if (!result) { 
            this.RemoveCookieDocument(documentId);

            if (isActiveDocument && !this.docMatrix().docSelected()) {
                // update domain title
                document.title = `${this.domain}`;

                // put domain URL in history
                window.domain.HistoryNavigate(`/${this.domain}`);
            }
        }
    }

    if (isPrint) {
        docElement = docMatrix.docElement(this.domain, documentId);
        if (docElement)
            await docMatrix.OpenPrintDocument(docElement);
    }
}

Explorer.prototype.OnDocumentActivated = function (doc, restore) {
    // capture document context
    const domain = doc.element.dataset.domain;
    const documentId = doc.element.dataset.id;
    const tagpath = DocParser.DocPath(documentId);

    var selectedHeadingIndex = 0;
    if (!restore) {
        const mode = doc.element.getAttribute("mode");

        // capture active document context
        this.activeDocumentId = documentId;

        if (mode == "view")
            selectedHeadingIndex = GetSelectedHeadingIndex(doc.docViewer());
        if (mode == "edit")
            selectedHeadingIndex = GetHeadingIndexAtCursor(doc.txtEditor());
    }

    // update document title
    document.title = `${domain} ${tagpath}`;

    // put document URL in history
    window.domain.HistoryNavigate(`/${domain}/${documentId}`);

    // store active document
    this.AddCookieDocument(documentId, selectedHeadingIndex);
}

Explorer.prototype.OnColumnPrintDialogOpened = function (column) {
    // capture document context
    const domain = this.domain;
    const selectedTag = this.selectedTag;
    const tagpath = DocParser.TagPath("", selectedTag);
    const path = selectedTag + DocParser.GetCookieGridFilterUrl(this.cookieState.gridFilters);
    const deep = this.loadDeepLevels ? ".deep" : "";

    // update document title
    document.title = `${domain} ${tagpath} ${column} print`;

    // put document URL in history
    if (path)
        window.domain.HistoryNavigate(`/${domain}/${path}/${column}${deep}.print`);
    else
        window.domain.HistoryNavigate(`/${domain}/${column}${deep}.print`);
}

Explorer.prototype.OnDocumentPrintDialogOpened = function (doc) {
    // capture document context
    const domain = doc.element.dataset.domain;
    const documentId = doc.element.dataset.id;
    const tagpath = DocParser.DocPath(documentId);

    // update document title
    document.title = `${domain} ${tagpath} print`;

    // put document URL in history
    window.domain.HistoryNavigate(`/${domain}/${documentId}.print`);
}

Explorer.prototype.OnDocumentEditorSelectionChanged = function (doc) {
    // capture document context
    const documentId = doc.element.dataset.id;
    const selectedHeadingIndex = GetHeadingIndexAtCursor(doc.txtEditor());

    // store active document
    this.AddCookieDocument(documentId, selectedHeadingIndex);
}

Explorer.prototype.OnDocumentClosed = async function (doc) {
    // remove active document
    this.RemoveCookieDocument(doc.documentId);

    // activate recent document
    this.ActivateRecentDocument();
}