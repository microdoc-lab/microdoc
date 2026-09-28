DocMatrix.prototype.InitEditor = function (options) {
    this.log('InitEditor');

    var grid = this.element.querySelector(".grid");
    var overlay = this.element.querySelector(".overlay");

    grid.addEventListener("click", event => {
        const cell = event.target.closest("td");

        if (!cell || !grid.contains(cell))
            return;

        var editor = overlay.querySelector(`[data-id="${cell.dataset.id}"]`);

        if (editor) {
            editor.focus();
            return;
        }
        
        editor = document.createElement("textarea");
        editor.className = "doc";
        editor.textContent = cell.dataset.content;
        editor.dataset.id = cell.dataset.id;
        overlay.appendChild(editor);

        function textAreaAdjust(o) {
            o.style.height = "1px";
            o.style.height = (o.scrollHeight) + "px";
        }

        editor.addEventListener("input", () => { textAreaAdjust(editor); });
        textAreaAdjust(editor)

        editor.focus();
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitEditor);