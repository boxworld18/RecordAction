let observer = new MutationObserver(
    (mutations) => setListeners()
);

let config = {
    attributes: true,
    characterData: true,

    // childList: true,
    // subtree: true
};

observer.observe(document.body, config);

function processClickEvent(event) {
    let obj = {};
    obj.type = event.type;
    obj.tagName = event.currentTarget.tagName; // todo: selector
    obj.textContent = event.currentTarget.textContent; // element
    obj.value = event.currentTarget.value;

    // obj.bound = event.currentTarget.getBoundingClientRect();

    chrome.runtime.sendMessage({
        type: obj
    })
}

function processChangeEvent(event) {
    let obj = {};
    obj.type = event.type;
    obj.tagName = event.currentTarget.tagName; // todo: selector
    obj.value = event.currentTarget.value;

    // obj.bound = event.currentTarget.getBoundingClientRect();

    chrome.runtime.sendMessage({
        type: obj
    })
}

function setListeners() {
    getFromStorage("status").then((status) => {
        if (status != 1) return;

        // get all elements
        const elements = document.querySelectorAll('*');

        // add event listener to each element
        elements.forEach((element) => {
            // if (element.children.length > 0) return;
            element.removeEventListener('click', processClickEvent);
            element.removeEventListener('change', processChangeEvent);
            element.addEventListener('click', processClickEvent);
            element.addEventListener('change', processChangeEvent);
        });

    });
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        // Do nothing
    }
);