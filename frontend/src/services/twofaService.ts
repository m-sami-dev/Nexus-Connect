import API from './api';

export const sendOtp = async () => {
  const response = await API.post('auth/2fa/send-otp/');
  return response.data;
};

export const verifyOtp = async (otpCode: string) => {
  const response = await API.post('auth/2fa/verify-otp/', { otp_code: otpCode });
  return response.data;
};

export const disable2FA = async () => {
  const response = await API.post('auth/2fa/disable/');
  return response.data;
};