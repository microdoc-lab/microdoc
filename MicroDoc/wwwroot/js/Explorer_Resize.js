Explorer.prototype.InitResize = function (options) {
    this.debug('InitResize');

    const container = this.element;
    const left = this.element.querySelector(".tree-panel");
    const splitter = this.element.querySelector(".splitter");

    let dragging = false;

    splitter.addEventListener("mousedown", () => {
        window.dragging = true;
        dragging = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", e => {
        if (!dragging)
            return;

        const rect = container.getBoundingClientRect();
        const width = e.clientX - rect.left;

        left.style.width = `${width}px`;
    });

    document.addEventListener("mouseup", () => {
        if (!dragging)
            return;

        window.dragging = false;
        dragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    });
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitResize);