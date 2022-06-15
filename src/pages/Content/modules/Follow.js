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
  createBackupFile,
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
  ); //wait a minimum of X seconds before clicking on the next user
  const [delayBetweenUsersMax, setDelayBetweenUsersMax] = useStickyState(
    '@delayBetweenUsersMax',
    5
  ); //wait a maximum of X seconds before clicking on the next user

  const [closeIframeDelayMin, setCloseIframeDelayMin] = useStickyState(
    '@closeIframeDelayMin',
    1
  );
  const [closeIframeDelayMax, setCloseIframeDelayMax] = useStickyState(
    '@closeIframeDelayMax',
    2
  );

  /* Liking posts 
  ==================================== */
  const [likePosts, setLikePosts] = useStickyState('@likePosts', 'yes'); //like posts?
  const [likeFirstXPosts, setLikeFirstXPosts] = useStickyState(
    '@likeFirstXPosts',
    20
  ); // randomly choose X of the first user posts and like them. if the user has less posts than this number, use number of posts instead.

  const [likePostsMin, setLikePostsMin] = useStickyState('@likePostsMin', 2);
  const [likePostsMax, setLikePostsMax] = useStickyState('@likePostsMax', 2);

  const [likePostsDelayMin, setLikePostsDelayMin] = useStickyState(
    '@likePostsDelayMin',
    3
  );
  const [likePostsDelayMax, setLikePostsDelayMax] = useStickyState(
    '@likePostsDelayMax',
    5
  );

  /* Loading user error
  ===================================== */
  const [iframeRestartTime, setIframeRestartTime] = useStickyState(
    '@iframeRestartTime',
    5
  ); // if iframe does not load, wait for X minutes and reload page.

  const [iframeWaitLimit, setIframeWaitLimit] = useStickyState(
    '@iframeWaitLimit',
    30
  ); // wait X seconds for iframe to load

  /* Following limit 
  ==================================== */
  const [followingLimit, setFollowingLimit] = useStickyState(
    '@followingLimit',
    'no'
  );
  const [followingMin, setFollowingMin] = useStickyState('@followingMin', 0); //if user has less than this following number, ignore.

  const [followingMax, setFollowingMax] = useStickyState('@followingMax', 3000); //if user has more than this following number, ignore.

  /* Followers limit 
  ==================================== */
  const [followersLimit, setFollowersLimit] = useStickyState(
    '@followersLimit',
    'no'
  );
  const [followersMin, setFollowersMin] = useStickyState('@followersMin', 30); //if user has less than this followers, ignore.

  const [followersMax, setFollowersMax] = useStickyState('@followersMax', 5000); //if user has more than this followers, ignore.

  const [storeSkippedUser, setStoreSkippedUser] = useStickyState(
    '@storeSkippedUser',
    'yes'
  ); //if user does not meet the limits (followings, followers, etc) store it in the database

  const [downloadBackupFile, setDownloadBackupFIle] = useStickyState(
    '@downloadBackupFile',
    'yes'
  );

  const [skipUserWithoutProfileImage, setSkipUserWithoutProfileImage] =
    useStickyState('@skipUserWithoutProfileImage', true);

  const [skipAccountWithNoPosts, setSkipAccountWithNoPosts] = useStickyState(
    '@skipAccountWithNoPosts',
    false
  );

  const [skipPrivateAccounts, setSkipPrivateAccounts] = useStickyState(
    '@skipPrivateAccounts',
    false
  );

  /* === */
  const INTERACTION_DELAY_MIN = 800;
  const INTERACTION_DELAY_MAX = 1200;

  const SKIP_USER_WITHOUT_PROFILE_IMAGE = true;
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

  /* Clicks on each user of the "followers" list. */
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
          `${CSS_SELECTORS.followersList} li:nth-child(${i})`,
          250,
          10
        );

        const $user = $parent.querySelector(`a[href]`);
        const user = $user
          .getAttribute(`href`)
          .replaceAll('/', '')
          .replaceAll(`followers`, '')
          .trim();
        const url = `https://www.instagram.com/${user}/`;
        const $image = $parent.querySelector(`img`);
        const $button = $parent.querySelector(`button`);

        if (user === state.username) {
          ignored += 1;
          continue;
        }

        ignoredUser = await actions.getIgnoredUser(user);

        if (ignoredUser) {
          updateLog(`You have unfollowed this user in the past. Skipping...`);
          ignored += 1;
          continue;
        }

        if (!$button) {
          updateLog(`Button not found ${i}`);
        }

        /* Check if user is in ignore list */

        if (!isFollowButtonOnFollowerList($button)) {
          updateLog(`You're already following this user. Skipping...`);
          ignored += 1;
          continue;
        }

        if (SKIP_USER_WITHOUT_PROFILE_IMAGE) {
          const hasImage = await doesUserHaveProfileImage($image);

          if (!hasImage) {
            updateLog(
              `<b>${user}</b> does not have a profile image. Skipping...`
            );
            ignored += 1;
            continue;
          }
        }

        setInteractingWithUser(user);

        window.localStorage.setItem(
          LOCAL_STORAGE.interactingWithUserInNewTab,
          'waiting...'
        );

        await _sleep(150);

        await openIframe(url);

        await _sleep(INTERACTION_DELAY);

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
          await _sleep(500);
          continue;
        }

        updateLog(
          `<br /><b>Users followed: ${successfullyFollowed} / ${limit}</b> <br />`
        );
        updateLog(`<br /><b>Users skipped: ${ignored}</b> <br /><br />`);

        window.localStorage.removeItem(LOCAL_STORAGE.interactionResult);

        if (successfullyFollowed >= limit) {
          break;
        }

        updateLog(
          `<br />Waiting <b>${
            DELAY_BETWEEN_USERS / 1000
          } seconds</b> before moving on.`
        );

        await _sleep(DELAY_BETWEEN_USERS);

        // console.log('res', res);
      } catch (err) {
        updateLog(`Something went wrong.`);
        throw new Error(err);
      }
    }

    if (downloadBackupFile === 'yes') {
      await createBackupFile();
    }

    localActions.setIsExecuting(false);
    updateLog(`<br />Following completed. <b>Please Refresh the page.</b>`);
  }

  async function likeRandomPosts($html) {
    return new Promise(async (resolve, reject) => {
      const LIKING_POSTS_LIMIT = randomIntFromInterval(
        likePostsMin,
        likePostsMax
      );

      const type = await getTypeOfFollowButtonOnUserPage($html);

      if (type === 'private') {
        updateLog(`This is a private account.`);
        reject(null);
        return;
      }

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

      const posts = await getPostsNumber($html);

      const totalPostsToLike =
        LIKING_POSTS_LIMIT >= posts ? posts : LIKING_POSTS_LIMIT;
      const availablePosts = likeFirstXPosts > posts ? posts : likeFirstXPosts;

      updateLog(
        `Preparing to like <b>${totalPostsToLike}</b> random posts from the first <b>${availablePosts}</b> posts...`
      );

      let ignored = 0;
      let liked = 0;

      let LIKING_POSTS_DELAY;

      const randomPosts = randomUniqueIntegers(
        availablePosts,
        totalPostsToLike
      );

      /* The instagram posts are divided like 3 posts in 1 div. 

      <div>
        post
        post
        post
      </div>

      To properly go through each one of them individually, it's required to count it via postY and postX,
      using mods of the current for loop index.
      */

      for (var [i, each] of randomPosts.entries()) {
        const index = i + ignored;

        let postX = each % 3 === 0 ? 3 : each % 3;
        let postY = Math.ceil(each / 3);

        if (each % 12 === 0) {
          await scrollDownUserPage($html);
        }

        LIKING_POSTS_DELAY = randomIntFromInterval(
          likePostsDelayMin * 1000,
          likePostsDelayMax * 1000
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

        $post.click();

        updateLog(
          `<b>Post ${each} opened.</b>  Awaiting <b>${
            LIKING_POSTS_DELAY / 1000
          }</b> seconds.`
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
          likePostsDelayMin * 1000,
          likePostsDelayMax * 1000
        );

        updateLog(`Waiting <b>${LIKING_POSTS_DELAY / 1000}</b> seconds.<br/>`);

        await _sleep(randomIntFromInterval(900, 3000));

        $close.click();

        updateLog(`Moving to the next post... <br />`);
        updateLog(`Posts liked: <b>${liked} / ${LIKING_POSTS_LIMIT}</b><br />`);
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
      if (followingLimit === 'no') {
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
      if (followersLimit === 'no') {
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
        closeIframeDelayMin * 1000,
        closeIframeDelayMax * 1000
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

      if (storeSkippedUser === 'yes') {
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

      /* Error handling - checks whether the iframe has loaded.
      
      If it has not, reload page.
      
      TODO: 
      
      - ensure it continues from where it stopped ("follow limit")
      - consider adding a boolean to prevent this set timeout from happening
      */
      setTimeout(async () => {
        if (!$iframe) {
          return;
        }

        const $content = $iframe.contentDocument.querySelector(`body > * > *`);

        if ($content) {
          return;
        }

        updateLog(
          `User page did not load. Waiting ${iframeRestartTime} minute(s) before reloading.`
        );

        await _sleep(iframeRestartTime * 60000);

        /* TODO -
        restartFollow should have the remaining number of folowers needed to continue*/
        localStorage.setItem(LOCAL_STORAGE.restartFollow, 'true');

        await _sleep(100);

        window.location.reload();

        console.log('iframe content', $content);
      }, iframeWaitLimit * 1000);

      $iframe.addEventListener('load', async () => {
        const $html = $iframe.contentDocument.querySelector(`html`);
        await _sleep(1000);
        $iframe.contentWindow.location.href = `https://instagram.com`;

        // await _sleep(1000);

        // <a class="customlink" href="https://www.instagram.com/spituki/">click</a>

        //

        // $iframe.contentWindow.location.href = `https://www.instagram.com/dropdopememe`;
        // await startInteractingWithUserInNewTab($html);
        // resolve(true);
      });
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

      if (!$currentUser) {
        return;
      }

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

      if (posts >= 1 && !isPrivate && likePosts === 'yes') {
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
      // await _sleep(1000);
      // const $html = document.querySelector(`html`);
      // likeRandomPosts($html);

      // return;

      checkIfMustRestartFollow();
      startInteractingWithUserInNewTab();

      const _user = window.location.pathname.replaceAll('/', '');

      if (_user) {
        setUsername(_user);
      }
    })();
  }, []);

  return (
    <div className="Follow">
      <h4 className="Follow-label h6">Follow user's followers</h4>
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

      {/* ## Follow limit
      ============================================== */}
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

      {/* 
      ==============================================
      ==============================================
      */}

      <p className="h4 Follow-text-separator">Delays</p>

      {/* 
      ==============================================
      ==============================================
      */}

      {/* ## Clicking on user delay
      ============================================== */}
      <Form.Group className="Follow-option Follow-option--click-delay mb-3">
        <Form.Label>
          <span>Wait between</span>{' '}
          {
            <Form.Control
              type="number"
              min={3}
              max={delayBetweenUsersMax}
              value={delayBetweenUsersMin}
              onChange={(e) => setDelayBetweenUsersMin(e.target.value)}
            />
          }{' '}
          <span>to</span>{' '}
          <b>
            {
              <Form.Control
                type="number"
                min={delayBetweenUsersMin}
                max={9999}
                value={delayBetweenUsersMax}
                onChange={(e) => setDelayBetweenUsersMax(e.target.value)}
              />
            }
          </b>
          <span>
            seconds before clicking on each user at the "following" page.
          </span>
        </Form.Label>
      </Form.Group>

      {/* ## Close user page delay
      ============================================== */}
      <Form.Group className="Follow-option Follow-option--click-delay mb-3">
        <p className="h6">Close page</p>
        <Form.Label>
          Wait between{' '}
          {
            <Form.Control
              type="number"
              min={1}
              max={closeIframeDelayMax}
              value={closeIframeDelayMin}
              onChange={(e) => {
                setCloseIframeDelayMin(e.target.value);
              }}
            />
          }{' '}
          to{' '}
          {
            <Form.Control
              type="number"
              min={closeIframeDelayMin}
              max={50}
              value={closeIframeDelayMax}
              onChange={(e) => {
                setCloseIframeDelayMax(e.target.value);
              }}
            />
          }{' '}
          seconds before closing each user's page.
        </Form.Label>

        <hr className="Follow-hr" />
      </Form.Group>

      {/* ## Close user page delay
      ============================================== */}
      <Form.Group className="Follow-option Follow-option--click-delay mb-3">
        <p className="h6">Restart</p>

        <Form.Label>
          Wait{' '}
          {
            <Form.Control
              type="number"
              min={1}
              value={iframeWaitLimit}
              onChange={(e) => {
                setIframeWaitLimit(e.target.value);
              }}
            />
          }{' '}
          seconds to load an user page. If it fails, wait{' '}
          {
            <Form.Control
              type="number"
              min={1}
              value={iframeRestartTime}
              onChange={(e) => {
                setIframeRestartTime(e.target.value);
              }}
            />
          }{' '}
          minutes, reload the page and restart.
        </Form.Label>

        <hr className="Follow-hr" />
      </Form.Group>

      {/* 
      ==============================================
      ==============================================
      */}

      <p className="h4 Follow-text-separator">Posts</p>

      {/* 
      ==============================================
      ==============================================
      */}

      {/* ## Like posts delay
      ============================================== */}

      <Form.Check
        type="switch"
        id="likePostsInput"
        checked={likePosts === 'yes' ? true : false}
        onChange={(e) => {
          setLikePosts(e.target.checked ? 'yes' : 'no');
        }}
        label={`Randomly like posts`}
      />

      <Form.Group
        style={{ display: likePosts === 'yes' ? 'block' : 'none' }}
        className="Follow-option Follow-option--click-delay mb-3"
      >
        <Form.Check
          className="Follow-"
          type="switch"
          id="storeSkippedUserRule"
          checked={storeSkippedUser === 'yes' ? true : false}
          onChange={(e) => {
            setStoreSkippedUser(e.target.checked ? 'yes' : 'no');
          }}
          label={`Add users that do not match the current settings to the ignore list.`}
        />
        <p className="h6" style={{ marginTop: 20 }}>
          Liking
        </p>
        <Form.Label>
          Choose{' '}
          {
            <Form.Control
              type="number"
              min={1}
              max={50}
              value={likeFirstXPosts}
              onChange={(e) => {
                setLikeFirstXPosts(e.target.value);
              }}
            />
          }{' '}
          of the latest user's posts and randomly like between{' '}
          <b>
            {
              <Form.Control
                type="number"
                min={1}
                max={likePostsMax}
                value={likePostsMin}
                onChange={(e) => {
                  setLikePostsMin(e.target.value);
                }}
              />
            }
          </b>{' '}
          to{' '}
          <b>
            {
              <Form.Control
                type="number"
                min={1}
                max={likeFirstXPosts}
                value={likePostsMax}
                onChange={(e) => {
                  setLikePostsMax(e.target.value);
                }}
              />
            }
          </b>{' '}
          of them.
        </Form.Label>

        <p className="h6">Liking delay</p>

        <div className="Follow--long-input">
          <Form.Label>
            Wait between{' '}
            {
              <Form.Control
                type="number"
                min={1}
                max={likePostsDelayMax}
                value={likePostsDelayMin}
                onChange={(e) => {
                  setLikePostsDelayMin(e.target.value);
                }}
              />
            }{' '}
            to{' '}
            {
              <Form.Control
                type="number"
                min={1}
                max={30}
                value={likePostsDelayMax}
                onChange={(e) => {
                  setLikePostsDelayMax(e.target.value);
                }}
              />
            }{' '}
            seconds before clicking on the post's like button.
          </Form.Label>
        </div>

        <hr className="Follow-hr" />
      </Form.Group>

      <p className="h4 Follow-text-separator">Exclusion rules</p>

      <div>
        <div className="Follow-options Follow-options--following">
          <Form.Group className="Follow-group mb-3">
            <Form.Check
              type="switch"
              id="followingLimitInput"
              checked={followingLimit === 'yes' ? true : false}
              onChange={(e) => {
                setFollowingLimit(e.target.checked ? 'yes' : 'no');
              }}
              label={`"following" limit`}
            />

            <div
              style={{ display: followingLimit === 'yes' ? 'block' : 'none' }}
            >
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
              checked={followersLimit === 'yes' ? true : false}
              onChange={(e) => {
                setFollowersLimit(e.target.checked ? 'yes' : 'no');
              }}
              label={`"followers" limit`}
            />

            <div
              style={{ display: followersLimit === 'yes' ? 'block' : 'none' }}
            >
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
      </div>

      <div>
        <Form.Check
          type="switch"
          id="downloadBackupFile"
          checked={downloadBackupFile === 'yes' ? true : false}
          onChange={(e) => {
            setDownloadBackupFIle(e.target.checked ? 'yes' : 'no');
          }}
          label={`Download backup file after completion`}
        />
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
