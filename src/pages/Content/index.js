import React from 'react';
import ReactDOM from 'react-dom';

// import getWindow from './modules/getWindow';
import Homepage from './modules/Homepage';

import './modules/bootstrap.min.css';
import { _sleep } from './modules/utils';

async function injectDivIntoInstagram() {
  const html = `<div id="ezgram"></div>`;

  const $body = document.querySelector(`body`);

  $body.insertAdjacentHTML(`beforeend`, html);

  await _sleep(50);

  ReactDOM.render(<Homepage></Homepage>, document.querySelector('#ezgram'));
}

injectDivIntoInstagram();
