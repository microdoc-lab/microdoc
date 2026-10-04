Domain.prototype.InitDomainOptions = function (options) {
    this.log('InitDomainOptions');

    this.domainOptions = document.querySelector("#domainOptions");
    this.domainOptionsEditor = document.querySelector("#domainOptions .editor");
}

Domain.prototype.behaviors.push(Domain.prototype.InitDomainOptions);

Domain.prototype.ToggleDomainOptions = async function () {
    if (this.domainOptions.style.display == "none") {
        // load options YAML from server
        const response = await this.service.LoadDomainOptions();
        if (!response.ok) {
            this.error("Domain options load failed", await response.text());
            return;
        }

        var yaml = await response.text();

        // update UI
        this.domainOptionsEditor.value = yaml;

        // show editor panel
        this.domainOptions.style.display = "block";

        // focus editor
        this.domainOptionsEditor.setSelectionRange(0, 0);
        this.domainOptionsEditor.blur();
        this.domainOptionsEditor.focus();
    }
    else {
        var yaml = this.domainOptionsEditor.value;

        // save options YAML to server
        const response = await this.service.SaveDomainOptions(yaml);
        if (!response.ok) {
            this.error("Domain options save failed", await response.text());
            return;
        }

        // reload all explorer docmatrix
        document.querySelectorAll('.explorerHost .explorer').forEach(explorer => {
            explorer.explorer.docMatrix().Reload();
        });

        // hide editor panel
        this.domainOptions.style.display = "none";
    }
}