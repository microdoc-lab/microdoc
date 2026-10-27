// soft hover
function enableSoftHover(code, selector, delayEnter = 500, delayLeave = 300) {
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

        // console.log(code + " pointerover " + element + " " + element.matches(":hover"));

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

        // console.log(code + " pointerout " + element + " " + element.matches(":hover"));

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
