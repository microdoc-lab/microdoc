function TagTree(element, options = {}) {
    if (!element) return;

    this.element = element;
    this.options = options;

    this.id = element.id;
    this.log = function (text) { console.log(`TagTree #${this.id}: ${text}`); }

    // Run initialization
    for (const init of this.behaviors) {
        init.call(this, options);
    }
}

TagTree.prototype.behaviors = [];
