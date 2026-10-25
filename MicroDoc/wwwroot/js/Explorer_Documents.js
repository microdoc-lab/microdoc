Explorer.prototype.InitDocuments = function (options) {
    this.debug('InitDocuments');

    this.cookieState = this.ReadCookie();
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
        return { documents: [], activationHistory: [] };

    try {
        const state = JSON.parse(decodeURIComponent(value));

        return {
            documents: state.documents ?? [],
            activationHistory: state.activationHistory ?? []
        };
    }
    catch {
        return { documents: [], activationHistory: [] };
    }
};

Explorer.prototype.WriteCookie = function () {
    const name = this.GetCookieName();
    const value = encodeURIComponent(JSON.stringify(this.cookieState));

    document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

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