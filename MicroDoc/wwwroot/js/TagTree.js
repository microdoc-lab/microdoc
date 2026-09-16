function TagTree(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    element.tagTree = this;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`TagTree #${this.id}: ${text}`); }

    if (options.style)
        element.setAttribute('style', options.style);
}

TagTree.prototype.behaviors = [];

TagTree.prototype.InitBehaviors = function () {
    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, this.options);
    }
}
