import { createStore, createHook } from 'react-sweet-state';
import {
  addChromeStorageData,
  getChromeStorageData,
  removeChromeStorageData,
} from '../modules/utils';

const Store = createStore({
  // value of the store on initialisation
  initialState: {
    ignoredUsers: [],
  },
  // actions that trigger store mutation
  actions: {
    addIgnoredUser:
      (data) =>
      async ({ setState, getState }) => {
        if (!data.hasOwnProperty('user') || !data.hasOwnProperty('date')) {
          throw new Error(
            "Invalid data. It needs to have both 'user' and 'date' "
          );
        }
        const user = await addChromeStorageData('ignoredUsers', {
          date: data.date,
          user: data.user,
        });

        setState({
          ignoredUsers: user,
        });
      },
    loadIgnoredUsers:
      () =>
      async ({ setState, getState }) => {
        const _users = await getChromeStorageData('ignoredUsers');

        const users = _users.hasOwnProperty('ignoredUsers')
          ? _users.ignoredUsers.sort((a, b) =>
              a.date < b.date ? 1 : b.date < a.date ? -1 : 0
            )
          : [];

        setState({
          ignoredUsers: users,
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
