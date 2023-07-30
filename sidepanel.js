const tableId = "result";
const lastElement = "last_element";
var tableHeader = "";
var contentList = [];

// Sleep function
const sleep = (time) => new Promise((res) => setTimeout(res, time, "done sleeping"));

/// init
updateHeader();
updateTable();

function updateHeader() {
    tableHeader = `<div class="table-container"><div class="table-image"><b>Image</b></div><div class="table-text"><b>Event</b></div></div><hr>`;
}

function lengthControl(str, len) {
    if (str.length > len) {
        return str.substring(0, len - 3) + "...";
    }
    return str;
}

function updateContent(content) {
    const contentId = content.eventId;
    const elementId = `rm_btn_${contentId}`;

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
        newContent += `<br>element "${lengthControl(content.text, 20)}"`;
    } else if (content.hasOwnProperty("navUrl")) {
        newContent += `<br><div title="${content.navUrl}">"${lengthControl(content.navUrl, 25)}"</div>`;
    }
    newContent += `</div>`;

    // remove button
    newContent += `<div class="table-remove">`;
    newContent += `<button class="remove-button" id="${elementId}">X</button>`;
    newContent += `</div>`;

    newContent += `</div><hr>`;

    console.log(`before contentList changes: ${contentId}`);
    contentList.push({
        id: contentId,
        content: newContent
    });
}

function updateTable() {
    var tableContent = "";
    console.log(`update table ${contentList.length}`);
    for (var i = 0; i < contentList.length; i++) {
        tableContent += contentList[i].content;
    }

    document.getElementById(tableId).innerHTML = tableHeader + tableContent;
    sleep(300).then(() => {
        updateListener();
    });
}

function updateView() {
    document.body.scrollIntoView({
        behavior: "auto",
        block: "end"
    });
}

function removeContent(position) {
    const contentId = contentList[position].id;
    console.log(`remove event ${contentId}`);
    contentList[position].content = "";
    updateTable();
    chrome.runtime.sendMessage({
        type: "bgRemove",
        content: contentId
    });
}

function updateListener() {
    for (var i = 0; i < contentList.length; i++) {
        if (contentList[i].content == "") continue;
        const position = i;
        const contentId = contentList[i].id;
        const elementId = `rm_btn_${contentId}`;
        document.getElementById(elementId).addEventListener("click", (event) => removeContent(position));
    }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "spUpdate":
            updateContent(message.content);
            updateView();
            updateTable();
            break;
        case "spClear":
            contentList = [];
            updateTable();
            break;
        default:
            // do nothing
            break;
    }
    return true;
});