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
  goToProfilePage,
  CSS_SELECTORS,
  getUserName,
  getFollowingNumber,
  getFollowersNumber,
  refreshPage,
  LOCAL_STORAGE,
  openFollowersPage,
  isFollowButton,
  scrollDownFollowersList,
  openInNewTab,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { resolveConfig } from 'prettier';

const Follow = () => {
  /* Redirects the user to the user to be scraped. */
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);

  const [interactingWithUser, setInteractingWithUser] = useStickyState(
    '@interactingWithUser',
    ''
  );

  const [tabId, setTabId] = useStickyState(`@tabId`, '');

  const [username, setUsername] = useState('user1');

  /* Settings */
  const limit = 5;
  const DELAY_BETWEEN_USERS = randomIntFromInterval(4000, 5000);
  const DELAY_WHILE_INTERACTING = randomIntFromInterval(800, 1200);

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
      try {
        await _sleep(randomIntFromInterval(40, 70));

        if (i % 6 === 1) {
          await scrollDownFollowersList();
        }

        const $button = document.querySelector(
          `[role="presentation"] > div > div > div > div:nth-child(2) ul div li:nth-child(${i}) button`
        );

        if (!isFollowButton($button)) {
          updateLog(`You're already following this user. Skipping...`);
          ignored++;
          continue;
        }

        const $parent = $button.closest(`li`);
        const $user = $parent.querySelector(`a[title]`);
        const user = $user.getAttribute(`title`);
        const url = `https://instagram.com/${user}`;

        updateLog(`Opening <b>${user}</b> page...`);

        setInteractingWithUser(user);

        window.localStorage.setItem(
          LOCAL_STORAGE.interactingWithUserInNewTab,
          'waiting...'
        );

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

        updateLog(`Interacting with ${user}.`);

        while (
          window.localStorage.getItem(LOCAL_STORAGE.interactingWithUserInNewTab)
        ) {
          await _sleep(DELAY_WHILE_INTERACTING);
        }

        updateLog(`moving on... awaitng delay time.`);

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

  async function start() {
    updateLog(`starting...`);

    if (isRefreshingPage) {
      updateLog(`<b>${username}</b> page found.`);
    }

    await openFollowersPage(username);
    clickOnEachUser();
  }

  async function startInteractingWithUserInNewTab() {
    if (isInteractingWithUserInNewTab()) {
      await _sleep(1000);
      updateLog(`Interacting with <b>${interactingWithUser}</b>.`);
      updateLog(
        `<span style="font-size: 25px;">Please don't change tabs.</span>`
      );

      await _sleep(1000);

      setInteractingWithUser('');

      const following = await getFollowingNumber();
      updateLog(`Following: ${following}`);

      await _sleep(1000);

      /* Todo */

      //likeRandomPictures()
      //watchStories()

      /* conditions to check:
       following number
       followers number
       posts number 
       has profile picture
       is private account
       */
      //clickOnFollowButton()

      chrome.runtime.sendMessage(
        {
          type: 'closeTab',
          message: tabId,
        },
        function (data) {
          if (data.type === 'closeTab') {
            console.log('closed!', data);
            window.localStorage.removeItem(
              LOCAL_STORAGE.interactingWithUserInNewTab
            );
          }
        }
      );

      await _sleep(1000);

      return;
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
          // chrome.runtime.sendMessage('hello', async function (res) {
          //   console.log('res: ', res);
          // });

          // chrome.runtime.onMessage.addListener(function (message) {
          //   console.log('message recevede', message);
          // });

          // chrome.runtime.onMessage.addListener(function (
          //   request,
          //   sender,
          //   sendResponse
          // ) {
          //   console.log(request);
          // });

          start();
        }}
      >
        start
      </Button>
    </div>
  );
};

export default Follow;
