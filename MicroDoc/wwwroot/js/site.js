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

// soft hover
function enableSoftHover(selector, delayEnter = 500, delayLeave = 300) {
    let enterTimer = null;
    let pendingEnter = null;
    let activeElement = null;

    const leaveTimers = new WeakMap();

    function cancelEnter() {
        clearTimeout(enterTimer);
        enterTimer = null;
        pendingEnter = null;
    }

    function cancelLeave(element) {
        const timer = leaveTimers.get(element);

        if (timer !== undefined) {
            clearTimeout(timer);
            leaveTimers.delete(element);
        }
    }

    function activate(element) {
        // Only one active element per controller.
        if (activeElement && activeElement !== element) {
            cancelLeave(activeElement);
            activeElement.classList.remove("hover");
        }

        element.classList.add("hover");
        activeElement = element;
    }

    document.addEventListener("pointerover", event => {
        if (!(event.target instanceof Element))
            return;

        const element = event.target.closest(selector);
        if (!element)
            return;

        // Ignore movement within the same matching element.
        if (event.relatedTarget instanceof Node &&
            element.contains(event.relatedTarget))
            return;

        cancelLeave(element);

        // Cancel a pending activation if we enter another element.
        if (pendingEnter !== element) {
            cancelEnter();
            pendingEnter = element;

            enterTimer = setTimeout(() => {
                activate(element);
                enterTimer = null;
                pendingEnter = null;
            }, delayEnter);
        }
    });

    document.addEventListener("pointerout", event => {
        if (!(event.target instanceof Element))
            return;

        const element = event.target.closest(selector);
        if (!element)
            return;

        // Ignore movement within the same matching element.
        if (event.relatedTarget instanceof Node &&
            element.contains(event.relatedTarget))
            return;

        if (pendingEnter === element)
            cancelEnter();

        // Only active elements need delayed removal.
        if (activeElement !== element)
            return;

        cancelLeave(element);

        const timer = setTimeout(() => {
            element.classList.remove("hover");

            if (activeElement === element)
                activeElement = null;

            leaveTimers.delete(element);
        }, delayLeave);

        leaveTimers.set(element, timer);
    });
}
