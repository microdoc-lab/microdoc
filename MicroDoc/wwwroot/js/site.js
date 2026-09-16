// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
function RecreateScripts(element) {
    element.querySelectorAll("script").forEach(oldScript => {
        const newScript = document.createElement("script");

        [...oldScript.attributes].forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });

        newScript.textContent = oldScript.textContent;

        oldScript.replaceWith(newScript);
    });
}

function ReplaceInnerHtml(element, html) {
    element.innerHTML = html;
    RecreateScripts(element);
}