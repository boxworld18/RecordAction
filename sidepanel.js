const tableId = "result";

/// Sleep function
const sleep = (time) => new Promise((res) => setTimeout(res, time, "done sleeping"));

/// init
resetTable();

/// reset: clear all content in the table
function resetTable() {
    var header = document.createElement('div');
    header.classList.add("table-container");

    var hdrImg = document.createElement('div');
    hdrImg.classList.add("table-image");
    hdrImg.innerHTML = `<b>Image</b>`;
    header.appendChild(hdrImg);

    var hdrTxt = document.createElement('div');
    hdrTxt.classList.add("table-text");
    hdrTxt.innerHTML = `<b>Event</b>`;
    header.appendChild(hdrTxt);

    const hdrHr = document.createElement('hr');

    document.getElementById(tableId).replaceChildren(header, hdrHr);
}

function lengthControl(str, len) {
    if (str.length > len) {
        return str.substring(0, len - 3) + "...";
    }
    return str;
}

function updateContent(content) {
    const contentId = content.eventId;
    const elementId = `ctx_${contentId}`;
    const contentHrId = `ctx_hr_${contentId}`;
    const rmBtnId = `rm_btn_${contentId}`;

    var newContent = document.createElement('div');
    newContent.classList.add("table-container");
    newContent.id = elementId;

    // add screenshot
    var ctxImg = document.createElement('div');
    ctxImg.classList.add("table-image");
    if (content.hasOwnProperty("screenshot")) {
        var tarImg = document.createElement('img');
        tarImg.classList.add("table-img");
        tarImg.src = content.screenshot;
        tarImg.width = "100%";
        tarImg.height = "100%";
        ctxImg.appendChild(tarImg);
    }
    newContent.appendChild(ctxImg);

    // event info
    var ctxInfo = document.createElement('div');
    ctxInfo.classList.add("table-text");
    ctxInfo.innerHTML = `<b>${content.type}</b>`;
    if (content.hasOwnProperty("text")) {
        ctxInfo.innerHTML += `<br class="content-text">elem "${content.text}"`;
    } else if (content.hasOwnProperty("navUrl")) {
        ctxInfo.innerHTML += `<br><div class="content-text" title="${content.navUrl}">"${content.navUrl}"</div>`;
    }
    newContent.appendChild(ctxInfo);

    // button
    var ctxBtn = document.createElement('div');
    ctxBtn.classList.add("table-remove");

    // remove button
    var ctxRmBtn = document.createElement('button');
    ctxRmBtn.classList.add("remove-button");
    ctxRmBtn.id = rmBtnId;
    ctxRmBtn.innerHTML = "X";
    ctxBtn.appendChild(ctxRmBtn);
    newContent.appendChild(ctxBtn);

    // add blank line
    var ctxHr = document.createElement('hr');
    ctxHr.id = contentHrId;
    document.getElementById(tableId).appendChild(newContent);
    document.getElementById(tableId).appendChild(ctxHr);

    sleep(300).then(() => {
        document.getElementById(rmBtnId).addEventListener("click", (event) => removeContent(contentId));
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