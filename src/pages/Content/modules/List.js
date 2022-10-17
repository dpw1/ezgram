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
  toastMessage,
  refreshState,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';
import { InputGroup } from 'react-bootstrap';

export default function List() {
  const [state, actions] = useDatabase();
  const [localState, localActions] = useLocalStore();
  const [usersList, setUsersList] = useState('');

  const [limit, setLimit] = useStickyState('@listLimit', 50);
  const [followingListLoop, setFollowingListLoop] = useStickyState(
    '@followingListLoop',
    0
  ); //checks what user the bot is currently following

  useEffect(() => {
    (async () => {
      syncFollowingListTextareWithDatabase();
    })();
  }, [state.mustFollowUsers]);

  async function extractUsernamesFromFollowersList(_limit = 100) {
    return new Promise(async (resolve, reject) => {
      let list = [];
      let ignored = 0;
      const EXTRACT_EVERY_X_USERS = 7;

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

        if (i % EXTRACT_EVERY_X_USERS === 1 && visible <= followers) {
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

        if (ignoredUsers && ignoredUsers.length > 0) {
          const isIgnored =
            ignoredUsers && ignoredUsers.length >= 1
              ? ignoredUsers.filter((e) => e.user === user).length >= 1
                ? true
                : false
              : false;

          const isInList =
            mustFollowUsers && mustFollowUsers.length >= 1
              ? mustFollowUsers.filter((e) => e === user).length >= 1
                ? true
                : false
              : false;

          if (isIgnored || isInList) {
            ignored += 1;
            continue;
          }
        }

        /* Save to list */
        list = [...list, user];

        updateLog(`Extracted ${list.length} users.`);

        // console.log('visible: ', visible);

        if (index >= visible || i >= limit + ignored) {
          updateLog(
            `Complete. ${list.length} users were extracted, ${ignored} users skipped.`
          );

          toastMessage(
            <p>
              {list.length} users were extracted, {ignored} users were skiped.
            </p>
          );
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

  /**
   * Adds users on the "To-follow" list to the database
   */
  async function storeUsersThatMustBeFollowed() {
    return new Promise(async (resolve, reject) => {
      const users = [...new Set(usersList.split('\n'))];

      const res = await actions.overwriteMustFollowUsers(users);

      await actions.getMustFollowUsers();

      resolve(res);
    });
  }

  async function start() {
    if (!(await isUserPage())) {
      updateLog(`ERROR: Please go to a user page.`);

      toastMessage(
        <p>
          Please go to a user page. There is nothing that can be extracted in
          this page.
        </p>,
        5000,
        'error'
      );

      return;
    }

    await openFollowersList();

    const list = await extractUsernamesFromFollowersList(limit);

    await storeMustFollowUsersListToDatabase(list);
    await actions.getMustFollowUsers();

    toastMessage(
      <p>
        Refreshing the page in <b>3</b> seconds.
      </p>,
      3000,
      'light'
    );

    await _sleep(3000);

    window.location.reload();
  }

  function syncFollowingListTextareWithDatabase() {
    const _users = state.mustFollowUsers;

    if (_users.length <= 0) {
      return;
    }

    const users = _users.hasOwnProperty('mustFollowUsers')
      ? state.mustFollowUsers.mustFollowUsers
      : state.mustFollowUsers;

    setUsersList(users.join('\n'));
  }

  return (
    <div className="List">
      <h3 className="List-title">List</h3>
      <h4 className="h6">List of users to follow and/or like posts.</h4>
      <hr />
      <p>You have {state.mustFollowUsers.length} users in your list.</p>
      <InputGroup className="mb-3">
        <Form.Label style={{ display: 'block' }}></Form.Label>

        <Form.Control
          value={usersList}
          id="mustFollowUsersList"
          as="textarea"
          onKeyDown={(e) => {
            if (e.key === ' ') {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            setUsersList(e.target.value);
          }}
          rows={3}
        />

        <Button
          onClick={async () => {
            await storeUsersThatMustBeFollowed();
          }}
        >
          Update
        </Button>
      </InputGroup>
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
