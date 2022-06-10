console.log('hello 2025');

chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
    let promise;
    if (data.type === 'isFirstInstall') {
      promise = new Promise(async (resolve) => {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);

        resolve(tab);
      });

      promise.then((tab) => {
        const res = { type: 'isFirstInstall', details };
        console.log('isFirstInstall11');
        sendResponse(res);
      });
    }
  });
});

chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
  let promise;

  if (data.type === 'getTab') {
    promise = new Promise(async (resolve) => {
      let queryOptions = { active: true, currentWindow: true };
      let [tab] = await chrome.tabs.query(queryOptions);

      resolve(tab);
    });

    promise.then((tab) => {
      const res = { type: 'getTab', message: { tab } };
      sendResponse(res);
    });
  }

  if (data.type === 'openNewTab') {
    promise = new Promise(async (resolve) => {
      resolve(data.message.tab);
    });

    promise.then((tab) => {
      /* is on user page */
      if (/instagram\.com\/.{3}/.test(tab.url)) {
        chrome.tabs.create(
          {
            active: true,
            url: data.message.url,
            index: tab.index + 1,
            windowId: tab.windowId,
            openerTabId: tab.openerTabId,
          },
          function (newTab) {
            sendResponse({ type: 'openNewTab', tab: newTab });
          }
        );
      }
    });
  }

  if (data.type === 'closeTab') {
    promise = new Promise(async (resolve) => {
      console.log('this is data to close tab', data);

      resolve({
        originalTab: data.message.originalTab,
        newTab: data.message.newTab,
      });
    });

    promise.then((data) => {
      const { newTab, originalTab } = data;
      console.log('Close tab data', data);

      chrome.tabs.remove(newTab.id, function () {
        chrome.tabs.update(originalTab.id, { highlighted: true });
        sendResponse({ type: 'closeTab', message: 'closeTab' });
      });
    });
  }

  return true;
});
