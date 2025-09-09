import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from 'antd';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        "token": {
          "colorPrimary": "#6d4c41",
          "colorInfo": "#6d4c41",
          "colorLink": "#4a7831",
          "colorTextBase": "#6d4c41",
          "colorBgBase": "#ffffff",
          "wireframe": false,
          "borderRadius": 16,
          "colorTextSecondary": "#666666",
          "colorLinkActive": "#556946"
        }
      }}
    >
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ConfigProvider>
  </React.StrictMode>
);
