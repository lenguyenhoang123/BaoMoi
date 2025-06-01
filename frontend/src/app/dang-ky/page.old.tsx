'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, XCircle, CheckCircle } from 'lucide-react';

type RegisterStep = 'register' | 'verify_otp';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  otp: string;
  agreeToTerms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('register');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    otp: '',
    agreeToTerms: false,
  });

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Hàm kiểm tra OTP
  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    console.log('Gọi API xác thực OTP cho email:', email);
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      console.log('Phản hồi từ API xác thực OTP:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Lỗi xác thực OTP:', errorData);
        throw new Error(errorData.message || 'Xác thực không thành công');
      }

      return true;
    } catch (error) {
      console.error('Lỗi khi xác thực OTP:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (step === 'verify_otp') {
        await handleOtpVerification();
      } else {
        await handleRegistration();
      }
    } catch (err: any) {
      console.error('Lỗi:', err);
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRegistration = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!formData.email) {
      throw new Error('Vui lòng nhập địa chỉ email');
    }
    
    if (!validateEmail(formData.email)) {
      throw new Error('Địa chỉ email không hợp lệ');
    }
    
    if (!formData.password) {
      throw new Error('Vui lòng nhập mật khẩu');
    }
    
    if (!validatePassword(formData.password)) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }
    
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp');
    }
    
    if (!formData.agreeToTerms) {
      throw new Error('Vui lòng đồng ý với điều khoản sử dụng');
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Gọi API đăng ký
      console.log('Đang đăng ký tài khoản...');
      const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.email.split('@')[0]
        })
      });
      
      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        throw new Error(registerData.message || 'Đăng ký thất bại');
      }
      
      // 2. Gửi yêu cầu OTP
      console.log('Đang gửi mã OTP...');
      const otpResponse = await fetch('http://localhost:3000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          type: 'register' 
        })
      });
      
      const otpData = await otpResponse.json();
      
      if (!otpResponse.ok) {
        throw new Error(otpData.message || 'Không thể gửi mã OTP');
      }
      
      // Lưu thông tin đăng ký tạm thời
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      }));
      
      setPendingEmail(formData.email);
      setStep('verify_otp');
      setSuccess('Mã xác thực đã được gửi đến email của bạn');
      
    } catch (err: any) {
      console.error('Lỗi khi đăng ký:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOtpVerification = async () => {
    if (!formData.otp) {
      throw new Error('Vui lòng nhập mã xác thực');
    }
    
    // Kiểm tra định dạng OTP (6 chữ số)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(formData.otp)) {
      throw new Error('Mã xác thực phải là 6 chữ số');
    }
    
    setIsSubmitting(true);
    
    try {
      // Xác thực OTP với email đã lưu
      const emailToVerify = pendingEmail || formData.email;
      const isVerified = await verifyOTP(emailToVerify, formData.otp);
      
      if (isVerified) {
        // Xóa dữ liệu tạm sau khi xác thực thành công
        sessionStorage.removeItem('pendingRegistration');
        
        setSuccess('Xác thực thành công! Đang chuyển hướng...');
        
        // Chuyển hướng về trang đăng nhập sau 1.5 giây
        setTimeout(() => {
          router.push('/dang-nhap');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Lỗi khi xác thực OTP:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    
    try {
      const emailToResend = pendingEmail || formData.email;
      if (!emailToResend) {
        throw new Error('Không tìm thấy địa chỉ email');
      }
      
      setIsSubmitting(true);
      
      const response = await fetch('http://localhost:3000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: emailToResend,
          type: 'register' 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại mã OTP');
      }
      
      setSuccess('Đã gửi lại mã xác thực thành công');
      
    } catch (err: any) {
      console.error('Lỗi khi gửi lại mã OTP:', err);
      setError(err.message || 'Đã xảy ra lỗi khi gửi lại mã OTP');
    } finally {
      setIsSubmitting(false);
    }
  };
    }

    // Kiểm tra điều khoản
    if (!formData.agreeToTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('Đang đăng ký tài khoản mới...');
      
      // 1. Gọi API đăng ký
      const registerResponse = await fetch('http://localhost:3005/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.email.split('@')[0]
        })
      });

      const registerData = await registerResponse.json();
      console.log('Phản hồi đăng ký:', registerData);

      if (!registerResponse.ok) {
        throw new Error(registerData.message || 'Đăng ký thất bại');
      }

      // 2. Gửi yêu cầu OTP sau khi đăng ký thành công
      console.log('Đang gửi yêu cầu OTP...');
      const otpResponse = await fetch('http://localhost:3005/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          type: 'register' 
        })
      });

      const otpData = await otpResponse.json();
      console.log('Phản hồi gửi OTP:', otpData);

      if (!otpResponse.ok) {
        throw new Error(otpData.message || 'Không thể gửi mã OTP');
      }

      // Lưu thông tin đăng ký tạm thời
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      }));

      setSuccess('Mã xác thực đã được gửi đến email của bạn');
      setStep('verify_otp');
      setFormData(prev => ({ ...prev, otp: '' }));
      
    } catch (err: any) {
      console.error('Lỗi trong quá trình đăng ký:', err);
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      console.log('Đang gửi yêu cầu OTP...');
      
      const response = await fetch('http://localhost:3005/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          email: formData.email.trim(),
          type: 'register'
        })
      });

      clearTimeout(timeoutId);
      console.log('Nhận được phản hồi từ server:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể gửi mã xác thực');
      }

      const data = await response.json();
      console.log('OTP response:', data);

      // Lưu thông tin đăng ký tạm thời để sử dụng sau khi xác thực OTP
      const registrationData = {
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim()
      };
      
      sessionStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
      console.log('Đã lưu thông tin đăng ký tạm thời');

      setPendingEmail(formData.email);
      setStep('verify_otp');
      setSuccess('Mã xác thực đã được gửi đến email của bạn');
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Lỗi khi gửi yêu cầu OTP:', err);
      
      let errorMessage = 'Đã xảy ra lỗi khi gửi mã xác thực';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối mạng và thử lại.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail) {
      console.error('Không tìm thấy email để gửi lại OTP');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      console.log('Gửi lại OTP cho email:', pendingEmail);
      
      const response = await fetch('http://localhost:3005/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: pendingEmail,
          type: 'register'
        })
      });
      
      const responseData = await response.json().catch(() => ({}));
      console.log('Phản hồi gửi lại OTP:', response.status, responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Gửi lại mã xác thực không thành công');
      }
      
      setSuccess('Đã gửi lại mã xác thực. Vui lòng kiểm tra email của bạn.');
    } catch (err: any) {
      console.error('Lỗi khi gửi lại mã xác thực:', err);
      setError(err.message || 'Đã xảy ra lỗi khi gửi lại mã xác thực');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
          <Link href="/" className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-6 inline-block">
            BÁO MỚI
          </Link>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="mt-2 text-center text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {step === 'register' ? 'Đăng ký tài khoản' : 'Xác thực OTP'}
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            {step === 'register' ? (
              'Đã có tài khoản? ' 
            ) : (
              'Mã xác thực đã được gửi đến ' + (pendingEmail || formData.email)
            )}
            {step === 'register' && (
              <Link 
                href="/dang-nhap" 
                className="font-semibold text-red-600 hover:text-red-500 transition-colors duration-200"
              >
                Đăng nhập ngay
              </Link>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="bg-white/90 backdrop-blur-sm py-8 px-6 shadow-xl border border-gray-100 rounded-2xl sm:px-10 transform transition-all duration-500 hover:shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {step === 'register' ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Họ và tên
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Nhập địa chỉ email"
                    />
                  </div>
                  

                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Mật khẩu
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword.password ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Nhập mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                      >
                        {showPassword.password ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Xác nhận mật khẩu
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword.confirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Nhập lại mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                      >
                        {showPassword.confirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
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
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                      Tôi đồng ý với <Link href="/dieu-khoan" className="text-red-600 hover:text-red-500">Điều khoản sử dụng</Link>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Mã xác thực 6 số
                  </label>
                  <div className="mt-1">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={formData.otp}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-center text-xl tracking-widest"
                      placeholder="------"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      className={`text-sm font-medium ${isSubmitting ? 'text-gray-400' : 'text-red-600 hover:text-red-500'}`}
                    >
                      Gửi lại mã xác thực
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium">
                      {step === 'register' ? 'Đang đăng ký...' : 'Đang xác thực...'}
                    </span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{step === 'register' ? 'Đăng ký' : 'Xác thực'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
