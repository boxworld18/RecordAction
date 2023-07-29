/* Function Bar */
const startIcon = document.querySelector(".start-icon");
const pauseIcon = document.querySelector(".pause-icon");
const stopIcon = document.querySelector(".stop-icon");
const saveIcon = document.querySelector(".save-icon");
const cameraIcon = document.querySelector(".camera-icon");
const videoIcon = document.querySelector(".video-icon");
const sendIcon = document.querySelector(".send-icon");
const input = document.querySelector('input[type="text"]');

let isRunning = false;
let isPaused = false;

function updateTabStatus(state) {
    chrome.tabs.query({
        active: true
    }, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
                type: "updateStatus",
                status: state
            });
        });
    });
}

startIcon.addEventListener("click", () => {
    startIcon.style.display = "none";
    pauseIcon.style.display = "inline-block";

    updateTabStatus(1);
    if (!isRunning) {
        stopIcon.style.color = "";
        stopIcon.classList.remove("disabled");
        stopIcon.classList.add("selected");
        saveIcon.classList.remove("selected");
        saveIcon.classList.add("disabled");
        chrome.runtime.sendMessage({
            type: "startRecording"
        });
        isRunning = true;
    } else {
        chrome.runtime.sendMessage({
            type: "continueRecording"
        });
        isPaused = false;
    }
});

pauseIcon.addEventListener("click", () => {
    pauseIcon.style.display = "none";
    startIcon.style.display = "inline-block";

    updateTabStatus(2);
    chrome.runtime.sendMessage({
        type: "pauseRecording"
    });
    isPaused = true;
});

stopIcon.addEventListener("click", () => {
    // Only stop if we're currently playing
    if (isRunning) {
        stopIcon.style.display = "inline-block";
        stopIcon.style.color = "grey";
        stopIcon.classList.remove("selected");
        stopIcon.classList.add("disabled");
        saveIcon.classList.remove("disabled");
        saveIcon.classList.add("selected");

        updateTabStatus(0);
        chrome.runtime.sendMessage({
            type: "stopRecording"
        });

        if (!isPaused) {
            pauseIcon.style.display = "none";
            startIcon.style.display = "inline-block";
        }

        isRunning = false;
        isPaused = false;
    }
});

saveIcon.addEventListener("click", () => {
    if (!isRunning) {
        chrome.runtime.sendMessage({
            type: "save"
        });
    }
});

cameraIcon.addEventListener("click", () => {
    if (cameraIcon.classList.contains("disabled")) return;
    chrome.runtime.sendMessage({
        type: "capture"
    });
});

videoIcon.addEventListener("click", () => {
    if (videoIcon.classList.contains("disabled")) return;
    chrome.windows.create({
        url: chrome.runtime.getURL("recorder.html"),
        focused: false
    });

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        var tabId = tabs[0].id;
        // Get the stream id of the tab
        chrome.tabCapture.getMediaStreamId({
            targetTabId: tabId
        }, (id) => {
            chrome.runtime.sendMessage({
                type: "videoCapture",
                streamId: id
            });

            const extensionId = chrome.runtime.id;
            var url = `chrome-extension://${extensionId}/recorder.html`
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.runtime.sendMessage({
                        type: `URL: ${tab.url}`,
                    });

                    if (tab.url == url) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: "videoCapture",
                            streamId: id
                        });
                    }
                });
            });

        });
    });

});

/* Input Bar */
input.addEventListener('change', () => {
    const text = input.value;
    chrome.runtime.sendMessage({
        type: "updateText",
        text: text
    });
});

sendIcon.addEventListener("click", () => {
    const text = input.value;
    chrome.runtime.sendMessage({
        type: "updateText",
        text: text
    });
});

function updateExternally(status) {
    updateTabStatus(status);
    if (status == 0) {
        startIcon.style.display = "inline-block";
        pauseIcon.style.display = "none";
        stopIcon.style.color = "grey";
        isRunning = false;
        isPaused = false;
    } else {
        if (status < 0 || status > 2) return;

        if (stopIcon.classList.contains("disabled")) {
            stopIcon.classList.remove("disabled");
            stopIcon.classList.add("selected");
            saveIcon.classList.remove("selected");
            saveIcon.classList.add("disabled");
        }

        if (status == 1) {
            startIcon.style.display = "none";
            pauseIcon.style.display = "inline-block";
            stopIcon.style.color = "";
            isPaused = false;
        } else if (status == 2) {
            startIcon.style.display = "inline-block";
            pauseIcon.style.display = "none";
            stopIcon.style.color = "";
            isPaused = true;
        }

        isRunning = true;
    }
}

// Status change listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "startRecording":
        case "continueRecording":
            updateExternally(1);
            break;
        case "pauseRecording":
            updateExternally(2);
            break;
        case "stopRecording":
            updateExternally(0);
            break;
        default:
            break;
    }

    return true;
});

// Reset state of the extension when the popup is opened
window.onload = () => {
    getFromStorage("status").then((status) => {
        updateExternally(status);
    });
    getFromStorage("userTarget").then((text) => {
        if (text == undefined) return;
        if (text.length == 0) return;
        input.value = text;
    });
}