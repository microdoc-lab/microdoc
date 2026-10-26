Explorer.prototype.InitDocuments = function (options) {
    this.debug('InitDocuments');

    this.ReadCookie();
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitDocuments);

Explorer.prototype.GetCookieName = function () { return `${this.domain}ActiveDocuments`; }

Explorer.prototype.ReadCookie = function () {
    const name = this.GetCookieName();
    const prefix = `${name}=`;

    const value = document.cookie
        .split("; ")
        .find(cookie => cookie.startsWith(prefix))
        ?.substring(prefix.length);

    if (!value)
        this.cookieState = { documents: [], activationHistory: [] };

    try {
        const state = JSON.parse(decodeURIComponent(value));
        if (!state.documents)
            state.documents = [];

        if (!state.activationHistory)
            state.activationHistory = [];

        this.cookieState = state;
    }
    catch {
        this.cookieState = { documents: [], activationHistory: [] };
    }
};

Explorer.prototype.WriteCookie = function () {
    const name = this.GetCookieName();
    const value = encodeURIComponent(JSON.stringify(this.cookieState));

    document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

/* Tree */
Explorer.prototype.SetCookieTag = function (tag, search, deep) {
    this.cookieState.tag = tag;
    this.cookieState.search = search;
    this.cookieState.deep = deep;

    this.WriteCookie();
}

/* Document */
Explorer.prototype.AddCookieDocument = function (documentId, headingIndex) {
    var doc = this.cookieState.documents.find(doc => doc.id === documentId);
    if (doc)
        doc.ind = headingIndex;
    else
        this.cookieState.documents.push({ id: documentId, ind: headingIndex });

    this.cookieState.activationHistory = this.cookieState.activationHistory.filter(id => id !== documentId);

    this.cookieState.activationHistory.unshift(documentId);

    this.WriteCookie();
}

Explorer.prototype.RemoveCookieDocument = function(documentId) {
    this.cookieState.documents = this.cookieState.documents.filter(doc => doc.id !== documentId);

    this.cookieState.activationHistory = this.cookieState.activationHistory.filter(id => id !== documentId);

    this.WriteCookie();

    return this.GetCookieRecentDocument();
}

Explorer.prototype.GetCookieRecentDocument = function () { return this.cookieState.activationHistory[0] ?? null; }

Explorer.prototype.GetCookieDocumentHeadingIndex = function (documentId) { return this.cookieState.documents.find(doc => doc.id === documentId)?.ind ?? null; }