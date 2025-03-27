// LoadingScreen.jsx
import React from 'react';
import './LoadingScreen.css'; // Import the CSS file for styling

const LoadingScreen = ({ fact }) => {
  return (
    <div className="loading-container">
      <div className="spinner">
        <div className="double-bounce1"></div>
        <div className="double-bounce2"></div>
      </div>
      <p className="loading-fact">{fact}</p>
    </div>
  );
};

export default LoadingScreen;