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

const Follow = () => {
  const [isRefreshingPage, setIsRefreshingPage] = useStickyState(
    '@isRefreshingPage',
    false
  );

  const [isOnNewUserPage, setIsOnNewUserPage] = useStickyState(
    '@isOnNewUserPage',
    false
  );

  const [username, setUsername] = useState('user1');
  const limit = 10;

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
          updateLog(`You're already following this user.`);
          continue;
        }

        const $parent = $button.closest(`li`);
        const $user = $parent.querySelector(`a[title]`);
        const user = $user.getAttribute(`title`);
        const url = `https://instagram.com/${user}`;

        updateLog(`Opening <b>${user}</b> page...`);

        setIsOnNewUserPage(true);

        openInNewTab(url);

        while (isOnNewUserPage) {
          await _sleep(2000);
          updateLog(`Interacting with user...`);
        }

        await _sleep(10000);
      } catch (err) {
        updateLog(`Something went wrong.`);
      }
    }
  }

  async function start() {
    chrome.runtime.sendMessage({ closeThis: true });

    if (!isOnNewUserPage) {
      redirectToUsernamePage();
    }

    if (isRefreshingPage) {
      updateLog(`<b>${username}</b> page found.`);
    }

    if (isOnNewUserPage) {
      await _sleep(1000);
      updateLog(`liking pictures and stories...`);
      await _sleep(1000);

      // setIsOnNewUserPage(false);
      return;
    }

    await openFollowersPage(username);
    clickOnEachUser();
  }

  useEffect(() => {
    // start();
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
