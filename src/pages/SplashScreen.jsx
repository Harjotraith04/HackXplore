import React from 'react';
import logo from "../assets/images/whitelogo_hinglish.png";

const SplashScreen = () => {
    return (
        <div className="splash-screen">
            <div className="logo-container">
                <div className="particle-ring"></div>
                <img src={logo} alt="Logo" className="splash-logo" />
            </div>
            <div className="loading-bar">
                <div className="loading-bar-fill"></div>
            </div>

            <style>
                {`
                    .splash-screen {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background-color: #000000;
                        color: #ffffff;
                        font-family: 'Arial', sans-serif;
                        overflow: hidden;
                    }

                    .logo-container {
                        width: 250px;
                        height: 250px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        background-color: transparent;
                        margin-bottom: 30px;
                        animation: pulse 2s infinite;
                    }

                    .splash-logo {
                        width: 200px;
                        height: 200px;
                        border-radius: 50%;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                        position: relative;
                        z-index: 2;
                    }

                    .splash-logo:hover {
                        transform: scale(1.15);
                    }

                    .particle-ring {
                        position: absolute;
                        width: 250px;
                        height: 250px;
                        border-radius: 100%;
                        top: 100%;
                        left: 100%;
                        transform: translate(-50%, -50%);
                        pointer-events: none;
                        z-index: 1;
                    }

                    .particle-ring::before,
                    .particle-ring::after {
                        content: '';
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        border: 3px dashed rgba(255, 255, 255, 0.5);
                        top: 0;
                        left: 0;
                        animation: rotate 30s infinite linear;
                    }

                    .particle-ring::after {
                        animation-duration: 12s;
                    }

                    .loading-bar {
                        width: 80%;
                        max-width: 500px;
                        height: 12px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 6px;
                        overflow: hidden;
                        margin-top: 20px;
                        position: relative;
                        box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.3);
                    }

                    .loading-bar-fill {
                        width: 0;
                        height: 100%;
                        background: linear-gradient(90deg, #00ff9d, #00a8ff);
                        border-radius: 6px;
                        animation: loading 3s forwards; /* Change from infinite to forwards */
                        position: absolute;
                        top: 0;
                        left: 0;
                    }

                    @keyframes loading {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }

                    @keyframes pulse {
                        0% {
                            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                        }
                        50% {
                            box-shadow: 0 0 20px rgba(255, 255, 255, 0.7);
                        }
                        100% {
                            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                        }
                    }

                    @keyframes rotate {
                        from {
                            transform: translate(-50%, -50%) rotate(0deg);
                        }
                        to {
                            transform: translate(-50%, -50%) rotate(360deg);
                        }
                    }
                `}
            </style>
        </div>
    );
}

export default SplashScreen;
