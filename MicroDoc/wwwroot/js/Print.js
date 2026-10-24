// copy HTML
async function CopyFormatted(element) {
    const clone = await CloneNodeForPrinting(element);

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

    const clone = await CloneNodeForPrinting(element);

    const doc = printWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>Print ${title}</title></head><body></body></html>`);
    doc.close();

    const stylesLoaded = Promise.all([
        LoadStylesheet(doc, `${window.location.origin}/css/Doc_Shared.css?v=${crypto.randomUUID()}`),
        LoadStylesheet(doc, `${window.location.origin}/css/Print.css?v=${crypto.randomUUID()}`)
    ]);

    const page = document.createElement("div");
    page.className = "print-page";
    page.append(clone);
    doc.body.append(page);

    try {
        await stylesLoaded;
        printWindow.focus();
        printWindow.print();
    } catch (error) {
        console.error("Failed to load print stylesheet:", linkDoc.href, error);
    }
}

async function CloneNodeForPrinting(element) {
    const clone = document.createElement("div");
    clone.className = "print";
    clone.innerHTML = element.innerHTML;

    CopyPseudoContent(element, clone);

    NormalizeTables(clone);

    await EmbedImages(clone);
    for (const img of clone.querySelectorAll("img"))
        await SetImageDimensions(img);

    AddDocumentSeparators(clone);
    NormalizeCallouts(clone);

    return clone;
}

function LoadStylesheet(doc, href) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = href;

    const loaded = new Promise((resolve, reject) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", reject, { once: true });
    });

    doc.head.append(link);

    return loaded;
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
            const style = getComputedStyle(element, pseudo);
            const content = style.content;

            if (content && content !== "none" && content !== "normal") {
                const text = content.replace(/^["']|["']$/g, "");
                const span = document.createElement("span");

                span.textContent = text;
                span.style.color = style.color;
                //span.style.backgroundColor = style.backgroundColor;
                //span.style.font = style.font;
                //span.style.padding = style.padding;
                //span.style.border = style.border;
                //span.style.borderRadius = style.borderRadius;

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

        const response = await fetch(img.src + "&thumbDimension=100");

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

function AddDocumentSeparators(root) {
    const docs = [...root.querySelectorAll("doc")];

    docs.slice(0, -1).forEach(doc => {
        const hr = document.createElement("hr");

        hr.style.border = "0";
        hr.style.borderTop = "1px solid #ccc";
        hr.style.margin = "8px 0";

        doc.after(hr);
    });
}

function NormalizeCallouts(root) {
    for (const element of root.querySelectorAll(".note, .example")) {
        const table = document.createElement("table");
        table.setAttribute("width", "100%");
        table.setAttribute("cellspacing", "0");
        table.setAttribute("cellpadding", "8");
        table.setAttribute("border", "1");
        table.setAttribute("bordercolor", "#888888");

        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.border = "1px solid #888888";
        table.style.margin = "8px 0";

        const cell = table.insertRow().insertCell();
        cell.setAttribute("border", "1");
        cell.style.border = "1px solid #888888";
        cell.style.padding = "8px 12px";
        cell.style.verticalAlign = "top";

        var accent = "darkgray";
        if (element.classList.contains("note"))
            accent = "#527da8";
        if (element.classList.contains("example"))
            accent = "#72966b";

        cell.style.borderLeft = `4px solid ${accent}`;

        while (element.firstChild)
            cell.appendChild(element.firstChild);

        element.replaceWith(table);
    }
}