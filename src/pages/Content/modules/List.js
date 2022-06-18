import './List.css';

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';

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
} from './utils';

import { useDatabase } from '../store/databaseStore';
import { useLocalStore } from './../store/localStore';

export default function List() {
  const [state, actions] = useDatabase();
  const [localState, localActions] = useLocalStore();

  return <div>list; {state.mustFollowUsers.length}</div>;
}
