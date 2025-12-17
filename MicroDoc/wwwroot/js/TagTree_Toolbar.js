TagTree.prototype.InitToolbar = function (options) {
    this.log('InitToolbar');

    const detailsElements = this.element.querySelectorAll(".title-bar");
    detailsElements.forEach(details => {
        var toolbar = document.createElement("div");
        toolbar.classList.add("toolbar");
        details.appendChild(toolbar);
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitToolbar);