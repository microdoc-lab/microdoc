function OpenDomainExplorer(domain, selectedTag) {
    const container = document.querySelector("#domainExplorers");

    var explorerId = "explorer" + domain.replaceAll(".", "_").replaceAll(" ", "_");

    var element = document.getElementById(explorerId);
    if (element) {
        if (element.parentElement.style.display == "none") {
            ActivateExplorer(element);
        }
        return;
    }

    var parent = document.createElement("div");
    parent.className = "explorerHost";
    parent.domain = domain;

    element = document.createElement("div");
    element.id = explorerId;
    parent.appendChild(element);
    container.appendChild(parent);

    var explorer = new Explorer(element);
    explorer.domain = domain;
    explorer.selectedTag = selectedTag;

    explorer.Reload();

    ActivateExplorer(element);
}

function ActivateExplorer(element) {
    // toggle explorer
    document.querySelectorAll(`.explorer:not(#${element.id})`).forEach(other => {
        other.parentElement.style.display = "none";
    });

    element.parentElement.style.display = "flex";

    // toggle link
    document.querySelectorAll(`a.explorer-link:not([data-domain="${element.parentElement.domain}"])`).forEach(other => {
        other.classList.remove("selected");
    });

    document.querySelectorAll(`a.explorer-link[data-domain="${element.parentElement.domain}"]`).forEach(other => {
        other.classList.add("selected");
    });
}