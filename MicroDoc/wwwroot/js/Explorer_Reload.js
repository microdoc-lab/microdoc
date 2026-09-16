Explorer.prototype.InitReload = function (options) {
    this.log('InitReload');
}

Explorer.prototype.behaviors.push(Explorer.prototype.InitReload);

// Api
Explorer.prototype.Reload = async function () {
    await this.Load(this.selectedTag);
}

Explorer.prototype.Load = async function (tagId) {
    // Update model property
    this.selectedTag = tagId;

    // Reload HTML content
    const response = await this.service.Explorer(this.id, this.domain, this.selectedTag);
    if (!response.ok) {
        console.error("Explorer request failed", await response.text());
        return;
    }

    ReplaceInnerHtml(this.element.parentElement, await response.text());
}

// Service methods
ExplorerService.prototype.Explorer = function(ExplorerId, domain, selectedTag) {
    return fetch(`/Home/Explorer?explorerId=${ExplorerId}&domain=${domain}&selectedTag=${selectedTag}`);
}