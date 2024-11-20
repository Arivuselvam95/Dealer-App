import React from 'react'
import titan_logo from '../../assets/image.png'

const WelcomePage = ({ onLogout }) => (
  <>
    <div className="page-container welcome-page">
      <div className="welcome-container">
        <div className="header">
          <img className='titan-logo' src={titan_logo} alt="" />
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
        <div className="welcome-content">
          <h1>WELCOME TO THE APPLICATION</h1>
        </div>
      </div>
    </div>
    <div className="area">
        <ul className="circles">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      </div>
  </>
  );

export default WelcomePage
