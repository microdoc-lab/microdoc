var domainInstanceId = 0;

function Domain(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.domain = this;

    this.instanceId = ++domainInstanceId;

    this.element = element;
    this.options = options;

    this.id = element.id;

    this.debug = function (text) { console.debug(`Domain #${this.id}: ${text}`); }
    this.info = function (text) { console.info(`Domain #${this.id}: ${text}`); }
    this.log = function (text) { console.log(`Domain #${this.id}: ${text}`); }
    this.warn = function (text) { console.warn(`Domain #${this.id}: ${text}`); }
    this.error = function (text, error) { console.error(`Domain: ${text}`, error); alert(text + "\n\n" + error); }

    if (options.style)
        element.setAttribute('style', options.style);

    window.domain = this;

    this.service = new DomainService();

    this.log(`new instance #${this.instanceId}`);
}

Domain.prototype.behaviors = [];
Domain.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

Domain.prototype.PublishChanges = function (changes) {
    for (const change of changes) {
        // translate domain events
        if (change.domain) {
            var explorerId = this.ExplorerId(change.domain);
            var element = document.getElementById(explorerId);
            if (element)
                element.explorer.ApplyChanges(change);
        }
    }
}

// Api
Domain.prototype.ExplorerId = domain => "explorer" + domain.replaceAll(".", "_").replaceAll(" ", "_");

// Service methods
function DomainService() { }

DomainService.prototype.LoadDomainOptions = function () {
    return apiFetch("/Home/LoadDomainOptions");
}

DomainService.prototype.SaveDomainOptions = function (yaml) {
    return apiFetch("/Home/SaveDomainOptions", {
        method: "POST",
        body: new URLSearchParams({
            yaml: yaml
        })
    });
}