function Domain(options) {
    this.options = options;
    this.container = document.querySelector("#domainExplorers");

    this.log = function (text) { console.log(`Domain: ${text}`); }
    this.error = function (text, error) { console.error(text, error); alert(text + "\n\n" + error); }

    window.domain = this;

    // prompt user to save&close editing document on browser tab close/reload
    window.addEventListener("beforeunload", e => {
        // find first editing document (current domain first)
        var docElement = document.querySelector('.explorerHost[style*="display: flex"] .explorer .overlay .doc[mode=edit]')
            ?? document.querySelector('.explorerHost[style*="display: none"] .explorer .overlay .doc[mode=edit]');

        // prompt user to close editing documents
        if (docElement) {
            var explorerElement = docElement.closest(".explorer");
            // activate explorer
            this.ActivateExplorer(explorerElement);
            // focus editing document
            docElement.doc.txtEditor().focus();

            e.preventDefault();
            e.returnValue = "Please close all active document editors";
        }
    });

    // close document viewer (with active selection) on ESC
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
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

    this.service = new DomainService();
}

Domain.prototype.behaviors = [];

Domain.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

// Api
Domain.prototype.OpenExplorer = function (domain, selectedTag) {

    // translate domain into explorerId
    var explorerId = "explorer" + domain.replaceAll(".", "_").replaceAll(" ", "_");

    // if explorer already opened and not visible - activate it
    var element = document.getElementById(explorerId);
    if (element) {
        if (element.parentElement.style.display == "none") {
            this.ActivateExplorer(element);
        }
        return;
    }

    // create explorer host
    var host = document.createElement("div");
    host.className = "explorerHost";
    host.domain = domain;

    // set background url, obtain background version from options
    var backgroundVersion = this.options.domainBackgroundVersions[domain];
    host.style.backgroundImage = `url("/Home/Background?domain=${domain}&v=${backgroundVersion}")`;

    // create explorer 
    element = document.createElement("div");
    element.id = explorerId;

    // add component to DOM
    host.appendChild(element);
    this.container.appendChild(host);

    // setup client component
    var options = {};
    var explorer = new Explorer(element, options);
    explorer.domain = domain;
    explorer.selectedTag = selectedTag;

    // load explorer content
    explorer.Reload();

    this.ActivateExplorer(element);
}

Domain.prototype.ActivateExplorer = function(element) {
    // toggle explorer
    document.querySelectorAll(`.explorer:not(#${element.id})`).forEach(other => {
        other.parentElement.style.display = "none";
    });

    element.parentElement.style.display = "flex";

    // toggle link
    document.querySelectorAll(`a.explorer-link:not([data-domain="${element.parentElement.domain}"])`).forEach(other => {
        other.classList.remove("selected");
    });

    document.querySelectorAll(`a.explorer-link[data-domain="${element.parentElement.domain}"]`).forEach(other => {
        other.classList.add("selected");
    });
}

// Service methods
function DomainService() { }

DomainService.prototype.LoadDomainOptions = function () {
    return fetch("/Home/LoadDomainOptions");
}

DomainService.prototype.SaveDomainOptions = function (yaml) {
    return fetch("/Home/SaveDomainOptions", {
        method: "POST",
        body: new URLSearchParams({
            yaml: yaml
        })
    });
}