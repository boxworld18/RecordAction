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
        // sendResponse({
        //     content: jsonse,
        //     filename: filename
        // });

    } else if (message.type == "event") {
        const obj = message.event;
        const url = obj.url;
        // remove chrome extension events
        if (!(url == undefined) && getUrlPrefix(url).toLowerCase() == "chrome-extension") return;
        eventArray.push(obj);
        console.log(obj);
    } else {
        console.log(message.type);
    }

    return true;
});