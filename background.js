// Import storage methods
try {
    importScripts("storage.js");
} catch (e) {
    console.log(e);
}

let timestamp = '--NO-TIMESTAMP--';
let eventArray = [];

// Extension initialization
chrome.runtime.onInstalled.addListener(() => {
    console.log("Chrome ext: ->  extension started");
    saveToStorage("status", 0);
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

// Status change listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type == "startRecording" || message.type == "continueRecording") {
        saveToStorage("status", 1);
        // chrome.action.setIcon({
        //     path: "icon_rec.png"
        // });
        console.log("Recording started");

        // update timestamp if it's a new recording
        if (message.type == "startRecording") {
            timestamp = getTimeStamp();
            eventArray = [];
        }

    } else if (message.type == "pauseRecording") {
        saveToStorage("status", 2);
        // chrome.action.setIcon({
        //     path: "icon_pause.png"
        // });
        console.log("Pause recording");
    } else if (message.type == "stopRecording") {
        saveToStorage("status", 0);
        // chrome.action.setIcon({
        //     path: "icon.png"
        // });
        console.log("Recording stopped");

        // save events to file
        saveToStorage("events", eventArray);

    } else if (message.type == "save") {
        const jsonse = JSON.stringify(eventArray);
        const filename = `recact_${timestamp}.json`;
        const reader = new FileReader();
        const blob = new Blob([jsonse], {
            type: "application/json"
        });

        reader.onload = function () {
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

    } else if (message.type == "event") {
        const obj = message.event;
        const url = obj.url;
        const eType = obj.type;
        // remove chrome extension events
        if (!(url == undefined) && getUrlPrefix(url).toLowerCase() == "chrome-extension") return;

        // keep only the last scrollend event for each url
        var lastObj = {};
        if (eventArray.length)
            lastObj = eventArray[eventArray.length - 1];
        
        if (eType == "scrollend" && url == lastObj.url && eType == lastObj.type)
            eventArray.pop();
        
        // add screenshot
        if (eType !== "scrollend") {
            chrome.tabs.captureVisibleTab((dataUri) => {
                obj.screenshot = dataUri;
            });
        }

        eventArray.push(obj);

        // display events in console
        if (eType !== "scrollend") {
            if (lastObj.type == "scrollend")
                console.log(lastObj);
            console.log(obj);
        }

    } else if (message.type == "capture") {
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
    } else {
        console.log(message.type);
    }

    return true;
});