import './List.css';

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useStatePersist as useStickyState } from 'use-state-persist';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.css'; // or include from a CDN
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

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
  isUserPage,
  updateLogError,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';

export default function List() {
  const [state, actions] = useDatabase();
  const [localState, localActions] = useLocalStore();

  const [limit, setLimit] = useStickyState('@listLimit', 50);
  const [followingListLoop, setFollowingListLoop] = useStickyState(
    '@followingListLoop',
    0
  ); //checks what user the bot is currently following

  async function extractUsernamesFromFollowersList(_limit = 100) {
    return new Promise(async (resolve, reject) => {
      let list = [];
      let ignored = 0;

      const ignoredUsers = await actions.loadIgnoredUsers();
      const mustFollowUsers = await actions.getMustFollowUsers();
      const followers = await getFollowersNumber();

      const limit = followers < _limit ? parseInt(followers) : parseInt(_limit);

      updateLog(`Preparing to extract ${limit} users...`);

      const $list = await _waitForElement(
        CSS_SELECTORS.followersListUsernames,
        250,
        20
      );

      if (!$list) {
        updateLogError(`No list was found.`);
        resolve(false);
        return;
      }

      for (let i = 1; i <= limit + ignored; i++) {
        const index = i + 1;
        /* Scroll down, check if must end */

        const $visibleUsers = document.querySelectorAll(
          CSS_SELECTORS.followersListUsernames
        );

        const visible = $visibleUsers.length;

        if (i % 5 === 1 && visible <= followers) {
          await scrollDownFollowersList();
        }

        /* Get current user */
        const $user = await _waitForElement(
          `${CSS_SELECTORS.followersListItem}:nth-child(${index})`,
          100,
          10
        );

        if (!$user) {
          alert(`no user found. ${index} -- `);
          break;
        }

        const $username = $user.querySelector(`a[href] > span`);
        const user = $username.textContent.trim();

        const isIgnored =
          ignoredUsers.filter((e) => e.user === user).length >= 1
            ? true
            : false;

        const isInList =
          mustFollowUsers.filter((e) => e === user).length >= 1 ? true : false;

        if (isIgnored || isInList) {
          ignored += 1;
          continue;
        }

        /* Save to list */
        list = [...list, user];

        console.log('list: ', i, limit, ignored);

        // console.log('visible: ', visible);

        if (index >= visible || i >= limit + ignored) {
          updateLog(
            `Complete. ${list.length} users were extracted, ${ignored} users skipped.`
          );

          updateLog(`Please refresh the page.`);
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
    if (!(await isUserPage())) {
      updateLog(`ERROR: Please go to a user page.`);
      return;
    }

    const res = await openFollowersList();

    if (!res) {
      alert('Unable to open followers list.');
    }

    const list = await extractUsernamesFromFollowersList(limit);
    const result = await storeMustFollowUsersListToDatabase(list);

    console.log('stored users: ', result);
  }

  return (
    <div className="List">
      <p>
        There are currently {state.mustFollowUsers.length} users in your list.
        You have already followed {followingListLoop + 1} of them.
      </p>
      <Form.Group className="List-option mb-3">
        <Form.Label>Extract limit:</Form.Label>
        <Form.Control
          type="number"
          min={1}
          max={1000}
          value={limit}
          onChange={(e) => {
            setLimit(e.target.value);
          }}
          placeholder="Stop extracting after reaching this number."
        />
      </Form.Group>

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
