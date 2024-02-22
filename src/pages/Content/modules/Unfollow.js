import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import { useStatePersist as useStickyState } from 'use-state-persist';

import { ToastContainer, toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import './Unfollow.css';

// import getWindow from './modules/getWindow';
import {
  _sleep,
  updateLog,
  _waitForElement,
  randomIntFromInterval,
  goToProfilePage,
  CSS_SELECTORS,
  getFollowersNumber,
  LOCAL_STORAGE,
  openFollowingPage,
  openFollowersList,
  scrollDownFollowersList,
  scrollDownFollowingList,
  stopExecuting,
  createBackupFile,
  getUnfollowConfirmationButton,
  toastMessage,
  isCurrentPageMyUserPage,
  isUserAboutToBeUnfollowedWhitelisted,
  updateLogError,
  addWhiteListButtonToFollowingListUsers,
  injectUpdateButton,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';

const Unfollow = () => {
  const [localState, localActions] = useLocalStore();
  const [state, actions] = useDatabase();
  const [whiteListUsers, setWhiteListUsers] = useState('');

  const [unfollowLimit, setUnfollowLimit] = useStickyState(
    '@unfollowLimit',
    50
  );

  const [delayBetweenUnfollowMin, setDelayBetweenUnfollowMin] = useStickyState(
    '@delayBetweenUnfollowMin',
    46
  );

  const [delayBetweenUnfollowMax, setDelayBetweenUnfollowMax] = useStickyState(
    '@delayBetweenUnfollowMax',
    68
  );

  const [unfollowNonFollowers, setUnfollowNonFollowers] = useStickyState(
    '@unfollowNonFollowers',
    'yes'
  );

  const [downloadBackupFile, setDownloadBackupFIle] = useStickyState(
    '@downloadBackupFileUnfollow',
    'yes'
  );

  useEffect(() => {
    (async () => {
      const users = await actions.getWhiteListUsers();

      setWhiteListUsers(users);
    })();
  }, []);

  /* Clicks on the "unfollow" button and then on the "confirm unfollow" button. */
  async function handleClickOnUnfollowButton() {
    await _waitForElement(CSS_SELECTORS.followingListUnfollowButton);

    const $buttons = document.querySelectorAll(
      CSS_SELECTORS.followingListUnfollowButton
    );

    if (!$buttons) {
      return;
    }

    updateLog(`Unfollow button found.`);

    const followers =
      JSON.parse(localStorage.getItem(LOCAL_STORAGE.followersList)) || [];

    let count = 0;
    let ignored = 0;

    for (let i = 1; i <= unfollowLimit + ignored; i++) {
      await _sleep(randomIntFromInterval(40, 70));

      if (i % 4 === 1) {
        await scrollDownFollowingList();
        removeWhiteListedUsersFromList();
      }

      const delay = randomIntFromInterval(
        delayBetweenUnfollowMin * 1000,
        delayBetweenUnfollowMax * 1000
      );

      debugger;

      const selector =
        CSS_SELECTORS.followingListUnfollowButtonNthChild.replaceAll('xx', i);

      const $button = await _waitForElement(selector);

      debugger;

      const $parent = $button.closest(`li, [aria-labelledby], div[role]`);
      const $user = $parent.querySelector(`a[href]`);
      const user = $user.getAttribute(`href`).replaceAll(`/`, '').trim(); //@username_123

      let isWhiteListed = [];

      try {
        isWhiteListed = whiteListUsers.filter((e) => e === user);
      } catch (err) {
        isWhiteListed = [];
      }

      if (isWhiteListed.length > 0) {
        updateLog(`<b>${user}</b> is white listed. Skipping...`);
        ignored += 1;
        await _sleep(randomIntFromInterval(95, 300));
        continue;
      }

      let found = [];
      try {
        found = followers.filter((e) => e === user);
      } catch (err) {
        found = [];
      }

      if (found.length > 0 && unfollowNonFollowers === 'yes') {
        updateLog(`<b>${user}</b> is following you back. Skipping...`);
        ignored += 1;
        await _sleep(randomIntFromInterval(95, 300));
        continue;
      }

      updateLog(
        `<br />Unfollowing <a target="_blank" href="/${user}">${user}</a>`
      );

      /* Todo *
      Make sure unfollowed successfully */

      await _sleep(100);

      $button.click();

      const $unfollow = await getUnfollowConfirmationButton();

      const unfollowDelay = randomIntFromInterval(1003, 3808);
      await _sleep(unfollowDelay);

      $unfollow.click();

      /* 
      
      TODO
      
      Make sure selector "followingListActionBlocked" does not appear here.
      */
      count += 1;

      await _sleep(20);

      const date = new Date().getTime();

      actions.addIgnoredUser({ user, date });

      if (count >= unfollowLimit) {
        updateLog(`Unfollowing completed.`);

        updateLog(`<b>${count}</b> users were successfully unfollowed.`);

        if (ignored > 0) {
          updateLog(`<b>${ignored}</b> users were skipped.`);
        }

        updateLog(
          `<br /><b>Please press F5 to refresh the page before using this app again.</b>`
        );

        if (downloadBackupFile === 'yes') {
          await createBackupFile();
        }

        localActions.setIsExecuting(false);
        return;
      }

      updateLog(
        `<span style="color:green;">Unfollowed <b>${user}</b> successfully. <b>${count} / ${unfollowLimit}</b></span>`
      );

      updateLog(
        `Waiting ${
          delay / 1000
        } seconds before moving to the next user...<br />`
      );

      toastMessage(
        () => (
          <>
            <p>
              Unfollowed <b>{user}</b> successfully.
            </p>
            <p> Waiting {delay / 1000} seconds.</p>
          </>
        ),
        delay,
        'success'
      );

      await _sleep(delay);
    }
  }

  /* Gets the name of everyone who is following you and saves to the local storage. */
  async function getFollowersList() {
    return new Promise(async (resolve, reject) => {
      const $username = _waitForElement(CSS_SELECTORS.followersListUsernames);

      if (!$username) {
        return;
      }

      const $usernames = document.querySelectorAll(
        CSS_SELECTORS.followersListUsernames
      );

      let usernames = [];

      for (var each of $usernames) {
        usernames.push(each.textContent.trim());
      }

      if (usernames.length > 0) {
        updateLog(`\nFollowers list stored successfully.`);
      }

      localStorage.setItem('ezgram_followers_list', JSON.stringify(usernames));

      resolve(true);
    });
  }

  function removeWhiteListedUsersFromList() {
    const $whitelisted = document.querySelectorAll(
      `[data-is-whitelisted='true']`
    );

    if (!$whitelisted) {
      return;
    }

    for (var each of $whitelisted) {
      each.remove();
    }
  }

  async function start() {
    await goToProfilePage(state.username);

    /* Unfollow only who does not follow you back */
    if (unfollowNonFollowers === 'yes') {
      await openFollowersList(state.username);
      await scrollDownFollowersList('all');
      await getFollowersList();
    }

    /* Unfollow everyone */
    await openFollowingPage(state.username);
    await addWhiteListButtonToFollowingListUsers(actions);
    injectUpdateButton();
    await scrollDownFollowingList();
    removeWhiteListedUsersFromList();
    handleClickOnUnfollowButton();
  }

  return (
    <div className="Unfollow">
      <h3 className="Unfollow-title">Unfollow</h3>
      <h4 className="h6">
        Automatically unfollow people who you're currently following.
      </h4>
      <hr />
      <div className="Unfollow-options">
        <div>
          <Form.Group className="Unfollow-option mb-3">
            <Form.Label>Unfollow limit:</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={1000}
              value={unfollowLimit}
              onChange={(e) => {
                setUnfollowLimit(e.target.value);
              }}
              placeholder="Stop unfollowing after reaching this number."
            />
          </Form.Group>

          <Form.Group className="Unfollow-option Unfollow-option--click-delay mb-3">
            <div className="Unfollow-inputfields">
              <Form.Label>
                <span>Wait between</span>{' '}
                {
                  <Form.Control
                    type="number"
                    min={3}
                    max={delayBetweenUnfollowMax}
                    value={delayBetweenUnfollowMin}
                    onChange={(e) => setDelayBetweenUnfollowMin(e.target.value)}
                  />
                }{' '}
                <span>to</span>{' '}
                <b>
                  {
                    <Form.Control
                      type="number"
                      min={delayBetweenUnfollowMin}
                      max={9999}
                      value={delayBetweenUnfollowMax}
                      onChange={(e) =>
                        setDelayBetweenUnfollowMax(e.target.value)
                      }
                    />
                  }
                </b>
                <span>seconds before unfollowing each user.</span>
              </Form.Label>
            </div>
            <Form.Text className="text-muted">
              45 and 63 are recommended numbers to avoid being action blocked.
            </Form.Text>
          </Form.Group>

          <Form.Check
            type="switch"
            id="custom-switch"
            defaultChecked={unfollowNonFollowers === 'yes' ? true : false}
            onChange={(e) => {
              setUnfollowNonFollowers(e.target.checked ? 'yes' : 'no');
            }}
            label="Unfollow only who is not following me back. (this process can take a long time if you have too many followers)"
          />
          <Form.Check
            type="switch"
            id="downloadBackupFile"
            checked={downloadBackupFile === 'yes' ? true : false}
            onChange={(e) => {
              setDownloadBackupFIle(e.target.checked ? 'yes' : 'no');
            }}
            label={`Download backup file after completion`}
          />

          <hr />
          <Button
            onClick={() => {
              if (!isCurrentPageMyUserPage(state.username)) {
                toastMessage(
                  <p>
                    Please go to your profile page before unfollowing.{' '}
                    <a
                      href={`https://instagram.com/${state.username}/following`}
                    >
                      Click here for a shortcut.
                    </a>
                  </p>,
                  5000,
                  'error'
                );

                return;
              }

              if (localState.isExecuting) {
                stopExecuting();
              } else {
                localActions.setIsExecuting(true);
                start();
              }
            }}
            variant="primary"
          >
            {localState.isExecuting ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unfollow;
