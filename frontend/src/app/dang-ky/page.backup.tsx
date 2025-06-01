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

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate password meets minimum requirements
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Verify OTP with the server
  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Xác thực không thành công');
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi xác thực OTP:', error);
      throw error;
    }
  };

  // Handle form submission
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

  // Handle user registration
  const handleRegistration = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess('Đang xử lý đăng ký...');
    
    try {
      // Validate form data
      if (!formData.email) throw new Error('Vui lòng nhập địa chỉ email');
      if (!validateEmail(formData.email)) throw new Error('Địa chỉ email không hợp lệ');
      if (!formData.password) throw new Error('Vui lòng nhập mật khẩu');
      if (!validatePassword(formData.password)) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      if (formData.password !== formData.confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');
      if (!formData.agreeToTerms) throw new Error('Vui lòng đồng ý với điều khoản sử dụng');
      
      // Call registration API
      const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.email.split('@')[0]
        })
      });
      
      const registerData = await registerResponse.json().catch(() => ({}));
      
      if (!registerResponse.ok || !registerData.success) {
        throw new Error(registerData.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
      }
      
      // Save email and proceed to OTP step
      setPendingEmail(formData.email);
      setStep('verify_otp');
      setSuccess('Mã xác thực đang được gửi đến email của bạn...');
      
      // Send OTP asynchronously
      (async () => {
        try {
          const otpResponse = await fetch('http://localhost:3000/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: formData.email, 
              type: 'register' 
            })
          });
          
          const otpResult = await otpResponse.json().catch(() => ({}));
          
          if (otpResponse.ok && otpResult.success) {
            setSuccess('Mã xác thực đã được gửi đến email của bạn');
          } else {
            throw new Error(otpResult.message || 'Không thể gửi mã OTP');
          }
        } catch (otpError: any) {
          console.error('Lỗi khi gửi OTP:', otpError);
          setError(otpError.message || 'Có lỗi xảy ra khi gửi mã OTP');
        }
      })();
      
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      setError(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerification = async () => {
    if (!formData.otp) {
      setError('Vui lòng nhập mã xác thực');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('Đang xác thực...');

    try {
      const email = pendingEmail || formData.email;
      const isValid = await verifyOTP(email, formData.otp);
      
      if (isValid) {
        setSuccess('Xác thực thành công! Đang chuyển hướng...');
        
        // Auto-login after successful verification
        try {
          const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              password: formData.password
            })
          });

          if (loginResponse.ok) {
            const data = await loginResponse.json();
            if (data.access_token) {
              localStorage.setItem('access_token', data.access_token);
              router.push('/');
            }
          } else {
            router.push('/dang-nhap');
          }
        } catch (loginError) {
          console.error('Lỗi đăng nhập tự động:', loginError);
          router.push('/dang-nhap');
        }
      }
    } catch (error: any) {
      console.error('Lỗi xác thực OTP:', error);
      setError(error.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP resend
  const handleResendOtp = async () => {
    if (!pendingEmail && !formData.email) {
      setError('Không tìm thấy địa chỉ email');
      return;
    }

    const email = pendingEmail || formData.email;
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('Đang gửi lại mã xác thực...');
      
      const response = await fetch('http://localhost:3000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          type: 'register' 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại mã OTP');
      }
      
      setSuccess('Đã gửi lại mã xác thực thành công');
    } catch (error: any) {
      console.error('Lỗi khi gửi lại OTP:', error);
      setError(error.message || 'Đã xảy ra lỗi khi gửi lại mã OTP');
    } finally {
      setIsSubmitting(false);
    }
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

  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
    setIsSubmitting(true);
    setError('');
    setSuccess('Đang xử lý đăng ký...');
    
    try {
      // Validate dữ liệu
      if (!formData.email) throw new Error('Vui lòng nhập địa chỉ email');
      if (!validateEmail(formData.email)) throw new Error('Địa chỉ email không hợp lệ');
      if (!formData.password) throw new Error('Vui lòng nhập mật khẩu');
      if (!validatePassword(formData.password)) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      if (formData.password !== formData.confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');
      if (!formData.agreeToTerms) throw new Error('Vui lòng đồng ý với điều khoản sử dụng');
      
      // Gọi API đăng ký
      const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.email.split('@')[0]
        })
      });
      
      const registerData = await registerResponse.json().catch(() => ({}));
      
      if (!registerResponse.ok || !registerData.success) {
        throw new Error(registerData.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
      }
      
      // Lưu email và chuyển sang bước OTP
      setPendingEmail(formData.email);
      setStep('verify_otp');
      setSuccess('Mã xác thực đang được gửi đến email của bạn...');
      
      // Gửi OTP bất đồng bộ
      (async () => {
        try {
          const otpResponse = await fetch('http://localhost:3000/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: formData.email, 
              type: 'register' 
            })
          });
          
          const otpResult = await otpResponse.json().catch(() => ({}));
          
          if (otpResponse.ok && otpResult.success) {
            setSuccess('Mã xác thực đã được gửi đến email của bạn');
          } else {
            throw new Error(otpResult.message || 'Không thể gửi mã OTP');
          }
        } catch (otpError: any) {
          console.error('Lỗi khi gửi OTP:', otpError);
          setError(otpError.message || 'Có lỗi xảy ra khi gửi mã OTP');
        }
      })();
      
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      setError(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!formData.otp) {
      setError('Vui lòng nhập mã xác thực');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('Đang xác thực...');

    try {
      const email = pendingEmail || formData.email;
      const isValid = await verifyOTP(email, formData.otp);
      
      if (isValid) {
        setSuccess('Xác thực thành công! Đang chuyển hướng...');
        
        // Đăng nhập tự động sau khi xác thực
        try {
          const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              password: formData.password
            })
          });

          if (loginResponse.ok) {
            const data = await loginResponse.json();
            if (data.access_token) {
              localStorage.setItem('access_token', data.access_token);
              router.push('/');
            }
          } else {
            router.push('/dang-nhap');
          }
        } catch (loginError) {
          console.error('Lỗi đăng nhập tự động:', loginError);
          router.push('/dang-nhap');
        }
      }
    } catch (error: any) {
      console.error('Lỗi xác thực OTP:', error);
      setError(error.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail && !formData.email) {
      setError('Không tìm thấy địa chỉ email');
      return;
    }

    const email = pendingEmail || formData.email;
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('Đang gửi lại mã xác thực...');
      
      const response = await fetch('http://localhost:3000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          type: 'register' 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại mã OTP');
      }
      
      setSuccess('Đã gửi lại mã xác thực thành công');
    } catch (error: any) {
      console.error('Lỗi khi gửi lại OTP:', error);
      setError(error.message || 'Đã xảy ra lỗi khi gửi lại mã OTP');
    } finally {
      setIsSubmitting(false);
    }
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

  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
    // Đặt trạng thái loading
    setIsSubmitting(true);
    setError('');
    setSuccess('Đang xử lý đăng ký...');
    
    try {
      // Validate dữ liệu
      if (!formData.email) throw new Error('Vui lòng nhập địa chỉ email');
      if (!validateEmail(formData.email)) throw new Error('Địa chỉ email không hợp lệ');
      if (!formData.password) throw new Error('Vui lòng nhập mật khẩu');
      if (!validatePassword(formData.password)) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      if (formData.password !== formData.confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');
      if (!formData.agreeToTerms) throw new Error('Vui lòng đồng ý với điều khoản sử dụng');
      
      console.log('Đang gửi yêu cầu đăng ký...');
      
      // Gọi API đăng ký
      const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.email.split('@')[0]
        })
      });
      
      // Xử lý response
      const registerData = await registerResponse.json().catch(() => ({}));
      console.log('Phản hồi đăng ký:', registerData);
      
      if (!registerResponse.ok || !registerData.success) {
        throw new Error(registerData.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
      }
      
      // Lưu email và chuyển sang bước OTP
      setPendingEmail(formData.email);
      setStep('verify_otp');
      setSuccess('Mã xác thực đang được gửi đến email của bạn...');
      
      // Gửi OTP bất đồng bộ
      (async () => {
        try {
          console.log('Đang gửi OTP đến:', formData.email);
          const otpResponse = await fetch('http://localhost:3000/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, type: 'register' })
          });
          
          const otpResult = await otpResponse.json().catch(() => ({}));
          console.log('Phản hồi OTP:', otpResult);
          
          if (otpResponse.ok && otpResult.success) {
            setSuccess('Mã xác thực đã được gửi đến email của bạn');
          } else {
            console.error('Lỗi gửi OTP:', otpResult.message || 'Lỗi không xác định');
            setError('Không thể gửi mã OTP. Vui lòng thử lại sau ít phút.');
          }
        } catch (otpError) {
          console.error('Lỗi khi gửi OTP:', otpError);
          setError('Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại.');
        }
      })();
      
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      setError(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
          resolve(true);
        }, 0);
      });
      
    } catch (err: any) {
      console.error('Lỗi khi đăng ký:', err);
      setError(err.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
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
      throw new Error('Mã xác thực phải có đúng 6 chữ số');
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      // Lấy thông tin đăng ký tạm thời
      const pendingData = sessionStorage.getItem('pendingRegistration');
      if (!pendingData) {
        throw new Error('Không tìm thấy thông tin đăng ký. Vui lòng thử lại.');
      }

      const { email } = JSON.parse(pendingData);
      
      // Gọi API xác thực OTP
      const isVerified = await verifyOTP(email, formData.otp);
      
      if (isVerified) {
        // Xóa dữ liệu tạm thời
        sessionStorage.removeItem('pendingRegistration');
        
        // Chuyển hướng về trang đăng nhập
        setSuccess('Xác thực thành công! Đang chuyển hướng...');
        setTimeout(() => {
          router.push('/dang-nhap');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Lỗi xác thực OTP:', err);
      setError(err.message || 'Xác thực thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setError('');
      setSuccess('');
      setIsSubmitting(true);

      // Lấy thông tin đăng ký tạm thời
      const pendingData = sessionStorage.getItem('pendingRegistration');
      if (!pendingData) {
        throw new Error('Không tìm thấy thông tin đăng ký. Vui lòng thử lại.');
      }

      const { email } = JSON.parse(pendingData);

      // Gọi API gửi lại OTP
      const otpResponse = await fetch('http://localhost:3000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: email,
          type: 'register' 
        })
      });

      const otpData = await otpResponse.json();
      
      if (!otpResponse.ok) {
        throw new Error(otpData.message || 'Không thể gửi lại mã OTP');
      }

      setSuccess('Đã gửi lại mã xác thực thành công');
    } catch (err: any) {
      console.error('Lỗi khi gửi lại OTP:', err);
      setError(err.message || 'Có lỗi xảy ra khi gửi lại mã OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'register' ? 'Đăng ký tài khoản' : 'Xác thực tài khoản'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'register' ? (
              <>
                Đã có tài khoản?{' '}
                <Link href="/dang-nhap" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Đăng nhập ngay
                </Link>
              </>
            ) : (
              `Mã xác thực đã được gửi đến ${pendingEmail}`
            )}
          </p>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Thông báo thành công */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {step === 'register' ? (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Địa chỉ email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="full_name" className="sr-only">
                  Họ và tên (tùy chọn)
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Họ và tên (tùy chọn)"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword.password ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {showPassword.password ? (
                    <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Xác nhận mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showPassword.confirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md shadow-sm">
              <label htmlFor="otp" className="sr-only">
                Mã xác thực
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nhập mã xác thực 6 số"
                value={formData.otp}
                onChange={handleChange}
              />
            </div>
          )}

          {step === 'register' && (
            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.agreeToTerms}
                onChange={handleChange}
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                Tôi đồng ý với{' '}
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Điều khoản dịch vụ
                </a>{' '}
                và{' '}
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Chính sách bảo mật
                </a>
              </label>
            </div>
          )}

          {step === 'verify_otp' && (
            <div className="text-sm text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang gửi lại...' : 'Gửi lại mã xác thực'}
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                'Đang xử lý...'
              ) : step === 'register' ? (
                'Đăng ký'
              ) : (
                'Xác thực'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
