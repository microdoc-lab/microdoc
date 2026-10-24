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

// copy HTML
async function CopyFormatted(element) {
    // const clone = element.cloneNode(true);

    const clone = document.createElement("div");
    clone.innerHTML = element.innerHTML;

    // CopyComputedStyles(element, clone);
    CopyPseudoContent(element, clone);
    NormalizeTables(clone);
    await EmbedImages(clone);
    for (const img of clone.querySelectorAll("img"))
        await SetImageDimensions(img);

    const html = clone.outerHTML;

    await navigator.clipboard.write([
        new ClipboardItem(
        {
            "text/html":  new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([element.innerText], { type: "text/plain" })
        })
    ]);
}

// print HTML
async function PrintElement(element, title) {
    const printWindow = window.open("", "_blank");

    if (!printWindow)
        return; // Popup blocked

    const clone = document.createElement("div");
    clone.className = "print";
    clone.innerHTML = element.innerHTML;

    CopyPseudoContent(element, clone);
    NormalizeTables(clone);
    await EmbedImages(clone);
    for (const img of clone.querySelectorAll("img"))
        await SetImageDimensions(img);

    const doc = printWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>Print ${title}</title></head><body></body></html>`);
    doc.close();

    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = `${window.location.origin}/css/Doc_Shared.css?v=${crypto.randomUUID()}`;

    const cssLoaded = new Promise((resolve, reject) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", reject, { once: true });
    });

    doc.head.append(link);
    doc.body.append(clone);

    try {
        await cssLoaded;
        printWindow.focus();
        printWindow.print();
    } catch (error) {
        console.error("Failed to load print stylesheet:", link.href, error);
    }
}

function CopyComputedStyles(source, clone) {
    const sourceElements = [source, ...source.querySelectorAll("*")];
    const cloneElements = [clone, ...clone.querySelectorAll("*")];

    sourceElements.forEach((element, index) => {
        const computed = getComputedStyle(element);
        const copy = cloneElements[index];

        for (const property of computed) {
            copy.style.setProperty(
                property,
                computed.getPropertyValue(property)
            );
        }
    });
}

function CopyPseudoContent(source, clone) {
    const sourceElements = [source, ...source.querySelectorAll("*")];
    const cloneElements = [clone, ...clone.querySelectorAll("*")];

    sourceElements.forEach((element, index) => {
        const copy = cloneElements[index];

        for (const pseudo of ["::before"/*, "::after"*/]) {
            const content = getComputedStyle(element, pseudo).content;

            if (content && content !== "none" && content !== "normal") {
                const text = content.replace(/^["']|["']$/g, "");
                const span = document.createElement("span");

                span.textContent = text;

                if (pseudo === "::before")
                    copy.prepend(span);
                else
                    copy.append(span);
            }
        }
    });
}

async function EmbedImages(root) {
    // show all galleries
    root.querySelectorAll("gallery").forEach(gallery => gallery.style.visibility = "visible");

    const images = [...root.querySelectorAll("img")];

    await Promise.all(images.map(async img => {
        if (img.src.startsWith("data:"))
            return;

        const response = await fetch(img.src + "&thumb=true&v=xxx");

        if (!response.ok)
            throw new Error(`Failed to load image: ${img.src}`);

        const blob = await response.blob();

        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });

        img.src = dataUrl;
        img.removeAttribute("srcset");
    }));
}

async function SetImageDimensions(img) {
    if (!img.complete || !img.naturalWidth) {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
    }

    img.setAttribute("width", img.naturalWidth);
    img.setAttribute("height", img.naturalHeight);

    img.style.width = `${img.naturalWidth}px`;
    img.style.height = `${img.naturalHeight}px`;
}

function NormalizeTables(root) {
    for (const table of root.querySelectorAll("table")) {
        table.setAttribute("border", "1");
        table.setAttribute("cellspacing", "0");
        table.setAttribute("cellpadding", "4");
        table.setAttribute("bordercolor", "#000000");

        table.style.borderCollapse = "collapse";
        table.style.border = "1px solid black";

        for (const cell of table.querySelectorAll("th, td")) {
            cell.setAttribute("border", "1");
            cell.style.border = "1px solid black";
        }
    }
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
