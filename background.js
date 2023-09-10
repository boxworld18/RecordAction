// Import storage methods
try {
    importScripts("storage.js");
} catch (e) {
    console.log(e);
}

// Init event
const baseEvent = {
    id: -1,
    object: null
};

// Record data
let timestamp = '--NO-TIMESTAMP--';
let eventArray = [baseEvent];
let webID = "0";
let taskID = "0";
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
    saveToStorage("webID", "0");
    saveToStorage("taskID", "0");
});

function updateEventArray(obj) {
    obj.eventId = objId;
    eventArray.push({
        id: objId,
        object: obj
    });
    objId++;
}

function captureCurrentStatus(obj) {
    chrome.tabs.query({
        active: true
    }, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
                type: "captureStatus",
                event: obj
            });
        });
    });
}

// Listen navigation events
chrome.webNavigation.onCompleted.addListener((details) => {
    if (nowStatus == 1 && details.frameId == 0) {
        console.log(details);

        let obj = {
            type: "navigation",
            navUrl: details.url
        };

        captureCurrentStatus(obj);

        // const waitTime = Math.max(captureInterval - (Date.now() - lastCapture), 1);

        // sleep(waitTime).then(chrome.tabs.captureVisibleTab((dataUri) => {
        //     obj.screenshot = dataUri;
        // }));

        // sleep(1000).then(() => {
        //     updateEventArray(obj);
        //     console.log(obj);
        //     updateContent(obj);
        // });
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

function insertContent(rawContent) {
    const contentId = rawContent.eventId;
    const lastContentId = rawContent.lastContentId;

    var pos = 0;
    var content = {};
    while (pos < eventArray.length && eventArray[pos].id !== lastContentId) pos++;

    const lastObj = eventArray[pos].object;

    if (pos < eventArray.length) {
        if (lastObj.hasOwnProperty("url"))
            rawContent.url = lastObj.url;
        if (rawContent.type == "change")
            content = JSON.parse(JSON.stringify(lastObj));
    }

    for (var key in rawContent)
        content[key] = rawContent[key];

    console.log(`Inserting content ${contentId} with text:`);
    console.log(content);

    eventArray.splice(pos + 1, 0, {
        id: contentId,
        object: content
    });
}

function updateValue(content) {
    const contentId = content.id;
    const value = content.value;
    const key = content.key;
    for (var i = 0; i < eventArray.length; i++) {
        if (eventArray[i].id == contentId) {
            eventArray[i].object[key] = value;
            console.log(`Updating content ${contentId} with text:`);
            console.log(eventArray[i].object);
            return;
        }
    }
}

function removeContent(contentId) {
    console.log(`Removing content ${contentId}`);
    for (var i = 0; i < eventArray.length; i++) {
        if (eventArray[i].id == contentId) {
            eventArray[i].object = null;
            return;
        }
    }
}

function getLastElement() {
    var obj = {
        type: "undefined"
    };

    if (eventArray.length)
        obj = eventArray[eventArray.length - 1].object;

    return obj;
}

async function handleEvent(obj) {
    if (nowStatus !== 1) return;

    const url = obj.url;
    const eType = obj.type;

    // remove chrome extension events
    if (!(url == undefined) && getUrlPrefix(url).toLowerCase() == "chrome-extension") return;

    // last move
    var lastObj = getLastElement();

    // remove duplicate events
    if (!(lastObj == undefined)) {
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

    if (!(lastObj == undefined) && lastObj.type == "resize") {
        console.log(lastObj);
        updateContent(lastObj);
    }

    await sleep(1000);

    console.log(obj);
    updateContent(obj);

    lastEventPosX = obj.posX;
    lastEventPosY = obj.posY;
}

function saveAsFile(target, webId, taskId) {
    var newArray = [];
    for (var i = 0; i < eventArray.length; i++) {
        if (eventArray[i].object != null) {
            newArray.push(eventArray[i].object);
        }
    };

    const object = {
        target: target,
        action: newArray,
        timestamp: timestamp,
        version: "0.3.9",
    }

    const jsonse = JSON.stringify(object);
    const filename = `tasks/${webId}/recact_${taskId}.json`;
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
            eventArray = [baseEvent];
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
            target = message.target;
            webId = message.webId;
            taskId = message.taskId;

            saveAsFile(target, webId, taskId);
            break;

        case "updateWebID":
            webID = message.text;
            console.log(`Web ID: ${webID}`);
            saveToStorage("webID", webID);
            break;

        case "updateTaskID":
            taskID = message.text;
            console.log(`Task ID: ${taskID}`);
            saveToStorage("taskID", taskID);
            break;

        case "capture":
            windowCapture();
            break;

        case "videoCapture":
            console.log(`Video capture started, stream id: ${message.streamId}`);
            break;

        case "bgInsert":
            insertContent(message.content);
            break;

        case "bgUpdateValue":
            updateValue(message.content);
            break;

        case "bgRemove":
            removeContent(message.content);
            break;

        default:
            console.log(message.type);
    }

    return true;
});