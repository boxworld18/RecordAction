const startIcon = document.querySelector(".start-icon");
const pauseIcon = document.querySelector(".pause-icon");
const stopIcon = document.querySelector(".stop-icon");

let isRunning = false;
let isPaused = false;

startIcon.addEventListener("click", () => {
    startIcon.style.display = "none";
    pauseIcon.style.display = "inline-block";

    if (!isRunning) {
        stopIcon.style.color = "black";
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

// Reset state of the extension when the popup is opened
window.onload = function setStorage() {
    getFromStorage("status").then(function (status) {
        if (status == 0) {
            startIcon.style.display = "inline-block";
            pauseIcon.style.display = "none";
            stopIcon.style.color = "grey";
            isRunning = false;
            isPaused = false;
        } else if (status == 1) {
            startIcon.style.display = "none";
            pauseIcon.style.display = "inline-block";
            stopIcon.style.color = "black";
            isRunning = true;
            isPaused = false;
        } else if (status == 2) {
            startIcon.style.display = "inline-block";
            pauseIcon.style.display = "none";
            stopIcon.style.color = "black";
            isRunning = true;
            isPaused = true;
        }
    });
}