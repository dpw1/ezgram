import React, { useEffect, useState } from 'react';
import './Whitelist.css';

import {
  getChromeStorageData,
  deleteChromeStorageData,
  addChromeStorageData,
  updateLog,
  _sleep,
  downloadFile,
  readImportedFile,
  importChromeStorage,
  createBackupFile,
  openFollowingList,
  CSS_SELECTORS,
  _waitForElement,
  isFollowingPage,
  isCurrentPageMyUserPage,
  toastMessage,
} from './utils';

import Unfollow from './Unfollow';
import useStore from '../store/store';
import { useDatabase } from '../store/databaseStore';
import Table from 'react-bootstrap/Table';
import TimeAgo from 'javascript-time-ago';

import en from 'javascript-time-ago/locale/en.json';
import { Button, Form } from 'react-bootstrap';
import { confirm } from 'react-bootstrap-confirmation';
import CustomTable from './CustomTable';

TimeAgo.addDefaultLocale(en);

const Whitelist = () => {
  const [state, actions] = useDatabase();
  const [whiteListUsers, setWhiteListUsers] = useState('');

  useEffect(() => {
    (async () => {
      const users = await actions.getWhiteListUsers();
      setWhiteListUsers(users);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      syncWhiteListTextareWithDatabase();
    })();
  }, [state.whiteListUsers]);

  function syncWhiteListTextareWithDatabase() {
    const _users = state.whiteListUsers;

    if (_users.length <= 0) {
      return;
    }

    const users = _users.hasOwnProperty('whiteListUsers')
      ? state.whiteListUsers.whiteListUsers
      : state.whiteListUsers;

    setWhiteListUsers(users.join('\n'));
  }

  async function saveWhiteListUsers() {
    return new Promise(async (resolve, reject) => {
      const users = [...new Set(whiteListUsers.split('\n'))];

      const res = await actions.overwriteWhiteListUsers(users);

      await actions.getWhiteListUsers();

      resolve(res);
    });
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
  ];

  function processUsersForTable(users) {
    return users.map((e) => {
      return {
        id: e,
      };
    });
  }

  async function addWhiteListButtonToFollowingListUsers() {
    /* Enlarge list 
      ============================= */
    const $list = await _waitForElement(
      `${CSS_SELECTORS.followingListParent}, .followingList`
    );

    if (!$list) {
      return;
    }

    window.isExtractingUser = false;

    $list.setAttribute(`style`, `min-width:500px;`);
    $list.classList.add(`followingList`);

    /* Add buttons 
      ============================= */

    await _sleep(100);

    const selector = `[aria-labelledby]:not([data-has-button])`;

    const $users = $list.querySelectorAll(selector);

    async function _addButtons(_$users) {
      for (var [index, each] of _$users.entries()) {
        window.isExtractingUser = true;
        const $button = each.querySelector(`button`);

        const $hasButton = each.querySelector(`[data-whitelist]`);

        if ($hasButton) {
          return;
        }

        const $user = each.querySelector(`a[href]`);
        const user = $user.getAttribute(`href`).replaceAll(`/`, ``).trim();

        const text = (await actions.getWhiteListUser(user))
          ? `Whitelisted ✔️`
          : `Add to white list`;

        const html = `<span data-whitelist="${user}">${text}</span>`;

        $button.insertAdjacentHTML(`beforebegin`, html);

        each.setAttribute(`data-has-button`, `true`);

        /* Handle click on white list buttons 
          ============================= */

        const $whitelist = document.querySelector(`[data-whitelist="${user}"]`);

        $whitelist.addEventListener(`click`, async function (e) {
          const user = e.target.getAttribute(`data-whitelist`);

          const exists = await actions.getWhiteListUser(user);

          if (exists) {
            await actions.removeOneWhiteListUser(user);
            toastMessage(
              <p>
                Removed <b>{user}</b> from white list successfully.
              </p>,
              3000,
              'success'
            );

            e.target.textContent = `Add to white list`;
          } else {
            await actions.addWhiteListUser(user);
            toastMessage(
              <p>
                Added <b>{user}</b> to the white list successfully.
              </p>,
              3000,
              'success'
            );

            e.target.textContent = `Whitelisted ✔️`;
          }

          await actions.getWhiteListUsers();
        });
      }

      window.isExtractingUser = false;
    }

    _addButtons($users);

    /* Handle scrolling
      ============================= */
    const $scrollable = document.querySelector(
      `${CSS_SELECTORS.followingList} > *`
    );

    function outputsize() {
      if (window.isExtractingUser) {
        return;
      }
      console.log(`SCROLLABLE`, $scrollable.offsetHeight);

      var $newUsers = document.querySelectorAll(selector);

      _addButtons($newUsers);
    }
    outputsize();

    new ResizeObserver(outputsize).observe($scrollable);
  }

  async function injectUpdateButton() {
    const $header = await _waitForElement(`div[style*='height'] > h1`);

    if (!$header) {
      return;
    }

    if (!$header.getAttribute(`style`)) {
      $header.setAttribute(`style`, `display: flex;flex-direction: row;`);
    }

    const html = `<button id="updateWhiteListButton" class="ig-button">Update Buttons</button>`;

    $header.insertAdjacentHTML(`beforeend`, html);

    const $button = document.querySelector(`#updateWhiteListButton`);

    $button.addEventListener(`click`, function (e) {
      e.preventDefault();
      addWhiteListButtonToFollowingListUsers();
    });
  }

  return (
    <div className="Whitelist">
      <h3 className="Whitelist-title">Whitelist</h3>
      <h4 className="h6">List of users that you do not want to unfollow.</h4>
      <hr />
      <Form.Label style={{ display: 'block' }}>
        You have {whiteListUsers && whiteListUsers.split('\n').length} users in
        your white list.
      </Form.Label>

      <Form.Control
        value={whiteListUsers}
        id="whiteListUsers"
        as="textarea"
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          setWhiteListUsers(e.target.value);
        }}
        cols={6}
      />
      <Button
        onClick={async () => {
          const res = await saveWhiteListUsers();
        }}
      >
        Update
      </Button>

      {/* {whiteListUsers && whiteListUsers.length >= 1 && (
        <CustomTable
          countPerPage={20}
          columns={columns}
          data={[
            {
              id: 'err31',
            },
            {
              id: '123',
            },
          ]}
        ></CustomTable>
      )} */}

      <Button
        id="whiteListFilter"
        onClick={async () => {
          if (!isCurrentPageMyUserPage(state.username)) {
            toastMessage(
              <p>
                Please go to your profile page to see the whitelist.{' '}
                <a href={`https://instagram.com/${state.username}/following`}>
                  Click here for a shortcut.
                </a>
              </p>,
              5000,
              'error'
            );

            return;
          }

          await openFollowingList();
          addWhiteListButtonToFollowingListUsers();
          injectUpdateButton();
        }}
      >
        View list
      </Button>
    </div>
  );
};

export default Whitelist;
