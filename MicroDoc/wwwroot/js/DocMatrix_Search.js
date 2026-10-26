DocMatrix.prototype.InitSearch = function (options) {
    this.debug('InitSearch');

    this.searchStyle = this.element.querySelector(".search-style");

    var grid = this.grid();

    // Default event handler
    options.OnSearchChanged ??= function (value) {
        this.log(`OnSearchChanged '${value}'`);
    };

    this.OnSearchChanged = options.OnSearchChanged;

    // search 
    grid.querySelectorAll(".search").forEach(input => {
        input.addEventListener("focus", () => input.select());
        input.addEventListener("input", () => this.Search());

        // handle Esc key to clear search
        input.addEventListener("keydown", e => {
            if (e.key == "Escape") {
                var initialValue = input.value;
                input.value = "";
                this.Search();

                if (!initialValue) {
                    input.blur();

                    // activate recent document
                    this.explorer().ActivateRecentDocument();
                }

                e.stopPropagation();
            }
        });
    });
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitSearch);

DocMatrix.prototype.ClearSearch = function (searchInput) {
    searchInput.value = "";
    this.Search();
}

DocMatrix.prototype.Search = function (value) {
    var grid = this.grid();

    // init search
    if (value) {
        // reset search
        grid.querySelectorAll(".search").forEach(searchInput => searchInput.value = "");

        // init from data
        for (const data of value) {
            if (data.id == "")
                grid.querySelector("tr:nth-child(1) th:nth-child(1) .search").value = data.search;
            else if (data.id == "misc")
                grid.querySelector("tr:nth-child(1) th.misc .search").value = data.search;
            else
                grid.querySelector(`tr:nth-child(1) th[data-document=${data.id}] .search`).value = data.search;
        }
    }

    const sheet = this.searchStyle.sheet;

    // Delete all existing rules
    while (sheet.cssRules.length > 0)
        sheet.deleteRule(0);

    // query predicates from all columns
    var predicates = [];
    var strings = [];
    grid.querySelectorAll(".search").forEach(searchInput => {
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

        // define cookie data
        if (cell.cellIndex == 0)                        // first column, search all documents
            strings.push({ id: "", search: searchText });
        else if (cell.classList.contains("misc"))       // last column MISC
            strings.push({ id: "misc", search: searchText });
        else                                            // document column
            strings.push({ id: document, search: searchText });
    });

    this.OnSearchChanged(strings);

    if (predicates.length == 0)
        return;
    
    // Add a new rule
    sheet.insertRule(`.docmatrix#${this.id} tr[data-tag] { display: none; }`, sheet.cssRules.length);
    sheet.insertRule(`.docmatrix#${this.id} tr[data-tag]${predicates.join("")} { display: table-row; }`, sheet.cssRules.length);
}