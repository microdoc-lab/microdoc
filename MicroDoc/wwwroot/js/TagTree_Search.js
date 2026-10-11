TagTree.prototype.InitSearch = function (options) {
    this.log('InitSearch');

    this.searchStyle = this.element.querySelector("#tagSearchStyle");
    this.searchInput = this.element.querySelector(".toolbar .search");

    this.searchInput.addEventListener("focus", () => this.searchInput.select());
    this.searchInput.addEventListener("input", () => this.Search());
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitSearch);

TagTree.prototype.ClearSearch = function () {
    this.Search("");
    this.searchInput.focus();
}

TagTree.prototype.Search = function (search) {
    if (search != null)
        this.searchInput.value = search;

    const sheet = this.searchStyle.sheet;

    // Delete all existing rules
    while (sheet.cssRules.length > 0)
        sheet.deleteRule(0);

    var searchText = this.searchInput.value.trim();
    if (!searchText)
        return;

    searchText = CSS.escape(searchText);

    // Add a new rule
    sheet.insertRule(".tag { display: none; }", sheet.cssRules.length);
    sheet.insertRule(`.tag[data-tag*="${searchText}" i] { display: list-item; }`, sheet.cssRules.length);
    sheet.insertRule(`.tag:has(.tag[data-tag*="${searchText}" i]) { display: list-item; }`, sheet.cssRules.length);
}