import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useStatePersist as useStickyState } from 'use-state-persist';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.css'; // or include from a CDN
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import './List.css';

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
  isFollowingPage,
  isFollowersPage,
  copyToClipboard,
  scrollDownFollowingList,
  getUsernameGender,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';
import { InputGroup } from 'react-bootstrap';

export default function List() {
  const [state, actions] = useDatabase();
  const [localState, localActions] = useLocalStore();
  const [usersList, setUsersList] = useState('');
  const [extractionList, setExtractionList] = useState('');

  const [ignoreMales, setIgnoreMales] = useStickyState('@ignoreMales', 'yes');
  const [ignorePrivate, setIgnorePrivate] = useStickyState(
    '@ignorePrivateAccounts',
    'yes'
  );

  const [limit, setLimit] = useStickyState('@listLimit', 50);
  const [followingListLoop, setFollowingListLoop] = useStickyState(
    '@followingListLoop',
    0
  ); //checks what user the bot is currently following

  /**
   * TODO
   * - update list in real time after extraction. It should be like this:
   * extracted 1 user
   * extracted 2 user
   * (textarea updated dynamically)
   *
   */
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
        `${CSS_SELECTORS.followersListUsernames}, ${CSS_SELECTORS.followingListUsernames}`,
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
          `${CSS_SELECTORS.followersListUsernames}, ${CSS_SELECTORS.followingListUsernames}`
        );

        const visible = $visibleUsers.length;

        if (i % EXTRACT_EVERY_X_USERS === 1 && visible <= followers) {
          if (isFollowingPage()) {
            await scrollDownFollowingList();
          } else {
            await scrollDownFollowersList();
          }
        }

        /* Get current user */

        const $user = await _waitForElement(
          `${CSS_SELECTORS.followersAndFollowingListItem}:nth-child(${index})`,
          100,
          25
        );

        if (!$user && !window.user_found) {
          alert(`no user found. ${index} -- `);
          break;
        } else {
          window.user_found = true;
        }

        let $username;
        let $name;
        let $verified;

        try {
          $username = $user.querySelector(`a[href] > span`);
          $name = $user.querySelector(
            `div div:nth-child(2) span + span > span`
          );
          $verified = $user.querySelector(
            `[title="Verificado"], [title="Verified"]`
          );
        } catch (err) {
          updateLogError(`No user found at the index ${index}.`);
        }

        if ($verified) {
          ignored += 1;
          continue;
        }

        if (ignorePrivate === 'yes') {
          const isPrivate = await isProfilePrivate($user);

          if (isPrivate) {
            updateLog(`Skipping private. (${index})`);
            ignored += 1;
            continue;
          }
        }

        const name = $name.textContent.split(' ')[0].trim();
        const user = $username.textContent.trim();

        if (ignoreMales === 'yes') {
          const { result: gender } = await getUsernameGender(name);
          if (gender !== 'female') {
            ignored += 1;
            continue;
          }
        }

        console.log(
          `Index: ${index} -- visible: ${visible} --  limit: ${
            limit + ignored
          } -- i: ${i}`
        );

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
            updateLog(`Ignored users: ${ignored}`);
            continue;
          }
        }

        /* Save to list */
        list = [...list, user];

        updateLog(`Extracted ${list.length} users.`);
        setExtractionList(list);

        // console.log('visible: ', visible);

        if (i >= limit + ignored) {
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

  function isProfilePrivate($user) {
    return new Promise(async (resolve, reject) => {
      const $canva = $user.querySelector(`[role="button"] > canvas`);

      const $hover = $canva.closest(`[role="button"]`);

      const _hasClickableStory = $hover.getAttribute(`aria-disabled`);

      const hasClickableStory = _hasClickableStory === 'false' ? true : false;

      if (hasClickableStory) {
        resolve(false);
        return;
      }

      let event;

      event = new MouseEvent('mouseover', {
        view: window,
        bubbles: true,
        cancelable: true,
      });

      $hover.dispatchEvent(event);

      await _waitForElement(
        `[style*='alpha'] > [style*='transform'][style*='translate']`,
        100,
        15
      );

      const $private = await _waitForElement(
        `[style*='alpha'] > [style*='transform'][style*='translate'] > * > * > div:not([class]) + div:not([class]) + div:not([class]) > * i[data-visualcompletion]`,
        100,
        15
      );

      event = new MouseEvent('mouseout', {
        view: window,
        bubbles: true,
        cancelable: true,
      });

      $hover.dispatchEvent(event);

      await _sleep(randomIntFromInterval(100, 250));

      if ($private) {
        resolve(true);
        return;
      }

      resolve(false);
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

    if (!isFollowingPage() && !isFollowersPage()) {
      updateLog(`ERROR: Please open the user's followers or following page.`);

      toastMessage(
        <p>Please open the user's followers or following page.</p>,
        5000,
        'error'
      );

      return;
    }

    const list = await extractUsernamesFromFollowersList(limit);

    await storeMustFollowUsersListToDatabase(list);

    await actions.getMustFollowUsers();

    toastMessage(<p>Completed!</p>, 'light');
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
        <hr />

        <Form.Label>
          <Form.Check
            className="Follow-"
            type="switch"
            id="ignoreMales"
            checked={ignoreMales === 'yes' ? true : false}
            onChange={(e) => {
              setIgnoreMales(e.target.checked ? 'yes' : 'no');
            }}
            label={`Enable gender extraction`}
          />

          <Form.Check
            className="Follow-"
            type="switch"
            id="ignorePrivate"
            checked={ignorePrivate === 'yes' ? true : false}
            onChange={(e) => {
              setIgnorePrivate(e.target.checked ? 'yes' : 'no');
            }}
            label={`Skip private accounts`}
          />
        </Form.Label>

        <br />
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

        <Form.Control
          value={extractionList ? extractionList.join('\n') : ''}
          id="extractionResults"
          as="textarea"
          placeholder={'Extraction results'}
          rows={3}
        />

        <Button
          onClick={async () => {
            copyToClipboard(extractionList.join('\n'));
          }}
        >
          Copy to clipboard
        </Button>
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
