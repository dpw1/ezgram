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

const Store = createStore({
  // value of the store on initialisation
  initialState: {
    ignoredUsers:
      [] /* Users that were already interacted with (followed and/or unfollowed) */,
    mustFollowUsers: [] /* List of users that must be followed */,
    username: '',
  },
  // actions that trigger store mutation
  actions: {
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

        const users = (await getChromeStorageData('ignoredUsers')) || [];

        if (
          users.filter((e) => e.user.toLowerCase() === data.user.toLowerCase())
            .length >= 1
        ) {
          console.log('User already exists.');
          return;
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
  },
  // optional, mostly used for easy debugging
  name: 'database',
});

export const useDatabase = createHook(Store);
