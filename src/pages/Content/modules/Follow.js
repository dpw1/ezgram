import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import RangeSlider from 'react-bootstrap-range-slider';
import { useStatePersist as useStickyState } from 'use-state-persist';

import './Follow.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.css'; // or include from a CDN
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

// import getWindow from './modules/getWindow';
import {
  getChromeStorageData,
  deleteChromeStorageData,
  addChromeStorageData,
  _sleep,
  updateLog,
  _waitForElement,
  randomIntFromInterval,
  CSS_SELECTORS,
  getFollowingNumber,
  getFollowersNumber,
  refreshPage,
  LOCAL_STORAGE,
  openFollowersList,
  isFollowButtonOnFollowerList,
  scrollDownFollowersList,
  openInNewTab,
  doesUserHaveProfileImage,
  scrollDownUserPage,
  isPrivateAccount,
  goToProfilePage,
  getTypeOfFollowButtonOnUserPage,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { resolveConfig } from 'prettier';

const Follow = () => {
  /* Redirects the user to the user to be scraped. */
  const [isRefreshingPage, setIsRefreshingPage] = useStickyState(false);

  const [interactingWithUser, setInteractingWithUser] = useStickyState(
    '@interactingWithUser',
    ''
  );

  const [tabId, setTabId] = useStickyState(`@tabId`, '');

  const [username, setUsername] = useState('user1');

  /* Settings 
  ===================================== */
  const limit = 5;

  const DELAY_BETWEEN_USERS_MIN = 4000;
  const DELAY_BETWEEN_USERS_MAX = 5000;

  const INTERACTION_DELAY_MIN = 800;
  const INTERACTION_DELAY_MAX = 1200;

  const SKIP_USER_WITHOUT_PROFILE_IMAGE = true;

  const FOLLOWING_LIMIT = false;
  const FOLLOWING_MAX = 100; //if user has more than this following number, ignore.
  const FOLLOWING_MIN = 30; //if user has less than this following number, ignore.

  const FOLLOWERS_LIMIT = true;
  const FOLLOWERS_MAX = 5000; //if user has more than this followers, ignore.
  const FOLLOWERS_MIN = 30; //if user has less than this followers, ignore.

  const LIKING_POSTS_DELAY_MIN = 3000;
  const LIKING_POSTS_DELAY_MAX = 5000;

  const LIKING_POSTS_MIN = 2;
  const LIKING_POSTS_MAX = 4;
  const LIKING_POSTS_LIMIT = randomIntFromInterval(
    LIKING_POSTS_MIN,
    LIKING_POSTS_MAX
  );

  const FOLLOW_EVEN_IF_THERE_ARE_NO_POSTS = false;
  const SKIP_PRIVATE_ACCOUNT = false;

  function redirectToUsernamePage() {
    if (isRefreshingPage) {
      setIsRefreshingPage(false);
    }

    const page = window.location.pathname.replaceAll(`/`, '');

    if (page !== username) {
      setIsRefreshingPage(true);
      updateLog(`Redirecting to <b>${username}</b> page, please wait...`);
      window.location.href = `https://www.instagram.com/${username}`;
      return;
    }
  }

  async function clickOnEachUser() {
    let ignored = 0;

    for (let i = 1; i <= limit + ignored; i++) {
      const DELAY_BETWEEN_USERS = randomIntFromInterval(
        DELAY_BETWEEN_USERS_MIN,
        DELAY_BETWEEN_USERS_MAX
      );

      const INTERACTION_DELAY = randomIntFromInterval(
        INTERACTION_DELAY_MIN,
        INTERACTION_DELAY_MAX
      );

      try {
        await _sleep(randomIntFromInterval(40, 70));

        if (i % 6 === 1) {
          await scrollDownFollowersList();
        }

        const $button = document.querySelector(
          `[role="presentation"] > div > div > div > div:nth-child(2) ul div li:nth-child(${i}) button`
        );

        if (!isFollowButtonOnFollowerList($button)) {
          updateLog(`You're already following this user. Skipping...`);
          ignored++;
          continue;
        }

        const $parent = $button.closest(`li`);
        const $user = $parent.querySelector(`a[title]`);
        const user = $user.getAttribute(`title`);
        const url = `https://instagram.com/${user}`;
        const $image = $parent.querySelector(`img`);

        if (SKIP_USER_WITHOUT_PROFILE_IMAGE) {
          const hasImage = await doesUserHaveProfileImage($image);

          if (!hasImage) {
            updateLog(
              `<b>${user}</b> does not have a profile image. Skipping...`
            );
            ignored++;
            continue;
          }
        }

        setInteractingWithUser(user);

        window.localStorage.setItem(
          LOCAL_STORAGE.interactingWithUserInNewTab,
          'waiting...'
        );

        updateLog(`Opening <b>${user}</b> page...`);
        chrome.runtime.sendMessage(
          {
            type: 'openNewTab',
            message: url,
          },
          function (data) {
            console.log('messages', data);

            if (!data) {
              window.localStorage.removeItem(
                LOCAL_STORAGE.interactingWithUserInNewTab
              );
            }

            if (data.type === 'openNewTab') {
              setTabId(data.message);
              window.localStorage.setItem(
                LOCAL_STORAGE.interactingWithUserInNewTab,
                data.message
              );
            }
          }
        );

        updateLog(`Interacting with <b>${user}</b>.`);

        while (
          window.localStorage.getItem(LOCAL_STORAGE.interactingWithUserInNewTab)
        ) {
          await _sleep(INTERACTION_DELAY);
        }

        updateLog(
          `Interaction completed. Moving to next user. <b>${
            i - ignored
          } / ${limit}</b> <br /><br />`
        );

        await _sleep(DELAY_BETWEEN_USERS);

        // console.log('res', res);
      } catch (err) {
        updateLog(`Something went wrong.`);
      }
    }

    updateLog(`Completed!`);
  }

  function isInteractingWithUserInNewTab() {
    if (interactingWithUser === '') {
      return false;
    }

    const user = window.location.pathname.replaceAll(`/`, '');

    if (interactingWithUser === user) {
      return true;
    }

    return false;
  }

  async function likeRandomPosts() {
    return new Promise(async (resolve, reject) => {
      const type = await getTypeOfFollowButtonOnUserPage();

      if (type === 'private') {
        updateLog(`This is a private account.`);
        reject(null);
        return;
      }

      updateLog(`Setting up to like ${LIKING_POSTS_LIMIT} posts...`);

      const _$post = await _waitForElement(CSS_SELECTORS.userPagePosts, 50, 20);

      if (!_$post) {
        updateLog(`There are no posts.`);
        resolve(true);
      }

      let ignored = 0;
      let liked = 0;
      var postY = 0;

      /* The instagram posts are divided like 3 posts in 1 div. 

      <div>
        post
        post
        post
      </div>

      To properly go through each one of them individually, it's required to count it via postY and postX,
      using mods of the current for loop index.
      */

      for (let i = 1; i <= LIKING_POSTS_LIMIT + ignored; i++) {
        const index = i + ignored;

        var postX = ((i - 1) % 3) + 1;

        if (i % 3 === 1) {
          postY += 1;
        }

        const LIKING_POSTS_DELAY = randomIntFromInterval(
          LIKING_POSTS_DELAY_MIN,
          LIKING_POSTS_DELAY_MAX
        );

        if (index >= 3 && i % 4 === 1) {
          await scrollDownUserPage();
        }

        var $post = document.querySelector(
          `main div >article > div > div > div:nth-child(${postY}) > div:nth-child(${postX}) a[href*='/p']`
        );

        await _sleep(randomIntFromInterval(900, 3000));

        $post.click();

        updateLog(
          `Post opened. Awaiting <b>${LIKING_POSTS_DELAY}</b> seconds.`
        );

        await _sleep(LIKING_POSTS_DELAY);

        const $close = document.querySelector(
          CSS_SELECTORS.postPageCloseButton
        );

        const $like = document.querySelector(CSS_SELECTORS.postPageLikeButton);
        const $unlike = document.querySelector(
          CSS_SELECTORS.postPageUnlikeButton
        );

        if (!$unlike) {
          updateLog(`Post liked.`);
          liked += 1;
          $like.click();
        } else {
          ignored += 1;
          updateLog(`This post has already been liked.`);
          $close.click();
          await _sleep(randomIntFromInterval(400, 1500));
          updateLog(`Moving to next post.<br/><br/>`);

          continue;
        }

        updateLog(`Waiting ${LIKING_POSTS_DELAY} seconds.`);

        await _sleep(randomIntFromInterval(900, 3000));

        $close.click();

        updateLog(`Moving to the next post... <br /><br />`);
        await _sleep(randomIntFromInterval(500, 800));
      }

      updateLog(`Completed!`);

      updateLog(`Posts liked: <b>${liked}</b>`);
      updateLog(`Posts ignored: <b>${ignored}</b>`);

      resolve(true);
    });
  }

  async function isFollowingEnough(following) {
    return new Promise(async (resolve, reject) => {
      if (!FOLLOWING_LIMIT) {
        resolve(true);
      }

      if (following >= FOLLOWING_MAX) {
        resolve(false);
      }

      if (following <= FOLLOWING_MIN) {
        resolve(false);
      }

      resolve(true);
    });
  }

  async function isFollowersEnough(followers) {
    return new Promise(async (resolve, reject) => {
      if (!FOLLOWERS_LIMIT) {
        resolve(true);
      }

      if (followers >= FOLLOWERS_MAX) {
        resolve(false);
      }

      if (followers <= FOLLOWERS_MIN) {
        resolve(false);
      }

      resolve(true);
    });
  }

  async function finishInteraction() {
    return new Promise(async (resolve, reject) => {
      updateLog(`Interaction completed. Closing tab.`);

      setInteractingWithUser('');

      await _sleep(1000);

      chrome.runtime.sendMessage(
        {
          type: 'closeTab',
          message: tabId,
        },
        function (data) {
          if (data.type === 'closeTab') {
            console.log('closed!', data);
            resolve(true);
            window.localStorage.removeItem(
              LOCAL_STORAGE.interactingWithUserInNewTab
            );
          }
        }
      );
    });
  }

  async function start() {
    updateLog(`starting...`);

    const currentUsername = window.location.pathname.replaceAll(`/`, '').trim();

    if (!isRefreshingPage) {
      redirectToUsernamePage();
    }

    if (isRefreshingPage && currentUsername === username) {
      updateLog(`Successfully navigated to ${username}.`);
    }

    await openFollowersList(username);
    clickOnEachUser();
  }

  async function startInteractingWithUserInNewTab() {
    const currentUser = window.location.pathname.replaceAll('/', '');
    if (
      interactingWithUser !== currentUser ||
      interactingWithUser === '' ||
      !interactingWithUser
    ) {
      setInteractingWithUser('');
      return;
    }

    await _sleep(randomIntFromInterval(500, 1000));
    updateLog(`Interacting with <b>${interactingWithUser}</b>.`);
    updateLog(
      `<span style="font-size: 25px;">Please don't change tabs.</span>`
    );

    /* 
      TODO
      Must check if you're following already.
      Must check if it's ignored user.
      Must check if there are enough posts to like.
      */

    console.log('isPrivate? ', await isPrivateAccount());
    console.log('skip private? ', SKIP_PRIVATE_ACCOUNT);

    if (SKIP_PRIVATE_ACCOUNT && (await isPrivateAccount())) {
      updateLog(`This is a private account. Skipping...`);
      await _sleep(100);
      // await finishInteraction();
    }

    updateLog(`counting folowers`);

    const following = await getFollowingNumber();
    const followers = await getFollowersNumber();

    updateLog(`Checking posts, followers and following number...`);

    if (!(await isFollowingEnough(following))) {
      updateLog(
        `<b>${interactingWithUser}</b> is following <b>${following}</b> users, this is off your limits.`
      );

      // await finishInteraction();
      return;
    }

    updateLog(`Checking followers...`);

    if (!(await isFollowersEnough(followers))) {
      updateLog(
        `<b>${interactingWithUser}</b> has <b>${followers}</b> followers, this is off your limits.`
      );

      // await finishInteraction();
      return;
    }

    try {
      await likeRandomPosts();
    } catch (err) {
      updateLog(`Ending...`);
      // await finishInteraction();
    }

    try {
      //clickOnFollowButton()
    } catch (err) {}

    await _sleep(5000);

    /* Todo */

    //watchStories()

    /* conditions to check:
       posts number 
       is private account
       */

    await _sleep(1000);

    return;
    if (isInteractingWithUserInNewTab()) {
    }
  }

  useEffect(() => {
    (async () => {
      startInteractingWithUserInNewTab();
    })();
  }, []);

  return (
    <div className="Follow">
      <h3>Follow user's followers</h3>

      <Button
        onClick={() => {
          start();
        }}
      >
        start
      </Button>
    </div>
  );
};

export default Follow;
