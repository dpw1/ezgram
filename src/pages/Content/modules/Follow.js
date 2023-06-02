import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import RangeSlider from 'react-bootstrap-range-slider';
import { useStatePersist as useStickyState } from 'use-state-persist';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './Follow.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.css'; // or include from a CDN
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

import InputGroup from 'react-bootstrap/InputGroup';

// import getWindow from './modules/getWindow';
import {
  getFollowButton,
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
  isFollowButton,
  scrollDownFollowersList,
  openInNewTab,
  doesUserHaveProfileImage,
  scrollDownUserPage,
  isPrivateAccount,
  goToProfilePage,
  getTypeOfFollowButtonOnUserPage,
  getPostsNumber,
  stopExecuting,
  getFollowersNumberIframe,
  removeIframe,
  randomUniqueIntegers,
  createBackupFile,
  removeChromeStorageData,
  getInstagramURL,
  isUserPage,
  toastMessage,
  isCurrentPageMyUserPage,
  updateLogError,
  getUserName,
  isHomePage,
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

  /* Settings 
  ===================================== */
  const [limit, setLimit] = useStickyState('@followLimit', 10);
  const [stopFollowingLimit, setStopFollowingLimit] = useStickyState(
    '@stopFollowingLimit',
    0
  ); //stop automatic following once you reach a specific number of users.

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

  const [followUser, setFollowUser] = useStickyState('@followUser', 'yes'); //follow user before ending interaction?

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

  const [usersList, setUsersList] = useState('');

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
    '@downloadBackupFileFollow',
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
    'no'
  );

  /* Following user automation
  ==================================== */
  const [isFollowingList, setIsFollowingList] = useStickyState(
    '@isFollowingList',
    'no'
  ); //checks whether the bot is currently following a list of users

  const SKIP_PRIVATE_ACCOUNT = false;

  // const [followingListLoop, setFollowingListLoop] = useStickyState(
  //   '@followingListLoop',
  //   0
  // );

  /**
   * TODO
   * - do not allow to put a limit greater than the list
   *
   */

  //checks what user the bot is currently following

  /* === */
  const INTERACTION_DELAY_MIN = 800;
  const INTERACTION_DELAY_MAX = 1200;

  const SKIP_USER_WITHOUT_PROFILE_IMAGE = true;
  const SKIP_ACCOUNTS_WITH_NO_POSTS = false;

  const CLICK_ON_FOLLOW_DELAY_MIN = 3000;
  const CLICK_ON_FOLLOW_DELAY_MAX = 4500;

  function redirectToUsernamePage() {
    if (isRefreshingPage) {
      setIsRefreshingPage(false);
    }

    const page = window.location.pathname.replaceAll(`/`, '');

    // if (page !== username) {
    //   setIsRefreshingPage(true);
    //   updateLog(`Redirecting to <b>${username}</b> page, please wait...`);
    //   window.location.href = `https://www.instagram.com/${username}`;
    //   return;
    // }
  }

  async function likeRandomPosts() {
    return new Promise(async (resolve, reject) => {
      const LIKING_POSTS_LIMIT = randomIntFromInterval(
        likePostsMin,
        likePostsMax
      );

      const type = await getTypeOfFollowButtonOnUserPage();

      if (type === 'private') {
        updateLog(`This is a private account.`);
        reject(null);
        return;
      }

      const _$post = await _waitForElement(CSS_SELECTORS.userPagePosts, 50, 20);

      if (!_$post) {
        updateLog(`There are no posts.`);
        resolve(true);
        return;
      }

      const posts = await getPostsNumber();

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
          await scrollDownUserPage();
        }

        LIKING_POSTS_DELAY = randomIntFromInterval(
          likePostsDelayMin * 1000,
          likePostsDelayMax * 1000
        );

        if (index >= 3 && i % 4 === 1) {
          await scrollDownUserPage();
        }

        let $post = null;
        try {
          $post = await _waitForElement(
            `main div >article > div > div > div:nth-child(${postY}) > div:nth-child(${postX}) a[href*='/p']`,
            250,
            10
          );

          await _sleep(randomIntFromInterval(900, 3000));

          $post.click();
        } catch (err) {
          updateLogError(`No clickable post found.`);
          throw new Error(`No clickable post found.`);
        }

        updateLog(
          `<b>Post ${each} opened.</b> Waiting <b>${
            LIKING_POSTS_DELAY / 1000
          }</b> seconds.`
        );

        toastMessage(<p>Post {each} opened.</p>, LIKING_POSTS_DELAY, 'light');

        await _sleep(LIKING_POSTS_DELAY);

        const $close = document.querySelector(
          CSS_SELECTORS.postPageCloseButton
        );

        const $like = await _waitForElement(
          CSS_SELECTORS.postPageLikeButton,
          100,
          5
        );
        const $unlike = await _waitForElement(
          CSS_SELECTORS.postPageUnlikeButton,
          100,
          5
        );

        if (!$unlike) {
          updateLog(`<br/>Post liked.`);
          liked += 1;
          $like.click();
        } else {
          ignored += 1;
          updateLog(`This post has already been liked.`);

          toastMessage(<p>This post has already been liked.</p>, 3000, 'info');

          $close.click();
          await _sleep(randomIntFromInterval(400, 1500));
          updateLog(`Moving to next post.<br/>`);

          if (i > posts) {
            updateLog(`No more posts to like.`);

            toastMessage(<p>No more posts to like.</p>, 3000, 'info');
            break;
          }
          continue;
        }

        LIKING_POSTS_DELAY = randomIntFromInterval(
          likePostsDelayMin * 1000,
          likePostsDelayMax * 1000
        );

        updateLog(`Waiting <b>${LIKING_POSTS_DELAY / 1000}</b> seconds.<br/>`);

        toastMessage(
          <p>
            Waiting <b>{LIKING_POSTS_DELAY / 1000}</b> seconds.
            <br />
          </p>,
          LIKING_POSTS_DELAY,
          'light'
        );

        await _sleep(randomIntFromInterval(900, 3000));

        $close.click();

        updateLog(`Moving to the next post... <br />`);
        updateLog(`Posts liked: <b>${liked} / ${LIKING_POSTS_LIMIT}</b><br />`);

        toastMessage(
          <p>
            Posts liked:{' '}
            <b>
              {liked} / {LIKING_POSTS_LIMIT}
            </b>
          </p>,
          LIKING_POSTS_DELAY,
          'light'
        );

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

  async function removeInteractedUserFromList() {
    return new Promise(async (resolve, reject) => {
      const $currentUser = document.querySelector(
        CSS_SELECTORS.userPageUsername
      );
      const user = $currentUser ? $currentUser.textContent.trim() : null;

      resolve(false);
    });
  }

  /* 
 Completes an interaction on a new user's tab. You can complete the interaction with a result of "fail" or "success".

 'fail' = something went wrong, unable to "follow" user.

 'success' = user followed successfully.

 'final' = final interaction, no more loop.

 'stop' = limit set by user reached. Stop following.
  */
  async function finishInteraction(result = 'fail', waitingTIme = 1000) {
    return new Promise(async (resolve, reject) => {
      const mustFollowUsers = await actions.getMustFollowUsers();

      const $currentUser = document.querySelector(
        CSS_SELECTORS.userPageUsername
      );
      const user = $currentUser
        ? $currentUser.textContent.trim()
        : mustFollowUsers[0];

      /* ================ */

      if (result === 'stop') {
        setIsFollowingList('no');
        updateLog(
          `<br/>Reached follow limit set by user, stopping automated following.`
        );
        resolve();
        return;
      }

      if (user) {
        await actions.removeOneMustFollowUsers(user);
        updateLog(`\n<b>${user}</b> removed from the list.`);

        resolve(true);
      }

      if (mustFollowUsers.length <= 0) {
        updateLog(`Interacted with all users in the list!`);
        result = 'final';
      } else if (result === 'final') {
        await actions.overwriteMustFollowUsers([]);
        setIsFollowingList('no');
        updateLog(`List successfully deleted. Please refresh the page.`);
        resolve();
        return;
      }

      const delay = randomIntFromInterval(
        closeIframeDelayMin * 1000,
        closeIframeDelayMax * 1000
      );

      if (
        (storeSkippedUser === 'yes' && result === 'fail' && user) ||
        result === 'success'
      ) {
        await _sleep(waitingTIme);
        await actions.addIgnoredUser({ user });
      }

      toastMessage(
        <p>
          Closing user page in <b>{delay / 1000}</b> seconds.
        </p>,
        delay
      );

      await _sleep(delay);

      if (mustFollowUsers.length >= 1) {
        await goToURLThatMustBeFollowed();
      } else {
        updateLog(`Interaction completed.`);
      }

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

  /* Return URL of the current user that must be followed */
  async function goToURLThatMustBeFollowed() {
    return new Promise(async (resolve, reject) => {
      const users = await actions.getMustFollowUsers();

      if (!users) {
        updateLogError(`No users found.`);
        return;
      }

      if (users.length <= 0) {
        updateLog(`Interacted with all users!`);
        setIsFollowingList('no');
        resolve();
        return;
      }

      debugger;

      const url = getInstagramURL(users[0]);

      /* No more users to interact with */
      if (!url || url === undefined || url === 'undefined') {
        setIsFollowingList('no');
        alert('error - user undefined');
        resolve();
        return;
      }

      window.location.href = url;
    });
  }

  async function start() {
    setIsFollowingList('yes');

    await _sleep(25);

    await goToURLThatMustBeFollowed();

    /* 
    ATTENTION!

    The function responsible to follow users is:
    startInteractingWithUserInNewTab()
    */
  }

  async function clickOnFollowButton(user) {
    return new Promise(async (resolve, reject) => {
      const $button = await getFollowButton();

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
        actions.addIgnoredUser({ user });
        updateLog(
          `<span style="color:green;"><b>You are now following ${user}</b>.</span>`
        );

        resolve(true);
        return;
      }
      // updateLog(`Failed to follow this user.`);
      resolve(null);
    });
  }

  async function startInteractingWithUserInNewTab() {
    return new Promise(async (resolve, reject) => {
      const mustFollowUsers = await actions.getMustFollowUsers();

      if (isHomePage()) {
        setIsFollowingList('no');
        return;
      }

      updateLog(
        `${
          isFollowingList === 'yes'
            ? `Automatic following is on.`
            : `Automatic following is off.`
        }`
      );

      updateLog(
        `stopFollowingLimit: ${stopFollowingLimit} || mustFollowUsers.length: ${mustFollowUsers.length}`
      );

      if (stopFollowingLimit > mustFollowUsers.length) {
        updateLog(`Limit reached! Stopping at user ${stopFollowingLimit}`);
        toastMessage(
          <p>Limit reached! Stopping automatic following.</p>,
          5000,
          'success'
        );
        setIsFollowingList('no');

        /* Reset limit */
        const currentLimit = limit;
        setLimit(0);
        setLimit(currentLimit);
        await _sleep(100);
        await finishInteraction('stop');
        resolve(true);
        return;
      }

      if (!mustFollowUsers || mustFollowUsers.length <= 0) {
        updateLog(`The users list is empty.`);
        setIsFollowingList('no');
        await _sleep(100);
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      /* Checks whether is currently set to follow */

      const $currentUser = await _waitForElement(
        CSS_SELECTORS.userPageUsername,
        100,
        20
      );

      if (isFollowingList === 'yes') {
        toastMessage(
          <p>
            Automatic following is <b>on</b>.{' '}
            <b>Please don't change tabs or interact with the page.</b>
          </p>,
          3000,
          'info'
        );
      }

      /* Checks whether is on a user page */
      if (!$currentUser) {
        /* Checks whether user doesn't exist. 
        If inexistent, go to next user */
        const $inexistent = document.querySelector(
          CSS_SELECTORS.userPageDoesNotExist404
        );

        if ($inexistent) {
          updateLogError(`This user does not exist.`);
          await finishInteraction('fail');
          resolve();
          return;
        } else {
          setIsFollowingList('no');
          resolve();
          return;
        }
      }

      const currentUser = $currentUser.textContent.trim();

      if (isFollowingList !== 'yes') {
        resolve();
        return;
      }

      updateLog(
        `<b>Automatic following enabled.<br/>${mustFollowUsers.length}</b><br/>`
      );

      /* Start following */
      const delay = randomIntFromInterval(
        delayBetweenUsersMin * 1000,
        delayBetweenUsersMax * 1000
      );

      const ignored = await actions.getIgnoredUser(currentUser);

      if (ignored) {
        updateLog(
          `You have unfollowed <b>${currentUser}</b> in the past. Skipping...`
        );

        await _sleep(randomIntFromInterval(100, 200));
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      updateLog(
        `<span style="font-size: 25px;">Please don't change tabs. Don't interact with the page.</span><br /><br />`
      );

      updateLog(`Interacting with <b>${currentUser}</b>.`);

      const followType = await getTypeOfFollowButtonOnUserPage();

      if (!followType) {
        updateLog('ERROR: Unable to identify type of follow button.');

        await _sleep(randomIntFromInterval(100, 200));
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      if (followType === 'unfollow') {
        updateLog(`You are already following this user.`);

        await _sleep(randomIntFromInterval(100, 200));
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      const isPrivate = await isPrivateAccount();

      if (skipPrivateAccounts === 'yes') {
        if (isPrivate) {
          updateLog(`This is a private account. Skipping...`);

          await _sleep(randomIntFromInterval(100, 200));
          await finishInteraction('fail');
          resolve(true);
          return;
        }
      }

      const posts = await getPostsNumber();
      const following = await getFollowingNumber();
      const followers = await getFollowersNumberIframe();

      updateLog(
        `Posts: ${posts} | Followers: ${followers} | Following: ${following}`
      );

      if (posts <= 0 && SKIP_ACCOUNTS_WITH_NO_POSTS) {
        updateLog(`<b>${currentUser}</b> has no posts. Skipping...`);

        await _sleep(randomIntFromInterval(100, 200));
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      updateLog(`Checking if following is enough...`);

      if (!(await isFollowingEnough(following))) {
        updateLog(
          `<b>${currentUser}</b> is following <b>${following}</b> user(s), this is off your limits.`
        );

        await _sleep(randomIntFromInterval(100, 200));
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      if (!(await isFollowersEnough(followers))) {
        updateLog(
          `<b>${currentUser}</b> has <b>${followers}</b> follower(s), this is off your limits.`
        );

        await _sleep(randomIntFromInterval(100, 200));
        await finishInteraction('fail');
        resolve(true);
        return;
      }

      updateLog(`<br /><br />`);

      if (posts >= 1 && !isPrivate && likePosts === 'yes') {
        try {
          await likeRandomPosts();
        } catch (err) {
          updateLog(`No posts found.`);

          await _sleep(randomIntFromInterval(100, 200));
          await finishInteraction('fail');
          resolve(true);
          return;
        }
      }

      if (followUser === 'yes') {
        updateLog(`Clicking on the "follow" button...`);
        try {
          await clickOnFollowButton(currentUser);
        } catch (err) {
          updateLog(
            `ERROR: Something went wrong while clicking on the follow button.`
          );
          await finishInteraction('fail');
          resolve(true);
          return;
        }
      }

      updateLog(`Interaction completed.`);

      toastMessage(<p>Interaction completed!</p>, 3000, 'success');

      /* Followed all users from the list. Reset following */
      if (mustFollowUsers.length <= 0) {
        finishInteraction('final');
        resolve(true);
        return;
      }

      updateLog(`<b>Waiting ${delay / 1000} seconds</b> before moving on.`);

      toastMessage(
        <p>
          Waiting <b>{delay / 1000}</b> seconds before moving on.
        </p>,
        delay
      );

      await finishInteraction('success', delay);

      resolve(true);
    });
  }

  function shouldDisableStartButton() {
    const value = state.mustFollowUsers.hasOwnProperty('mustFollowUsers')
      ? state.mustFollowUsers.mustFollowUsers.length
      : state.mustFollowUsers.length;

    if (value === 0) {
      return true;
    }

    return false;
  }

  useEffect(() => {
    (async () => {
      console.log('loop:', state.followingListLoop);
    })();
  }, [state.followingListLoop]);

  useEffect(() => {
    (async () => {
      checkIfMustRestartFollow();
      startInteractingWithUserInNewTab();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const value = state.mustFollowUsers.hasOwnProperty('mustFollowUsers')
        ? state.mustFollowUsers.mustFollowUsers.length
        : state.mustFollowUsers.length;

      if (value <= 0) {
        return;
      }

      setStopFollowingLimit(value - limit);
    })();
  }, [limit]);

  function getStopFollowingNumber() {
    const value = state.mustFollowUsers.hasOwnProperty('mustFollowUsers')
      ? state.mustFollowUsers.mustFollowUsers.length
      : state.mustFollowUsers.length;

    if (value <= 0) {
      return 0;
    } else if (stopFollowingLimit !== 0) {
      return stopFollowingLimit;
    }

    return value;
  }

  return (
    <div className="Follow">
      <h3 className="Follow-title">Follow</h3>
      <h4 className="h6">
        Automatically follow and/or like posts from a list of users.
      </h4>

      <hr />
      <p>
        You have{' '}
        {state.mustFollowUsers.hasOwnProperty('mustFollowUsers')
          ? state.mustFollowUsers.mustFollowUsers.length
          : state.mustFollowUsers.length}{' '}
        users on your list.
      </p>

      {/* ## Follow limit
      ============================================== */}
      <Form.Group className="Follow-option mb-3">
        <Form.Label>
          Limit (stop following once you reach the user number{' '}
          <span>{getStopFollowingNumber()} </span>). You have{' '}
          {state.mustFollowUsers.hasOwnProperty('mustFollowUsers')
            ? state.mustFollowUsers.mustFollowUsers.length
            : state.mustFollowUsers.length}{' '}
          user(s) in your list.
        </Form.Label>
        <Form.Control
          type="number"
          min={1}
          max={
            state.mustFollowUsers.hasOwnProperty('mustFollowUsers')
              ? state.mustFollowUsers.mustFollowUsers.length
              : state.mustFollowUsers.length
          }
          value={limit}
          onChange={(e) => {
            setLimit(e.target.value);
          }}
          placeholder="Stop following after reaching this number."
        />
      </Form.Group>

      {/* ## Clicking on user delay
      ============================================== */}
      <Form.Group className="Follow-option Follow-option--click-delay mb-3">
        <p className="h6">Next user pause</p>
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
          <span>seconds before moving to the next user in the list.</span>
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
        id="followUser"
        checked={followUser === 'yes' ? true : false}
        onChange={(e) => {
          setFollowUser(e.target.checked ? 'yes' : 'no');
        }}
        label={`Follow user`}
      />
      <Form.Check
        type="switch"
        id="likePostsInput"
        checked={likePosts === 'yes' ? true : false}
        onChange={(e) => {
          setLikePosts(e.target.checked ? 'yes' : 'no');
        }}
        label={`Like random posts`}
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
          label={`Add users that do not match the current settings to the ignore list`}
        />
        <Form.Check
          className="Follow-"
          type="switch"
          id="skipPrivateUsers"
          checked={skipPrivateAccounts === 'yes' ? true : false}
          onChange={(e) => {
            setSkipPrivateAccounts(e.target.checked ? 'yes' : 'no');
          }}
          label={`Skip private accounts`}
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
                min={likePostsMin}
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
        disabled={shouldDisableStartButton()}
        onClick={() => {
          if (isFollowingList === 'yes') {
            stopExecuting();
          } else {
            start();
          }
        }}
      >
        {isFollowingList === 'yes' ? 'Stop' : 'Start'}
      </Button>
    </div>
  );
};

export default Follow;
