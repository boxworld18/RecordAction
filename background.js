// Import storage methods
try {
    importScripts("storage.js");
} catch (e) {
    console.log(e);
}

// Record data
let timestamp = '--NO-TIMESTAMP--';
let eventArray = [];
let userTarget = '';
let nowStatus = 0;
let objId = 0;

// Screenshot parameters
let windowSizeX = 1280;
let windowSizeY = 900;
let lastEventPosX = 0;
let lastEventPosY = 0;
let lastCapture = 0;
const captureInterval = 1000;

// Sleep function
const sleep = (time) => new Promise((res) => setTimeout(res, time, "done sleeping"));

// Extension initialization
chrome.runtime.onInstalled.addListener(() => {
    console.log("Chrome ext: ->  extension started");
    saveToStorage("status", 0);
    saveToStorage("userTarget", "");
});

function updateEventArray(obj) {
    obj.eventId = objId;
    eventArray.push(obj);
    objId++;
}
// Listen navigation events
chrome.webNavigation.onCompleted.addListener((details) => {
    if (nowStatus == 1 && details.frameId == 0) {
        console.log(details);

        let obj = {
            type: "navigation",
            navUrl: details.url
        };

        const waitTime = Math.max(captureInterval - (Date.now() - lastCapture), 1);

        sleep(waitTime).then(chrome.tabs.captureVisibleTab((dataUri) => {
            obj.screenshot = dataUri;
        }));

        sleep(1000).then(() => {
            updateEventArray(obj);
            console.log(obj);
            updateContent(obj);
        });
    }
});

function getTimeStamp() {
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);

    const formattedDate = `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
    console.log("Current Time: " + formattedDate);
    return formattedDate;
}

function getUrlPrefix(url) {
    var prefix = url.split(/:\/\//)[0];
    return prefix;
}

// declare the function
function downloadAsDataURL(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = () => resolve(reader.result)
                reader.onerror = err => reject(err)
            })
            .catch(err => reject(err))
    })
}

function updateContent(content, type = "spUpdate") {
    chrome.runtime.sendMessage({
        type: type,
        content: content
    });
}

function removeContent(contentId) {
    eventArray[contentId] = null;
}

async function handleEvent(obj) {
    const url = obj.url;
    const eType = obj.type;

    // remove chrome extension events
    if (!(url == undefined) && getUrlPrefix(url).toLowerCase() == "chrome-extension") return;

    // last move
    var lastObj = {
        type: "undefined"
    };

    if (eventArray.length)
        lastObj = eventArray[eventArray.length - 1];

    // remove duplicate events
    if (eType == "scrollend" && url == lastObj.url && eType == lastObj.type) {
        if (Math.abs(obj.windowView.x - lastEventPosX) * 3 < windowSizeX &&
            Math.abs(obj.windowView.y - lastEventPosY) * 3 < windowSizeY)
            return;
    }

    if (eType == "resize" && eType == lastObj.type) {
        windowSizeX = obj.windowSize.x;
        windowSizeY = obj.windowSize.y;
        eventArray.pop();
        objId--;
    }

    // add screenshot
    const waitTime = Math.max(captureInterval - (Date.now() - lastCapture), 1);
    console.log(`waitTime: ${waitTime}`);

    if ((eType == "resize" || eType !== "scroll") && waitTime > 1) return;

    // for normal event, wait for captureInterval and then capture screenshot
    // but for duplicate scroll events, capture screenshot immediately or drop it
    await sleep(waitTime);

    await chrome.tabs.captureVisibleTab((dataUri) => {
        obj.screenshot = dataUri;
    });

    lastCapture = Date.now();
    console.log('window captured');

    updateEventArray(obj);

    // display events in console
    if (eType == "resize") return;

    if (lastObj.type == "resize") {
        console.log(lastObj);
        updateContent(lastObj);
    }

    await sleep(1000);

    console.log(obj);
    updateContent(obj);

    lastEventPosX = obj.posX;
    lastEventPosY = obj.posY;
}

function saveAsFile() {
    var newArray = [];
    for (var i = 0; i < eventArray.length; i++) {
        if (eventArray[i] != null) {
            newArray.push(eventArray[i]);
        }
    };

    const object = {
        target: userTarget,
        action: newArray,
        timestamp: timestamp
    }

    const jsonse = JSON.stringify(object);
    const filename = `recact_${timestamp}.json`;
    const reader = new FileReader();
    const blob = new Blob([jsonse], {
        type: "application/json"
    });

    reader.onload = () => {
        const url = reader.result;
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false,
            conflictAction: 'overwrite'
        });
    };

    reader.readAsDataURL(blob);
    console.log(`Saving events to file ${filename}`);
}

function windowCapture() {
    chrome.tabs.captureVisibleTab((dataUri) => {
        downloadAsDataURL(dataUri)
            .then((res) => {
                console.log(`Window captured!`);
                console.log(dataUri);
                console.log(res);
                chrome.downloads.download({
                    url: res,
                    filename: 'test.jpg',
                    saveAs: false,
                    conflictAction: 'overwrite'
                });
            })
            .catch((err) => {
                console.error(err)
            })
    });
}

function setStatus(status) {
    nowStatus = status;
    // chrome.action.setIcon({
    //     path: `icon_${status}.png`
    // });
}

// Status change listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "startRecording":
            // update timestamp if it's a new recording
            timestamp = getTimeStamp();
            eventArray = [];
            objId = 0;
            updateContent({}, "spClear");
        case "continueRecording":
            saveToStorage("status", 1);
            setStatus(1);
            console.log("Recording started");
            break;
        case "pauseRecording":
            saveToStorage("status", 2);
            setStatus(2);
            console.log("Pause recording");
            break;
        case "stopRecording":
            saveToStorage("status", 0);
            setStatus(0);
            console.log("Recording stopped");
            break;

        case "event":
            var obj = message.event;
            handleEvent(obj);
            break;

        case "save":
            saveAsFile();
            break;

        case "updateText":
            userTarget = message.text;
            console.log(`User target: ${userTarget}`);
            saveToStorage("userTarget", userTarget);
            break;

        case "capture":
            windowCapture();
            break;

        case "videoCapture":
            console.log(`Video capture started, stream id: ${message.streamId}`);
            break;

        case "bgRemove":
            removeContent(message.content)
            break;

        default:
            console.log(message.type);
    }

    return true;
});