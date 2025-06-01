import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    // Thêm các token khác nếu cần
  },
  components: {
    // Tắt hiệu ứng wave để tránh cảnh báo
    Button: {
      borderRadius: 6,
      colorPrimary: '#1890ff',
    },
    // Tối ưu Modal để tránh findDOMNode
    Modal: {
      // Sử dụng cấu hình mặc định
    },
  },
};
