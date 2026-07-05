import React, { useState } from 'react';
import { User as UserIcon, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { sendOtp, verifyOtp, disable2FA } from '../../services/twofaService';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  // Local states for the Profile Update Form
  const [name, setName] = useState(user?.name || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [industry, setIndustry] = useState(user?.industry || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  // Status tracking states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA states
  const [is2faEnabled, setIs2faEnabled] = useState(user?.is2faEnabled || false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const handleEnable2FA = async () => {
    setOtpLoading(true);
    setOtpMessage(null);
    try {
      const res = await sendOtp();
      setOtpSent(true);
      setOtpMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setOtpMessage({ type: 'error', text: err.response?.data?.error || 'Failed to send code.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setOtpMessage({ type: 'error', text: 'Please enter the code sent to your email.' });
      return;
    }
    setOtpLoading(true);
    setOtpMessage(null);
    try {
      await verifyOtp(otpCode);
      setIs2faEnabled(true);
      setOtpSent(false);
      setOtpCode('');
      setOtpMessage({ type: 'success', text: 'Two-factor authentication enabled!' });
    } catch (err: any) {
      setOtpMessage({ type: 'error', text: err.response?.data?.error || 'Verification failed.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setOtpLoading(true);
    setOtpMessage(null);
    try {
      await disable2FA();
      setIs2faEnabled(false);
      setOtpSent(false);
      setOtpMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
    } catch (err: any) {
      setOtpMessage({ type: 'error', text: 'Failed to disable 2FA.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // Calling our clean context function synced with Django backend
      await updateProfile(user.id, {
        name,
        companyName,
        industry,
        bio
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
                <UserIcon size={18} className="mr-3" />
                Profile
              </button>
              
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Lock size={18} className="mr-3" />
                Security
              </button>
              
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Bell size={18} className="mr-3" />
                Notifications
              </button>
              
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Globe size={18} className="mr-3" />
                Language
              </button>
              
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Palette size={18} className="mr-3" />
                Appearance
              </button>
              
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <CreditCard size={18} className="mr-3" />
                Billing
              </button>
            </nav>
          </CardBody>
        </Card>
        
        {/* Main settings content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Alert Notification banner */}
                {message && (
                  <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="xl"
                  />
                  <div>
                    <Button type="button" variant="outline" size="sm">
                      Change Photo
                    </Button>
                    <p className="mt-2 text-sm text-gray-500">
                      JPG, GIF or PNG. Max size of 800K
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={user.email}
                    disabled
                  />
                  
                  <Input
                    label="Role"
                    value={user.role}
                    disabled
                  />
                  
                  <Input
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Nexus Connect Pvt"
                  />

                  <Input
                    label="Industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Fintech, Healthcare"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm p-2.5 bg-white border"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself or your investment strategy..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setName(user.name);
                      setCompanyName(user.companyName || '');
                      setIndustry(user.industry || '');
                      setBio(user.bio || '');
                      setMessage(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>

                {otpMessage && (
                  <div
                    className={`mb-3 p-2 rounded-md text-sm ${
                      otpMessage.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {otpMessage.text}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                    {is2faEnabled ? (
                      <Badge variant="success" className="mt-1">Enabled</Badge>
                    ) : (
                      <Badge variant="error" className="mt-1">Not Enabled</Badge>
                    )}
                  </div>

                  {is2faEnabled ? (
                    <Button type="button" variant="outline" onClick={handleDisable2FA} disabled={otpLoading}>
                      {otpLoading ? 'Please wait...' : 'Disable'}
                    </Button>
                  ) : !otpSent ? (
                    <Button type="button" variant="outline" onClick={handleEnable2FA} disabled={otpLoading}>
                      {otpLoading ? 'Sending...' : 'Enable'}
                    </Button>
                  ) : null}
                </div>

                {otpSent && !is2faEnabled && (
                  <div className="mt-4 flex items-end gap-3">
                    <Input
                      label="Enter verification code"
                      name="otp_verification_code"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit code"
                    />
                    <Button type="button" onClick={handleVerifyOtp} disabled={otpLoading}>
                      {otpLoading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                  />
                  
                  <Input
                    label="New Password"
                    type="password"
                  />
                  
                  <Input
                    label="Confirm New Password"
                    type="password"
                  />
                  
                  <div className="flex justify-end">
                    <Button type="button">Update Password</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};