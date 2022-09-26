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
      <Form.Label style={{ display: 'block' }}>hello</Form.Label>

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

      <Button onClick={async () => {}}>View all</Button>
    </div>
  );
};

export default Whitelist;
