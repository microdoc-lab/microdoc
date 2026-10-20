DocMatrix.prototype.InitSearch = function (options) {
    this.log('InitSearch');

    this.searchStyle = this.element.querySelector(".search-style");

    var grid = this.grid();

    // search 
    grid.querySelectorAll(".search").forEach(input => {
        input.addEventListener("focus", () => input.select());
        input.addEventListener("input", () => this.Search(input));

        // handle Esc key to clear search
        input.addEventListener("keydown", e => {
            if (e.key == "Escape") {
                var initialValue = input.value;
                input.value = "";
                this.Search();

                if (!initialValue)
                    input.blur();
            }
        });
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitSearch);

DocMatrix.prototype.ClearSearch = function (searchInput) {
    searchInput.value = "";
    this.Search();
}

DocMatrix.prototype.Search = function () {
    const sheet = this.searchStyle.sheet;

    // Delete all existing rules
    while (sheet.cssRules.length > 0)
        sheet.deleteRule(0);

    // query predicates from all columns
    var predicates = [];
    this.grid().querySelectorAll(".search").forEach(searchInput => {
        var searchText = searchInput.value.trim();
        if (!searchText)
            return;

        const cell = searchInput.closest("th");
        const document = cell.dataset.document;

        if (cell.cellIndex == 0)                        // first column, search all documents
            predicates.push(`:has(doc[data-content*="${searchText}" i])`);
        else if (cell.classList.contains("misc"))       // last column MISC
            predicates.push(`:has(td.misc doc[data-content*="${searchText}" i])`);
        else                                            // document column
            predicates.push(`:has(td[data-document="${document}"] doc[data-content*="${searchText}" i])`);
    });

    if (predicates.length == 0)
        return;
    
    // Add a new rule
    sheet.insertRule(`.docmatrix#${this.id} tr[data-tag] { display: none; }`, sheet.cssRules.length);
    sheet.insertRule(`.docmatrix#${this.id} tr[data-tag]${predicates.join("")} { display: table-row; }`, sheet.cssRules.length);
}