console.log('hello 2024');

chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
  console.log('Background message: ', data);

  let promise;

  if (data.type === 'openNewTab') {
    promise = new Promise(async (resolve) => {
      let queryOptions = { active: true, currentWindow: true };
      let [tab] = await chrome.tabs.query(queryOptions);

      resolve(tab);
    });

    promise.then((tab) => {
      console.log('Completed', tab);

      const res = { type: 'openNewTab', message: tab.id };

      /* is on user page */
      if (/instagram\.com\/.{3}/.test(tab.url)) {
        chrome.tabs.create({ url: data.message, index: tab.index + 1 });
      }

      sendResponse(res);
    });
  }

  if (data.type === 'closeTab') {
    promise = new Promise(async (resolve) => {
      let queryOptions = { active: true, currentWindow: true };
      let [tab] = await chrome.tabs.query(queryOptions);

      resolve(tab);
    });

    promise.then((tab) => {
      console.log('Close tab data', tab);

      const tabId = data.message;

      chrome.tabs.remove(tab.id);
      chrome.tabs.update(tabId, { highlighted: true });

      sendResponse({ type: 'closeTab', message: 'closeTab' });
    });
  }

  return true;
});
