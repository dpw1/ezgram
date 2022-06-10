const replaceAll = require('string.prototype.replaceall');
const striptags = require('striptags');

/* ====================================== */

export function randomIntFromInterval(min, max) {
  return Math.floor(
    Math.random() * (parseInt(max) - parseInt(min) + 1) + parseInt(min)
  );
}

export const CSS_SELECTORS = {
  profileDropdownImage: 'nav div > div > div > div:nth-child(3) img[alt]',
  profileDropdownLink: `div[aria-hidden] > div[style] + * a[href]:nth-child(1)`,

  followingList: `[aria-label][role="dialog"] > div  > div > div:nth-child(3)`,
  followingListUnfollowButton: `div[role="presentation"] ul li button`,
  followingListUnfollowConfirmationButton: `[role="presentation"] + [role="presentation"] button:nth-child(1)`,
  followingListActionBlocked: `body > div+ div + div + div + div > div > div > div > div  + div > button + button`,

  followersList: `[role="presentation"] > div > div > div > div:nth-child(2)`,
  followersNumber: `ul li [href*='followers'] > *`,
  followersListUsernames: `[role="presentation"] > div > div > div > div:nth-child(2) li a[href] > span`,
  followersListButton: `[role="presentation"] > div > div > div > div:nth-child(2) ul li button`,

  userPagePostsNumber: `header section ul li:nth-child(1) >span >span, header section ul li:nth-child(1) span, main header + div + ul li:nth-child(1) > div > span, section > main > div > header + * + * + ul li:nth-child(1) > div > span`,
  userPageFollowersNumber: `header section ul li:nth-child(2) >span >span, ul li [href*='followers'] > *,  header section ul li:nth-child(2) span, main header + div + ul li:nth-child(2) > * > span`,
  userPageFollowingNumber: `header section ul li:nth-child(3) >span >span, ul li [href*='following'] > *, header section ul li:nth-child(3) span, main header + div + ul li:nth-child(3) > * > span`,
  userPageFollowButton: `header section h2 + div:first-of-type  > div > div > button,
  header section h2 + div:first-of-type > div > div > div > span:nth-child(1) > *:nth-child(1) button, 
  header section h1 + div:first-of-type  > div > div > button,
  main header div+ section > div:nth-child(2)  > * > * > * > span > span:nth-child(1) button,
  section > main > div > header > section > div > div > div > button`,
  userPageUnfollowButton: `header section h2 + div:first-of-type  > div > div:nth-child(2) > * > * > *:nth-child(1) > button`,
  userPagePosts: `main div >article a[href*='/p']`,
  userPageActionBlocked: `#fb-root + div > div > div > div > div  + div > button + button`,
  userPagePrivateAccountMessage: `#react-root section main article > div > div > h2`,
  userPageProfileImage: `main > div > header canvas + span > img[alt][src]`,
  userPageUsername: `main header section > * > h2, main header section > * > h1`,

  postPageLikeButton: `section > span:nth-child(1) > button`,
  postPageCloseButton: `div[role="presentation"] > div > button[type]`,
  postPageUnlikeButton: `section > span:nth-child(1) > button [color*='#ed4956'], section > span:nth-child(1) > button [aria-label*='Unlike']`,

  /* There are script tags containing the current user data in each page. 
  This CSS selector finds all of them. */
  scriptTagWithUserData: `body [src*='Feed'] + script[src] + script:not([src]), #react-root + link + link + script`,
};

export const LOCAL_STORAGE = {
  followersList: 'ezgram_followers_list',
  interactingWithUserInNewTab: `ezgram_currently_interacting`,
  interactionResult: `fail` /* used in conjunction with finishInteraction() */,
  originalTab: 'ezgram_original_tab',
  newTab: 'ezgram_new_tab',
  restartFollow: 'ezgram_restart_follow',
};

export function randomUniqueIntegers(total, quantity) {
  const numbers = Array(parseInt(total))
    .fill(null)
    .map((_, i) => i + 1);

  return numbers
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
    .slice(0, quantity);
}

/* Checks what type of follow button the user page has. It retusn:

follow = I don't follow the user yet.
unfollow = I already follow the user
private = private account.

*/
export async function getTypeOfFollowButtonOnUserPage($html) {
  let $buttons;
  return new Promise(async (resolve, reject) => {
    /* Private */
    const $message = $html.querySelector(
      CSS_SELECTORS.userPagePrivateAccountMessage
    );
    $buttons = $html.querySelectorAll(`header section h2 + div button`);

    if ($message) {
      resolve('private');
      return;
    }

    $buttons = $html.querySelectorAll(CSS_SELECTORS.userPageFollowButton);

    /* Follow */
    if ($buttons && $buttons.length === 1) {
      resolve('follow');
      return;
    }

    /* unfollow */
    if ($buttons && $buttons.length === 2) {
      resolve('unfollow');
      return;
    }

    resolve(null);
    return;
  });
}

/* TODO is user ignored */

/* Checks whether a button from a 'followers' list is a "following" or "follow". 

Following = I'm already following this user
Follow = I'm not following this user.

*/
export function isFollowButtonOnFollowerList($button) {
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

export function downloadFile(filename, content) {
  var element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
  );
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function createBackupFile() {
  return new Promise(async (resolve, reject) => {
    const data = await getChromeStorageData();

    /* Format date */
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const _date = new Date();
    const date = `${_date.getDate()}_${
      months[_date.getMonth()]
    }_${_date.getFullYear()}`;
    const hours = _date
      .toLocaleTimeString('en-US', {
        // en-US can be set to 'default' to use user's browser settings
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(':', '.')
      .replace(' ', '');

    /* Download file */
    downloadFile(`ezgram_${date}_${hours}.json`, JSON.stringify(data));

    updateLog(`Downloading ignored users' file...`);

    resolve();
  });
}

export function readImportedFile(file) {
  return new Promise(async (resolve, reject) => {
    var reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = function (evt) {
      const res = JSON.parse(evt.target.result);
      resolve(res);
    };
    reader.onerror = function (evt) {
      resolve(null);
    };
  });
}

export async function scrollDownFollowingList() {
  return new Promise(async (resolve, reject) => {
    updateLog(`<br />Scrolling down...`);

    let $list = await _waitForElement(CSS_SELECTORS.followingList, 50, 10);

    await _sleep(50);

    if (!$list) {
      alert(`"Following" list not found.`);
    }

    if ($list.scrollHeight - $list.scrollTop === $list.clientHeight) {
      updateLog(`<br />List is already fully scrolled.`);
      resolve(true);
    }

    const delay = randomIntFromInterval(901, 2641);

    await _sleep(randomIntFromInterval(200, 500));

    $list = document.querySelector(CSS_SELECTORS.followingList);

    $list.scrollTop = $list.scrollHeight - $list.clientHeight;

    await _sleep(delay);

    resolve(true);
  });
}

export function stopExecuting() {
  updateLog(`<b style="font-size:30px;">Stopping...</b>`);
  window.location.reload();
  return;
}

/* Scrolls down the a user's followers list. 


paramenters:

type = 'once' or 'all';

*/
export async function scrollDownFollowersList(type = 'once') {
  return new Promise(async (resolve, reject) => {
    updateLog(`Scrolling down followers list...`);

    const limit = type === 'once' ? 1 : await getFollowersNumber();

    let $list = document.querySelector(CSS_SELECTORS.followersList);

    await _sleep(50);

    if ($list.scrollHeight - $list.scrollTop === $list.clientHeight) {
      updateLog(`<br />List is already fully scrolled.`);
      resolve(true);
    }

    if (!$list) {
      resolve(null);
      updateLog(`Error: followers list not found.`);
    }

    const delay = randomIntFromInterval(901, 1341);

    const repeatLimit = 10;

    let previousUserCount = 0;
    let repeat = 0;

    for (let i = 0; i <= limit; i++) {
      $list.scrollTop = $list.scrollHeight - $list.clientHeight;

      if (repeat >= repeatLimit) {
        updateLog(`Repeating...`);
        break;
      }

      await _sleep(randomIntFromInterval(200, 450));

      let $users = document.querySelectorAll(
        CSS_SELECTORS.followersListUsernames
      );
      let users = $users.length;

      if (users === previousUserCount) {
        repeat += 1;
      } else {
        updateLog(`Scrolling down. ${users} visible users.`);
        repeat = 0;
      }

      previousUserCount = users;

      if (users >= limit) {
        break;
      }
    }

    $list = document.querySelector(CSS_SELECTORS.followersList);

    await _sleep(delay);

    resolve(true);
  });
}

export async function scrollDownUserPage($html) {
  return new Promise(async (resolve, reject) => {
    updateLog(`<br />Scrolling down...`);

    let $list = $html ? $html : document.querySelector(`html`);

    await _sleep(50);

    if ($list.scrollHeight - $list.scrollTop === $list.clientHeight) {
      updateLog(`<br />Page is already fully scrolled.`);
      resolve(true);
    }

    if (!$list) {
      alert(`User page not found.`);
    }

    const delay = randomIntFromInterval(901, 2641);

    await _sleep(randomIntFromInterval(200, 500));

    $list = $list.scrollTop = $list.scrollHeight - $list.clientHeight;

    await _sleep(delay);

    resolve(true);
  });
}

/* Detects within an iframe whether it's a private account or Not */
export async function isPrivateAccount($html) {
  return new Promise(async (resolve, reject) => {
    const $title = await _waitForElementIframe(
      $html,
      CSS_SELECTORS.userPagePrivateAccountMessage,
      50,
      10
    );

    if ($title) {
      resolve(true);
      return;
    } else {
      resolve(false);
    }
  });
}

/* Checks within an iframe whether how many posts there are */
export async function getPostsNumber($html) {
  return new Promise(async (resolve, reject) => {
    const $posts = await _waitForElementIframe(
      $html,
      CSS_SELECTORS.userPagePostsNumber,
      50,
      10
    );

    if (!$posts) {
      resolve(null);
      return;
    }

    const _posts = $posts.textContent
      .toLowerCase()
      .trim()
      .replace('.', '')
      .replace(',', '')
      .replace('m', '000000');

    const posts = parseInt(_posts);

    resolve(posts);
  });
}

/* Gets how many people the user is currently following. 

To use it, make sure you're currently on the user's page. (instagram.com/user1)
=========================== */
export async function getFollowingNumber($html) {
  return new Promise(async (resolve, reject) => {
    const $following = await _waitForElementIframe(
      $html,
      CSS_SELECTORS.userPageFollowingNumber,
      30,
      10
    );

    if (!$following) {
      resolve(null);
      return;
    }

    const _following = $following.textContent
      .toLowerCase()
      .trim()
      .replace('.', '')
      .replace(',', '')
      .replace('m', '000000');

    const following = parseInt(_following);

    resolve(following);
  });
}

/* Gets how many followers the user has.

To use it, make sure you're currently on the user's page. (instagram.com/user1)
=========================== */
export async function getFollowersNumber() {
  return new Promise(async (resolve, reject) => {
    const $followers = await _waitForElement(
      CSS_SELECTORS.userPageFollowersNumber,
      50,
      20
    );

    if (!$followers) {
      resolve(null);
      return;
    }

    const _followers = $followers.textContent
      .toLowerCase()
      .trim()
      .replace('.', '')
      .replace(',', '')
      .replace('m', '000000');

    const followers = parseInt(_followers);

    resolve(followers);
  });
}

export async function getFollowersNumberIframe($html) {
  return new Promise(async (resolve, reject) => {
    const $followers = await _waitForElementIframe(
      $html,
      CSS_SELECTORS.userPageFollowersNumber,
      50,
      20
    );

    if (!$followers) {
      resolve(null);
      return;
    }

    const _followers = $followers.textContent
      .toLowerCase()
      .trim()
      .replace('.', '')
      .replace(',', '')
      .replace('m', '000000');

    const followers = parseInt(_followers);

    resolve(followers);
  });
}

/* Gets the name of the currently logged user
============================= */
export async function getUserName() {
  return new Promise(async (resolve, reject) => {
    /* Get username by clicking on profile image > href */

    if (
      window.hasOwnProperty('ezfyCurrentUser') &&
      window.ezfyCurrentUser !== ''
    ) {
      resolve(window.ezfyCurrentUser);
      return;
    }

    const $image = await _waitForElement(
      CSS_SELECTORS.profileDropdownImage,
      50,
      10
    );

    if (!$image) {
      resolve(null);
      return;
    }

    $image.click();

    const $link = await _waitForElement(
      CSS_SELECTORS.profileDropdownLink,
      50,
      10
    );

    if (!$link) {
      resolve(null);
      return;
    }

    const _user = $link.getAttribute(`href`);
    const user = _user.replaceAll(`/`, '').trim();

    document.elementFromPoint(0, 0).click();

    window.ezfyCurrentUser = user;

    resolve(user);

    /* Trying to get username from window's script */

    /*
    const $script = await _waitForElement(
      CSS_SELECTORS.scriptTagWithUserData,
      50,
      10
    );

    const script = $script.innerHTML.trim();
    const hasUsername = script.includes(`"username":`);

    if (hasUsername) {
      const regex = /\"username\"\:\"(.+?)"/gm;

      let m;
      while ((m = regex.exec(script)) !== null) {
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        const username = m[1];

        // Checking if the username found in the JSON is the same as the user's profile image ALT tag
        const $profile = document.querySelector(
          CSS_SELECTORS.profileDropdownImage
        );
        const user = $profile.getAttribute('alt').trim();

        console.log(username, user);

        if (user.includes(username)) {
          resolve(username);
        } else {
          resolve(null);
        }

        return;
      }
    }

    resolve(null);
    */
  });
}

export async function goToProfilePage(user) {
  return new Promise(async (resolve, reject) => {
    if (!user) {
      updateLog(`No user: ${user}`);
      alert('no user');
    }

    const $posts = document.querySelector(CSS_SELECTORS.userPagePostsNumber);
    if (window.location.pathname.includes(user) && $posts) {
      updateLog(`You're already at the profile page.`);
      resolve(true);
      return;
    }

    updateLog(`Navigating to profile page...`);
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

export function _waitForElement(selector, delay = 50, tries = 100) {
  const element = document.querySelector(selector);

  if (!window[`__${selector}`]) {
    window[`__${selector}`] = 0;
    window[`__${selector}__delay`] = delay;
    window[`__${selector}__tries`] = tries;
  }

  function _search() {
    return new Promise((resolve) => {
      window[`__${selector}`]++;
      setTimeout(resolve, window[`__${selector}__delay`]);
    });
  }

  if (element === null) {
    if (window[`__${selector}`] >= window[`__${selector}__tries`]) {
      window[`__${selector}`] = 0;
      return Promise.resolve(null);
    }

    return _search().then(() => _waitForElement(selector));
  } else {
    return Promise.resolve(element);
  }
}

/* Removes the iframe responsible to load the user page. */
export function removeIframe() {
  const $iframe = document.querySelector(`#ezgram-iframe`);

  if (!$iframe) {
    return;
  }

  $iframe.remove();
}

export async function _waitForElementIframe(
  $html,
  selector,
  delay = 50,
  tries = 100
) {
  if (!$html) {
    return null;
  }
  const element = $html.querySelector(selector);

  if (!window[`__${selector}`]) {
    window[`__${selector}`] = 0;
    window[`__${selector}__delay`] = delay;
    window[`__${selector}__tries`] = tries;
  }

  function _search() {
    return new Promise((resolve) => {
      window[`__${selector}`]++;
      setTimeout(resolve, window[`__${selector}__delay`]);
    });
  }

  if (element === null) {
    if (window[`__${selector}`] >= window[`__${selector}__tries`]) {
      window[`__${selector}`] = 0;
      return Promise.resolve(null);
    }

    return _search().then(() => _waitForElementIframe($html, selector));
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

/* Opens the follower list of a given user. */
export async function openFollowersList(username) {
  return new Promise(async (resolve, reject) => {
    updateLog(`<br />Opening followers list...`);

    if (!username) {
      updateLog(`No username passed as parameter`);
      return;
    }

    const css = `[href*='${username}'][href*="followers/"]`;

    await _sleep(200);

    const $followers = await _waitForElement(css);

    console.log('followers btn', $followers);

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

export async function openFollowingPage(username) {
  updateLog('Navigating to "following" page...');

  if (!username || username === '') {
    updateLog(`No username.`);
    return;
  }

  await goToProfilePage(username);

  const css = `[href*='${username}'][href*="following/"]`;

  await _sleep(50);

  const $followingButton = await _waitForElement(css);

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

export async function convertImageToBase64(image) {
  return new Promise(async (resolve, reject) => {
    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    var s = canvas.toDataURL();
    var base64 = s.substring(s.indexOf(','));
    resolve(base64);
  });
}

export function getPixelColor($image, x, y) {
  var canvas = document.createElement('canvas');
  canvas.width = $image.width;
  canvas.height = $image.height;
  canvas.getContext('2d').drawImage($image, 0, 0, $image.width, $image.height);

  var pixelData = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
  var rgba = `${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]}`;
  canvas.remove();
  return rgba;
}

/* Checks whether the user has a profile image.  */
export async function doesUserHaveProfileImage($image) {
  return new Promise(async (resolve, reject) => {
    if (
      getPixelColor($image, 20, 1) === '227, 227, 227, 255' &&
      getPixelColor($image, 10, 1) === '219, 219, 219, 255' &&
      getPixelColor($image, 15, 15) === '255, 255, 255, 255'
    ) {
      resolve(false);
    }

    resolve(true);
  });
}

/* Overwrites all data to import new one. */
export async function importChromeStorage(data) {
  return new Promise(async (resolve, reject) => {
    const user = await getUserName();

    const obj = {
      [user]: data,
    };

    chrome.storage.local.set(obj, function () {
      resolve(obj);
    });
  });
}

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
  return new Promise(async (resolve, reject) => {
    const user = await getUserName();

    console.log('user is: ', user);

    if (!user) {
      resolve(null);
      return;
    }

    chrome.storage.local.get(user, function (result) {
      console.log('res', result);
      if (chrome.runtime.lastError) {
        reject(null);
        updateLog('error getting data from Database.');
      }

      if (!result[user]) {
        resolve({});
      }

      if (result[user] !== undefined) {
        resolve(result[user]);
      }
    });
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
