
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider, theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';

dayjs.locale('zh-tw');

// Simulating Locale object since we can't import json in browser esm easily without plugin
const zhTW = { locale: 'zh-tw' }; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhTW}
      theme={{
        token: {
          colorPrimary: '#1890ff', // CloudSchool Blue
          fontFamily: "'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', sans-serif",
          borderRadius: 4,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
