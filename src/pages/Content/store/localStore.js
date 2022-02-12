import { createStore, createHook } from 'react-sweet-state';
import {
  addChromeStorageData,
  CSS_SELECTORS,
  getUserName,
  _waitForElement,
} from '../modules/utils';

const Store = createStore({
  // value of the store on initialisation
  initialState: {
    isExecuting: false,
    tab: {},
    openedTab: {},
  },
  // actions that trigger store mutation
  actions: {
    setIsExecuting:
      (_) =>
      async ({ setState, getState }) => {
        const isExecuting = !getState().isExecuting;

        setState({
          isExecuting,
        });
      },
  },

  // optional, mostly used for easy debugging
  name: 'local_store',
});

export const useLocalStore = createHook(Store);
