function DocMatrix(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.docMatrix = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`DocMatrix #${this.id}: ${text}`); }

    if (options.style)
        element.setAttribute('style', options.style);
}

DocMatrix.prototype.behaviors = [];

DocMatrix.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}