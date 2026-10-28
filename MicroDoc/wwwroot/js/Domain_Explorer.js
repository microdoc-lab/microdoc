Domain.prototype.InitDomainExplorer = function (options) {
    this.debug('InitDomainExplorer');

    // handle browser Back button
    window.addEventListener("popstate", async () => {
        var parts = location.pathname.split('/');

        this.popState = true;
        try {
            if (parts.length < 2) {         // incorrect
            } else if (parts.length == 2)   // domain only
                await this.OpenExplorer(parts[1], "");
            else                            // domain + document
                await this.OpenExplorer(parts[1], parts.slice(2).join("/"));
        }
        finally {
            this.popState = false;
        }
    });

    // prompt user to save&close editing document on browser tab close/reload
    window.addEventListener("beforeunload", e => {

        // check opened domain options window
        if (this.domainOptions.style.display == "block" && this.domainOptionsEditor.content != this.domainOptionsEditor.value) {
            e.preventDefault();
            e.returnValue = "Please close domain options editor";
            return;
        }

        // find first editing document (current domain first)
        var docElement = [...document.querySelectorAll('.explorerHost[style*="display: flex"] .explorer .overlay .doc[mode=edit]')]
            .find(doc => doc.doc.txtEditor().value != doc.dataset.content)
            ?? [...document.querySelectorAll('.explorerHost[style*="display: none"] .explorer .overlay .doc[mode=edit]')]
                .find(doc => doc.doc.txtEditor().value != doc.dataset.content);

        // prompt user to close editing documents
        if (docElement) {
            var explorerElement = docElement.closest(".explorer");
            // activate explorer
            this.ActivateExplorer(explorerElement);
            // focus editing document
            docElement.doc.txtEditor().focus();

            e.preventDefault();
            e.returnValue = "Please close all active document editors";
            return;
        }
    });

    // close document viewer (with active selection) on ESC
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            // skip if modal window opened
            if (document.querySelector('.explorerHost[style*="display: flex"] .explorer .modal[style*="display: block"]'))
                return;

            // current document viewer can be determined by having selection in it
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed)
                return;

            // locate and check viewer
            const viewer = selection.anchorNode.closest(".viewer");
            if (!viewer)
                return;

            // locate and check doc
            const docElement = viewer.closest(".doc");
            if (!docElement)
                return;

            // close document
            docElement.doc.CloseDocument();
        }
    });

    // AdjustImageGalleryPositionAndVisibility on window resize
    window.addEventListener("resize", () => {
        document.querySelectorAll(".explorer .overlay .doc .viewer, .explorer .modal .doc-container .scroll-area").forEach(container =>
            AdjustImageGalleryPositionAndVisibility(container));
    });    
}

Domain.prototype.behaviors.push(Domain.prototype.InitDomainExplorer);

Domain.prototype.HistoryNavigate = async function (url) {
    if (!this.popState)
        history.pushState(null, "", url);
}

Domain.prototype.OpenExplorer = async function (domain, activeDocumentId) {
    this.log(`OpenExplorer domain: ${domain}, activeDocumentId: ${activeDocumentId}`);

    // translate domain into explorerId
    var explorerId = this.ExplorerId(domain);

    // if explorer already opened and not visible - activate it along with document
    var element = document.getElementById(explorerId);
    if (element) {
        if (element.parentElement.style.display == "none")
            this.ActivateExplorer(element);
        
        // in no document required - take first from history
        if (!activeDocumentId)
            activeDocumentId = element.explorer.GetCookieRecentDocument();

        // activate required document
        await element.explorer.ActivateDocumentOrLoadAndOpen(activeDocumentId);

        return;
    }

    // create explorer host
    var host = document.createElement("div");
    host.className = "explorerHost";
    host.domain = domain;

    // set background url, obtain background version from options
    var backgroundVersion = this.options.domainBackgroundVersions[domain];
    host.style.display = "none";
    host.style.backgroundImage = `url("/Home/Background?domain=${domain}&v=${backgroundVersion}")`;

    // create explorer 
    element = document.createElement("div");
    element.id = explorerId;

    // add component to DOM
    host.appendChild(element);
    this.element.appendChild(host);

    // setup client component
    var options = {};
    const explorer = GetInstanceOrCreate(element.parentElement, () => new Explorer(element, options));
    explorer.domain = domain;

    // obtain selected tag from cookies
    explorer.ReadCookie();
    explorer.selectedTag = explorer.cookieState.tag ?? "";
    explorer.loadDeepLevels = explorer.cookieState.deep ?? false;

    // load explorer content
    await explorer.Reload();

    // init TagTree search
    if (explorer.cookieState.search)
        explorer.tagTree().Search(explorer.cookieState.search);

    // init docMatrix search
    if (explorer.cookieState.gridFilters.length)
        explorer.docMatrix().Search(explorer.cookieState.gridFilters);

    // activate explorer
    this.ActivateExplorer(document.getElementById(explorerId));

    // restore opened documents
    const state = explorer.cookieState;
    for (const doc of state.documents) {
        await explorer.ActivateDocumentOrLoadAndOpen(doc.id);
    }

    // activate required document
    await explorer.ActivateDocumentOrLoadAndOpen(activeDocumentId);
}

Domain.prototype.ActivateExplorer = function (element) {
    // toggle explorer
    document.querySelectorAll(`.explorer:not(#${element.id})`).forEach(other => {
        other.parentElement.style.display = "none";
    });

    document.querySelector(".landing-page").style.display = "none";

    element.parentElement.style.display = "flex";

    // toggle link
    document.querySelectorAll(`a.explorer-link:not([data-domain="${element.parentElement.domain}"])`).forEach(other => {
        other.classList.remove("selected");
    });

    document.querySelector(".landing-page-link").classList.remove("selected");

    document.querySelectorAll(`a.explorer-link[data-domain="${element.parentElement.domain}"]`).forEach(other => {
        other.classList.add("selected");
    });
}

Domain.prototype.ShowLandingPage = function () {
    // hide explorers
    document.querySelectorAll(".explorer").forEach(other => {
        other.parentElement.style.display = "none";
    });

    document.querySelector(".landing-page").style.display = "block";

    // toggle link
    document.querySelectorAll("a.explorer-link").forEach(other => {
        other.classList.remove("selected");
    });

    document.querySelector(".landing-page-link").classList.add("selected");

    // update landing page title
    document.title = "MicroDoc";

    // put base URL in history
    this.HistoryNavigate("/Home/LandingPage");
}