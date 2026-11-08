TagTree.prototype.InitDragNDropMove = function (options) {
    this.debug('InitDragNDropMove');

    this.element.querySelectorAll(".tag-list").forEach(list => {
        list.addEventListener("dragover", e => {
            e.stopPropagation();

            if (!this.draggedNode) return;

            const sender = this.draggedNode.closest(".tag");
            const target = list.closest(".tag") ?? this.element.querySelector(".domain.tag");

            // Prevent moving tag into itself
            if (sender === target || sender.contains(target))
                return;

            // Deny drop within the same parent
            if (this.draggedNode.closest(".tag-list") === list) return;

            // Deny moving RootTag
            if (sender.dataset.id == "")
                return;

            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        list.addEventListener("drop", async e => {
            e.preventDefault();
            e.stopPropagation();

            if (!this.draggedNode) return;

            const sender = this.draggedNode.closest(".tag");
            const target = list.closest(".tag") ?? this.element.querySelector(".domain.tag");

            // Prevent moving tag into itself
            if (sender === target || sender.contains(target))
                return;

            // Deny drop within the same parent
            if (this.draggedNode.closest(".tag-list") === list) return;

            // Deny moving RootTag
            if (sender.dataset.id == "")
                return;

            // Extract tag context
            const domain = sender.dataset.domain;
            const selectedTag = sender.dataset.id;
            const targetTag = target.dataset.id;

            const tagPath = DocParser.TagPath(domain, selectedTag);

            this.log(`MoveTag selectedTag: ${selectedTag}, targetTag: ${targetTag}`);

            // Move Tag
            const response = await this.service.MoveTag(domain, selectedTag, targetTag);
            if (!response.ok) {
                this.error(format(Loc.TagTree_MoveFailed, tagPath, targetTag), await response.text());
                return;
            }

            // PublishChanges
            var data = await response.json();
            await window.domain.PublishChanges(data.changes);
        });
    });
}

TagTree.prototype.behaviors.push(TagTree.prototype.InitDragNDropMove);