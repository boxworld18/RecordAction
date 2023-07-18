// Import storage methods
try {
	importScripts("storage.js");
} catch (e) {
	console.log(e);
}

// Extension initialization
chrome.runtime.onInstalled.addListener(
	function () {
		console.log("Chrome ext: ->  extension started");
		saveToStorage("status", 0);
	}
);

// Status change listener
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type == "startRecording" || message.type == "continueRecording") {
        saveToStorage("status", 1);
        // chrome.action.setIcon({
        //     path: "icon_rec.png"
        // });
        console.log("Recording started");
    }

    if (message.type == "pauseRecording") {
        saveToStorage("status", 2);
        // chrome.action.setIcon({
        //     path: "icon_pause.png"
        // });
        console.log("Pause recording");
    }

    if (message.type == "stopRecording") {
        saveToStorage("status", 0);
        // chrome.action.setIcon({
        //     path: "icon.png"
        // });
        console.log("Recording stopped");
    }

    return true;
});