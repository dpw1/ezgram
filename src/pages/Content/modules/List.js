import './List.css';

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';

// import getWindow from './modules/getWindow';
import {
  deleteChromeStorageData,
  addChromeStorageData,
  clearLog,
  updateLog,
  _waitForElement,
  CSS_SELECTORS,
  downloadFile,
  LOCAL_STORAGE,
  _sleep,
  randomIntFromInterval,
  openFollowersList,
  getFollowersNumber,
  scrollDownFollowersList,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';

export default function List() {
  const [state, actions] = useDatabase();
  const [localState, localActions] = useLocalStore();

  async function extractUsernamesFromFollowersList(_limit = 100) {
    return new Promise(async (resolve, reject) => {
      let list = [];
      let ignored = 0;

      const ignoredUsers = await actions.loadIgnoredUsers();
      const followers = await getFollowersNumber();

      const limit = followers < _limit ? followers : _limit;

      for (let i = 1; i <= limit + ignored; i++) {
        const index = i + 1;
        /* Scroll down, check if must end */
        const $visibleUsers = document.querySelectorAll(
          CSS_SELECTORS.followersListUsernames
        );

        const visible = $visibleUsers.length;

        if (i % 8 === 1 && visible <= followers) {
          await scrollDownFollowersList();
        }

        /* Get current user */
        const $user = document.querySelector(
          `${CSS_SELECTORS.followersListItem}:nth-child(${index})`
        );

        const $username = $user.querySelector(`a[href] > span`);
        const user = $username.textContent.trim();

        const isIgnored =
          ignoredUsers.filter((e) => e.user === user).length >= 1
            ? true
            : false;

        if (isIgnored) {
          ignored += 1;
          continue;
        }

        /* Save to list */
        list = [...list, user];

        console.log('list: ', list[0], '--- index', i);

        console.log('visible: ', visible);

        if (index >= visible) {
          updateLog(`No more visible users. ${visible} users extracted.`);
          resolve(list);
          break;
        }

        await _sleep(randomIntFromInterval(30, 60));
      }
    });
  }
  async function storeMustFollowUsersListToDatabase(list) {
    return new Promise(async (resolve, reject) => {
      const res = await actions.addMustFollowUsers(list);

      resolve(res);
    });
  }

  async function start() {
    const res = await openFollowersList();

    if (!res) {
      alert('Unable to open followers list.');
    }

    const list = await extractUsernamesFromFollowersList();
    const result = await storeMustFollowUsersListToDatabase(list);

    console.log(result);
  }

  return (
    <div>
      list; {state.mustFollowUsers.length}
      <Button
        onClick={() => {
          start();
        }}
      >
        Start
      </Button>
    </div>
  );
}
