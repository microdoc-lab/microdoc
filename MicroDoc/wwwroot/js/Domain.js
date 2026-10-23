var domainInstanceId = 0;

function Domain(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    this.instanceId = ++domainInstanceId;
    this.options = options;
    this.service = new DomainService();

    this.UpdateElement(element);

    this.log(`new instance #${this.instanceId}`);
}

Domain.prototype.UpdateElement = function (element) {
    this.id = element.id;
    this.element = element;
    this.element.domain = this;
    if (this.options.style)
        this.element.setAttribute('style', this.options.style);

    window.domain = this;
}

Domain.prototype.debug = function (text) { console.debug(`Domain #${this.id}: ${text}`); }
Domain.prototype.info = function (text) { console.info(`Domain #${this.id}: ${text}`); }
Domain.prototype.log = function (text) { console.log(`Domain #${this.id}: ${text}`); }
Domain.prototype.warn = function (text) { console.warn(`Domain #${this.id}: ${text}`); }
Domain.prototype.error = function (text, error) { console.error(`Domain: ${text}`, error); alert(text + "\n\n" + error); }

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