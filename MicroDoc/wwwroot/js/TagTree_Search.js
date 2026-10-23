TagTree.prototype.InitSearch = function (options) {
    this.debug('InitSearch');

    this.searchStyle = this.element.querySelector(".search-style");
    this.searchInput = this.element.querySelector(".toolbar .search");

    this.searchInput.addEventListener("focus", () => this.searchInput.select());
    this.searchInput.addEventListener("input", () => this.Search());

    // handle Esc key to clear search
    this.searchInput.addEventListener("keydown", e => {
        if (e.key == "Escape") {
            var initialValue = this.searchInput.value;
            this.searchInput.value = "";
            this.Search();

            if (!initialValue)
                this.searchInput.blur();
        }
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitSearch);

TagTree.prototype.Search = function () {
    const sheet = this.searchStyle.sheet;

    // Delete all existing rules
    while (sheet.cssRules.length > 0)
        sheet.deleteRule(0);

    var searchText = this.searchInput.value.trim();
    if (!searchText)
        return;

    searchText = CSS.escape(searchText);

    // Add a new rule
    sheet.insertRule(`.tag-tree#${this.id} .tag { display: none; }`, sheet.cssRules.length);
    sheet.insertRule(`.tag-tree#${this.id} .tag[data-tag*="${searchText}" i] { display: list-item; }`, sheet.cssRules.length);
    sheet.insertRule(`.tag-tree#${this.id} .tag:has(.tag[data-tag*="${searchText}" i]) { display: list-item; }`, sheet.cssRules.length);
}