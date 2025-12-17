TagTree.prototype.InitToggle = function (options) {
    this.log('InitToggle');

    const detailsElements = this.element.querySelectorAll(".title");
    detailsElements.forEach(details => {
        details.addEventListener("click", (event) => {
            event.preventDefault(); // prevent default toggle for other clicks
        });
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitToggle);