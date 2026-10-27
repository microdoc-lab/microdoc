var Loc;

function InitLanguage() {
    var language = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('Language='))
        ?.substring('Language='.length) ?? 'US';

    switch (language) {
        case "UA": Loc = LocUA; break;
        default: Loc = LocUS; break;
    }
}

function ChangeLanguage(language) {
    document.cookie = `Language=${language}; path=/; max-age=31536000; SameSite=Lax`;
    location.reload();
}

function LocalizeElement(element) {
    [element, ...element.querySelectorAll('*')].forEach(element => {
        [...element.attributes]
            .filter(attr => attr.name.startsWith('data-loc-'))
            .forEach(attr => {
                const name = attr.name.substring('data-loc-'.length);

                if (name.includes('$'))
                    return;

                const value = Loc[attr.value] ?? "*" + attr.value + "*";

                const args = [...element.attributes]
                    .filter(a => a.name.startsWith(attr.name + "$"))
                    .sort((a, b) =>
                        Number(a.name.substring(attr.name.length + 1)) -
                        Number(b.name.substring(attr.name.length + 1)))
                    .map(a => a.value);

                const formatted = format(value, args);

                if (name === 'content')
                    element.textContent = formatted;
                else
                    element.setAttribute(name, formatted);
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