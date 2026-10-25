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
async function PrintElement(element, title, keepPrintWindowOpen) {
    const printWindow = window.open("", "_blank");

    if (!printWindow)
        return; // Popup blocked

    const clone = await CloneNodeForPrinting(element);

    const doc = printWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>${title}</title></head><body></body></html>`);
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

        printWindow.addEventListener("afterprint", () => {
            if (!keepPrintWindowOpen)
                printWindow.close();
        }, { once: true });

        printWindow.focus();

        if (!keepPrintWindowOpen)
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

    NormalizeGalleries(clone);
    await EmbedImages(clone);
    await SetImageDimensions(clone);

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

function NormalizeGalleries(root) {
    for (const gallery of root.querySelectorAll("gallery")) {
        const items = Array.from(gallery.querySelectorAll(":scope > imgw"));

        if (items.length === 0)
            continue;

        const table = document.createElement("table");
        table.className = "gallery";
        table.setAttribute("border", "0");
        table.setAttribute("cellspacing", "0");
        table.setAttribute("cellpadding", "0");

        const imagesRow = table.insertRow();
        const captionsRow = table.insertRow();

        for (const item of items) {
            const imageCell = imagesRow.insertCell();
            imageCell.setAttribute("align", "center");
            imageCell.setAttribute("valign", "center");
            imageCell.style.paddingLeft = "12.5px";
            imageCell.style.paddingRight = "12.5px";

            const image = item.querySelector("imgc img");
            if (image)
                imageCell.appendChild(image.cloneNode(true));

            const captionCell = captionsRow.insertCell();
            captionCell.setAttribute("align", "center");
            captionCell.setAttribute("valign", "top");
            captionCell.style.paddingLeft = "12.5px";
            captionCell.style.paddingRight = "12.5px";

            const caption = item.querySelector(":scope > span");
            if (caption) {
                var label = caption.cloneNode(true);
                label.setAttribute("align", "center");
                label.style.textAlign = "center";
                captionCell.appendChild(label);
            }
        }

        gallery.replaceWith(table);
    }
}

async function EmbedImages(root) {
    // show all galleries
    root.querySelectorAll(".gallery").forEach(gallery => gallery.style.visibility = "visible");

    const images = [...root.querySelectorAll("img")];

    await Promise.all(images.map(async img => {
        if (img.src.startsWith("data:"))
            return;

        const response = await fetch(img.src + (img.closest(".gallery") ? "&thumbDimension=100" : ""));

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

async function SetImageDimensions(root) {
    for (const img of root.querySelectorAll("img")) {
        if (!img.complete || !img.naturalWidth) {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
        }

        if (img.closest(".gallery")) {
            img.setAttribute("width", img.naturalWidth);
            img.setAttribute("height", img.naturalHeight);

            img.style.width = `${img.naturalWidth}px`;
            img.style.height = `${img.naturalHeight}px`;
        }

        if (img.closest(".img-preview")) {
            // FitImageToPage
            const MmToPx = mm => mm * 96 / 25.4;
            const maxWidthPx = MmToPx(210 - 18 - 18);  // 174 mm ≈ 658 px
            const maxHeightPx = MmToPx(297 - 30 - 30); // 237 mm ≈ 896 px

            const scale = Math.min(
                1,
                maxWidthPx / img.naturalWidth,
                maxHeightPx / img.naturalHeight
            );

            const width = Math.round(img.naturalWidth * scale);
            const height = Math.round(img.naturalHeight * scale);

            img.setAttribute("width", width);
            img.setAttribute("height", height);

            // Avoid conflicting CSS dimensions.
            img.style.width = `${width}px`;
            img.style.height = `${height}px`;
        }
    }
}

function TransformGalleriesToImagePages(root) {
    const result = document.createElement("div");

    for (const gallery of root.querySelectorAll("gallery")) {
        for (const item of gallery.querySelectorAll(":scope > imgw")) {
            const image = item.querySelector("imgc img");
            const caption = item.querySelector(":scope > span");

            if (!image)
                continue;

            const table = document.createElement("table");
            table.className = "img-preview";
            table.setAttribute("border", "0");
            table.setAttribute("cellspacing", "0");
            table.setAttribute("cellpadding", "4");

            const imageCell = table.insertRow().insertCell();
            imageCell.setAttribute("align", "center");
            imageCell.setAttribute("valign", "middle");
            imageCell.appendChild(image.cloneNode(true));

            const captionCell = table.insertRow().insertCell();
            captionCell.setAttribute("align", "center");
            captionCell.setAttribute("valign", "top");

            if (caption)
                captionCell.textContent = caption.textContent;

            result.appendChild(table);
        }
    }

    return result;
}

function CreateSingleImageGallery(span) {
    const item = span.closest("imgw");
    if (!item)
        return null;

    const doc = document.createElement("doc");

    const gallery = document.createElement("gallery");
    gallery.style.marginTop = "0px";
    gallery.style.visibility = "visible";

    const imgw = document.createElement("imgw");
    imgw.dataset.imagepath = item.dataset.imagepath;
    imgw.title = item.title;

    const imgc = document.createElement("imgc");
    const image = item.querySelector("imgc img");

    if (image)
        imgc.appendChild(image.cloneNode(true));

    imgw.appendChild(imgc);
    imgw.appendChild(span.cloneNode(true));

    gallery.appendChild(imgw);

    doc.appendChild(gallery);
    return doc;
}

function NormalizeTables(root) {
    for (const table of root.querySelectorAll("table.table")) {
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
    for (const element of root.querySelectorAll(".note, .example, .code content")) {
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
        if (element.classList.contains("code"))
            accent = "#d1d5db";

        cell.style.borderLeft = `4px solid ${accent}`;

        while (element.firstChild)
            cell.appendChild(element.firstChild);

        element.replaceWith(table);
    }
}