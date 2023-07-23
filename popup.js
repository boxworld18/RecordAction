/* Button */
const startIcon = document.querySelector(".start-icon");
const pauseIcon = document.querySelector(".pause-icon");
const stopIcon = document.querySelector(".stop-icon");
const saveIcon = document.querySelector(".save-icon");
const cameraIcon = document.querySelector(".camera-icon");

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
        stopIcon.style.color = "black";
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
    chrome.runtime.sendMessage({
        type: "capture"
    });
});

/* Input */
const input = document.querySelector('input[type="text"]');
input.addEventListener('change', () => {
    const text = input.value;
    chrome.runtime.sendMessage({
        type: "updateText",
        text: text
    });
});

cameraIcon.addEventListener("click", () => {
    const text = input.value;
    chrome.runtime.sendMessage({
        type: "updateText",
        text: text
    });
});


// Reset state of the extension when the popup is opened
window.onload = () => {
    getFromStorage("status").then((status) => {
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
                stopIcon.style.color = "black";
                isPaused = false;
            } else if (status == 2) {
                startIcon.style.display = "inline-block";
                pauseIcon.style.display = "none";
                stopIcon.style.color = "black";
                isPaused = true;
            }

            isRunning = true;
        }
    });
}