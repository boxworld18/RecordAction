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

function basicInfo(event) {
    let obj = {};
    obj.type = event.type;
    obj.windowView = {
        x: window.scrollX,
        y: window.scrollY
    };
    obj.url = document.URL;

    return obj;
}

function commonInfo(event) {
    let obj = basicInfo(event);
    
    obj.tagName = event.target.tagName.toLowerCase();
    obj.xpath = getXPath(event.target);
    obj.pointer = {
        x: event.clientX,
        y: event.clientY
    };
    obj.bounding = event.target.getBoundingClientRect();
    
    obj.html = document.documentElement.outerHTML;
    obj.elementPosNSize = getAllElePosNSize(document.body);

    return obj;
}

function getAllElePosNSize(node) {
    record = {};
    if (node.nodeType == Node.ELEMENT_NODE) {
        path = getXPath(node);
        data = node.getBoundingClientRect();
        if (data.x != 0 || data.y != 0 || data.width != 0 || data.height != 0) {
            record[path] = data;
        }
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        record = Object.assign(record, getAllElePosNSize(node.childNodes[i]));
    }
    return record;
}

function processClickEvent(event) {
    if (chrome.runtime == undefined) return;

    let obj = commonInfo(event);
    obj.text = event.target.text;
    obj.innerText = event.target.innerText;
    
    // remove leading and trailing spaces
    if (!(obj.text === undefined))
        obj.text = obj.text.trim();

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function processChangeEvent(event) {
    if (chrome.runtime == undefined) return;

    let obj = commonInfo(event);
    obj.value = event.target.value;

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function processKeyEvent(event) {
    if (chrome.runtime == undefined) return;
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
    if (chrome.runtime == undefined) return;

    let obj = basicInfo(event);
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
    if (chrome.runtime == undefined) return;

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

function processResizeEvent(event) {
    if (chrome.runtime == undefined) return;
    
    let obj = basicInfo(event);
    obj.windowSize = {
        x: window.innerWidth,
        y: window.innerHeight
    };

    chrome.runtime.sendMessage({
        type: 'event',
        event: obj
    });
}

function processHoverEvent(event) {
    if (chrome.runtime == undefined) return;

    let obj = commonInfo(event);
    obj.text = event.target.text;
    obj.innerText = event.target.innerText;
    
    // remove leading and trailing spaces
    if (!(obj.text === undefined))
        obj.text = obj.text.trim();

    // only record a or span
    if (!(obj.tagName == 'a' || obj.tagName == 'span')) return;

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
        document.body.addEventListener('mouseover', processHoverEvent);
        // document.body.addEventListener('mouseenter', processClickEvent);
        // document.body.addEventListener('mouseleave', processClickEvent);
        // document.addEventListener('scroll', processScrollEvent);
        document.addEventListener('scrollend', processScrollEvent);
        // navigation.addEventListener('navigate', processNavigateEvent);
        window.addEventListener('resize', processResizeEvent);
    });
}

function removeListeners() {
    document.body.removeEventListener('click', processClickEvent);
    document.body.removeEventListener('change', processChangeEvent);
    document.body.removeEventListener('keydown', processKeyEvent);
    document.body.removeEventListener('keyup', processKeyEvent);
    document.body.removeEventListener('mouseover', processHoverEvent);
    // document.body.removeEventListener('mouseenter', processClickEvent);
    // document.body.removeEventListener('mouseleave', processClickEvent);
    // document.removeEventListener('scroll', processScrollEvent);
    document.removeEventListener('scrollend', processScrollEvent);
    // navigation.removeEventListener('navigate', processNavigateEvent);
    window.removeEventListener('resize', processResizeEvent);
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.type == 'updateStatus') {
            if (message.status == 1)
                setListeners();
            else
                removeListeners();
            console.log(message.status);
        }
        return true;
    }
);
