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
  addWhiteListButtonToFollowingListUsers,
  injectUpdateButton,
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
          addWhiteListButtonToFollowingListUsers(actions);
          injectUpdateButton();
        }}
      >
        View list
      </Button>
    </div>
  );
};

export default Whitelist;
