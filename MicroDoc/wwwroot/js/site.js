// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

const instances = new WeakMap();

function GetInstanceOrCreate(key, factory) {
    var instance = instances.get(key);
    if (!instance) {
        instance = factory();
        instances.set(key, instance);
    }

    return instance;
}

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
    const email = prompt(Loc.Login_Prompt);

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

// Localization
function LocalizeElement(element) {
    [element, ...element.querySelectorAll('*')].forEach(element => {
        [...element.attributes]
            .filter(attr => attr.name.startsWith('data-loc-'))
            .forEach(attr => {
                const name = attr.name.substring('data-loc-'.length);
                const value = Loc[attr.value];
                element.setAttribute(name, value ?? "*" + attr.value + "*");
            });
    });
}

function LocalizeError(errorCode) {
    const value = Loc["ErrorCode_" + errorCode];
    return value ?? "*" + "ErrorCode_" + errorCode + "*";
}

function format(template, ...args) {
    return template.replace(/\{(\d+)\}/g, (match, index) =>
        args[index] ?? match
    );
}