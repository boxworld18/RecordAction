// Import storage methods
try {
    importScripts("storage.js");
} catch (e) {
    console.log(e);
}

// Extension initialization
chrome.runtime.onInstalled.addListener(() => {
    console.log("Chrome ext: ->  extension started");
    saveToStorage("status", 0);
    sendResponse({status: "ok"});
});

// chrome.webNavigation.onCompleted.addListener((details) => {
//     console.log(details);
//     // console.log({
//     //     type: 'basic',
//     //     title: 'page loaded',
//     //     message: 'Completed loading: ' +
//     //         details.url +
//     //         ' at ' +
//     //         details.timeStamp +
//     //         ' milliseconds since the epoch.'
//     // });
// });

// Status change listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type == "startRecording" || message.type == "continueRecording") {
        saveToStorage("status", 1);
        // chrome.action.setIcon({
        //     path: "icon_rec.png"
        // });
        console.log("Recording started");
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
    } else {
        console.log(message.type)
    }

    sendResponse({status: "ok"});
    return true;
});