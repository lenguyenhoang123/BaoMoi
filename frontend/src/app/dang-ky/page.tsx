'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, XCircle, CheckCircle } from 'lucide-react';
import { FieldTimeOutlined } from '@ant-design/icons';

type BuocDangKy = 'dang_ky' | 'xac_thuc_otp';

interface DuLieuForm {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  otp: string;
  agreeToTerms: boolean;
}

export default function TrangDangKy() {
  const router = useRouter();
  const [buocHienTai, setBuocHienTai] = useState<BuocDangKy>('dang_ky');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loi, setLoi] = useState('');
  const [thanhCong, setThanhCong] = useState('');
  const [emailChoXuLy, setEmailChoXuLy] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState({
    password: false,
    confirmPassword: false
  });
  
  const [formData, setFormData] = useState<DuLieuForm>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    otp: '',
    agreeToTerms: false,
  });

  // Chuyển đổi hiển thị mật khẩu
  const chuyenDoiHienThiMatKhau = (truong: 'password' | 'confirmPassword') => {
    setHienMatKhau(prev => ({
      ...prev,
      [truong]: !prev[truong]
    }));
  };

  // Xử lý thay đổi input
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Kiểm tra định dạng email
  const kiemTraEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Kiểm tra mật khẩu hợp lệ
  const kiemTraMatKhau = (matKhau: string): boolean => {
    return matKhau.length >= 6;
  };

  // Xác thực OTP với máy chủ
  const xacThucOTP = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
    console.log('Bắt đầu xác thực OTP cho email:', email);
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Tạo controller để có thể hủy request nếu cần
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      console.log('Đang gửi yêu cầu xác thực OTP...');
      const response = await fetch('http://localhost:3000/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ 
          email, 
          otp,
          source: 'web'
        }),
        credentials: 'include',
        signal: controller.signal
      });
      
      // Clear timeout nếu request hoàn thành
      clearTimeout(timeoutId);
      
      console.log('Nhận được phản hồi từ server:', response.status);
      
      // Xử lý phản hồi
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Lỗi máy chủ: ${response.status}`
        }));
        throw new Error(errorData.message || 'Xác thực không thành công');
      }
      
      const data = await response.json();
      return { 
        success: data.success === true, 
        message: data.message || 'Xác thực thành công',
        ...data
      };
      
    } catch (error: any) {
      console.error('Lỗi khi xác thực OTP:', error);
      if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('aborted')) {
        throw new Error('Mất kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
      throw new Error(error.message || 'Đã xảy ra lỗi khi xác thực. Vui lòng thử lại sau.');
    } finally {
      // Đảm bảo luôn clear timeout
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  // Xử lý gửi form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoi('');
    setThanhCong('');
    
    try {
      if (buocHienTai === 'xac_thuc_otp') {
        await xuLyXacThucOTP();
      } else {
        await xuLyDangKy();
      }
    } catch (err: any) {
      console.error('Lỗi:', err);
      setLoi(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setDangXuLy(false);
    }
  };

  // Xử lý đăng ký người dùng
  const xuLyDangKy = async () => {
    setDangXuLy(true);
    setLoi('');
    setThanhCong('Đang xử lý đăng ký...');
    
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!formData.email) throw new Error('Vui lòng nhập địa chỉ email');
      if (!kiemTraEmail(formData.email)) throw new Error('Địa chỉ email không hợp lệ');
      if (!formData.password) throw new Error('Vui lòng nhập mật khẩu');
      if (!kiemTraMatKhau(formData.password)) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      if (formData.password !== formData.confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');
      if (!formData.agreeToTerms) throw new Error('Vui lòng đồng ý với điều khoản sử dụng');
      
      // Gọi API đăng ký
      const phanHoi = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.email.split('@')[0]
        })
      });
      
      const duLieu = await phanHoi.json().catch(() => ({}));
      
      if (!phanHoi.ok || !duLieu.success) {
        throw new Error(duLieu.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
      }
      
      // Lưu email và chuyển sang bước xác thực OTP
      setEmailChoXuLy(formData.email);
      setBuocHienTai('xac_thuc_otp');
      setThanhCong('Mã xác thực đang được gửi đến email của bạn...');
      
      // Gửi OTP bất đồng bộ
      (async () => {
        try {
          const phanHoiOTP = await fetch('http://localhost:3000/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: formData.email, 
              type: 'register' 
            })
          });
          
          const ketQuaOTP = await phanHoiOTP.json().catch(() => ({}));
          
          if (phanHoiOTP.ok && ketQuaOTP.success) {
            setThanhCong('Mã xác thực đã được gửi đến email của bạn');
          } else {
            throw new Error(ketQuaOTP.message || 'Không thể gửi mã OTP');
          }
        } catch (loiOTP: any) {
          console.error('Lỗi khi gửi OTP:', loiOTP);
          setLoi(loiOTP.message || 'Có lỗi xảy ra khi gửi mã OTP');
        }
      })();
      
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      setLoi(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setDangXuLy(false);
    }
  };

  // Xử lý xác thực OTP
  const xuLyXacThucOTP = async () => {
    if (!formData.otp) {
      setLoi('Vui lòng nhập mã xác thực');
      return;
    }

    setDangXuLy(true);
    setLoi('');
    setThanhCong('Đang xác thực...');

    try {
      const email = emailChoXuLy || formData.email;
      if (!email) {
        throw new Error('Không tìm thấy thông tin email');
      }

      // Xác thực OTP
      const result = await xacThucOTP(email, formData.otp);
      
      if (result.success) {
        setThanhCong('Xác thực thành công! Đang đăng nhập...');
        
        // Tự động đăng nhập sau khi xác thực thành công
        try {
          setThanhCong('Đang đăng nhập tự động...');
          
          const phanHoiDangNhap = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              password: formData.password
            }),
            credentials: 'include'
          });
          
          if (!phanHoiDangNhap.ok) {
            throw new Error('Đăng nhập thất bại');
          }
          
          const duLieuDangNhap = await phanHoiDangNhap.json();
          
          if (duLieuDangNhap.accessToken) {
            // Xóa token cũ và lưu token mới
            localStorage.removeItem('accessToken');
            localStorage.setItem('accessToken', duLieuDangNhap.accessToken);
            
            // Xóa mật khẩu khỏi state
            setFormData(prev => ({ ...prev, password: '' }));
            
            setThanhCong('Xác thực và đăng nhập thành công! Đang chuyển hướng...');
            
            // Chuyển hướng sau 1.5 giây
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          } else {
            throw new Error(duLieuDangNhap.message || 'Không nhận được token đăng nhập');
          }
        } catch (loiDangNhap: any) {
          console.error('Lỗi khi đăng nhập tự động:', loiDangNhap);
          setThanhCong('Xác thực thành công! Vui lòng đăng nhập để tiếp tục.');
          
          // Xóa mật khẩu khỏi state
          setFormData(prev => ({ ...prev, password: '' }));
          
          // Chuyển hướng sau 2 giây
          setTimeout(() => {
            window.location.href = '/dang-nhap';
          }, 2000);
        }
      } else {
        throw new Error(result.message || 'Mã xác thực không hợp lệ');
      }
    } catch (error: any) {
      console.error('Lỗi xác thực OTP:', error);
      setLoi(error.message || 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.');
    } finally {
      setDangXuLy(false);
    }
  };

  // Gửi lại mã OTP
  const guiLaiOTP = async () => {
    const email = emailChoXuLy || formData.email;
    if (!email) {
      setLoi('Không tìm thấy email để gửi lại mã OTP');
      return;
    }

    setDangXuLy(true);
    setLoi('');
    setThanhCong('Đang gửi lại mã xác thực...');

    try {
      const phanHoi = await fetch('http://localhost:3000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ 
          email: email,
          type: 'register' 
        }),
        credentials: 'include'
      });
      
      if (!phanHoi.ok) {
        const errorData = await phanHoi.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể gửi lại mã OTP');
      }
      
      const duLieu = await phanHoi.json();
      
      if (duLieu.success) {
        setThanhCong('✅ Đã gửi lại mã xác thực thành công. Vui lòng kiểm tra email của bạn.');
        
        // Tự động ẩn thông báo sau 5 giây
        setTimeout(() => {
          setThanhCong('');
        }, 5000);
      } else {
        throw new Error(duLieu.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    } catch (error: any) {
      console.error('Lỗi khi gửi lại OTP:', error);
      setLoi(`❌ ${error.message || 'Đã xảy ra lỗi khi gửi lại mã OTP. Vui lòng thử lại.'}`);
      
      // Tự động ẩn thông báo lỗi sau 5 giây
      setTimeout(() => {
        setLoi('');
      }, 5000);
    } finally {
      setDangXuLy(false);
    }
  };

  const renderDangKyForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          placeholder="Nhập họ và tên của bạn"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          placeholder="email@example.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mật khẩu <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            type={hienMatKhau.password ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border pr-10"
            placeholder="Nhập mật khẩu"
            required
          />
          <button
            type="button"
            onClick={() => chuyenDoiHienThiMatKhau('password')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800"
          >
            {hienMatKhau.password ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Xác nhận mật khẩu <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            type={hienMatKhau.confirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border pr-10"
            placeholder="Nhập lại mật khẩu"
            required
          />
          <button
            type="button"
            onClick={() => chuyenDoiHienThiMatKhau('confirmPassword')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800"
          >
            {hienMatKhau.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
            Tôi đồng ý với <Link href="/dieu-khoan" className="text-blue-600 hover:text-blue-500">Điều khoản dịch vụ</Link> và <Link href="/chinh-sach" className="text-blue-600 hover:text-blue-500">Chính sách bảo mật</Link>
          </label>
        </div>
      </div>

      {loi && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{loi}</h3>
            </div>
          </div>
        </div>
      )}

      {thanhCong && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{thanhCong}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={dangXuLy}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${dangXuLy ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {dangXuLy ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </div>
    </form>
  );

  const renderXacThucOTPForm = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Xác thực email</h2>
        <p className="mt-1 text-sm text-gray-600">
          Chúng tôi đã gửi mã xác thực đến <span className="font-medium">{emailChoXuLy}</span>.
          Vui lòng nhập mã để hoàn tất đăng ký.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
            Mã xác thực <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="otp"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="Nhập mã xác thực 6 chữ số"
              required
              maxLength={6}
            />
          </div>
        </div>

        {loi && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{loi}</h3>
              </div>
            </div>
          </div>
        )}

        {thanhCong && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{thanhCong}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={guiLaiOTP}
            disabled={dangXuLy}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-blue-400"
          >
            Gửi lại mã
          </button>
          <button
            type="submit"
            disabled={dangXuLy}
            className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${dangXuLy ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {dangXuLy ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </div>
      </form>

      <div className="text-sm text-center">
        <button
          type="button"
          onClick={() => setBuocHienTai('dang_ky')}
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          ← Quay lại đăng ký
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          {buocHienTai === 'dang_ky' ? 'Tạo tài khoản mới' : 'Xác thực email'}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {buocHienTai === 'dang_ky' ? (
            <>
              Đã có tài khoản?{' '}
              <Link href="/dang-nhap" className="font-medium text-blue-600 hover:text-blue-500">
                Đăng nhập ngay
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {buocHienTai === 'dang_ky' ? renderDangKyForm() : renderXacThucOTPForm()}
        </div>
      </div>
    </div>
  );
}
