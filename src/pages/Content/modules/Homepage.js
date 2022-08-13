import './Homepage.css';

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Tabs, Tab } from 'react-bootstrap-tabs';
import Draggable from 'react-draggable'; // The default

import { useStatePersist as useStickyState } from 'use-state-persist';

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
  isObject,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';

import Unfollow from './Unfollow';
import Data from './Data';
import Follow from './Follow';
import List from './List';

const Homepage = () => {
  const [isMinimized, setIsMinimized] = useStickyState('@isMinimized', false);

  const [interactingWithUser, setInteractingWithUser] = useStickyState(
    '@interactingWithUser',
    ''
  );

  const [state, actions] = useDatabase();
  const [localState, localActions] = useLocalStore();

  useEffect(() => {
    async function isFirstInstall() {
      chrome.runtime.sendMessage(
        {
          type: 'isFirstInstall',
          message: {},
        },
        function (data) {
          console.log('first install data: ', data);
        }
      );
    }

    isFirstInstall();

    /* initiate state for store */

    async function initState() {
      await actions.loadUsername();
      await actions.loadIgnoredUsers();
      await actions.getMustFollowUsers();
      await actions.getFollowingListLoop();
    }

    function storeOriginalTabData() {
      chrome.runtime.sendMessage(
        {
          type: 'getTab',
          message: {},
        },
        function (data) {
          if (!data) {
            return;
          }

          if (data.type === 'getTab') {
            const tab = data.message.tab;

            updateLog(
              `<b style="color:green;">EZgram loaded successfully. ID: ${tab.id}</b>`
            );

            window.localStorage.setItem(
              LOCAL_STORAGE.originalTab,
              JSON.stringify(tab)
            );
          }
        }
      );
    }

    async function preventFollowingIgnoredUser() {
      let $follow;

      try {
        $follow = await _waitForElement(
          CSS_SELECTORS.userPageFollowButton,
          50,
          20
        );

        const user = window.location.pathname.replaceAll(`/`, '');

        const ignored = await actions.getIgnoredUser(user);

        if (!ignored || user === '' || !user) {
          return;
        }

        updateLog(`<b>${user}</b> is in your "interacted users" list.`);

        $follow.addEventListener('click', function (e) {
          e.preventDefault();
          updateLog(
            '<span style="color:red;">This user is in your ignore list because you have followed them in the past.</span>'
          );
        });
      } catch (err) {
        console.log('No follow button found.');
      }
    }

    function handleUrlChange() {
      const $links = document.querySelectorAll(`body a[href]`);

      for (var each of $links) {
        each.addEventListener(`click`, function () {
          alert('change');
        });
      }
    }

    initState();

    handleUrlChange();
    preventFollowingIgnoredUser();
  }, []);

  useEffect(() => {
    console.log('tab: ', localState.tab);
  }, [localState.tab]);

  useEffect(() => {
    console.log('my userrrrrrr', state.username);
  }, [state.username]);

  useEffect(() => {
    if (interactingWithUser === '') {
    }
  }, [interactingWithUser]);

  return (
    <Draggable
      disabled={isMinimized}
      handle={'.Homepage-header'}
      bounds="body[class]"
    >
      <div className="Homepage">
        {/* <h1>My value: {JSON.stringify(key)}</h1> */}

        <header className="Homepage-header">
          <p>
            <b>
              EZGram - Easy Instagram Automation | Welcome, {state.username}.
            </b>
          </p>
          <div className="Homepage-buttons">
            <button
              className="Homepage-minimize"
              onClick={() => {
                setIsMinimized(!isMinimized);
              }}
            >
              {isMinimized ? 'Open' : 'Minimize'}
            </button>
          </div>
        </header>
        <div
          className={`Homepage-body ${
            isMinimized && `Homepage-body--minimized`
          }`}
        >
          <Tabs
            defaultActiveKey={2}
            className="Homepage-tabs"
            onSelect={(index, label) => console.log(label + ' selected')}
          >
            <Tab
              disabled={localState.isExecuting}
              eventKey={0}
              className="Homepage-tab"
              label="Follow"
            >
              <Follow></Follow>
            </Tab>
            <Tab
              disabled={localState.isExecuting}
              eventKey={1}
              className="Homepage-tab"
              label="Unfollow"
            >
              <Unfollow></Unfollow>
            </Tab>
            <Tab eventKey={0} className="Homepage-tab" label="List">
              <List></List>
            </Tab>
            <Tab
              disabled={localState.isExecuting}
              eventKey={2}
              className="Homepage-tab"
              label="Testing"
            >
              <Button
                onClick={() => {
                  console.log(state);
                }}
              >
                Testing
              </Button>
              <fieldset>
                <p>Ignored users</p>
                <input id="okok" type="text" />

                <Button
                  onClick={async () => {
                    const $okok = document.querySelector(`#okok`);
                    const user = $okok.value;

                    actions.addIgnoredUser({
                      user,
                      date: new Date().getTime(),
                    });
                  }}
                >
                  add
                </Button>
                <Button
                  onClick={() => {
                    actions.clearIgnoredUsers();
                  }}
                >
                  delete
                </Button>
              </fieldset>
              <hr />
              <fieldset>
                <p>Must follow users</p>
                <input id="mustFollowUser" type="text" />

                <Button
                  onClick={async () => {
                    const $mustFollow =
                      document.querySelector(`#mustFollowUser`);
                    const user = $mustFollow.value;

                    actions.addMustFollowUsers([user]);
                  }}
                >
                  add
                </Button>
                <Button
                  onClick={() => {
                    actions.clearMustFollowUsers();
                  }}
                >
                  delete
                </Button>
              </fieldset>
              <hr />
              <fieldset>
                <p>
                  Following List Loop{' '}
                  {!isObject(state.followingListLoop) &&
                    state.followingListLoop}
                </p>
                <input id="followingListLoop" type="text" />

                <Button
                  onClick={async () => {
                    const $mustFollow =
                      document.querySelector(`#followingListLoop`);
                    const num = parseInt($mustFollow.value);

                    actions.updateFollowingListLoop(num);
                  }}
                >
                  add
                </Button>
                <Button
                  onClick={() => {
                    actions.clearFollowingListLoop();
                  }}
                >
                  delete
                </Button>

                <Button
                  onClick={async () => {
                    await actions.getFollowingListLoop();
                  }}
                >
                  get
                </Button>
              </fieldset>
            </Tab>

            <Tab eventKey={3} className="Homepage-tab" label="Database">
              <Data></Data>
            </Tab>

            <Tab eventKey={3} className="Homepage-tab" label="Cache">
              <Button
                onClick={async () => {
                  setInteractingWithUser('');
                  await _sleep(100);
                  window.location.reload();
                }}
              >
                Refresh
              </Button>
            </Tab>
          </Tabs>

          <div className="Homepage-debug">
            <div className="Homepage-log" readOnly={true} id="log"></div>
            <div className="Homepage-database" id="ezgramDatabase">
              <div className="Homepage-stats Homepage-stats--ignored-users">
                <p>Interacted users:</p>
                <span>
                  {state.ignoredUsers.hasOwnProperty('ignoredUsers')
                    ? state.ignoredUsers.ignoredUsers.length
                    : state.ignoredUsers.length}
                </span>
                <hr />
                <p>To-follow list:</p>
                <span>
                  {state.mustFollowUsers.hasOwnProperty('mustFollowUsers')
                    ? state.mustFollowUsers.mustFollowUsers.length
                    : state.mustFollowUsers.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default Homepage;
