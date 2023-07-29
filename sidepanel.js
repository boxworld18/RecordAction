const tableId = "result";
var tableHeader = "";
var tableContent = "";

/// init
updateHeader();
updateTable();

function updateHeader() {
    tableHeader = `<div class="table-container"><div class="table-image"><b>Image</b></div><div class="table-text"><b>Event</b></div></div><hr>`;
}

function lengthControl(str, len) {
    if (str.length > len) {
        return str.substring(0, len) + "...";
    }
    return str;
}
function updateContent(content) {
    var newContent = "";
    newContent += `<div class="table-container">`;

    // add screenshot
    newContent += `<div class="table-image">`;
    if (content.hasOwnProperty("screenshot")) {
        newContent += `<img class="table-img" src="${content.screenshot}" width="100%" height="100%">`;
    }
    newContent += `</div>`;

    // event info
    newContent += `<div class="table-text">`;
    
    newContent += `<b>${content.type}</b>`;
    if (content.hasOwnProperty("text")) {
        newContent += `<br>element "${content.text}"`;
    }
    
    newContent += `</div>`;

    newContent += "</div><hr>"
    tableContent += newContent;
}

function updateTable() {
    document.getElementById(tableId).innerHTML = tableHeader + tableContent;
}

function updateView() {
    document.body.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "spUpdate":
            updateContent(message.content);
            updateTable();
            updateView();
            break;
        case "spClear":
            tableContent = "";
            updateTable();
            break;
        default:
            // do nothing
            break;
    }
    return true;
});