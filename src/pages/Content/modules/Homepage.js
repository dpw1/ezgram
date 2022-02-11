import React, { useEffect, useState } from 'react';
import './Homepage.css';
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
} from './utils';
import Unfollow from './Unfollow';
import { useDatabase } from '../store/databaseStore';
import Data from './Data';
import Follow from './Follow';

const Homepage = () => {
  const [isMinimized, setIsMinimized] = useStickyState('@isMinimized', false);

  const [state, actions] = useDatabase();

  useEffect(() => {
    async function initState() {
      await actions.loadUsername();
      await actions.loadIgnoredUsers();
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

        if (!ignored) {
          return;
        }

        updateLog(`<b>${user}</b> is in your ignore list.`);

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
      var target = document.querySelector('#react-root');

      // create an observer instance
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(async function (mutation) {
          if (window.location.pathname !== '/') {
            preventFollowingIgnoredUser();
          }
        });
      });

      // configuration of the observer:
      var config = { attributes: true, childList: true, characterData: true };

      // pass in the target node, as well as the observer options
      observer.observe(target, config);
    }

    initState();
    handleUrlChange();
    preventFollowingIgnoredUser();
  }, []);

  useEffect(() => {
    console.log('my userrrrrrr', state.username);
  }, [state.username]);

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
            <b>EZGram - Easy Instagram Automation | {state.username} </b>
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
            <Tab eventKey={0} className="Homepage-tab" label="Follow">
              <Follow></Follow>
            </Tab>
            <Tab eventKey={1} className="Homepage-tab" label="Unfollow">
              <Unfollow></Unfollow>
            </Tab>
            <Tab eventKey={2} className="Homepage-tab" label="Testing">
              <input id="okok" type="text" />

              <button
                onClick={async () => {
                  const $okok = document.querySelector(`#okok`);
                  const user = $okok.value;

                  actions.addIgnoredUser({ user, date: 111 });
                }}
              >
                add
              </button>
              <button
                onClick={() => {
                  actions.clearIgnoredUsers();
                }}
              >
                delte
              </button>
            </Tab>

            <Tab eventKey={3} className="Homepage-tab" label="Database">
              <Data></Data>
            </Tab>
          </Tabs>

          <div className="Homepage-debug">
            <div className="Homepage-log" readOnly={true} id="log"></div>
            <div className="Homepage-database" id="ezgramDatabase">
              <div className="Homepage-stats Homepage-stats--ignored-users">
                <p>Ignored users:</p>
                <span>
                  {state.ignoredUsers &&
                    state.ignoredUsers.hasOwnProperty('ignoredUsers') &&
                    state.ignoredUsers['ignoredUsers'].length}
                </span>

                <div style={{ overflowY: 'scroll' }}>
                  {JSON.stringify(state.ignoredUsers)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default Homepage;
