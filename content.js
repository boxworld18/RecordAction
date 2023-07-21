let observer = new MutationObserver(
    (mutationList) => setListeners()
);

let config = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
};

observer.observe(document.body, config);

function getXPath(element) {
    var xpath = '';
    while (!(element == undefined)) {
        // Find the element's index within its parent
        if (element.id !== '') {
            xpath = '//*[@id="' + element.id + '"]' + xpath;
            break;
        }

        // Back to root
        if (element === document.body) {
            xpath = '/html/body' + xpath;
            break;
        }

        const parent = element.parentNode;

        // Element is 'root'
        if (parent == undefined) {
            xpath = '/' + element.tagName.toLowerCase() + xpath;
            break;
        }

        var isFound = false;
        var totIx = 0;
        var ix = 0;

        parent.childNodes.forEach((sibling) => {
            if (sibling === element)
                isFound = true;
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                if (isFound === false) ix++;
                totIx++;
            }
        });

        var suffix = ((totIx > 1) ? '[' + (ix + 1) + ']' : '');
        xpath = '/' + element.tagName.toLowerCase() + suffix + xpath;

        // iterate parent node
        element = parent;
    }

    return 'xpath/' + xpath;
}

function processClickEvent(event) {
    let obj = {};
    obj.type = event.type;
    obj.tagName = event.target.tagName.toLowerCase();

    // remove useless click events
    if (obj.tagName == 'div') return;

    obj.text = event.target.text;
    obj.innerText = event.target.innerText;
    obj.xpath = getXPath(event.target);
    obj.pointer = {
        x: event.clientX,
        y: event.clientY
    };
    obj.bounding = event.target.getBoundingClientRect();
    obj.url = document.URL;
    obj.html = document.documentElement.outerHTML;

    // remove leading and trailing spaces
    if (!(obj.text === undefined))
        obj.text = obj.text.trim();

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function processChangeEvent(event) {
    let obj = {};
    obj.type = event.type;
    obj.tagName = event.target.tagName.toLowerCase(); // todo: selector
    obj.value = event.target.value;
    obj.xpath = getXPath(event.target);
    obj.pointer = {
        x: event.clientX,
        y: event.clientY
    };
    obj.bounding = event.target.getBoundingClientRect();
    obj.url = document.URL;
    obj.html = document.documentElement.outerHTML;

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function processKeyEvent(event) {
    if (event.code !== 'Enter') return;

    let obj = {};
    obj.name = event.key;
    obj.type = event.type;
    obj.code = event.code;

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function processScrollEvent(event) {
    let obj = {};
    obj.type = event.type;

    // last scroll position
    obj.scrollTop = document.documentElement.scrollTop;
    obj.scrollLeft = document.documentElement.scrollLeft;
    obj.url = document.URL;
    // obj.html = document.documentElement.outerHTML;

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function getDomain(url) {
    var domain = url.replace(/[\w-:]*\/\//, '').split(/[/?#]/)[0];
    return domain;
}

function processNavigateEvent(event) {
    var src_url = document.URL;
    var dst_url = event.destination.url;

    // both urls have same domain
    if (getDomain(src_url) === getDomain(dst_url)) return;

    let obj = {};
    obj.type = event.type;
    obj.url = dst_url;
    obj.html = document.documentElement.outerHTML;

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function setListeners() {
    getFromStorage('status').then((status) => {
        if (status != 1) return;
        removeListeners();
        document.body.addEventListener('click', processClickEvent);
        document.body.addEventListener('change', processChangeEvent);
        document.body.addEventListener('keydown', processKeyEvent);
        document.body.addEventListener('keyup', processKeyEvent);
        // document.addEventListener('scroll', processScrollEvent);
        document.addEventListener('scrollend', processScrollEvent);
        navigation.addEventListener('navigate', processNavigateEvent);
    });
}

function removeListeners() {
    document.body.removeEventListener('click', processClickEvent);
    document.body.removeEventListener('change', processChangeEvent);
    document.body.removeEventListener('keydown', processKeyEvent);
    document.body.removeEventListener('keyup', processKeyEvent);
    // document.removeEventListener('scroll', processScrollEvent);
    document.removeEventListener('scrollend', processScrollEvent);
    navigation.removeEventListener('navigate', processNavigateEvent);
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.type == 'updateStatus') {
            if (message.status == 1) {
                console.log('hi - true');
                setListeners();
            } else {
                console.log('hi - false');
                removeListeners();
            }
            console.log(message.status);
        }
        return true;
    }
);