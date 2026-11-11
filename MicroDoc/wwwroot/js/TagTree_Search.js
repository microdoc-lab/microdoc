TagTree.prototype.InitSearch = function (options) {
    this.debug('InitSearch');

    this.searchStyle = this.element.querySelector(".search-style");
    this.searchInput = this.element.querySelector(".toolbar .search");

    // Default event handler
    options.OnSearchChanged ??= function (value) {
        this.log(`OnSearchChanged '${value}'`);
    };

    this.OnSearchChanged = options.OnSearchChanged;

    this.searchInput.addEventListener("focus", () => this.searchInput.select());
    this.searchInput.addEventListener("input", () => this.Search());

    // handle Esc key to clear search
    this.searchInput.addEventListener("keydown", e => {
        if (e.key == "Escape") {
            var initialValue = this.searchInput.value;
            this.searchInput.value = "";
            this.Search();

            if (!initialValue) {
                this.searchInput.blur();

                // activate recent document
                this.explorer().ActivateRecentDocument();
            }

            e.stopPropagation();
        }
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitSearch);

TagTree.prototype.Search = function (text) {
    if (text)
        this.searchInput.value = text;

    const sheet = this.searchStyle.sheet;

    // Delete all existing rules
    while (sheet.cssRules.length > 0)
        sheet.deleteRule(0);

    var searchText = this.searchInput.value.trim();

    this.OnSearchChanged(searchText);

    if (!searchText)
        return;

    searchText = CSS.escape(searchText);

    // Hide all tags
    sheet.insertRule(`.tag-tree#${this.id} .tag { display: none; }`, sheet.cssRules.length);
    // Show matched tags
    sheet.insertRule(`.tag-tree#${this.id} .tag[data-tag*=${JSON.stringify(searchText)} i] { display: list-item; }`, sheet.cssRules.length);
    sheet.insertRule(`.tag-tree#${this.id} .tag:has(.tag[data-tag*=${JSON.stringify(searchText)} i]) { display: list-item; }`, sheet.cssRules.length);

    // Smooth all titles
    sheet.insertRule(`.tag-tree#${this.id} .tag .title { opacity: 0.5; }`, sheet.cssRules.length);
    // Highlight matched titles
    sheet.insertRule(`.tag-tree#${this.id} .title[data-tag*=${JSON.stringify(searchText)} i] { opacity: 1; }`, sheet.cssRules.length);
}