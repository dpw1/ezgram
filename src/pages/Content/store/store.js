import create from 'zustand';
import { getChromeStorageData, getUserName, _sleep } from './../modules/utils';

const getLocalStorage = (key) => JSON.parse(window.localStorage.getItem(key));
const setLocalStorage = (key, value) =>
  window.localStorage.setItem(key, JSON.stringify(value));

const useStore = create((set, get) => ({
  getIgnoredUsers: async () => {
    const users = await getChromeStorageData('ignoredUsers');

    console.log('checkxx', users);
    set((_) => {
      return {
        getIgnoredUsers: users,
      };
    });
  },
}));

export default useStore;
