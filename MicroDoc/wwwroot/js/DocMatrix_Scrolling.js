DocMatrix.prototype.InitScrolling = function (options) {
    this.debug('InitScrolling');

    this.scrollPosition = 0;
}

DocMatrix.prototype.behaviors.push(DocMatrix.prototype.InitScrolling);

// Api
DocMatrix.prototype.ScrollTo = function (position) {
    const docPanel = this.explorer().docPanel();
    const grid = this.grid();
    const header = this.gridHeader();

    const maxScroll = grid.offsetHeight - 100;

    this.scrollPosition = Math.max(0, Math.min(maxScroll, position));

    grid.style.transform = `translateY(${-this.scrollPosition}px)`;

    header.querySelectorAll("th").forEach(th => th.style.transform = `translateY(${this.scrollPosition}px)`);
}

DocMatrix.prototype.ScrollToSelectedRow = function (tagId) {
    if (tagId)
        this.selectedTag = tagId;

    const grid = this.grid();
    const header = this.gridHeader();
    const row = this.tagRow(this.selectedTag);

    if (!row) return;

    const rowTop = row.offsetTop - header.offsetHeight;
    this.ScrollTo(rowTop);
}