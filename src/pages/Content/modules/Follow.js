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

import { resolveConfig } from 'prettier';

import { useLocalStore } from './../store/localStore';
import { useDatabase } from './../store/databaseStore';

const Follow = () => {
  /* Redirects the user to the user to be scraped. */
  const [isRefreshingPage, setIsRefreshingPage] = useStickyState(false);

  const [interactingWithUser, setInteractingWithUser] = useStickyState(
    '@interactingWithUser',
    ''
  );

  const [tabId, setTabId] = useStickyState(`@tabId`, '');

  const [localState, localActions] = useLocalStore();
  const [state, actions] = useDatabase();
  const [username, setUsername] = useState('user2');

  /* Settings 
  ===================================== */
  const [limit, setLimit] = useStickyState('@followLimit', 10);

  const [delayBetweenUsersMin, setDelayBetweenUsersMin] = useStickyState(
    '@delayBetweenUsersMin',
    4
  );
  const [delayBetweenUsersMax, setDelayBetweenUsersMax] = useStickyState(
    '@delayBetweenUsersMin',
    5
  );

  const [closeTabDelayMin, setCloseTabDelayMin] =
    useStickyState('@closeTabDelayMin');
  const [closeTabDelayMax, setCloseTabDelayMax] = useStickyState(
    '@closeTabDelayMax',
    11
  );

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

  const CLICK_ON_FOLLOW_DELAY_MIN = 3000;
  const CLICK_ON_FOLLOW_DELAY_MAX = 4500;

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
        delayBetweenUsersMin * 1000,
        delayBetweenUsersMax * 1000
      );

      const INTERACTION_DELAY = randomIntFromInterval(
        INTERACTION_DELAY_MIN,
        INTERACTION_DELAY_MAX
      );

      try {
        await _sleep(randomIntFromInterval(40, 70));

        if (i % 3 === 1) {
          await scrollDownFollowersList();
        }

        const $button = await _waitForElement(
          `[role="presentation"] > div > div > div > div:nth-child(2) ul div li:nth-child(${i}) button`,
          250,
          10
        );

        if (!$button) {
          await scrollDownFollowersList();
          await scrollDownFollowersList();
        }

        if (!$button) {
          updateLog(`Button not found ${i}`);
        }

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

        updateLog(`Interacting with <b>${user}</b> in a new tab.`);

        while (
          window.localStorage.getItem(LOCAL_STORAGE.interactingWithUserInNewTab)
        ) {
          await _sleep(INTERACTION_DELAY);
        }

        if (
          window.localStorage.getItem(LOCAL_STORAGE.interactionResult) !==
          'fail'
        ) {
          updateLog(`Followed <b>${interactingWithUser}</b> with success.`);
        } else {
          updateLog(`Unable to follow <b>${interactingWithUser}</b>.`);
          ignored += 1;
        }

        updateLog(
          `Waiting <b>${DELAY_BETWEEN_USERS}</b> seconds before moving on.`
        );

        updateLog(`<b>${i - ignored} / ${limit}</b> <br /><br />`);

        window.localStorage.removeItem(LOCAL_STORAGE.interactionResult);
        await _sleep(DELAY_BETWEEN_USERS);

        // console.log('res', res);
      } catch (err) {
        updateLog(`Something went wrong.`);
        throw new Error(err);
      }
    }

    updateLog(`Following completed.`);

    /* Todo 
    Add more data here (how many followed, ignored, etc)
    */
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
        return;
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

  /* 
 Completes an interaction with a new user's tab. You can complete the interaction with a result of "fail" or "success".

 'fail' = something went wrong, unable to "follow" user.

 'success' = was able to follow the user.
  */
  async function finishInteraction(result = 'fail') {
    return new Promise(async (resolve, reject) => {
      updateLog(`Interaction completed. Closing tab.`);

      setInteractingWithUser('');
      window.localStorage.setItem(LOCAL_STORAGE.interactionResult, result);

      await _sleep(
        randomIntFromInterval(closeTabDelayMin * 1000, closeTabDelayMax * 1000)
      );

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

  async function clickOnFollowButton() {
    return new Promise(async (resolve, reject) => {
      const $button = document.querySelector(
        CSS_SELECTORS.userPageFollowButton
      );

      if (!$button) {
        updateLog(`Follow button not found.`);
        resolve(null);
        return;
      }

      await _sleep(
        randomIntFromInterval(
          CLICK_ON_FOLLOW_DELAY_MIN,
          CLICK_ON_FOLLOW_DELAY_MAX
        )
      );

      $button.click();

      const $unfollow = await _waitForElement(
        CSS_SELECTORS.userPageUnfollowButton,
        200,
        10
      );

      if ($unfollow) {
        actions.addIgnoredUser({ user: interactingWithUser });
        updateLog(
          `<span style="color:green;"><b>You are now following ${interactingWithUser}</b>.</span>`
        );

        resolve(true);
        return;
      }
      updateLog(`Failed to follow this user.`);
      resolve(null);
    });
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
      `<span style="font-size: 25px;">Please don't change or close this tab.</span>`
    );

    /* 
      TODO
      Must check if there are enough posts to like.
      */

    const ignored = await actions.getIgnoredUser(interactingWithUser);

    if (ignored) {
      updateLog(`You have unfollowed this user in the past.`);
      await _sleep(100);
      await finishInteraction('fail');
    }

    const followType = await getTypeOfFollowButtonOnUserPage();

    if (followType === 'unfollow') {
      updateLog(`You are already following this user.`);
      await _sleep(100);
      await finishInteraction('fail');
    }

    if (SKIP_PRIVATE_ACCOUNT && (await isPrivateAccount())) {
      updateLog(`This is a private account. Skipping...`);
      await _sleep(100);
      await finishInteraction('fail');
    }

    const following = await getFollowingNumber();
    const followers = await getFollowersNumber();

    updateLog(`Checking following number...`);

    if (!(await isFollowingEnough(following))) {
      updateLog(
        `<b>${interactingWithUser}</b> is following <b>${following}</b> user(s), this is off your limits.`
      );

      await finishInteraction('fail');
      return;
    }

    updateLog(`Checking followers number...`);

    if (!(await isFollowersEnough(followers))) {
      updateLog(
        `<b>${interactingWithUser}</b> has <b>${followers}</b> follower(s), this is off your limits.`
      );

      await finishInteraction('fail');
      return;
    }

    try {
      await likeRandomPosts();
    } catch (err) {
      updateLog(`Something went wrong while liking posts.`);
      await finishInteraction('fail');
    }

    updateLog(`Clicking on "follow" button...`);

    try {
      await clickOnFollowButton();
    } catch (err) {
      updateLog(`Something went wrong while clicking on the follow button.`);
      await finishInteraction('fail');
    }

    updateLog(`Ending interaction...`);
    /* Todo */

    //watchStories()

    await _sleep(randomIntFromInterval(800, 1200));

    await finishInteraction('success');
  }

  useEffect(() => {
    (async () => {
      startInteractingWithUserInNewTab();
    })();
  }, []);

  return (
    <div className="Follow">
      <h3>Follow user's followers</h3>

      <Form.Group className="Unfollow-option mb-3">
        <Form.Label>Follow limit:</Form.Label>
        <Form.Control
          type="number"
          min={1}
          max={1000}
          value={limit}
          onChange={(e) => {
            setLimit(e.target.value);
          }}
          placeholder="Stop following after reaching this number."
        />
      </Form.Group>

      <Form.Group className="Unfollow-option Unfollow-option--click-delay mb-3">
        <Form.Label>
          Wait from <b>{delayBetweenUsersMin}</b> to{' '}
          <b>{delayBetweenUsersMax}</b> seconds between clicking on each user.
        </Form.Label>
        <div className="Unfollow-slider">
          <RangeSlider
            min={5}
            max={60}
            value={delayBetweenUsersMin}
            onChange={(e) => setDelayBetweenUsersMin(e.target.value)}
          />
          <RangeSlider
            min={10}
            max={600}
            value={delayBetweenUsersMax}
            onChange={(e) => setDelayBetweenUsersMax(e.target.value)}
          />
        </div>
      </Form.Group>

      <Button
        disabled={localState.isExecuting}
        onClick={() => {
          localActions.setIsExecuting(true);
          start();
        }}
      >
        {localState.isExecuting ? 'Stop' : 'Start'}
      </Button>
    </div>
  );
};

export default Follow;
