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

// Viewer Selection
function SelectElement(element) {
    const range = document.createRange();
    range.selectNodeContents(element);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function IsFullyVisibleAndAboveMiddle(element, container) {
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const top = containerRect.top + container.clientTop;
    const bottom = top + container.clientHeight;
    const middle = (top + bottom) / 2;

    return rect.top >= top
        && rect.bottom <= bottom
        && rect.top < middle;
}

function SelectAndScrollViewer(viewer, headingIndex) {
    // move cursor to clicked Header position
    if (headingIndex >= 0) {
        const heading = viewer.querySelectorAll("h1, h2, h3")[headingIndex];
        if (heading) {
            // scroll heading into view (if not fully visible above document viewer middle line)
            if (!IsFullyVisibleAndAboveMiddle(heading, viewer))
                heading.scrollIntoView({ behavior: "auto", block: "start" });

            // put selection on heading
            SelectElement(heading);
        }
    }
    else {
        // if no heading specified - scroll document to top
        viewer.scrollTo({ behavior: "auto", top: 0 });
    }
}

function GetSelectedHeadingIndex(viewer) {
    const selection = window.getSelection();

    if (!selection.rangeCount || selection.isCollapsed)
        return -1;

    const range = selection.getRangeAt(0);

    if (!viewer.contains(range.commonAncestorContainer))
        return -1;

    const headings = [...viewer.querySelectorAll("h1, h2, h3")];

    for (let i = 0; i < headings.length; i++) {
        if (range.intersectsNode(headings[i]))
            return i;
    }

    return -1;
}

// Editor Selection
function SelectAndScrollEditor(editor, headingIndex, focus = true) {
    // move cursor to clicked Header position
    if (headingIndex >= 0) {
        // determine cursor position of heading; move cursor to this position
        const position = getHeadingCursorPosition(editor, headingIndex);
        if (position >= 0)
            editor.setSelectionRange(position, position);
        else
            editor.setSelectionRange(0, 0);
    } else {
        // if no heading specified - scroll editor to top
        editor.setSelectionRange(0, 0);
    }

    // scroll textarea to position cursor at the top
    scrollCursorToTop(editor);

    // focus textEditor
    if (focus) {
        editor.blur();
        editor.focus();
    }

    function getHeadingCursorPosition(textarea, headingIndex) {
        const text = textarea.value;
        const lines = text.split("\n");

        let index = 0;
        let position = 0;

        for (const line of lines) {
            if (/^#{1,3} /.test(line)) {
                if (index === headingIndex)
                    return position;

                index++;
            }

            position += line.length + 1; // +1 for "\n"
        }

        return -1;
    }

    function scrollCursorToTop(textarea) {
        const text = textarea.value;
        const cursor = textarea.selectionStart;

        const before = text.substring(0, cursor);
        const after = text.substring(cursor);

        // Let the browser calculate wrapping for text before the cursor.
        textarea.value = before;
        textarea.scrollTop = textarea.scrollHeight;

        const scrollHeight = textarea.scrollHeight;

        // Restore the complete document.
        textarea.value = before + after;
        textarea.selectionStart = textarea.selectionEnd = cursor;

        // Move the cursor's visual line to the top.
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
        textarea.scrollTop = scrollHeight + lineHeight;
    }
}

function GetHeadingIndexAtCursor(textarea) {
    const text = textarea.value;
    const cursor = textarea.selectionStart;
    const lines = text.split("\n");

    let position = 0;
    let headingIndex = -1;

    for (const line of lines) {
        if (position > cursor)
            break;

        if (/^#{1,3} /.test(line))
            headingIndex++;

        position += line.length + 1; // +1 for \n
    }

    return headingIndex;
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