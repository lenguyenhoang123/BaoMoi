'use client';

import { useEffect } from 'react';
import { App as AntdApp, message, notification } from 'antd';

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] = notification.useNotification();

  useEffect(() => {
    // Set global message and notification
    message.config({
      top: 100,
      duration: 3,
      maxCount: 3,
    });

    notification.config({
      placement: 'topRight',
      top: 24,
      duration: 4.5,
    });
  }, []);

  return (
    <>
      {contextHolder}
      {notificationContextHolder}
      <AntdApp>
        {children}
      </AntdApp>
    </>
  );
}
