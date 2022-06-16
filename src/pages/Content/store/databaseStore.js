import { createStore, createHook } from 'react-sweet-state';
import {
  addChromeStorageData,
  CSS_SELECTORS,
  getChromeStorageData,
  getUserName,
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
          if (!Array.isArray(data) || data.length <= 1) {
            throw new Error("Invalid data. 'users' array required.");
          }

          const users = await addChromeStorageData('mustFollowUsers', data);

          setState({
            mustFollowUsers: users,
          });

          resolve(users);
        });
      },

    getMustFollowUsers:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const _users = await getChromeStorageData('mustFollowUsers');

          if (!_users) {
            resolve(null);
            return;
          }

          const users = _users.hasOwnProperty('mustFollowUsers')
            ? _users.mustFollowUsers.sort((a, b) =>
                a.date < b.date ? 1 : b.date < a.date ? -1 : 0
              )
            : [];

          const obj = {
            mustFollowUsers: users,
          };

          setState(obj);
          resolve(obj);
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

          if (!_users) {
            resolve(null);
            return;
          }

          const users = _users.hasOwnProperty('ignoredUsers')
            ? _users.ignoredUsers.sort((a, b) =>
                a.date < b.date ? 1 : b.date < a.date ? -1 : 0
              )
            : [];

          const obj = {
            ignoredUsers: users,
          };

          setState(obj);
          resolve(obj);
        });
      },
    clearIgnoredUsers:
      () =>
      async ({ setState, getState }) => {
        return new Promise(async (resolve, reject) => {
          const remove = await removeChromeStorageData();

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
          const _users = await getChromeStorageData('ignoredUsers');

          if (!_users) {
            resolve(null);
            return;
          }
          const users = _users.ignoredUsers;

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
