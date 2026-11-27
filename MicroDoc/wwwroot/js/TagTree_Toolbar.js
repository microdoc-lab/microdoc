TagTree.prototype.InitToolbar = function (options) {
    this.debug('InitToolbar');

    const toolbar = this.tagToolbar();

    this.element.addEventListener("mouseover", event => {
        // find & check title
        const title = event.target.closest(".title");
        if (!title)
            return;

        // find & check tag
        const tag = title.closest(".tag");
        if (!tag)
            return;

        // obtain tag context
        var domain = tag.dataset.domain;
        var tagId = tag.dataset.id;

        // don't show toolbar for root tag
        if (tagId == "")
            return;

        // show toolbar
        toolbar.style.visibility = "visible";
        // set toolbar context
        toolbar.dataset.domain = domain;
        toolbar.dataset.id = tagId;

        this.PositionToolbar(title);
    });

    // hide toolbar on mouseout
    this.element.addEventListener("mouseout", event => {
        // find & check title
        const title = event.target.closest(".title");
        if (!title)
            return;

        // Don't hide when moving between elements inside the same item.
        if (title.contains(event.relatedTarget))
            return;

        // Don't hide when moving over toolbar itself.
        if (toolbar.contains(event.relatedTarget))
            return;

        // hide toolbar
        toolbar.style.visibility = "hidden";
        // reset toolbar context
        toolbar.dataset.id = null;

        // unhighlight title
        this.element.querySelectorAll(".tag .title").forEach(tag => tag.classList.remove("hover"));
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitToolbar);

TagTree.prototype.PositionToolbar = function (title) {
    var overlay = this.element;
    var toolbar = this.tagToolbar();

    // position toolbar at the top-right corner of title
    const rect = title.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    toolbar.style.right = `${overlayRect.right - rect.right}px`;
    toolbar.style.top = `${rect.top - overlayRect.top}px`;
    //toolbar.style.width = `${overlayRect.width - 18}px`;

    // highlight title
    this.element.querySelectorAll(".tag .title").forEach(tag => tag.classList.remove("hover"));
    title.classList.add("hover");
}