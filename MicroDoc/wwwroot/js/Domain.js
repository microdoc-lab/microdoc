function Domain(options) {
    this.options = options;
    this.container = document.querySelector("#domainExplorers");

    this.log = function (text) { console.log(`Domain: ${text}`); }
    this.error = function (text, error) { console.error(text, error); alert(text + "\n\n" + error); }

    window.domain = this;

    // prompt user to save&close editing document on browser tab close/reload
    window.addEventListener("beforeunload", e => {
        var docElement = document.querySelector('.explorerHost[style*="display: flex"] .explorer .overlay .doc[mode=edit]')
            ?? document.querySelector('.explorerHost[style*="display: none"] .explorer .overlay .doc[mode=edit]');
        if (docElement) {
            var explorerElement = docElement.closest(".explorer");
            this.ActivateExplorer(explorerElement);
            docElement.doc.txtEditor().focus();

            e.preventDefault();
            e.returnValue = "Please close all active document editors";
        }
    });

    // close document viewer with active selection on ESC
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const selection = window.getSelection();

            if (!selection || selection.isCollapsed)
                return;

            // locate and check viewer
            const viewer = selection.anchorNode.closest(".viewer");
            if (!viewer)
                return;

            const docElement = viewer.closest(".doc");
            if (!docElement)
                return;

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
Domain.prototype.OpenExplorer = function(domain, selectedTag) {
    var explorerId = "explorer" + domain.replaceAll(".", "_").replaceAll(" ", "_");

    var element = document.getElementById(explorerId);
    if (element) {
        if (element.parentElement.style.display == "none") {
            this.ActivateExplorer(element);
        }
        return;
    }

    var parent = document.createElement("div");
    parent.className = "explorerHost";
    parent.domain = domain;

    var backgroundVersion = this.options.DomainBackgroundVersions[domain];
    parent.style.backgroundImage = `url("/Home/Background?domain=${domain}&v=${backgroundVersion}")`;

    element = document.createElement("div");
    element.id = explorerId;
    parent.appendChild(element);
    this.container.appendChild(parent);

    var explorer = new Explorer(element);
    explorer.domain = domain;
    explorer.selectedTag = selectedTag;

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