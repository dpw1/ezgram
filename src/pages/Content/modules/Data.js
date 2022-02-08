import React, { useEffect, useState } from 'react';
import './Data.css';

import {
  getChromeStorageData,
  deleteChromeStorageData,
  addChromeStorageData,
  updateLog,
  getUserName,
  _sleep,
  downloadFile,
  readImportedFile,
  importChromeStorage,
} from './utils';

import Unfollow from './Unfollow';
import useStore from '../store/store';
import { useDatabase } from '../store/databaseStore';
import Table from 'react-bootstrap/Table';
import TimeAgo from 'javascript-time-ago';

import en from 'javascript-time-ago/locale/en.json';
import { Button, Form } from 'react-bootstrap';

TimeAgo.addDefaultLocale(en);

const Data = () => {
  const timeAgo = new TimeAgo('en-US');

  const [state, actions] = useDatabase();

  const [users, setUsers] = useState(null);

  useEffect(() => {
    const loadIgnoredUsers = (async () => {
      actions.loadIgnoredUsers();

      const _users = () => {
        if (!state.hasOwnProperty(`ignoredUsers`)) {
          return {};
        }

        return state.ignoredUsers.hasOwnProperty('ignoredUsers')
          ? state.ignoredUsers.ignoredUsers
          : state.ignoredUsers;
      };

      setUsers(_users());
    })();
  }, []);

  useEffect(() => {
    setUsers(state.ignoredUsers);
  }, [state.ignoredUsers]);

  return (
    <div className="Data">
      <div className="Data-actions">
        <Button
          disabled={!users || (users && users.length <= 0)}
          onClick={async () => {
            const data = await getChromeStorageData();

            debugger;
            downloadFile(
              `ezgram_${new Date().toUTCString()}.json`,
              JSON.stringify(data)
            );

            updateLog(`Exporting ignored users...`);
          }}
          className="Data-button"
        >
          Export
        </Button>

        <Button
          className="Data-button"
          onClick={() => {
            const $button = document.querySelector(`#importFileDialog`);

            $button.click();
          }}
        >
          Import{' '}
        </Button>

        <Form.Control
          style={{ display: 'none' }}
          id="importFileDialog"
          accept=".json"
          onChange={async (e) => {
            const file = e.target.files[0];

            debugger;
            if (!file || !/json/.test(file.type)) {
              updateLog(
                `<span style="color:red;">Invalid type of file. Make sure it's a JSON. </span>`
              );
              return;
            }

            const data = await readImportedFile(file);

            await importChromeStorage(data);
            actions.loadIgnoredUsers();
            setUsers(state.ignoredUsers);

            updateLog(`Successfully imported data.`);
          }}
          type="file"
        />
      </div>

      {users && users.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              {users &&
                users.length > 0 &&
                Object.keys(users[0]).map((e, i) => (
                  <th key={e + i + 3}>{e}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {users.map((item, i) => {
              return (
                <tr key={item + i}>
                  {Object.values(item).map((val, index) => {
                    const column = Object.keys(users[0])[index];
                    let content = val;

                    if (column === 'date') {
                      content = timeAgo.format(new Date(val), 'round-minute');
                    }

                    if (column === 'user') {
                      content = (
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.instagram.com/${val}`}
                        >
                          {val}
                        </a>
                      );
                    }

                    return (
                      <React.Fragment>
                        {index === 0 && <td key={val + index + 1}>{i + 1}</td>}

                        <td key={val + index + 2}>{content}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <p>You don't have any ignored users yet.</p>
      )}
    </div>
  );
};

export default Data;
