/* Function Bar */
const startIcon = document.querySelector(".start-icon");
const pauseIcon = document.querySelector(".pause-icon");
const stopIcon = document.querySelector(".stop-icon");
const saveIcon = document.querySelector(".save-icon");
const cameraIcon = document.querySelector(".camera-icon");
const videoIcon = document.querySelector(".video-icon");
const web_id = document.querySelector('#web_id');
const task_id = document.querySelector('#task_id');
const web_info = document.querySelector('#web_info');
const task_info = document.querySelector('#task_info');
const web_left = document.querySelector('#web_left');
const web_right = document.querySelector('#web_right');
const task_left = document.querySelector('#task_left');
const task_right = document.querySelector('#task_right');


const maxWebID = 6;
const maxTaskID = 50;

let isRunning = false;
let isPaused = false;

function isNum(val){
    return !isNaN(val)
}

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

/* web id Bar */
web_id.addEventListener('change', () => {
    if (!isNum(web_id.value) || web_id.value > maxWebID) {
        getFromStorage("webID").then((text) => {
            if (text == undefined) return;
            if (text.length == 0) return;
            web_id.value = text;
        });
        return;
    }

    // update storage web id
    chrome.runtime.sendMessage({
        type: "updateWebID",
        text: web_id.value
    });

    // readFile
    const metaPath = chrome.runtime.getURL(`tasks/${web_id.value}/meta.json`);
    fetch(metaPath).then(
        (res) => res.json()
    ).then((result) => {
        data = result;

        // update web info
        web_info.innerHTML = data.purpose;

        // jump to new website
        console.log(data.url);
        chrome.tabs.create({url: `https://${data.url}/`});

        // task id to be 0
        task_id.value = 0;
        task_id.dispatchEvent(new Event("change"));
    });
});

/* task id Bar */
task_id.addEventListener('change', () => {
    
    if (!isNum(task_id.value) || task_id.value > maxTaskID) {
        getFromStorage("taskID").then((text) => {
            if (text == undefined) return;
            if (text.length == 0) return;
            task_id.value = text;
        });
        return;
    }

    // update storage task id
    chrome.runtime.sendMessage({
        type: "updateTaskID",
        text: task_id.value
    });

    // readFile
    const dataPath = chrome.runtime.getURL(`tasks/${web_id.value}/data.jsonl`);
    fetch(dataPath).then(
        (res) => res.text()
    ).then((result) => {
        dataList = result.split('\n');

        data = JSON.parse(dataList[Number(task_id.value)]);
        console.log(data);

        // update task info
        task_info.innerHTML = data.query;
    });
    
});

web_left.addEventListener("click", () => {
    web_id.value = web_id.value - 1 > 0? web_id.value - 1: 0;
    web_id.dispatchEvent(new Event("change"));
});

web_right.addEventListener("click", () => {
    web_id.value = String(Number(web_id.value) + 1);
    web_id.dispatchEvent(new Event("change"));
});

task_left.addEventListener("click", () => {
    task_id.value = task_id.value - 1 > 0? task_id.value - 1: 0;
    task_id.dispatchEvent(new Event("change"));
});

task_right.addEventListener("click", () => {
    task_id.value = String(Number(task_id.value) + 1);
    task_id.dispatchEvent(new Event("change"));
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
    getFromStorage("webID").then((text) => {
        if (text == undefined) return;
        if (text.length == 0) return;
        web_id.value = text;
        web_id.dispatchEvent(new Event("change"));
    });
    getFromStorage("taskID").then((text) => {
        if (text == undefined) return;
        if (text.length == 0) return;
        task_id.value = text;
        task_id.dispatchEvent(new Event("change"));
    });
}