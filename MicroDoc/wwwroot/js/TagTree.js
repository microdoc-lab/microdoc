function TagTree(element, options = {}) {
    if (!element) return;

    if (!options) options = {};

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`TagTree #${this.id}: ${text}`); }

    if (options.style)
        element.setAttribute('style', options.style);

    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, options);
    }
}

TagTree.prototype.behaviors = [];
