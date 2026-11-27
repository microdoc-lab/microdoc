// soft hover
function enableSoftHover(code, overselector, outselector, overDelay = 500, outDelay = 300) {
    let enterTimer = null;
    let pendingEnter = null;
    let activeElement = null;

    if (!outselector)
        outselector = overselector;

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
        //if (activeElement && activeElement !== element) {
        //    cancelLeave(activeElement);
        //    activeElement.classList.remove("hover");
        //}

        element.classList.add("hover");
        activeElement = element;
    }

    // hover element when mouse pointer over overselector
    document.addEventListener("pointerover", event => {
        if (!(event.target instanceof Element))
            return;

        const overelement = event.target.closest(overselector);
        if (!overelement)
            return;

        const element = event.target.closest(outselector);
        if (!element)
            return;

        // Ignore movement within the same matching element.
        if (event.relatedTarget instanceof Node &&
            overelement.contains(event.relatedTarget))
            return;

        // console.log(code + " pointerover " + element + " " + overDelay);

        cancelLeave(element);

        // Cancel a pending activation if we enter another element.
        if (pendingEnter !== element) {
            cancelEnter();
            pendingEnter = element;

            enterTimer = setTimeout(() => {
                activate(element);
                enterTimer = null;
                pendingEnter = null;
            }, event.custom ? 0 : overDelay);
        }
    });

    // unhover element when mouse pointer leave outselector
    document.addEventListener("pointerout", event => {
        if (!(event.target instanceof Element))
            return;

        const element = event.target.closest(outselector);
        if (!element)
            return;

        // Ignore movement within the same matching element.
        if (event.relatedTarget instanceof Node &&
            element.contains(event.relatedTarget))
            return;

        // console.log(code + " pointerout " + element + " " + outDelay);

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
        }, event.custom ? 0 : outDelay);

        leaveTimers.set(element, timer);
    });

    if (overselector == outselector)
        return;

    // don't hover element if mouse pointer leave overselector
    document.addEventListener("pointerout", event => {
        if (!(event.target instanceof Element))
            return;

        const overelement = event.target.closest(overselector);
        if (!overelement)
            return;

        const element = overelement.closest(outselector);

        // skip if element already hovered
        if (element.classList.contains("hover"))
            return;

        // Ignore movement within the same matching element.
        if (event.relatedTarget instanceof Node &&
            overelement.contains(event.relatedTarget))
            return;

        // console.log(code + " pointerout " + element + " " + outDelay);

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
        }, event.custom ? 0 : outDelay);

        leaveTimers.set(element, timer);
    });
}

function pointeroverRaise(element) {
    var arg = new PointerEvent("pointerover", {
        bubbles: true,
        cancelable: true,
        pointerType: "mouse"
    });
    arg.custom = true;
    element.dispatchEvent(arg);
}

function pointeroutRaise(element) {
    var arg = new PointerEvent("pointerout", {
        bubbles: true,
        cancelable: true,
        pointerType: "mouse"
    });
    arg.custom = true;
    element.dispatchEvent(arg);
}