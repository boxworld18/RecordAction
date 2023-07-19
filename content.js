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
    while (element) {
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

        var isFound = false;
        var needIx = 0;
        var ix = 0;

        var siblings = element.parentNode.childNodes;
        siblings.forEach((sibling) => {
            if (sibling === element)
                isFound = true;
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                if (isFound === false) ix++;
                needIx++;
            }
        });

        var suffix = ((needIx > 1) ? '[' + (ix + 1) + ']' : '');
        xpath = '/' + element.tagName.toLowerCase() + suffix + xpath;

        // iterate parent node
        element = element.parentNode;
    }

    return 'xpath/' + xpath;
}

function processClickEvent(event) {
    let obj = {};
    obj.type = event.type;
    obj.tagName = event.target.tagName.toLowerCase();
    obj.textContent = event.target.textContent;
    obj.value = event.target.value;
    obj.xpath = getXPath(event.target);
    obj.url = document.URL;

    chrome.runtime.sendMessage({
        type: obj
    });
}

function processChangeEvent(event) {
    let obj = {};
    obj.type = event.type;
    obj.tagName = event.target.tagName.toLowerCase(); // todo: selector
    obj.value = event.target.value;
    obj.xpath = getXPath(event.target);
    obj.url = document.URL;
    
    chrome.runtime.sendMessage({
        type: obj
    });
}

function processKeyEvent(event) {
    if (event.code !== "Enter") return;

    let obj = {};
    obj.name = event.key;
    obj.type = event.type;
    obj.code = event.code;

    chrome.runtime.sendMessage({
        type: obj
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
    });
}

function removeListeners() {
    document.body.removeEventListener('click', processClickEvent);
    document.body.removeEventListener('change', processChangeEvent);
    document.body.removeEventListener('keydown', processKeyEvent);
    document.body.removeEventListener('keyup', processKeyEvent);
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.type == "updateStatus") {
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