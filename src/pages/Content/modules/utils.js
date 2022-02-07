const replaceAll = require('string.prototype.replaceall');
const striptags = require('striptags');

export function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const CSS_SELECTORS = {
  profileDropdownImage: "nav img[alt*='picture']",
  followingList: `[aria-label][role="dialog"] > div  > div > div:nth-child(3)`,
  followingListUnfollowButton: `div[role="presentation"] ul li button`,
  followingNumber: `ul li [href*='following'] > *`,
  followingListUnfollowConfirmationButton: `[role="presentation"] + [role="presentation"] button:nth-child(1)`,

  followersList: `[role="presentation"] > div > div > div > div:nth-child(2)`,
  followersNumber: `ul li [href*='followers'] > *`,
  followersListUsernames: `[role="presentation"] > div > div > div > div:nth-child(2) li a[href] > span`,
  followersListButton: `[role="presentation"] > div > div > div > div:nth-child(2) ul li button`,

  userPageFollowButton: `main header section [style] span span:nth-child(1) button`,
};

export const LOCAL_STORAGE = {
  followersList: 'ezgram_followers_list',
};

/* Checks whether a button from a 'followers' list is a "following" or "follow". 

Following = I'm already following this user
Follow = I'm not following this user.

*/
export function isFollowButton($button) {
  const color = window.getComputedStyle($button).backgroundColor;

  if (color !== 'rgba(0, 0, 0, 0)') {
    return true;
  }

  return false;
}

export function openInNewTab(href) {
  Object.assign(document.createElement('a'), {
    target: '_blank',
    href: href,
  }).click();
}

export async function scrollDownFollowersList() {
  return new Promise(async (resolve, reject) => {
    updateLog(`<br />Scrolling down...`);

    let $list = await _waitForElement(CSS_SELECTORS.followersList, 50, 10);

    await _sleep(50);

    if (!$list) {
      alert(`"followers" list not found.`);
    }

    const delay = randomIntFromInterval(901, 2641);

    await _waitForElement(CSS_SELECTORS.followersList);

    await _sleep(randomIntFromInterval(200, 500));

    $list = document.querySelector(CSS_SELECTORS.followersList);

    $list.scrollTop = $list.scrollHeight - $list.clientHeight;

    await _sleep(delay);

    resolve(true);
  });
}

/* Gets how many people the user is currently following 
=========================== */
export function getFollowingNumber() {
  const $following = document.querySelector(CSS_SELECTORS.followingNumber);

  if (!$following) {
    return null;
  }

  const _following = $following.textContent
    .toLowerCase()
    .trim()
    .replace('.', '')
    .replace(',', '')
    .replace('m', '000000');

  const following = parseInt(_following);

  return following;
}

export function getFollowersNumber() {
  const $followers = document.querySelector(CSS_SELECTORS.followersNumber);

  if (!$followers) {
    return null;
  }

  const _followers = $followers.textContent
    .toLowerCase()
    .trim()
    .replace('.', '')
    .replace(',', '')
    .replace('m', '000000');

  const followers = parseInt(_followers);

  return followers;
}

/* Gets the name of the currently logged user
============================= */
export function getUserName() {
  return new Promise(async (resolve, reject) => {
    const $picture = await _waitForElement(CSS_SELECTORS.profileDropdownImage);

    if (!$picture) {
      resolve(null);
      return;
    }

    const alt = $picture.getAttribute('alt');
    const username = alt.split(' ')[0].replace(`'s`, '').trim();

    resolve(username);
  });
}

export async function goToProfilePage(user) {
  return new Promise(async (resolve, reject) => {
    const $picture = document.querySelector(CSS_SELECTORS.profileDropdownImage);

    if (!$picture) {
      return;
    }

    $picture.click();

    await _sleep(100);

    const username = user ? user : await getUserName();

    await _sleep(100);

    const $following = await _waitForElement(
      `nav [href$='${username}/'][tabindex]`
    );

    if (!$following) {
      return;
    }

    await _sleep(50);
    $following.click();

    resolve(true);
  });
}

export function _waitForElement(selector, delay = 50, tries = 250) {
  const element = document.querySelector(selector);

  if (!window[`__${selector}`]) {
    window[`__${selector}`] = 0;
  }

  function _search() {
    return new Promise((resolve) => {
      window[`__${selector}`]++;
      setTimeout(resolve, delay);
    });
  }

  if (element === null) {
    if (window[`__${selector}`] >= tries) {
      window[`__${selector}`] = 0;
      return Promise.resolve(null);
    }

    return _search().then(() => _waitForElement(selector));
  } else {
    return Promise.resolve(element);
  }
}

export function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Update log 
================================ */
export function updateLog() {
  const $log = document.querySelector(`#log`);

  if (!$log) {
    return;
  }

  const text = `${[...arguments].map((e) => `<span>${e}</span>`).join('')}`;

  console.log(text);

  $log.innerHTML += text;
  $log.scrollTop = $log.scrollHeight - $log.clientHeight;
}

export function clearLog() {
  const $log = document.querySelector(`#log`);

  if (!$log) {
    return;
  }
  $log.innerHTML = '';
}

export function refreshPage() {
  updateLog(`Refreshing page...`);
  window.location.reload();
}

export async function openFollowersPage(user) {
  return new Promise(async (resolve, reject) => {
    updateLog(`<br />Navigating to "followers" page...`);

    const username = user ? user : await getUserName();

    if (!user) {
      await _sleep(50);
      await goToProfilePage();
    }

    const css = `[href*='${username}'][href*="followers/"]`;

    await _sleep(200);

    const $followers = await _waitForElement(css);

    $followers.click();

    await _sleep(50);

    const $unfollowButton = await _waitForElement(
      CSS_SELECTORS.followingListUnfollowButton
    );

    await _sleep(50);

    if ($unfollowButton) {
      updateLog('Followers page opened.');
      resolve(true);
    } else {
      updateLog(`Something went wrong. Please refresh the page and try again.`);
      resolve(false);
    }
  });
}

export async function openFollowingPage() {
  updateLog('Navigating to "following" page...');

  const username = await getUserName();

  await goToProfilePage();

  const css = `[href*='${username}'][href*="following/"]`;

  await _sleep(50);

  const $followingButton = document.querySelector(css);

  $followingButton.click();

  await _sleep(50);

  const $unfollowButton = await _waitForElement(
    CSS_SELECTORS.followingListUnfollowButton
  );

  await _sleep(50);

  if ($unfollowButton) {
    updateLog('Following page opened.');
  } else {
    updateLog(`Something went wrong.`);
  }
}

/* Deletes all data in Chrome storage
================================ */
export function deleteChromeStorageData() {
  return new Promise(async (resolve, reject) => {
    chrome.storage.local.clear(function () {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
    });
  });
}

/* 
By default all data is added to the current account. 

Therefore, if you're on the "abby" account, your data will look like this:

{"abby": 
	{ 
		"ignoredUsers": [
			{"name":"ok"}
		] 
	}
}

In this case: 

key = "ignoredUsers" 
data = {'name': 'ok'}
================================ */

export async function addChromeStorageData(key, data) {
  const user = await getUserName();
  let _previous = await getChromeStorageData(key);

  var obj = {};
  if (isObjectEmpty(_previous)) {
    obj = {
      [user]: {
        [key]: [data],
      },
    };
  } else {
    var updated = [..._previous[key]];

    updated.push(data);

    obj = {
      [user]: {
        [key]: updated,
      },
    };
  }

  console.log('saving this obejct:', obj);

  return new Promise(async (resolve, reject) => {
    chrome.storage.local.set(obj, function () {
      resolve(obj[user][key]);
    });
  });
}

/* Gets the chrome storage data for the current user. */
export async function getChromeStorageData(key) {
  const user = await getUserName();

  let data = null;
  return new Promise(async (resolve, reject) => {
    while (data === null) {
      chrome.storage.local.get(user, function (result) {
        if (chrome.runtime.lastError) {
          data = {};
        }

        if (!result[user]) {
          data = {};
        }

        if (result[user] !== undefined) {
          data = result[user];

          data = result[user];
        }
      });

      await new Promise((res) => setTimeout(res, Math.random() * 25));
    }

    if (!data) {
      resolve({});
    }

    resolve(data);
  });
}

/* Deletes all data for the current user. */
export async function removeChromeStorageData() {
  const user = await getUserName();

  return new Promise(async (resolve, reject) => {
    chrome.storage.local.remove(user, function () {
      var error = chrome.runtime.lastError;
      if (error) {
        reject(null);
      }

      resolve(true);
    });
  });
}

export function _extractTextBetween(text, start, end) {
  if (!start || !end) {
    throw new Error(`Please add a "start" and "end" parameter`);
  }

  return text.split(start)[1].split(end)[0];
}

export function shortenString(str, maxLen = 100, separator = ' ') {
  if (str.length <= maxLen) return str;
  return str.substr(0, str.lastIndexOf(separator, maxLen));
}

export function isObjectEmpty(obj) {
  for (var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

export function cleanEcwidProducts(products) {
  return new Promise((resolve, reject) => {
    const filtered = products.items.filter((e) => {
      if (e.enabled) {
        return e;
      }
    });

    resolve(filtered);
  });
}

export async function getProductsFromCategory(category) {
  return new Promise(async (resolve, reject) => {
    const url = `https://app.ecwid.com/api/v3/61271341/categories?token=public_iNxZWDXrKMZrzGkdBWk3fvcfaJhBVgcm`;
    let response = await fetch(url);
    let data = await response.json();

    const _categories = data.items;

    let categories = _categories
      .filter((e) => {
        const name = e.name.toLowerCase();
        const theme = category.toLowerCase();

        if (
          name.includes(theme) ||
          name === 'all themes' ||
          name === 'app functionality'
        ) {
          console.log(`${e.name} (${e.id})`);
          return e;
        }
      })
      .map((e) => e.id);

    const _products = await getProducts();

    /* If the product contains one of the allowed categories, 
    returns the product */
    const products = _products
      .map((e) => {
        const difference = compareArrays(e.categoryIds, categories);

        console.log('diff', difference, e.name);
        if (difference.length > 0) {
          return e;
        }
      })
      .filter((x) => x != null);

    resolve(shuffle(products));
  });
}

export function getProducts() {
  return new Promise(async (resolve, reject) => {
    const url = `https://app.ecwid.com/api/v3/61271341/products?token=public_iNxZWDXrKMZrzGkdBWk3fvcfaJhBVgcm`;
    let response = await fetch(url);
    let data = await response.json();

    const products = await cleanEcwidProducts(data);

    resolve(products);
  });
}

export function compareArrays(arr1, arr2) {
  return arr1.filter((x) => arr2.includes(x));
}

export function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}
