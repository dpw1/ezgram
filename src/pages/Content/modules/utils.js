import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const replaceAll = require('string.prototype.replaceall');
const striptags = require('striptags');

/* ====================================== */

export function randomIntFromInterval(min, max) {
  return Math.floor(
    Math.random() * (parseInt(max) - parseInt(min) + 1) + parseInt(min)
  );
}

export function getInstagramURL(username) {
  if (!username || username === '') {
    return undefined;
  }
  if (username.includes('instagram.com')) {
    return username;
  }

  return `https://instagram.com/${username}`;
}

export const CSS_SELECTORS = {
  profileDropdownImage: 'nav div > div > div > div:nth-child(3) img[alt]',
  profileDropdownLink: `div[aria-hidden] > div[style] + * a[href]:nth-child(1)`,
  profileImage: `[tabindex="-1"] [style*='transform'] a[href^='/']:has(img)`,

  followingListParent: `[role='dialog'] > div:not([style]), div[style='height: auto; overflow: hidden auto;']>*`,
  followingList: `[style*='signup'] div[style] > div[role]+ div + div, [style*='flex'] > * > [role="tablist"] + *[class] > * > *`,
  followingListUnfollowButton: `div[role="presentation"] ul li button, 
  div[role="tablist"] + div > ul > div > li button,
  [style*='signup'] div[style] > div[role]+ div button,
  [style*='signup'] div[style] > div[style] > div:last-of-type > div[style]  > div[style] > div button`,
  followingListUnfollowButtonNthChild: `div[role="tablist"] + div > ul li:nth-child(xx) button,
  [style*='signup'] div[style] > div[role]+ div [aria-labelledby]:nth-child(xx) button, 
  [style*='signup'] div[style] > div[role]+ div > * > * > *:nth-child(xx) button,
  [style*='signup'] div[style] > div[style] > div:last-of-type > div[style]  > div[style] > div:nth-child(xx) button`,
  followingListUnfollowConfirmationButton: `div[style] > div > div > button[tabindex]:nth-child(1)`,
  followingListActionBlocked: `body div > div > div > div > div  + div > button + button`,
  followingListUsernames: `span[style*='clamp'] div > div > div > div:nth-child(2) li a[href] > span, div[style*='min-height'] > div[class] > div[style*='auto'] a[href] > span >*`,

  followersList: `[style*='min-height'] div[style] > div[style*='height'] > div+ div + div`,
  followersNumber: `ul li [href*='followers'] > *`,
  followersListUsernames: `div > canvas[style] + a`,
  followersListButton: `div > div > div > div:nth-child(2) ul li button, div[style*='min-height'] > div[class] > div[style*='auto'] button`,

  followersAndFollowingListItem: `div[style] > div[style] > div + div li,  div[style*='min-height'] > div[class] > div[style*='auto'] > div > div`,

  userPageFollowButtons: `header > div + section > * button, header > section + section button`,
  userPageFollowerstListOpenButton: `header > section  ul li:nth-child(2) a`,
  userPageFollowingtListOpenButton: `header > section  ul li:nth-child(3) a`,

  userPagePostsNumber: `header section ul li:nth-child(1) >span >span, header section ul li:nth-child(1) span, main header + div + ul li:nth-child(1) > div > span, section > main > div > header + * + * + ul li:nth-child(1) > div > span`,
  userPageFollowersNumber: `header section ul li:nth-child(2) >span >span, ul li [href*='followers'] > *,  header section ul li:nth-child(2) span, main header + div + ul li:nth-child(2) > * > span`,
  userPageFollowingNumber: `header section ul li:nth-child(3) >span >span, ul li [href*='following'] > *, header section ul li:nth-child(3) span, main header + div + ul li:nth-child(3) > * > span`,
  userPageFollowButton: `main header section div span > span:nth-child(1) > button > div`,
  userPageUnfollowButton: `main header section div span > span:nth-child(1) > button svg`,
  userPagePosts: `main div > header ~ div:not([class]) a[href]`,
  userPageActionBlocked: `div > div > div > div > div  + div > button + button`,
  userPagePrivateAccountMessage: `section main hr + div h2, section header + hr + div div > span:nth-child(1)`,
  userPageProfileImage: `main > div > header canvas + span > img[alt][src], main > div > header button > img[src]`,
  userPageUsername: `main header section > * > h2, main header section > * > h1,main header section a>h2, section header a > h1`,
  userPageDoesNotExist404: `main [style*='height'][style*='100'] > div > h2 + div a[href='/'], main [style*='height'][style*='clamp'] + * [style*='clamp'] a[href='/'] `,

  postPageLikeButton: `section > span:nth-child(1) > button, section > span:nth-child(1) > *[role='button']`,
  postPageCloseButton: `div[role="presentation"] > div > button[type], div[style] > div > div > div > div[role='button']`,
  postPageUnlikeButton: `section > span:nth-child(1) > button [color*='#ed4956'], section > span:nth-child(1) > button [aria-label*='Unlike']`,

  likesList: `[role="dialog"] > * > * >[style*='max-height']`,
  likesListUsername: `[role="dialog"] > * > * >[style*='max-height'] a[role='link']:not([style])`,
  likesListItem: `[role="dialog"] > * > * >[style*='max-height'] > * > * > *`,

  likesOfPost: `article[role="presentation"] a > [style*='line'] > span, section[class] a > [style*='line'] > span`,

  /* There are script tags containing the current user data in each page. 
  This CSS selector finds all of them. */
  scriptTagWithUserData: `body > link ~ script`,
};

export async function addWhiteListButtonToFollowingListUsers(actions) {
  /* Enlarge list 
    ============================= */
  const $list = await _waitForElement(`${CSS_SELECTORS.followingListParent}`);

  if (!$list) {
    return;
  }

  window.isExtractingUser = false;

  $list.setAttribute(`style`, `min-width:500px;`);
  $list.classList.add(`followingList`);

  /* Add buttons 
    ============================= */

  await _sleep(100);

  const $users = document.querySelectorAll(
    `${CSS_SELECTORS.followingListParent} > *:not([data-has-button])`
  );

  async function _addButtons(_$users) {
    for (var [index, each] of _$users.entries()) {
      window.isExtractingUser = true;
      const $button = each.querySelector(`button`);

      const $hasButton = each.querySelector(`[data-whitelist]`);

      if ($hasButton) {
        return;
      }

      const $user = each.querySelector(`a[href]`);
      const user = $user.getAttribute(`href`).replaceAll(`/`, ``).trim();

      const isWhitelisted = await actions.getWhiteListUser(user);

      const text = isWhitelisted ? `Whitelisted ✔️` : `Add to white list`;

      const html = `<span data-whitelist="${user}">${text}</span>`;

      $button.insertAdjacentHTML(`beforebegin`, html);

      each.setAttribute(`data-has-button`, `true`);
      each.setAttribute(`data-is-whitelisted`, isWhitelisted ? true : false);

      /* Handle click on white list buttons 
        ============================= */

      const $whitelist = document.querySelector(`[data-whitelist="${user}"]`);

      $whitelist.addEventListener(`click`, async function (e) {
        const user = e.target.getAttribute(`data-whitelist`);

        const exists = await actions.getWhiteListUser(user);
        const $parent = e.target.closest(`[data-has-button]`);

        if (exists) {
          await actions.removeOneWhiteListUser(user);
          toastMessage(
            <p>
              Removed <b>{user}</b> from white list successfully.
            </p>,
            3000,
            'success'
          );

          e.target.textContent = `Add to white list`;

          $parent.setAttribute(`data-is-whitelisted`, false);
        } else {
          await actions.addWhiteListUser(user);
          toastMessage(
            <p>
              Added <b>{user}</b> to the white list successfully.
            </p>,
            3000,
            'success'
          );

          e.target.textContent = `Whitelisted ✔️`;
          $parent.setAttribute(`data-is-whitelisted`, true);
        }

        await actions.getWhiteListUsers();
      });
    }

    window.isExtractingUser = false;
  }

  _addButtons($users);

  /* Handle scrolling
    ============================= */

  const $scrollable = document.querySelector(`${CSS_SELECTORS.followingList}`);

  function outputsize() {
    if (window.isExtractingUser) {
      return;
    }
    console.log(`SCROLLABLE`, $scrollable.offsetHeight);

    var $newUsers = document.querySelectorAll(
      `${CSS_SELECTORS.followingListParent} > *:not([data-has-button])`
    );

    _addButtons($newUsers);
  }
  outputsize();

  new ResizeObserver(outputsize).observe($scrollable);
}

export async function injectUpdateButton() {
  const $header = await _waitForElement(`div[style*='height'] > h1`);

  if (!$header) {
    return;
  }

  if (!$header.getAttribute(`style`)) {
    $header.setAttribute(`style`, `display: flex;flex-direction: row;`);
  }

  const html = `<button id="updateWhiteListButton" class="ig-button">Update Buttons</button>`;

  $header.insertAdjacentHTML(`beforeend`, html);

  const $button = document.querySelector(`#updateWhiteListButton`);

  $button.addEventListener(`click`, function (e) {
    e.preventDefault();
    addWhiteListButtonToFollowingListUsers();
  });
}

export function toastMessage(Text = <p></p>, autoClose = 5000, type = 'light') {
  return toast(Text, {
    position: 'bottom-right',
    autoClose: autoClose === 0 || null ? false : autoClose,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    type,
    draggable: false,
    progress: undefined,
    pauseOnFocusLoss: false,
    theme: 'light',
  });
}

/* Double checks if the user to be unfollowed is whitelisted */
export function isUserAboutToBeUnfollowedWhitelisted(whitelist) {
  return new Promise(async (resolve, reject) => {
    try {
      var $button = document.querySelector(
        `[role='dialog'] [role='dialog'] button + button`
      );

      var _$parent = $button.closest(`div[role]`);
      var $user = _$parent.querySelector(`div + span`);

      var user = $user.textContent.trim().split('@')[1].replaceAll('?', '');

      if (!user || whitelist.filter((e) => e === user).length >= 1) {
        updateLogError(`ERROR please check console`);
        throw new Error(
          `"Something went wrong in the function isUserAboutToBeUnfollowedWhitelisted"`
        );
        return;
        resolve();
      }

      resolve(false);
    } catch (err) {
      updateLogError(`ERROR please check console`);
      throw new Error(
        `"Something went wrong in the function isUserAboutToBeUnfollowedWhitelisted"`
      );
    }
  });
}

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

export function removeDuplicatesFromArrayOfObjects(arr, prop) {
  const seen = new Set();
  return arr.filter((obj) => {
    const value = obj[prop];
    if (!seen.has(value)) {
      seen.add(value);
      return true;
    }
    return false;
  });
}

/* This file can be found in:

D:\Web Dev\JavaScript\InstagramDatabase\backend

node index.js
*/
export function getUsernameGender(name) {
  return new Promise(async (resolve, reject) => {
    const url = 'http://localhost:4501/';
    const data = {
      name,
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch(url, requestOptions);
      const responseData = await response.json();
      // console.log('Response:', responseData);
      resolve(responseData);
      // Do something with the response data
    } catch (error) {
      alert('Gender detection server is offline.');
      console.error('Error:', error);
    }
  });
}

/**
 * Checks whether the current URL is a profile page of the logged in user.
 *
 * Example:
 *
 * - Username is "A1".
 *
 * - instagram.com/user_xx => false
 * - instagram.com/a1 => true
 * - instagram.com/ => false
 */
export function isCurrentPageMyUserPage(username) {
  if (!window.location.href.includes(username)) {
    return false;
  }
  return true;
}

/* Checks what type of follow button the user page has. It retusn:

follow = I don't follow the user yet.
unfollow = I already follow the user
private = private account.

*/
export async function getTypeOfFollowButtonOnUserPage() {
  return new Promise(async (resolve, reject) => {
    /* Private */
    const $message = document.querySelector(
      CSS_SELECTORS.userPagePrivateAccountMessage
    );

    if ($message) {
      resolve('private');
      return;
    }

    const $unfollow = document.querySelector(
      CSS_SELECTORS.userPageUnfollowButton
    );

    /* unfollow */
    if ($unfollow) {
      resolve('unfollow');
      return;
    }

    resolve('follow');
    return;
  });
}

/* TODO is user ignored */

/* Checks whether a button from a 'followers' list is a "following" or "follow". 

Following = I'm already following this user
Follow = I'm not following this user.

*/
export function isFollowButton($button) {
  const color = window.getComputedStyle($button).backgroundColor;

  const $svg = $button.querySelector(`svg`);

  if (color !== 'rgba(0, 0, 0, 0)' && !$svg) {
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

/* Create and download a backup file with all current data on the database. */
export function createBackupFile() {
  return new Promise(async (resolve, reject) => {
    const data = await getChromeStorageData();
    const user = await getUserName();

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
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(':', '.')
      .replace(' ', '');

    /* Download file */
    downloadFile(
      `igdroid_backup_${user}_${date}_${hours}.json`,
      JSON.stringify(data)
    );

    updateLog(`Downloading backup...`);

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

export async function updateLogError() {
  return updateLog(
    `<span style="font-weight:bold;color:red;">ERROR: ${[...arguments]}</span>`
  );
}

/* Check if 'likes' pop up is open */
export async function isThereLikesPopup() {
  return new Promise((resolve, reject) => {
    const $popup = document.querySelector(CSS_SELECTORS.likesList);

    if (!$popup) {
      resolve(false);
      return;
    }
    resolve(true);
  });
}

export async function isUserPage() {
  return new Promise(async (resolve, reject) => {
    const $buttons = _waitForElement(
      CSS_SELECTORS.userPageFollowButtons,
      100,
      10
    );

    if (window.location.pathname.replaceAll('/', '').length >= 2 && $buttons) {
      resolve(true);
      return;
    }

    resolve(false);
  });
}

export async function getFollowButton() {
  return new Promise(async (resolve, reject) => {
    const $button = await _waitForElement(
      CSS_SELECTORS.userPageFollowButtons,
      100,
      10
    );

    if (!$button) {
      resolve(null);
    }

    const $buttons = await document.querySelectorAll(
      CSS_SELECTORS.userPageFollowButtons
    );

    for (var [index, each] of $buttons.entries()) {
      if (isFollowButton(each)) {
        resolve($buttons[index]);
        break;
      }
    }

    resolve(null);
  });
}

export async function scrollDownLikesList() {
  return new Promise(async (resolve, reject) => {
    updateLog(`<br />Scrolling down likes list... `);

    let amount = 550;

    if (!window.hasOwnProperty('scrollDownLikesListIncrementor')) {
      window.scrollDownLikesListIncrementor = amount;
    }

    let $list = await _waitForElement(CSS_SELECTORS.likesList, 100, 50);

    await _sleep(50);

    if (!$list) {
      alert(`"Likes" list not found.`);
    }

    const delay = randomIntFromInterval(901, 2641);

    await _sleep(randomIntFromInterval(200, 500));

    $list = document.querySelector(`${CSS_SELECTORS.likesList} > *`);

    $list.scrollTop = window.scrollDownLikesListIncrementor;

    window.scrollDownLikesListIncrementor =
      window.scrollDownLikesListIncrementor + amount;

    await _sleep(delay);

    resolve(true);
  });
}

export async function scrollDownFollowingList() {
  return new Promise(async (resolve, reject) => {
    updateLog(`<br />Scrolling down...`);

    let $list = await _waitForElement(CSS_SELECTORS.followingList, 100, 50);

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

    $list.scrollTop = $list.scrollHeight;

    await _sleep(delay);

    resolve(true);
  });
}

export function stopExecuting() {
  updateLog(`<b style="font-size:30px;">Stopping...</b>`);
  toastMessage(<b>Pausing automatic following...</b>, 3000, 'warning');
  localStorage.removeItem(`@useStatePerist:@isFollowingList`);
  window.location.reload();
  return;
}

/* Scrolls down the a user's followers list. 


paramenters:

type = 'once' or 'all';

*/
export async function scrollDownFollowersList(type = 'once') {
  window.followers_list_height = 0;
  return new Promise(async (resolve, reject) => {
    const limit = type === 'once' ? 1 : await getFollowersNumber();

    let $list = await _waitForElement(CSS_SELECTORS.followersList);

    await _sleep(50);

    if ($list.scrollHeight - $list.scrollTop === $list.clientHeight) {
      updateLog(`<br />List is already fully scrolled.`);
      resolve(true);
    }

    if (!$list) {
      resolve(null);
      updateLog(`Error: followers list not found.`);
    }

    const delay = randomIntFromInterval(800, 1300);

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
    const $title = await _waitForElement(
      CSS_SELECTORS.userPagePrivateAccountMessage,
      50,
      10
    );

    if (!$title) {
      resolve(false);
      return;
    }

    const text = $title.textContent.trim().toLowerCase();

    if (text.includes('account is private')) {
      resolve(true);
      return;
    } else {
      resolve(false);
    }
  });
}

export function isHomePage() {
  return window.location.pathname === '/';
}

/* Checks within an iframe whether how many posts there are */
export async function getPostsNumber() {
  return new Promise(async (resolve, reject) => {
    const $posts = await _waitForElement(
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
export async function getFollowingNumber() {
  return new Promise(async (resolve, reject) => {
    const $following = await _waitForElement(
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

export async function getNumberOfLikesOfCurrentlyOpenPost() {
  return new Promise((resolve, reject) => {
    const $likes = document.querySelector(CSS_SELECTORS.likesOfPost);

    if (!$likes) {
      resolve(null);
      return;
    }

    const likes = parseInt($likes.textContent.trim());

    resolve(likes);
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
      .replace(/M/, '000000')
      .replace('mil', '000')
      .replace('k', '000')
      .replace(/\s/g, '');

    const followers = parseInt(_followers);

    resolve(followers);
  });
}

export async function getFollowersNumberIframe() {
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

function resetAutomaticFollowing() {
  localStorage.setItem(`@useStatePerist:@isFollowingList`, `no`);
}

export function isFollowingPage() {
  return /following\/?$/gim.test(window.location.pathname);
}

export function isFollowersPage() {
  return /followers\/?$/gim.test(window.location.pathname);
}

export function copyToClipboard(text) {
  if (window.clipboardData && window.clipboardData.setData) {
    // IE specific code path to prevent textarea being shown while dialog is visible.
    return clipboardData.setData('Text', text);
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported('copy')
  ) {
    var textarea = document.createElement('textarea');
    textarea.textContent = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy'); // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/* Gets the name of the currently logged user
============================= */
export async function getUserName() {
  return new Promise(async (resolve, reject) => {
    if (
      window.hasOwnProperty('ezfyCurrentUser') &&
      window.ezfyCurrentUser !== ''
    ) {
      resolve(window.ezfyCurrentUser);
      return;
    }

    /* Get username from profile image */

    const $link = await _waitForElement(CSS_SELECTORS.profileImage, 100, 100);

    if (!$link) {
      resolve('');
    }

    const id = $link.getAttribute('href').replaceAll(`/`, '');
    window.ezfyCurrentUser = id;

    console.log('id:', id);

    resolve(id);
    /* Trying to get username from window's script */

    // const $script = await _waitForElement(
    //   CSS_SELECTORS.scriptTagWithUserData,
    //   50,
    //   50
    // );

    // if (!$script) {
    //   updateLog(`ERROR: This user does not exist.`);

    //   resetAutomaticFollowing();
    //   return;
    // }

    // const $scripts = document.querySelectorAll(
    //   CSS_SELECTORS.scriptTagWithUserData
    // );

    // for (var [index, each] of $scripts.entries()) {
    //   const script = each.innerHTML.toLowerCase().trim();
    //   const hasUsername = script.includes(`username\\":\\"`);

    //   if (!hasUsername) {
    //     continue;
    //   }

    //   const regex = /username\\":\\"(.+?)"/gm;

    //   let m;
    //   while ((m = regex.exec(script)) !== null) {
    //     if (m.index === regex.lastIndex) {
    //       regex.lastIndex++;
    //     }

    //     const _username = m[1];

    //     const username = _username.replace('/', '').replace('\\', '').trim();

    //     /* Checks if the username found is the same as the alt tag */
    //     if (username && username !== '' && username.length >= 3) {
    //       const $element = await _waitForElement(
    //         `nav [alt*='${username}'], a span>[alt*='${username}']`
    //       );

    //       if ($element) {
    //         window.ezfyCurrentUser = username;
    //         resolve(username);
    //         break;
    //       }
    //     }
    //   }

    //   resolve('');
    // }
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
      updateLog(`\nYou're already at the profile page.`);
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

  const text = `${[...arguments]
    .map((e) => `<span style="display:block;">${e}</span>`)
    .join('')}`;

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

/* Opens the follower list of the current user. */
export async function openFollowersList() {
  /* Updated version */
  return new Promise(async (resolve, reject) => {
    const $button = await _waitForElement(
      CSS_SELECTORS.userPageFollowerstListOpenButton,
      100,
      10
    );

    if (!$button) {
      resolve(null);
      return;
    }

    $button.click();

    const $list = await _waitForElement(CSS_SELECTORS.followersList, 50, 10);

    if (!$list) {
      resolve(null);
      return;
    }

    resolve(true);
  });
}

/* Opens the following list of the current user. */
export async function openFollowingList() {
  return new Promise(async (resolve, reject) => {
    const $button = await _waitForElement(
      CSS_SELECTORS.userPageFollowingtListOpenButton,
      100,
      10
    );

    if (!$button) {
      resolve(null);
      return;
    }

    $button.click();

    const $list = await _waitForElement(CSS_SELECTORS.followersList, 50, 10);

    if (!$list) {
      resolve(null);
      return;
    }

    resolve(true);
  });
}

export async function getUnfollowConfirmationButton() {
  return new Promise(async (resolve, reject) => {
    const $buttons = await _waitForElement(
      `[style] > div > div > button + button, [role='dialog'] div > div > div + button + button`,
      100,
      50
    );

    if (!$buttons) {
      resolve(null);
      return;
    }

    const $parent = $buttons.closest('div');
    const $button = $parent.querySelector(`button:first-of-type`);

    console.log('first button', $button);

    resolve($button);
  });
}

export async function openFollowingPage(username) {
  return new Promise(async (resolve, reject) => {
    updateLog('\nNavigating to following page...');

    if (!username || username === '') {
      updateLog(`No username.`);
      return;
    }

    await goToProfilePage(username);

    const css = `a[href*="following/"]`;

    await _sleep(50);

    const $followingButton = await _waitForElement(css, 50, 50);

    $followingButton.click();

    updateLog(`Opening Following page.`);

    resolve();
  });
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
export async function importChromeStorage(data, initialState = {}) {
  return new Promise(async (resolve, reject) => {
    const user = await getUserName();

    const obj = {
      [user]: { ...initialState, ...data },
    };

    chrome.storage.local.set(obj, function () {
      resolve(obj);
    });
  });
}

export async function overwriteChromeStorageData(key, data) {
  if (!key) {
    throw new Error('Key is needed.');
  }

  if (!data) {
    throw new Error('Data is needed.');
  }

  const user = await getUserName();
  let previous = (await getChromeStorageData()) || {};

  let updated = [data].flat();
  let obj = {
    [user]: {
      ...previous,
      [key]: updated,
    },
  };

  if (!isObject(data)) {
    obj[user][key] = data;
  }

  console.log('saving this obejct:', obj);

  return new Promise(async (resolve, reject) => {
    chrome.storage.local.set(obj, function () {
      resolve(obj[user]);
    });
  });
}

export async function addChromeStorageData(key, data) {
  if (!key) {
    throw new Error('Key is needed.');
    resolve(null);
    return;
  }

  const user = await getUserName();
  let previous = (await getChromeStorageData()) || {};

  var obj = {};

  /* Create new field */
  if (isObjectEmpty(previous)) {
    obj = {
      [user]: {
        [key]: [data],
      },
    };
  } else if (!previous.hasOwnProperty(key)) {
    obj = {
      [user]: {
        ...previous,
        [key]: data,
      },
    };
  } else {
    /* Add data to existing field */

    const currentData = previous[key];

    let updated = [];
    /* Check if it's a simple array, not array of objects */
    if (Array.isArray(currentData) && !isObject(currentData[0])) {
      updated = [...previous[key], ...data];
    } else {
      updated = [previous[key], data].flat();
    }
    obj = {
      [user]: {
        ...previous,
        [key]: updated,
      },
    };
  }

  console.log('saving this obejct:', obj);

  return new Promise(async (resolve, reject) => {
    chrome.storage.local.set(obj, function () {
      resolve(obj[user]);
    });
  });
}

export function isObject(obj) {
  var type = typeof obj;
  return (
    obj === Object(obj) &&
    Object.prototype.toString.call(obj) !== '[object Array]'
  );
}

/* Gets the chrome storage data for the current user. */
export async function getChromeStorageData(key = null) {
  return new Promise(async (resolve, reject) => {
    const user = await getUserName();

    if (!user) {
      resolve(null);
      return;
    }

    chrome.storage.local.get(user, function (result) {
      console.log('result: ', result);

      if (chrome.runtime.lastError) {
        console.log('errrr', chrome.runtime.lastError);
        updateLog('error getting data from Database.');
        resolve(null);
        return;
      }

      if (!result[user] || result[user] === undefined) {
        resolve(null);
        return;
      }

      if (key) {
        resolve(result[user][key]);
        return;
      }

      resolve(result[user]);
    });
  });
}

/* Deletes all data for the current user. */
export async function removeChromeStorageData(key = null) {
  return new Promise(async (resolve, reject) => {
    const user = await getUserName();

    if (!user) {
      resolve(null);

      return;
    }

    /* No specified key, remove everything */
    if (!key) {
      chrome.storage.local.remove(user, function () {
        var error = chrome.runtime.lastError;
        if (error) {
          reject(null);
        }

        resolve(true);
      });
    } else {
      /* There is a specific key remove only that field */
      const data = await getChromeStorageData();

      delete data[key];

      const obj = {
        [user]: data,
      };

      chrome.storage.local.set(obj, function () {
        resolve(true);
      });
    }
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
