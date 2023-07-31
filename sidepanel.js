const tableId = "result";
var objId = -1;

/// Sleep function
const sleep = (time) => new Promise((res) => setTimeout(res, time, "done sleeping"));

/// init
resetTable();

/// reset: clear all content in the table
function resetTable() {
    objId = -1;
    const contentId = objId--;

    var header = document.createElement('div');
    header.classList.add("table-cell");
    header.id = `ctx_${contentId}`;

    var hdrImg = document.createElement('div');
    hdrImg.classList.add("cell-image");
    hdrImg.innerHTML = `<b>Image</b>`;
    header.appendChild(hdrImg);

    var hdrTxt = document.createElement('div');
    hdrTxt.classList.add("cell-text");
    hdrTxt.innerHTML = `<b>Event</b>`;
    header.appendChild(hdrTxt);

    var hdrBtn = document.createElement('div');
    hdrBtn.classList.add("table-remove");

    // button container
    var ctnBtn = document.createElement('div');
    ctnBtn.classList.add("content-button-container");

    const addBtnId = `add_btn_${contentId}`;
    var addBtn = document.createElement('i');
    addBtn.classList.add("add-button", "fas", "fa-plus", "selected");
    addBtn.id = addBtnId;

    ctnBtn.appendChild(addBtn);
    hdrBtn.appendChild(ctnBtn);
    header.appendChild(hdrBtn);

    const hdrHr = document.createElement('hr');
    hdrHr.id = `ctx_hr_${contentId}`;

    document.getElementById(tableId).replaceChildren(header, hdrHr);
    sleep(300).then(() => {
        document.getElementById(addBtnId).addEventListener("click", (event) => addContent(contentId));
    });
}

function lengthControl(str, len) {
    if (str.length > len) {
        return str.substring(0, len - 3) + "...";
    }
    return str;
}

function updateContent(content) {
    const contentId = content.eventId;

    var newContent = document.createElement('div');
    newContent.classList.add("table-cell");
    newContent.id = `ctx_${contentId}`;

    // add screenshot
    var cellImg = document.createElement('div');
    cellImg.classList.add("cell-image");
    if (content.hasOwnProperty("screenshot")) {
        var ctnImg = document.createElement('img');
        ctnImg.classList.add("content-img");
        ctnImg.src = content.screenshot;
        ctnImg.width = "100%";
        ctnImg.height = "100%";
        cellImg.appendChild(ctnImg);
    }
    newContent.appendChild(cellImg);

    // event info
    var cellInfo = document.createElement('div');
    cellInfo.classList.add("cell-text");
    cellInfo.innerHTML = `<b>${content.type}</b>`;
    if (content.hasOwnProperty("text")) {
        cellInfo.innerHTML += `<br>elem "${lengthControl(content.text, 20)}"`;
    } else if (content.hasOwnProperty("navUrl")) {
        cellInfo.innerHTML += `<br><div class="content-url" title="${content.navUrl}">"${content.navUrl}"</div>`;
    }
    newContent.appendChild(cellInfo);

    // button
    var cellBtn = document.createElement('div');
    cellBtn.classList.add("table-remove");

    // button container
    var ctnBtn = document.createElement('div');
    ctnBtn.classList.add("content-button-container");

    // remove button
    const rmBtnId = `rm_btn_${contentId}`;
    var rmBtn = document.createElement('i');
    rmBtn.classList.add("remove-button", "fas", "fa-trash-alt", "selected");
    rmBtn.id = rmBtnId;

    // add button
    const addBtnId = `add_btn_${contentId}`;
    var addBtn = document.createElement('i');
    addBtn.classList.add("add-button", "fas", "fa-plus", "selected");
    addBtn.id = addBtnId;

    ctnBtn.appendChild(rmBtn);
    ctnBtn.appendChild(addBtn);

    cellBtn.appendChild(ctnBtn);
    newContent.appendChild(cellBtn);

    // add blank line
    var cellHr = document.createElement('hr');
    cellHr.id = `ctx_hr_${contentId}`;

    document.getElementById(tableId).appendChild(newContent);
    document.getElementById(tableId).appendChild(cellHr);

    sleep(300).then(() => {
        document.getElementById(rmBtnId).addEventListener("click", (event) => removeContent(contentId));
        document.getElementById(addBtnId).addEventListener("click", (event) => addContent(contentId));
    });
}

function addContent(lastContentId) {
    const lastHrId = `ctx_hr_${lastContentId}`;
    const contentId = objId--;

    var newContent = document.createElement('div');
    newContent.classList.add("table-cell");
    newContent.id = `ctx_${contentId}`;

    // add screenshot
    var cellImg = document.createElement('div');
    cellImg.classList.add("cell-image");
    newContent.appendChild(cellImg);

    // event info
    var cellInfo = document.createElement('div');
    cellInfo.classList.add("cell-text");
    newContent.appendChild(cellInfo);
    
    // button
    var cellBtn = document.createElement('div');
    cellBtn.classList.add("table-remove");

    // button container
    var ctnBtn = document.createElement('div');
    ctnBtn.classList.add("content-button-container");

    // remove button
    const rmBtnId = `rm_btn_${contentId}`;
    var rmBtn = document.createElement('i');
    rmBtn.classList.add("remove-button", "fas", "fa-trash-alt", "selected");
    rmBtn.id = rmBtnId;

    // add button
    const addBtnId = `add_btn_${contentId}`;
    var addBtn = document.createElement('i');
    addBtn.classList.add("add-button", "fas", "fa-plus", "selected");
    addBtn.id = addBtnId;

    ctnBtn.appendChild(rmBtn);
    ctnBtn.appendChild(addBtn);

    cellBtn.appendChild(ctnBtn);
    newContent.appendChild(cellBtn);

    // add blank line
    var cellHr = document.createElement('hr');
    cellHr.id = `ctx_hr_${contentId}`;
    
    document.getElementById(lastHrId).after(newContent, cellHr);
    sleep(300).then(() => {
        document.getElementById(rmBtnId).addEventListener("click", (event) => removeContent(contentId));
        document.getElementById(addBtnId).addEventListener("click", (event) => addContent(contentId));
    });
}

function removeContent(contentId) {
    const elementId = `ctx_${contentId}`;
    const contentHrId = `ctx_hr_${contentId}`;
    document.getElementById(elementId).remove();
    document.getElementById(contentHrId).remove();
    chrome.runtime.sendMessage({
        type: "bgRemove",
        content: contentId
    });
}

function updateView() {
    document.body.scrollIntoView({
        behavior: "auto",
        block: "end"
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "spUpdate":
            updateContent(message.content);
            updateView();
            break;
        case "spClear":
            resetTable();
            break;
        default:
            // do nothing
            break;
    }
    return true;
});