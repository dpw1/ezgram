import { createStore, createHook } from 'react-sweet-state';
import {
  addChromeStorageData,
  CSS_SELECTORS,
  getChromeStorageData,
  getUserName,
  isObjectEmpty,
  overwriteChromeStorageData,
  removeChromeStorageData,
  _waitForElement,
} from '../modules/utils';

/* This is the database of the app. 

*/

const Store = createStore({
  initialState: {
    /* Users that were already interacted with (followed and/or unfollowed) */
    ignoredUsers: [],
    /* List of users that must be followed. The extracted users are stored here. */
    mustFollowUsers: [],
    /* Users that you're currently following and should not be unfollowed. */
    whiteListUsers: [],
    /* Current user username */
    username: '',
    followingListLoop: 0,
  },
  // actions that trigger store mutation
  actions: {
    /* ## Following list loop variable
      ======================== */

    addFollowingListLoop:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const _previous = await getChromeStorageData('followingListLoop');
          const previous = _previous ? parseInt(_previous) : 0;

          const updated = previous + 1;
          const _loop = await overwriteChromeStorageData(
            'followingListLoop',
            updated
          );

          setState({ followingListLoop: updated });
          resolve(updated);
        });
      },

    updateFollowingListLoop:
      (num) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const response = await overwriteChromeStorageData(
            'followingListLoop',
            parseInt(num)
          );

          const loop = response.followingListLoop;

          setState({ followingListLoop: loop });
          resolve(loop);
        });
      },

    clearFollowingListLoop:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const remove = await removeChromeStorageData('followingListLoop');

          if (!remove) {
            throw new Error('Unable to delete storage.');
          }

          setState({
            followingListLoop: 0,
          });

          resolve(0);
        });
      },

    /* ## Get current user
      ======================== */
    loadUsername:
      (_) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          if (getState().username !== '') {
            resolve(getState().username);
          }

          const username = await getUserName();

          resolve(username);

          setState({
            username,
          });
        });
      },

    /* ## Must Follow users
      ======================== */
    addMustFollowUsers:
      (data) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          if (!Array.isArray(data) || data.length <= 0) {
            throw new Error("Invalid data. 'users' array required.");
          }

          const _previous = await getChromeStorageData('mustFollowUsers');
          const previous = _previous && _previous.length >= 1 ? _previous : [];

          const updated = [...new Set([...previous, ...data])];

          const users = await overwriteChromeStorageData(
            'mustFollowUsers',
            updated
          );

          try {
            await this.actions.getMustFollowUsers();
          } catch (err) {}

          setState(users.mustFollowUsers);
          resolve(users.mustFollowUsers);
        });
      },

    overwriteMustFollowUsers:
      (data) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          if (!Array.isArray(data)) {
            throw new Error("Invalid data. 'users' array required.");
          }

          const updated = [...new Set([...data])];

          const users = await overwriteChromeStorageData(
            'mustFollowUsers',
            updated
          );

          await Store.actions.getMustFollowUsers();

          setState(users.mustFollowUsers);

          resolve(users.mustFollowUsers);
        });
      },

    removeOneMustFollowUsers:
      (user) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          if (!user || user.length <= 0 || user === '') {
            throw new Error("'user' is required.");
          }

          const _previous = await getChromeStorageData('mustFollowUsers');

          const previous = _previous && _previous.length >= 1 ? _previous : [];
          const updated = previous.filter(
            (e) => e.toLowerCase() !== user.toLowerCase()
          );

          const users = await overwriteChromeStorageData(
            'mustFollowUsers',
            updated
          );

          const res = await Store.actions.getMustFollowUsers();

          setState(users.mustFollowUsers);

          resolve(users.mustFollowUsers);
        });
      },

    getMustFollowUsers:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const _users = await getChromeStorageData('mustFollowUsers');

          if (!_users || isObjectEmpty(_users)) {
            resolve(null);
            return;
          }

          const users = _users;

          const obj = {
            mustFollowUsers: users,
          };

          setState(obj);
          resolve(users);
        });
      },

    clearMustFollowUsers:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const remove = await removeChromeStorageData('mustFollowUsers');

          if (!remove) {
            throw new Error('Unable to delete storage.');
          }

          setState({
            mustFollowUsers: [],
          });

          await Store.actions.getMustFollowUsers();

          resolve([]);
        });
      },
    /* ## Ignored Users
      ======================== */
    addIgnoredUser:
      (data) =>
      async ({ setState, getState }) => {
        if (!data.hasOwnProperty('user')) {
          throw new Error("Invalid data. 'user' required.");
        }

        if (data.user === '' || !data.user || data.user === undefined) {
          throw new Error("Invalid data. 'user' is empty or undefined.");
        }

        const _users = await getChromeStorageData('ignoredUsers');

        const users = _users ? _users : [];

        if (users.length >= 1) {
          if (
            users.filter(
              (e) => e.user.toLowerCase() === data.user.toLowerCase()
            ).length >= 1
          ) {
            console.log('User already exists.');
            return;
          }
        }

        const user = await addChromeStorageData('ignoredUsers', {
          date: data.hasOwnProperty('date') ? data.date : new Date().getTime(),
          user: data.user,
        });

        setState({
          ignoredUsers: user,
        });
      },
    loadIgnoredUsers:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const _users = await getChromeStorageData('ignoredUsers');

          if (!_users || isObjectEmpty(_users)) {
            resolve(null);
            return;
          }

          const users = Array.isArray(_users)
            ? _users.sort((a, b) =>
                a.date < b.date ? 1 : b.date < a.date ? -1 : 0
              )
            : [_users];

          setState({ ignoredUsers: users });
          resolve(users);
        });
      },
    clearIgnoredUsers:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const remove = await removeChromeStorageData('ignoredUsers');

          if (!remove) {
            throw new Error('Unable to delete storage.');
          }

          setState({
            ignoredUsers: [],
          });

          resolve([]);
        });
      },
    getIgnoredUser:
      (user) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const users = await getChromeStorageData('ignoredUsers');

          if (!users || isObjectEmpty(users)) {
            resolve(null);
            return;
          }

          const found =
            users && users.length > 0
              ? users.filter((e) => e.user === user)
              : [];

          if (found && found.length > 0) {
            resolve(found[0]);
          }

          resolve(null);
        });
      },
    /* ## White List
  ======================== */
    getWhiteListUsers:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const _users = await getChromeStorageData('whiteListUsers');

          if (!_users || isObjectEmpty(_users)) {
            resolve(null);
            return;
          }

          const users = _users;

          const obj = {
            whiteListUsers: users,
          };

          setState(obj);
          resolve(users);
        });
      },
    getWhiteListUser:
      (user) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const users = await getChromeStorageData('whiteListUsers');

          if (!users || isObjectEmpty(users)) {
            resolve(null);
            return;
          }

          const found =
            users && users.length > 0 ? users.filter((e) => e === user) : [];

          if (found && found.length > 0) {
            resolve(found[0]);
          }

          resolve(null);
        });
      },
    addWhiteListUser:
      (user) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          if (!user || user.length <= 0) {
            throw new Error("Invalid data. 'user' required.");
          }

          const _previous = await getChromeStorageData('whiteListUsers');
          const previous = _previous && _previous.length >= 1 ? _previous : [];

          const updated = [...new Set([...previous, user])];

          const users = await overwriteChromeStorageData(
            'whiteListUsers',
            updated
          );

          setState(users.whiteListUsers);
          resolve(users.whiteListUsers);
        });
      },

    removeOneWhiteListUser:
      (user) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          if (!user || user.length <= 0 || user === '') {
            throw new Error("'user' is required.");
          }

          const _previous = await getChromeStorageData('whiteListUsers');

          const previous = _previous && _previous.length >= 1 ? _previous : [];
          const updated = previous.filter(
            (e) => e.toLowerCase() !== user.toLowerCase()
          );

          const users = await overwriteChromeStorageData(
            'whiteListUsers',
            updated
          );

          const res = await Store.actions.getWhiteListUsers();

          setState(users.whiteListUsers);

          resolve(users.whiteListUsers);
        });
      },
    overwriteWhiteListUsers:
      (data) =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          if (!Array.isArray(data)) {
            throw new Error("Invalid data. 'users' array required.");
          }

          const updated = [...new Set([...data])];

          const users = await overwriteChromeStorageData(
            'whiteListUsers',
            updated
          );

          await Store.actions.getWhiteListUsers();

          setState(users.whiteListUsers);

          resolve(users.whiteListUsers);
        });
      },
  },

  // optional, mostly used for easy debugging
  name: 'database',
});

export const useDatabase = createHook(Store);
