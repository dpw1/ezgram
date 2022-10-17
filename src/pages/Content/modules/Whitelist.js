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
    const $list = await _waitForElement(CSS_SELECTORS.followingListParent);

    if (!$list) {
      return;
    }

    window.isExtractingUser = false;

    $list.setAttribute(`style`, `min-width:500px;`);

    /* Add buttons 
      ============================= */

    await _sleep(100);

    const selector = `[aria-labelledby]:not([data-has-button])`;

    const $users = $list.querySelectorAll(selector);

    async function _addButtons(_$users) {
      console.log('llll', $users);

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

          await actions.addWhiteListUser(user);
          await actions.getWhiteListUsers();

          e.target.textContent = `Whitelisted ✔️`;
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

  async function viewAllWhiteListedUsers() {}

  return (
    <div className="Whitelist">
      <Form.Label style={{ display: 'block' }}>
        You have {whiteListUsers && whiteListUsers.length} users in your white
        list.
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
          await openFollowingList();
          addWhiteListButtonToFollowingListUsers();
        }}
      >
        View list
      </Button>
    </div>
  );
};

export default Whitelist;
