import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import RangeSlider from 'react-bootstrap-range-slider';
import { useStatePersist as useStickyState } from 'use-state-persist';

import './Follow.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.css'; // or include from a CDN
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

import InputGroup from 'react-bootstrap/InputGroup';

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
  getPostsNumber,
  stopExecuting,
  _waitForElementIframe,
  getFollowersNumberIframe,
  removeIframe,
  randomUniqueIntegers,
} from './utils';

import { resolveConfig } from 'prettier';

import { useLocalStore } from './../store/localStore';
import { useDatabase } from './../store/databaseStore';
import { FormControl } from 'react-bootstrap';

const Follow = () => {
  /* Redirects the user to the user to be scraped. */
  const [isRefreshingPage, setIsRefreshingPage] = useStickyState(false);

  const [interactingWithUser, setInteractingWithUser] = useStickyState(
    '@interactingWithUser',
    ''
  );

  const [localState, localActions] = useLocalStore();
  const [state, actions] = useDatabase();
  const [username, setUsername] = useState('');

  /* Settings 
  ===================================== */
  const [limit, setLimit] = useStickyState('@followLimit', 10);

  const [delayBetweenUsersMin, setDelayBetweenUsersMin] = useStickyState(
    '@delayBetweenUsersMin',
    4
  );
  const [delayBetweenUsersMax, setDelayBetweenUsersMax] = useStickyState(
    '@delayBetweenUsersMax',
    5
  );

  const [closeTabDelayMin, setCloseTabDelayMin] = useStickyState(
    '@closeTabDelayMin',
    1
  );
  const [closeTabDelayMax, setCloseTabDelayMax] = useStickyState(
    '@closeTabDelayMax',
    2
  );

  /* Liking posts 
  ==================================== */
  const [likePosts, setLikePosts] = useStickyState('@likePosts', true); //like posts?
  const [likeFirstXPosts, setLikeFirstXPosts] = useStickyState(
    '@likeFirstXPosts',
    10
  ); //randomly choose X of the first user posts and like them.

  /* Loading user error
  ===================================== */
  const [iframeRestartTime, setIframeRestartTime] = useStickyState(
    '@iframeRestartTime',
    30
  ); //if iframe does not load, wait for X minutes and reload page.

  const [iframeWaitLimit, setIframeWaitLimit] = useStickyState(
    '@iframeWaitLimit',
    30
  ); //wait X seconds for iframe to load

  /* Following limit 
  ==================================== */
  const [followingLimit, setFollowingLimit] = useStickyState(
    '@followingLimit',
    false
  );
  const [followingMin, setFollowingMin] = useStickyState('@followingMin', 0); //if user has less than this following number, ignore.

  const [followingMax, setFollowingMax] = useStickyState('@followingMax', 3000); //if user has more than this following number, ignore.

  /* Followers limit 
  ==================================== */
  const [followersLimit, setFollowersLimit] = useStickyState(
    '@followersLimit',
    false
  );
  const [followersMin, setFollowersMin] = useStickyState('@followersMin', 30); //if user has less than this followers, ignore.

  const [followersMax, setFollowersMax] = useStickyState('@followersMax', 5000); //if user has more than this followers, ignore.

  const [storeSkippedUser, setStoreSkippedUser] = useStickyState(
    '@storeSkippedUser',
    true
  ); //if user does not meet the limits (followings, followers, etc) store it in the database

  /* === */
  const INTERACTION_DELAY_MIN = 800;
  const INTERACTION_DELAY_MAX = 1200;

  const LIKING_POSTS_DELAY_MIN = 3000;
  const LIKING_POSTS_DELAY_MAX = 5000;

  const LIKING_POSTS_MIN = 2;
  const LIKING_POSTS_MAX = 5;

  const LIKING_POSTS_LIMIT = randomIntFromInterval(
    LIKING_POSTS_MIN,
    LIKING_POSTS_MAX
  );

  const SKIP_USER_WITHOUT_PROFILE_IMAGE = false;
  const SKIP_ACCOUNTS_WITH_NO_POSTS = false;
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
    let ignoredUser;
    let successfullyFollowed = 0;

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

        const $parent = await _waitForElement(
          `[role="presentation"] > div > div > div > div:nth-child(2) ul div li:nth-child(${i})`,
          250,
          10
        );

        const $user = $parent.querySelector(`a[title]`);
        const user = $user.getAttribute(`title`);
        const url = `https://instagram.com/${user}`;
        const $image = $parent.querySelector(`img`);
        const $button = $parent.querySelector(`button`);

        if (user === state.username) {
          ignored++;
          continue;
        }

        ignoredUser = await actions.getIgnoredUser(user);

        if (ignoredUser) {
          updateLog(`You have unfollowed this user in the past. Skipping...`);
          ignoredUser++;
          continue;
        }

        if (!$button) {
          updateLog(`Button not found ${i}`);
        }

        /* Check if user is in ignore list */

        if (!isFollowButtonOnFollowerList($button)) {
          updateLog(`You're already following this user. Skipping...`);
          ignored++;
          continue;
        }

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

        await _sleep(150);

        const result = await openIframe(url);

        updateLog(`Opening <b>${user}</b> page...`);

        /* TODO
        - add a while loop that repeats every 1 second. 
        - while the #ezgram-iframe is empty, keep looping.
        - if 30 seconds pass by and the iframe does not load, refresh page and restart automatically.
        
        options to give control:
        
        - seconds to wait for iframe to load;
        - restart after X minutes if iframe failed to load (server rejected)

        */

        await _sleep(INTERACTION_DELAY);

        // while (
        //   window.localStorage.getItem(LOCAL_STORAGE.interactingWithUserInNewTab)
        // ) {
        //   console.log(
        //     window.localStorage.getItem(
        //       LOCAL_STORAGE.interactingWithUserInNewTab
        //     )
        //   );
        //   await _sleep(INTERACTION_DELAY);
        // }

        if (
          window.localStorage.getItem(LOCAL_STORAGE.interactionResult) !==
          'fail'
        ) {
          updateLog(`<span style="color:green;">Successfully followed!</span>`);
          window.localStorage.removeItem(LOCAL_STORAGE.interactionResult);
          successfullyFollowed += 1;
        } else {
          updateLog(
            `<b>${interactingWithUser}</b> was <b>not</b> followed, the user does not match your settings.`
          );
          ignored += 1;
        }

        if (successfullyFollowed > limit + ignored) {
          break;
        }

        updateLog(
          `<br /><b>Following: ${successfullyFollowed} / ${limit}</b> <br />`
        );
        updateLog(`<br /><b>Ignored: ${ignored}</b> <br /><br />`);

        updateLog(
          `<br />Waiting <b>${
            DELAY_BETWEEN_USERS / 1000
          } seconds</b> before moving on.`
        );

        window.localStorage.removeItem(LOCAL_STORAGE.interactionResult);
        await _sleep(DELAY_BETWEEN_USERS);

        // console.log('res', res);
      } catch (err) {
        updateLog(`Something went wrong.`);
        throw new Error(err);
      }
    }

    updateLog(`<br />Following completed.`);

    /* Todo 
    Add more data here (how many followed, ignored, requested, failed etc)
    */
  }

  /* Currently not working with randomization. It will like each individual post, one by one.*/
  async function likeRandomPosts($html) {
    return new Promise(async (resolve, reject) => {
      const type = await getTypeOfFollowButtonOnUserPage($html);

      if (type === 'private') {
        updateLog(`This is a private account.`);
        reject(null);
        return;
      }

      const posts = await getPostsNumber($html);

      const limit = LIKING_POSTS_LIMIT >= posts ? posts : LIKING_POSTS_LIMIT;

      updateLog(`Preparing to like ${limit} posts...`);

      const _$post = await _waitForElementIframe(
        $html,
        CSS_SELECTORS.userPagePosts,
        50,
        20
      );

      if (!_$post) {
        updateLog(`There are no posts.`);
        resolve(true);
        return;
      }

      let ignored = 0;
      let liked = 0;
      var postY = 0;

      const randomPosts = randomUniqueIntegers(likeFirstXPosts, limit);

      /* The instagram posts are divided like 3 posts in 1 div. 

      <div>
        post
        post
        post
      </div>

      To properly go through each one of them individually, it's required to count it via postY and postX,
      using mods of the current for loop index.
      */

      let LIKING_POSTS_DELAY;

      for (let i = 1; i <= limit + ignored; i++) {
        const index = i + ignored;

        var postX = ((i - 1) % 3) + 1;

        if (i % 3 === 1) {
          postY += 1;
        }

        LIKING_POSTS_DELAY = randomIntFromInterval(
          LIKING_POSTS_DELAY_MIN,
          LIKING_POSTS_DELAY_MAX
        );

        if (index >= 3 && i % 4 === 1) {
          await scrollDownUserPage($html);
        }

        var $post = await _waitForElementIframe(
          $html,
          `main div >article > div > div > div:nth-child(${postY}) > div:nth-child(${postX}) a[href*='/p']`,
          250,
          10
        );

        await _sleep(randomIntFromInterval(900, 3000));

        if (!$post) {
        }

        $post.click();

        updateLog(
          `Post opened. Awaiting <b>${LIKING_POSTS_DELAY / 1000}</b> seconds.`
        );

        await _sleep(LIKING_POSTS_DELAY);

        const $close = $html.querySelector(CSS_SELECTORS.postPageCloseButton);

        const $like = await _waitForElementIframe(
          $html,
          CSS_SELECTORS.postPageLikeButton,
          100,
          5
        );
        const $unlike = await _waitForElementIframe(
          $html,
          CSS_SELECTORS.postPageUnlikeButton,
          100,
          5
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
          updateLog(`Moving to next post.<br/>`);

          if (i >= posts) {
            updateLog(`No more posts to like.`);
            break;
          }
          continue;
        }

        LIKING_POSTS_DELAY = randomIntFromInterval(
          LIKING_POSTS_DELAY_MIN,
          LIKING_POSTS_DELAY_MAX
        );

        updateLog(`Waiting <b>${LIKING_POSTS_DELAY / 1000}</b> seconds.<br/>`);

        await _sleep(randomIntFromInterval(900, 3000));

        $close.click();

        updateLog(`Moving to the next post... <br />`);
        updateLog(`Posts liked: <b>${i} / ${LIKING_POSTS_LIMIT}</b><br />`);
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
      if (!followingLimit) {
        resolve(true);
      }

      if (following >= followingMax) {
        resolve(false);
      }

      if (following <= followingMin) {
        resolve(false);
      }

      resolve(true);
    });
  }

  async function isFollowersEnough(followers) {
    return new Promise(async (resolve, reject) => {
      if (!followersLimit) {
        resolve(true);
      }

      if (followers >= followersMax) {
        resolve(false);
      }

      if (followers <= followersMin) {
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
      const user = localStorage.getItem(
        LOCAL_STORAGE.interactingWithUserInNewTab
      );
      updateLog(`Interaction completed.`);

      setInteractingWithUser('');
      window.localStorage.setItem(LOCAL_STORAGE.interactionResult, result);

      const delay = randomIntFromInterval(
        closeTabDelayMin * 1000,
        closeTabDelayMax * 1000
      );

      updateLog(`<br />Closing user page in <b>${delay / 1000}</b> seconds.`);

      await _sleep(delay);

      const originalTab = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE.originalTab)
      );

      const newTab = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE.newTab)
      );

      window.localStorage.removeItem(LOCAL_STORAGE.interactingWithUserInNewTab);

      if (storeSkippedUser) {
        await actions.addIgnoredUser({ user });
      }

      removeIframe();

      await _sleep(100);

      resolve(true);
    });
  }

  /* 
  If user page was not loaded, refresh page and restart following.
  */
  async function checkIfMustRestartFollow() {
    const restart = localStorage.getItem(LOCAL_STORAGE.restartFollow);

    if (!restart) {
      return;
    }

    updateLog(`Automatically restarting follow...`);

    localStorage.removeItem(LOCAL_STORAGE.restartFollow);

    await _sleep(1000);

    const $follow = document.querySelector(`#ezgram .Follow button`);

    if ($follow) {
      $follow.click();
    }
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

    /* TODO
    check if is not open already */
    await openFollowersList(username);
    clickOnEachUser();
  }

  async function clickOnFollowButton($html) {
    return new Promise(async (resolve, reject) => {
      const $button = await _waitForElementIframe(
        $html,
        CSS_SELECTORS.userPageFollowButton,
        100,
        10
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

      const $unfollow = await _waitForElementIframe(
        $html,
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
      // updateLog(`Failed to follow this user.`);
      resolve(null);
    });
  }

  async function openIframe(src, $parent) {
    let tries = 0;
    const delay = 1000;

    return new Promise(async (resolve, reject) => {
      const html = `<iframe src="" id="ezgram-iframe"></iframe>`;
      let $iframe = document.querySelector(`#ezgram-iframe`);

      if (!$iframe) {
        const $body = document.querySelector(`body`);
        $body.insertAdjacentHTML('beforeend', html);

        await _sleep(50);
        $iframe = document.querySelector(`#ezgram-iframe`);
      }

      $iframe.setAttribute('src', src);

      $iframe.addEventListener('load', async function () {
        while (!$iframe.contentDocument) {
          tries += 1;

          if (tries > iframeWaitLimit) {
            updateLog(
              `User page failed to load. <b>Waiting ${iframeRestartTime} minute(s) before reloading.</b>`
            );
            iframeFailedToLoad();
            break;
          }

          updateLog(
            `waiting for user page to load... ${tries} / ${iframeWaitLimit}`
          );
          await _sleep(delay);
        }

        const $html = $iframe.contentDocument.querySelector(`html`);

        await startInteractingWithUserInNewTab($html);
        resolve(true);
      });
    });
  }

  /* If the iframe fails to load, wait for X seconds and refresh. */
  async function iframeFailedToLoad() {
    return new Promise(async (resolve, reject) => {
      await _sleep(iframeRestartTime * 60000);
      localStorage.setItem(LOCAL_STORAGE.restartFollow, 'true');
      window.location.reload();
      resolve();
    });
  }

  async function startInteractingWithUserInNewTab($html) {
    return new Promise(async (resolve, reject) => {
      const $currentUser = await _waitForElementIframe(
        $html,
        CSS_SELECTORS.userPageUsername,
        100,
        10
      );
      const currentUser = $currentUser.textContent.trim();

      localStorage.setItem(
        LOCAL_STORAGE.interactingWithUserInNewTab,
        currentUser
      );

      updateLog(`Iframe of the user:`, currentUser);

      if ($html) {
        updateLog(`Page loaded successfully.`);
      }
      await _waitForElementIframe(
        $html,
        CSS_SELECTORS.userPageProfileImage,
        30,
        10
      );

      updateLog(
        `<span style="font-size: 25px;">Please don't change or close this tab.</span><br /><br />`
      );

      updateLog(`Interacting with <b>${currentUser}</b>.`);

      /* 
        TODO
        Must check if there are enough posts to like.
        */

      const ignored = await actions.getIgnoredUser(currentUser);

      if (ignored) {
        updateLog(`You have unfollowed this user in the past.`);
        await _sleep(100);
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      const followType = await getTypeOfFollowButtonOnUserPage($html);

      if (!followType) {
        updateLog('ERROR: Unable to identify type of follow button.');
        resolve(true);
        return;
      }

      if (followType === 'unfollow') {
        updateLog(`You are already following this user.`);
        await _sleep(100);
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      const isPrivate = await isPrivateAccount($html);

      if (SKIP_PRIVATE_ACCOUNT) {
        if (isPrivate) {
          updateLog(`This is a private account. Skipping...`);
          await _sleep(100);
          await finishInteraction('fail');
          resolve(true);
          return;
        }
      }

      const posts = await getPostsNumber($html);
      const following = await getFollowingNumber($html);
      const followers = await getFollowersNumberIframe($html);

      updateLog(
        `Post: ${posts} -- followers: ${followers} -- following: ${following}`
      );

      updateLog(`Checking posts number...`);

      if (posts <= 0 && SKIP_ACCOUNTS_WITH_NO_POSTS) {
        updateLog(`<b>${currentUser}</b> has no posts. Skipping...`);

        await finishInteraction('fail');
        resolve(true);
        return;
      }

      updateLog(`Checking following number...`);

      if (!(await isFollowingEnough(following))) {
        updateLog(
          `<b>${currentUser}</b> is following <b>${following}</b> user(s), this is off your limits.`
        );

        await finishInteraction('fail');
        resolve(true);
        return;
      }

      updateLog(`Checking followers number...`);

      if (!(await isFollowersEnough(followers))) {
        updateLog(
          `<b>${currentUser}</b> has <b>${followers}</b> follower(s), this is off your limits.`
        );

        await finishInteraction('fail');
        resolve(true);
        return;
      }

      updateLog(`<br /><br />`);

      if (posts >= 1 && !isPrivate && likePosts) {
        try {
          await likeRandomPosts($html);
        } catch (err) {
          updateLog(`No posts found.`);
          await finishInteraction('fail');
          resolve(true);
          return;
        }
      }

      /*
      TODO
      Differentiate between requesting to follow & follow */

      updateLog(`Clicking on the "follow" button...`);

      try {
        await clickOnFollowButton($html);
      } catch (err) {
        updateLog(`Something went wrong while clicking on the follow button.`);
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      updateLog(`Ending interaction...`);
      /* Todo */

      //watchStories()

      await _sleep(randomIntFromInterval(800, 1200));

      await finishInteraction('success');
      resolve(true);
    });
  }

  useEffect(() => {
    (async () => {
      await _sleep(1000);
      const $html = document.querySelector(`html`);
      likeRandomPosts($html);

      checkIfMustRestartFollow();
      // startInteractingWithUserInNewTab();

      const _user = window.location.pathname.replaceAll('/', '');

      if (_user) {
        setUsername(_user);
      }
    })();
  }, []);

  return (
    <div className="Follow">
      <h4 className="h6">Follow user's followers</h4>
      <hr />

      <InputGroup className="mb-3">
        <Form.Label style={{ display: 'block' }}>User:</Form.Label>
        <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
        <FormControl
          value={username}
          placeholder="Username"
          aria-label="Username"
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          aria-describedby="basic-addon1"
        />
      </InputGroup>

      <Form.Group className="Follow-option mb-3">
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

      <Form.Group className="Follow-option Follow-option--click-delay mb-3">
        <Form.Label>
          Wait between <b>{delayBetweenUsersMin}</b> to{' '}
          <b>{delayBetweenUsersMax}</b> seconds before clicking on each user.
        </Form.Label>
        <div className="Follow-slider">
          <RangeSlider
            min={1}
            max={delayBetweenUsersMax}
            value={delayBetweenUsersMin}
            onChange={(e) => setDelayBetweenUsersMin(e.target.value)}
          />
          <RangeSlider
            min={
              delayBetweenUsersMin && delayBetweenUsersMin > 1
                ? delayBetweenUsersMin
                : 2
            }
            max={200}
            value={delayBetweenUsersMax}
            onChange={(e) => setDelayBetweenUsersMax(e.target.value)}
          />
        </div>
      </Form.Group>

      <div className="Follow-options Follow-options--following">
        <Form.Group className="Follow-group mb-3">
          <Form.Check
            type="switch"
            id="followingLimitInput"
            checked={followingLimit}
            onChange={(e) => {
              setFollowingLimit(e.target.checked);
            }}
            label={`"following" limit`}
          />

          <div style={{ display: followingLimit ? 'block' : 'none' }}>
            <Form.Label>
              Skip user if they are following less than{' '}
              <b>{followingMin || 'X'}</b> or more than{' '}
              <b>{followingMax || 'X'}</b> users.
            </Form.Label>

            <div className="Follow-inputs">
              <Form.Control
                type="number"
                value={followingMin}
                onChange={(e) => {
                  setFollowingMin(e.target.value);
                }}
                placeholder={'Minimum'}
              />
              <Form.Control
                type="number"
                value={followingMax}
                onChange={(e) => {
                  setFollowingMax(e.target.value);
                }}
                placeholder={'Maximum'}
              />
            </div>
          </div>
        </Form.Group>

        <Form.Group className="Follow-group mb-3">
          <Form.Check
            type="switch"
            id="followersLimitInput"
            checked={followersLimit}
            onChange={(e) => {
              setFollowersLimit(e.target.checked);
            }}
            label={`"followers" limit`}
          />

          <div style={{ display: followersLimit ? 'block' : 'none' }}>
            <Form.Label>
              Skip user if they have less than <b>{followersMin || 'X'}</b> or
              more than <b>{followersMax || 'X'}</b> followers.
            </Form.Label>

            <div className="Follow-inputs">
              <Form.Control
                type="number"
                value={followersMin}
                onChange={(e) => {
                  setFollowersMin(e.target.value);
                }}
                placeholder={'Minimum'}
              />
              <Form.Control
                type="number"
                value={followersMax}
                onChange={(e) => {
                  setFollowersMax(e.target.value);
                }}
                placeholder={'Maximum'}
              />
            </div>
          </div>
        </Form.Group>
      </div>

      <hr />
      <Button
        onClick={() => {
          if (localState.isExecuting) {
            stopExecuting();
          } else {
            localActions.setIsExecuting(true);
            start();
          }
        }}
      >
        {localState.isExecuting ? 'Stop' : 'Start'}
      </Button>
    </div>
  );
};

export default Follow;
