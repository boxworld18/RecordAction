const tableId = "result";
var tableHeader = "";
var tableContent = "";

/// init
updateHeader();
updateTable();

function updateHeader() {
    tableHeader = "<tr><th>Image</th><th>Event</th></tr>";
}

function updateContent(content) {
    var newContent = "";
    newContent += "<tr>";

    if (content.hasOwnProperty("screenshot")) {
        newContent += `<td><img src="${content.screenshot}" width="200" height="200"></td>`;
    } else {
        newContent += `<td></td>`;
    }

    newContent += `<td>${content.type}</td>`;

    newContent += "</tr>"
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