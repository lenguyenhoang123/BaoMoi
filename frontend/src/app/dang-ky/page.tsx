'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Lock, Mail, User, Eye, EyeOff, CheckCircle, ArrowLeft, RefreshCw, Check, XCircle } from 'lucide-react';

// Màu sắc chủ đạo - Đồng bộ với giao diện chính
const colors = {
  // Màu chính (xanh dương đậm #1E40AF)
  primary: 'from-[#1E40AF] to-[#1E3A8A]',
  primaryHover: 'hover:from-[#1E3A8A] hover:to-[#1E3A8A]',
  primaryText: 'text-[#1E40AF]',
  primaryBorder: 'border-[#1E40AF]',
  
  // Màu phụ
  secondary: 'bg-blue-50',
  secondaryText: 'text-[#1E40AF]',
  
  // Màu nền
  background: 'bg-white',
  
  // Màu chữ
  text: 'text-gray-800',
  textLight: 'text-gray-600',
  
  // Input
  input: 'block w-full rounded-lg border border-gray-200 pl-3 pr-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200',
  
  // Button
  button: 'bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 shadow-md',
  
  // Checkbox
  checkbox: 'h-5 w-5 rounded border-2 border-gray-300 text-red-600 focus:ring-red-500 focus:ring-offset-0',
  
  // Alert
  error: 'text-red-600',
  errorBg: 'bg-red-50',
  errorBorder: 'border-red-200',
  success: 'text-green-600',
  successBg: 'bg-green-50',
  successBorder: 'border-green-200',
};

export default function TrangDangKy() {
  const router = useRouter();
  const [buocHienTai, setBuocHienTai] = useState<'dang_ky' | 'xac_thuc_otp'>('dang_ky');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loi, setLoi] = useState('');
  const [thanhCong, setThanhCong] = useState('');
  const [emailChoXuLy, setEmailChoXuLy] = useState('');
  const [thoiGianDemNguoc, setThoiGianDemNguoc] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    otp: '',
    agreeToTerms: false,
  });

  // Effect for countdown timer
  useEffect(() => {
    if (thoiGianDemNguoc <= 0) return;

    const timer = setInterval(() => {
      setThoiGianDemNguoc(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [thoiGianDemNguoc]);
  
  // Cập nhật thông báo đếm ngược
  useEffect(() => {
    if (thoiGianDemNguoc > 0) {
      const mins = Math.floor(thoiGianDemNguoc / 60);
      const secs = thoiGianDemNguoc % 60;
      const message = `Vui lòng đợi ${mins}:${secs < 10 ? '0' + secs : secs} trước khi yêu cầu mã mới`;
      setLoi(prev => prev !== message ? message : prev);
    } else if (loi?.includes('Vui lòng đợi')) {
      setLoi('');
    }
  }, [thoiGianDemNguoc, loi]);

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Alias for backward compatibility
  const handleChange = handleInputChange;

  // Validate email format
  const kiemTraEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate password
  const kiemTraMatKhau = (matKhau: string): boolean => {
    return matKhau.length >= 6;
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (buocHienTai === 'dang_ky') {
      xuLyDangKy();
    } else if (buocHienTai === 'xac_thuc_otp') {
      xuLyXacThucOTP();
    }
  };

  // Handle user registration
  const xuLyDangKy = async () => {
    setDangXuLy(true);
    setLoi('');
    setThanhCong('');

    // Validate form data
    if (formData.password !== formData.confirmPassword) {
      setLoi('Mật khẩu xác nhận không khớp');
      setDangXuLy(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setLoi('Vui lòng đồng ý với điều khoản sử dụng');
      setDangXuLy(false);
      return;
    }

    try {
      // Call register API via proxy
      const response = await fetch('/api/proxy/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name
        }),
        credentials: 'same-origin'
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // Nếu email đã tồn tại, hiển thị thông báo rõ ràng hơn
        if (response.status === 400 && data.message?.includes('đã được đăng ký')) {
          throw new Error(data.message + ' Bạn có muốn đăng nhập không?');
        }
        throw new Error(data.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
      }

      // Chuyển đến bước xác thực OTP
      setEmailChoXuLy(formData.email);
      setBuocHienTai('xac_thuc_otp');
      // Không tự động gửi OTP nữa, để người dùng tự bấm nút gửi lại
      setThanhCong('Vui lòng kiểm tra email để lấy mã xác thực. Nếu không thấy, vui lòng bấm nút "Gửi lại mã" bên dưới.');
      
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      
      // Nếu lỗi liên quan đến email đã tồn tại, hiển thị thông báo và nút đăng nhập
      if (error.message?.includes('đã được đăng ký')) {
        setLoi('Email này đã được đăng ký. Bạn có muốn đăng nhập không?');
        
        // Thêm nút đăng nhập vào giao diện
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
          errorElement.innerHTML = `
            <div class="text-red-700">
              <p>${error.message} Bạn có muốn đăng nhập không?</p>
              <div class="mt-2">
                <a href="/dang-nhap" class="text-indigo-600 hover:text-indigo-500 font-medium">
                  Đi đến trang đăng nhập →
                </a>
              </div>
            </div>
          `;
        }
      } else {
        setLoi(error.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.');
      }
    } finally {
      setDangXuLy(false);
    }
  };

  // Handle OTP verification
  const xuLyXacThucOTP = async () => {
    if (!formData.otp) {
      setLoi('Vui lòng nhập mã xác thực');
      return;
    }

    setDangXuLy(true);
    setLoi('');
    setThanhCong('');

    try {
      const email = emailChoXuLy || formData.email;
      if (!email) {
        throw new Error('Không tìm thấy email để xác thực');
      }

      // Call verify-email API via proxy
      const response = await fetch('/api/proxy/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          otp: formData.otp,
          type: 'register'
        }),
        credentials: 'same-origin'
      });

      const result = await response.json().catch(() => ({
        success: false,
        message: 'Lỗi khi xử lý phản hồi từ máy chủ'
      }));
      
      if (response.ok && result.success) {
        // Verification successful
        setThanhCong('Xác thực thành công! Đang chuyển hướng...');
        
        // Clear sensitive data
        setFormData(prev => ({ ...prev, password: '' }));
        
        // Redirect to login after delay
        setTimeout(() => {
          router.push('/dang-nhap');
        }, 1500);
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

  // Effect to handle countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (thoiGianDemNguoc > 0) {
      timer = setInterval(() => {
        setThoiGianDemNguoc(prev => {
          if (prev <= 1) {
            setLoi('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [thoiGianDemNguoc]);

  // Resend OTP
  // Gửi lại mã OTP
  const guiLaiMaOTP = async (): Promise<void> => {
    const email = emailChoXuLy || formData.email;
    if (!email) {
      setLoi('Không tìm thấy email để gửi lại mã OTP');
      return;
    }

    // Prevent multiple clicks during processing
    if (dangXuLy || thoiGianDemNguoc > 0) {
      return;
    }

    setDangXuLy(true);
    setLoi('');
    setThanhCong('Đang gửi lại mã xác thực...');

    try {
      const response = await fetch('/api/proxy/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          type: 'register'
        }),
        credentials: 'same-origin'
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // Handle cooldown error (400 with wait time)
        if (response.status === 400 && data.message?.match(/đợi|chờ|wait/i)) {
          // Extract minutes from error message (default to 15 minutes if not found)
          const waitMinutes = parseInt(data.message.match(/\d+/) || '15');
          const waitSeconds = waitMinutes * 60;
          
          // Update UI to show cooldown
          setThoiGianDemNguoc(waitSeconds);
          throw new Error(`Vui lòng đợi ${waitMinutes} phút trước khi yêu cầu mã mới`);
        } else {
          // Handle other errors
          throw new Error(data.message || 'Có lỗi xảy ra khi gửi lại mã OTP');
        }
      }

      // Reset countdown and show success message
      setThoiGianDemNguoc(60);
      setThanhCong('Đã gửi lại mã xác thực thành công!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setThanhCong('');
      }, 5000);
      
    } catch (error) {
      console.error('Lỗi khi gửi lại mã OTP:', error);
      setLoi(error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi lại mã OTP');
    } finally {
      setDangXuLy(false);
    }
  };
  
  // Alias for backward compatibility
  const guiLaiOTP = guiLaiMaOTP;
  
  // Alias for icons
  const ArrowPathIcon = RefreshCw;
  const CheckIcon = Check;
  const UserPlus = User;

  // Render OTP verification form
  const renderDangKyForm = () => (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Họ và tên */}
      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            value={formData.full_name}
            onChange={handleInputChange}
            className={`${colors.input} pl-10`}
            placeholder="Nhập họ và tên đầy đủ"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Địa chỉ email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={`${colors.input} pl-10`}
            placeholder="email@vidu.com"
          />
        </div>
      </div>

      {/* Mật khẩu */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-500">Tối thiểu 6 ký tự</span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={6}
            value={formData.password}
            onChange={handleInputChange}
            className={`${colors.input} pl-10 pr-10`}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Xác nhận mật khẩu */}
      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Xác nhận mật khẩu <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={6}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`${colors.input} pl-10 pr-10`}
            placeholder="Nhập lại mật khẩu"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Điều khoản dịch vụ */}
      <div className="flex items-start mt-5">
        <div className="flex items-center h-5">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            required
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className={`h-4 w-4 rounded ${colors.checkbox} focus:ring-0`}
          />
        </div>
        <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-600">
          Tôi đồng ý với{' '}
          <Link href="/dieu-khoan" className={`font-medium ${colors.primaryText} hover:underline`}>
            Điều khoản dịch vụ
          </Link>{' '}
          và{' '}
          <Link href="/bao-mat" className={`font-medium ${colors.primaryText} hover:underline`}>
            Chính sách bảo mật
          </Link>{' '}
          <span className="text-red-500">*</span>
        </label>
      </div>

      {/* Nút đăng ký */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="pt-2"
      >
        <button
          type="submit"
          disabled={dangXuLy}
          className={`w-full flex justify-center items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
        >
          {dangXuLy ? (
            <>
              <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">Đang xử lý...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              <span className="font-semibold">Đăng ký tài khoản</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Đăng nhập bằng mạng xã hội */}
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập bằng</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          type="button"
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.162 20 14.417 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.99 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.99 20 10z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </form>
  );

  // Render OTP verification form
  const renderXacThucOTPForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác thực tài khoản</h2>
        <p className="text-sm text-gray-600">
          Mã xác nhận đã được gửi đến <span className="font-semibold text-blue-800">{emailChoXuLy}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Vui lòng kiểm tra hộp thư đến hoặc thư mục spam</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
            Mã OTP <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={formData.otp}
              onChange={handleInputChange}
              className={`${colors.input} pl-12 pr-4 text-center tracking-[0.5em] font-mono text-2xl h-16 text-blue-900 font-bold`}
              placeholder="••••••"
              autoComplete="one-time-code"
              autoFocus
              disabled={dangXuLy}
              style={{ letterSpacing: '0.5em' }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Vui lòng nhập mã gồm 6 chữ số đã được gửi đến email của bạn
          </p>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={guiLaiMaOTP}
            disabled={thoiGianDemNguoc > 0 || dangXuLy}
            className={`text-sm font-medium transition-colors ${
              thoiGianDemNguoc > 0 || dangXuLy 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-700 hover:text-blue-900 hover:underline'
            }`}
          >
            {thoiGianDemNguoc > 0 ? (
              `Gửi lại mã sau ${thoiGianDemNguoc}s`
            ) : (
              'Gửi lại mã OTP'
            )}
          </button>
        </div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="pt-2"
        >
          <button
            type="submit"
            disabled={dangXuLy}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {dangXuLy ? (
              <>
                <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Đang xác thực...</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span className="font-semibold">Xác thực</span>
              </>
            )}
          </button>
        </motion.div>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-gray-600">
          Không nhận được mã?{' '}
          <button
            type="button"
            onClick={guiLaiMaOTP}
            disabled={thoiGianDemNguoc > 0 || dangXuLy}
            className={`font-medium ${
              thoiGianDemNguoc > 0 || dangXuLy 
                ? 'text-gray-400' 
                : 'text-blue-700 hover:text-blue-900 hover:underline'
            }`}
          >
            {thoiGianDemNguoc > 0 ? `Gửi lại sau (${thoiGianDemNguoc}s)` : 'Gửi lại mã'}
          </button>
        </p>
        
        <button
          type="button"
          onClick={() => setBuocHienTai('dang_ky')}
          className="mt-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại đăng ký
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Thông báo lỗi */}
      <div id="error-message">
        {loi && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 z-50 w-full max-w-md"
          >
            <div className={`${colors.errorBg} border-l-4 ${colors.errorBorder} p-4 rounded-r-lg shadow-lg`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <XCircle className={`h-5 w-5 ${colors.error}`} />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${colors.error}`}>{loi}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Thông báo thành công */}
      {thanhCong && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50 w-full max-w-md"
        >
          <div className={`${colors.successBg} border-l-4 ${colors.successBorder} p-4 rounded-r-lg shadow-lg`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className={`h-5 w-5 ${colors.success}`} />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${colors.success}`}>{thanhCong}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20"
        >
          <div className="px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {buocHienTai === 'dang_ky' ? 'Tạo tài khoản' : 'Xác thực Email'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {buocHienTai === 'dang_ky' ? (
                  <>
                    Đã có tài khoản?{' '}
                    <Link href="/dang-nhap" className={`font-medium ${colors.primaryText} hover:underline`}>
                      Đăng nhập ngay
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuocHienTai('dang_ky')}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors flex items-center justify-center mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Quay lại đăng ký
                  </button>
                )}
              </p>
            </div>

            <div className="mt-8">
              {buocHienTai === 'dang_ky' ? renderDangKyForm() : renderXacThucOTPForm()}
            </div>
          </div>
          
          {/* Viền màu gradient ở dưới */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        </motion.div>
      </div>
    </div>
  );
}
