function getFromStorage(key) {
	return new Promise(function (resolve, reject) {
		chrome.storage.local.get([key], function (data) {
			resolve(data[key]);
		});
	});
}

function saveToStorage(key, val) {
	chrome.storage.local.set({
		[key]: val
	});
}