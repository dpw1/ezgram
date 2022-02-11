import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import RangeSlider from 'react-bootstrap-range-slider';
import { useStatePersist as useStickyState } from 'use-state-persist';

import './Unfollow.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

// import getWindow from './modules/getWindow';
import {
  _sleep,
  updateLog,
  _waitForElement,
  randomIntFromInterval,
  goToProfilePage,
  CSS_SELECTORS,
  getFollowersNumber,
  LOCAL_STORAGE,
  openFollowingPage,
  openFollowersList,
  scrollDownFollowersList,
  scrollDownFollowingList,
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';

const Unfollow = () => {
  const [unfollowLimit, setUnfollowLimit] = useStickyState(
    '@unfollowLimit',
    50
  );
  const [delayBetweenUnfollowMin, setDelayBetweenUnfollowMin] = useStickyState(
    '@delayBetweenUnfollowMin',
    46
  );
  const [delayBetweenUnfollowMax, setDelayBetweenUnfollowMax] = useStickyState(
    '@delayBetweenUnfollowMax',
    68
  );
  const [unfollowNonFollowers, setUnfollowNonFollowers] = useStickyState(
    '@unfollowNonFollowers',
    true
  );

  const [localState, localActions] = useLocalStore();
  const [state, actions] = useDatabase();

  async function handleClickOnUnfollowButton() {
    await _waitForElement(CSS_SELECTORS.followingListUnfollowButton);

    const $buttons = document.querySelectorAll(
      CSS_SELECTORS.followingListUnfollowButton
    );

    if (!$buttons) {
      return;
    }

    const followers = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.followersList)
    );

    let count = 0;
    let ignored = 0;

    for (let i = 1; i <= unfollowLimit + ignored; i++) {
      await _sleep(randomIntFromInterval(40, 70));

      if (i % 6 === 1) {
        await scrollDownFollowingList();
      }

      const delay = randomIntFromInterval(
        delayBetweenUnfollowMin * 1000,
        delayBetweenUnfollowMax * 1000
      );

      const $button = await _waitForElement(
        `div[role="presentation"] ul li:nth-child(${i}) button`
      );
      const $parent = $button.closest(`li`);
      const $user = $parent.querySelector(`a[title]`);
      const user = $user.getAttribute(`title`);

      const found = followers.filter((e) => e === user);

      if (found.length > 0) {
        updateLog(`<b>${user}</b> is following you back. Skipping...`);
        ignored += 1;
        await _sleep(randomIntFromInterval(95, 300));
        continue;
      }

      updateLog(
        `<br />Unfollowing <a target="_blank" href="/${user}">${user}</a>...`
      );

      await _sleep(100);

      $button.click();

      const $unfollow = await _waitForElement(
        CSS_SELECTORS.followingListUnfollowConfirmationButton
      );

      const unfollowDelay = randomIntFromInterval(1003, 3808);
      await _sleep(unfollowDelay);

      $unfollow.click();

      count += 1;

      updateLog(
        `<span style="color:green;">Unfollowed <b>${user}</b> successfully. <b>${count} / ${unfollowLimit}</b></span>`
      );

      const date = new Date().getTime();

      actions.addIgnoredUser({ user, date });

      if (count >= unfollowLimit) {
        updateLog(`Finished!`);

        updateLog(`<b>${count}</b> users were successfully unfollowed.`);

        if (ignored > 0) {
          updateLog(`<b>${ignored}</b> users were skipped.`);
        }

        updateLog(
          `<br /><b>Please press F5 to refresh the page before using this app again.</b>`
        );

        localActions.setIsExecuting(false);
        return;
      }

      updateLog(
        `Awaiting ${
          delay / 1000
        } seconds before moving to the next one...<br />`
      );
      await _sleep(delay);
    }
  }

  /* Gets the name of everyone who is following you and saves to the local storage. */
  async function getFollowersList() {
    return new Promise(async (resolve, reject) => {
      const $username = _waitForElement(CSS_SELECTORS.followersListUsernames);

      if (!$username) {
        return;
      }

      const $usernames = document.querySelectorAll(
        CSS_SELECTORS.followersListUsernames
      );

      let usernames = [];

      for (var each of $usernames) {
        usernames.push(each.textContent.trim());
      }

      if (usernames.length > 0) {
        updateLog(`Successfully stored followers.`);
      }

      localStorage.setItem('ezgram_followers_list', JSON.stringify(usernames));

      resolve(true);
    });
  }

  async function start() {
    await goToProfilePage(state.username);

    if (unfollowNonFollowers) {
      await openFollowersList(state.username);
      await scrollDownFollowersList('all');
      await getFollowersList();
    }

    openFollowingPage(state.username);
    // await scrollDownFollowingList();
    handleClickOnUnfollowButton();
  }

  return (
    <div className="Unfollow">
      <h3 className="Unfollow-title">
        Unfollow people who you're currently following.
      </h3>
      <div className="Unfollow-options">
        <div>
          <Form.Group className="Unfollow-option mb-3">
            <Form.Label>Unfollow limit:</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={1000}
              value={unfollowLimit}
              onChange={(e) => {
                setUnfollowLimit(e.target.value);
              }}
              placeholder="Stop unfollowing after reaching this number."
            />
          </Form.Group>

          <Form.Group className="Unfollow-option Unfollow-option--click-delay mb-3">
            <Form.Label>
              Wait from <b>{delayBetweenUnfollowMin}</b> to{' '}
              <b>{delayBetweenUnfollowMax}</b> seconds between each user.
            </Form.Label>
            <div className="Unfollow-slider">
              <RangeSlider
                min={5}
                max={60}
                value={delayBetweenUnfollowMin}
                onChange={(e) => setDelayBetweenUnfollowMin(e.target.value)}
              />
              <RangeSlider
                min={10}
                max={600}
                value={delayBetweenUnfollowMax}
                onChange={(e) => setDelayBetweenUnfollowMax(e.target.value)}
              />
            </div>
            <Form.Text className="text-muted">
              45 and 63 are recommended numbers to avoid being action blocked.
            </Form.Text>
          </Form.Group>

          <Form.Check
            type="switch"
            id="custom-switch"
            checked={unfollowNonFollowers}
            onChange={(e) => {
              setUnfollowNonFollowers(e.target.checked);
            }}
            label="Unfollow only who is not following me back"
          />

          <hr />
          <Button
            disabled={localState.isExecuting}
            onClick={() => {
              if (localState.isExecuting) {
                updateLog(`<b style="font-size:30px;">Stopping...</b>`);
                window.location.reload();
              } else {
                localActions.setIsExecuting(true);
                start();
              }
            }}
            variant="primary"
          >
            {localState.isExecuting ? 'Stop' : 'Start'}
          </Button>

          <Button
            onClick={() => {
              localActions.setIsExecuting(!localState);
            }}
          >
            {localState.isExecuting ? 'executing' : 'naw'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unfollow;
