function Explorer(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.explorer = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`Explorer #${this.id}: ${text}`); }

    if (options.style)
        element.setAttribute('style', options.style);
}

Explorer.prototype.behaviors = [];

Explorer.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}

// Api
Explorer.prototype.tagTree = function () { return document.getElementById(this.tagTreeId).tagTree; }
Explorer.prototype.docMatrix = function () { return document.getElementById(this.docMatrixId).docMatrix; }
