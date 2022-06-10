import React from 'react';
import logo from '../../assets/img/logo.svg';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';

const Popup = () => {
  return (
    <div className="App">
      <h2>hello</h2>
      <button onClick={(e)=> {
        e.preventDefault();




      }}>Open</button>
    </div>
  );
};

export default Popup;
