import React from 'react'
// --- Loader Component (Added) ---
// --- Full Screen Loader (NO Chakra, NO Flex) ---
const Loader = () => (
  <div className="full-loader-overlay">
    <div className="spinner">
      <div></div><div></div><div></div><div></div><div></div>
    </div> 
    

    <style>{`
      .full-loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
      }

      .spinner {
        position: relative;
        width: 24.6px;
        height: 24.6px;
      }

      .spinner div {
        animation: spinner-4t3wzl 2.25s infinite backwards;
        background-color: #057718;
        border-radius: 50%;
        height: 100%;
        position: absolute;
        width: 100%;
      }

      .spinner div:nth-child(1) {
        animation-delay: 0.18s;
        background-color: rgba(5,119,24,0.9);
      }
      .spinner div:nth-child(2) {
        animation-delay: 0.36s;
        background-color: rgba(5,119,24,0.8);
      }
      .spinner div:nth-child(3) {
        animation-delay: 0.54s;
        background-color: rgba(5,119,24,0.7);
      }
      .spinner div:nth-child(4) {
        animation-delay: 0.72s;
        background-color: rgba(5,119,24,0.6);
      }
      .spinner div:nth-child(5) {
        animation-delay: 0.9s;
        background-color: rgba(5,119,24,0.5);
      }

      @keyframes spinner-4t3wzl {
        0% { transform: rotate(0deg) translateY(-200%); }
        60%, 100% { transform: rotate(360deg) translateY(-200%); }
      }
    `}</style>
  </div>
);


export default Loader;
