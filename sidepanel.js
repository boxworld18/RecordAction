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

    const hdrBtn = getBtn(contentId, false);
    const addMenu = getAddMenu(contentId);

    header.appendChild(hdrBtn);
    header.appendChild(addMenu);

    const hdrHr = document.createElement('hr');
    hdrHr.id = `ctx_hr_${contentId}`;

    document.getElementById(tableId).replaceChildren(header, hdrHr);
    sleep(300).then(() => {
        listenAddEvent(contentId);
    });
}

function listenRmEvent(contentId) {
    const rmBtnId = `rm_btn_${contentId}`;
    document.getElementById(rmBtnId).addEventListener("click", (event) => {
        event.stopPropagation();
        removeContent(contentId);
    });
}

function listenAddEvent(contentId) {
    const addBtnId = `add_btn_${contentId}`;
    const addMenuId = `add_menu_${contentId}`;
    const addMenu = document.getElementById(addMenuId);

    document.getElementById(addBtnId).addEventListener("click", (event) => {
        event.stopPropagation();
        addMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        if (addMenu.classList.contains("show")) {
            addMenu.classList.toggle("show");
        }
    });
}

function getScreenshot(content) {
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
    return cellImg;
}

function getEventInfo(content) {
    var cellInfo = document.createElement('div');
    cellInfo.classList.add("cell-text");

    var cellB = document.createElement('b');
    cellB.innerHTML = content.type;
    cellInfo.appendChild(cellB);

    // for click event
    if (content.hasOwnProperty("text")) {
        cellInfo.appendChild(document.createElement('br'));
        cellInfo.appendChild(document.createTextNode(`elem "${lengthControl(content.text, 20)}"`));
    }
    
    // for navigation event
    if (content.hasOwnProperty("navUrl")) {
        cellInfo.appendChild(document.createElement('br'));
        var cellText = document.createElement('div');
        cellText.classList.add("content-url");
        cellText.title = content.navUrl;
        cellText.innerHTML = `"${lengthControl(content.navUrl, 20)}"`;
        cellInfo.appendChild(cellText);
    }
    
    // for input event and answer
    if (content.type == "answer" || content.type == "change") {
        cellInfo.appendChild(document.createElement('br'));
        var input = document.createElement('textarea');
        input.classList.add("content-input");
        input.type = "text";

        if (content.hasOwnProperty("value")) 
            input.value = content.value;
        else
            input.placeholder = "input...";

        input.rows = 2;
        input.addEventListener("change", (event) => {
            var text = input.value;
            chrome.runtime.sendMessage({
                type: "bgUpdateValue",
                content: {
                    id: content.eventId,
                    value: text
                }
            });
        });

        cellInfo.appendChild(input);
    }

    return cellInfo;
}

function getBtn(contentId, needRm = true) {
    // button
    var cellBtn = document.createElement('div');
    cellBtn.classList.add("table-remove");

    // button container
    var ctnBtn = document.createElement('div');
    ctnBtn.classList.add("content-button-container");

    // remove button
    if (needRm) {
        const rmBtnId = `rm_btn_${contentId}`;
        var rmBtn = document.createElement('i');
        rmBtn.classList.add("remove-button", "fas", "fa-trash-alt", "selected");
        rmBtn.id = rmBtnId;
        ctnBtn.appendChild(rmBtn);
    }

    // add button
    const addBtnId = `add_btn_${contentId}`;
    var addBtn = document.createElement('i');
    addBtn.classList.add("add-button", "fas", "fa-plus", "selected");
    addBtn.id = addBtnId;
    ctnBtn.appendChild(addBtn);

    cellBtn.appendChild(ctnBtn);
    return cellBtn;
}

function getMenuItem(contentId, menuName) {
    var menuItem = document.createElement('div');
    menuItem.classList.add("add-menu-item")
    menuItem.innerHTML = menuName;
    menuItem.addEventListener("click", (event) => {
        addContent(contentId, menuName);
    });
    return menuItem;
}

function getAddMenu(contentId) {
    const addMenuId = `add_menu_${contentId}`;
    var addMenu = document.createElement('div');
    addMenu.classList.add("add-menu");
    addMenu.id = addMenuId;

    const loginItem = getMenuItem(contentId, "login");
    const verificationItem = getMenuItem(contentId, "verification");
    const answerItem = getMenuItem(contentId, "answer");
    const inputItem = getMenuItem(contentId, "change");

    addMenu.appendChild(loginItem);
    addMenu.appendChild(verificationItem);
    addMenu.appendChild(answerItem);
    addMenu.appendChild(inputItem);

    return addMenu;
}

function lengthControl(str, len) {
    if (str.length > len) {
        return str.substring(0, len - 3) + "...";
    }
    return str;
}

function commonContent(content, contentId) {
    var newContent = document.createElement('div');
    newContent.classList.add("table-cell");
    newContent.id = `ctx_${contentId}`;

    // add screenshot
    const cellImg = getScreenshot(content);
    newContent.appendChild(cellImg);

    // event info
    const cellInfo = getEventInfo(content);
    newContent.appendChild(cellInfo);

    // button
    const cellBtn = getBtn(contentId);
    const addMenu = getAddMenu(contentId);

    newContent.appendChild(cellBtn);
    newContent.appendChild(addMenu);

    return newContent;
}

function updateContent(content) {
    const contentId = content.eventId;
    const newContent = commonContent(content, contentId);

    // add blank line
    var cellHr = document.createElement('hr');
    cellHr.id = `ctx_hr_${contentId}`;

    document.getElementById(tableId).appendChild(newContent);
    document.getElementById(tableId).appendChild(cellHr);

    sleep(300).then(() => {
        listenRmEvent(contentId);
        listenAddEvent(contentId);
    });
}

function addContent(lastContentId, contentType) {
    const contentId = objId--;

    const content = {
        eventId: contentId,
        lastContentId: lastContentId,
        type: contentType
    };

    chrome.runtime.sendMessage({
        type: "bgInsert",
        content: content
    });

    const newContent = commonContent(content, contentId);
    var cellHr = document.createElement('hr');
    cellHr.id = `ctx_hr_${contentId}`;

    const lastHrId = `ctx_hr_${lastContentId}`;
    document.getElementById(lastHrId).after(newContent, cellHr);

    sleep(300).then(() => {
        listenRmEvent(contentId);
        listenAddEvent(contentId);
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