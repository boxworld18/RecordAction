function getFromStorage(key) {
	return new Promise((resolve, reject) => {
		try {
			chrome.storage.local.get([key], function (data) {
				resolve(data[key]);
			});
		} catch (e) {
			console.log(e);
			resolve(0);
		}
	});
}

function saveToStorage(key, val) {
	chrome.storage.local.set({
		[key]: val
	});
}