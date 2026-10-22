// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// ReplaceInnerHtml
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

// setup unique clientId
const clientUID = crypto.randomUUID();

async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers);
    headers.set("X-Client-UID", clientUID);

    return fetch(url, {
        ...options,
        headers
    });
}

async function SimpleLogin() {
    const email = prompt("Enter user email");

    if (email === null || email.trim() === "")
        return;

    const response = await apiFetch("/Home/SimpleLogin", {
        method: "POST",
        body: new URLSearchParams({
            email: email
        })
    });

    if (!response.ok) {
        const result = await response.json();
        alert(result.error);
        return;
    }

    location.reload();
}