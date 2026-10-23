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

function UpdateCanonicalInstance(target, source) {
    // source should be always a new object on replacement (no owner must be)
    if (source.owner)
        throw new Error(`Source has owner ${source} #${source.instanceId}, owner ${source.owner} #${source.owner.instanceId}`); 

    // if replacemennt initiated by copy itself - resolve canonical instance
    if (target.owner)
        target = target.owner;

    // instanceId should be always 1 (canonical instance)
    if (target.owner)
        throw new Error(`Resolved target should not have owner ${target} #${target.instanceId}`);

    // remove properties on target that doesn't exist on source
    for (const key of Reflect.ownKeys(target)) {
        if (!Reflect.has(source, key))
            delete target[key];
    }

    // copy source -> target (except instanceId)
    for (const key of Reflect.ownKeys(source)) {
        if (key !== "instanceId")
            target[key] = source[key];
    }

    // set canonical instance on copy
    source.owner = target;

    return target;
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
