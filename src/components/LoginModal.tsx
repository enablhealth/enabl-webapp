'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signInWithRedirect } from 'aws-amplify/auth';
import Link from 'next/link';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [username, setUsername] = useState('');
  const [resetUsername, setResetUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPasswords, setShowSignupPasswords] = useState(false);
  const [showResetPasswords, setShowResetPasswords] = useState(false);

  const { signIn, signUp, confirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword } = useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setError('');
    setNeedsConfirmation(false);
    setConfirmationCode('');
    setUsername('');
  setSuccess('');
    setIsResetMode(false);
    setResetStep('request');
    setResetUsername('');
    setResetCode('');
    setNewPassword('');
    setNewPasswordConfirm('');
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const switchToReset = () => {
    setIsResetMode(true);
    setResetStep('request');
    setError('');
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
  const usernameToReset = email.trim().toLowerCase();
      if (!usernameToReset) {
        setError('Please enter your email');
        return;
      }
      await resetPassword({ username: usernameToReset });
      setResetUsername(usernameToReset);
      setResetStep('confirm');
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'Error requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        setError('Passwords do not match');
        return;
      }
      await confirmResetPassword({
    username: resetUsername.trim().toLowerCase(),
        confirmationCode: resetCode,
        newPassword
      });
      // On success, return to sign-in with a success banner
      setIsResetMode(false);
      setIsLogin(true);
  setEmail(resetUsername.trim().toLowerCase());
      setPassword('');
      setConfirmPassword('');
      setSuccess('Password updated. Please sign in with your new password.');
    } catch (err: unknown) {
      console.error('Confirm reset password error:', err);
      setError(err instanceof Error ? err.message : 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const cleanEmail = email.trim().toLowerCase();
        const result = await signIn({
          username: cleanEmail,
          password: password
        });
        
        if ((result as { isSignedIn?: boolean })?.isSignedIn) {
          onClose();
          resetForm();
        }
      } else {
        // Sign up validation
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          setLoading(false);
          return;
        }

  const cleanEmail = email.trim().toLowerCase();
        const result = await signUp({
          username: cleanEmail,
          password: password,
          options: {
            userAttributes: {
              email: cleanEmail,
              given_name: firstName,
              family_name: lastName,
              ...(phone && { phone_number: phone })
            }
          }
        });

        if ((result as { nextStep?: { signUpStep?: string } })?.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          setNeedsConfirmation(true);
          setUsername(cleanEmail);
        }
      }
    } catch (err: unknown) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: username.trim().toLowerCase(),
        confirmationCode: confirmationCode
      });
      
      // Auto sign in after confirmation
      await signIn({
        username: username.trim().toLowerCase(),
        password: password
      });
      
      onClose();
      resetForm();
    } catch (err: unknown) {
      console.error('Confirmation error:', err);
      setError(err instanceof Error ? err.message : 'Error confirming sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode(username);
      setError('');
      // Show success message if needed
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error resending code');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithRedirect({ provider: 'Google' });
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Error signing in with Google');
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Confirm Your Email</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We&apos;ve sent a confirmation code to <strong>{username}</strong>. 
            Please enter the code below to complete your registration.
          </p>

          <form onSubmit={handleConfirmSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmation Code
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Confirming...' : 'Confirm Email'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              className="w-full text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              Didn&apos;t receive the code? Resend
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isResetMode) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {resetStep === 'request' ? 'Forgot your password?' : 'Set a new password'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          {resetStep === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Enter the email associated with your account and we’ll send a verification code.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send code'}
              </button>

              <button
                type="button"
                onClick={() => { setIsResetMode(false); setIsLogin(true); setError(''); }}
                className="w-full text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                We sent a code to <strong>{resetUsername}</strong>. Enter it below with your new password.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type={showResetPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showResetPasswords ? 'text' : 'password'}
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  minLength={8}
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <input type="checkbox" checked={showResetPasswords} onChange={(e) => setShowResetPasswords(e.target.checked)} />
                  Show passwords
                </label>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => { try { setLoading(true); setError(''); await resetPassword({ username: resetUsername }); } catch (e: any) { setError(e?.message || 'Error resending code'); } finally { setLoading(false); } }}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => { setIsResetMode(false); setIsLogin(true); setError(''); }}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="text-green-700 bg-green-50 border border-green-200 dark:text-green-300 dark:bg-green-900/20 dark:border-green-800 text-sm p-3 rounded">
              {success}
            </div>
          )}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type={showLoginPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
              minLength={8}
            />
            {isLogin && (
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={showLoginPassword} onChange={(e) => setShowLoginPassword(e.target.checked)} />
                Show password
              </label>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type={showSignupPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required={!isLogin}
                minLength={8}
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={showSignupPasswords} onChange={(e) => setShowSignupPasswords(e.target.checked)} />
                Show passwords
              </label>
            </div>
          )}

          {!isLogin && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>By creating an account, you acknowledge that you:</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                <li>Understand and agree to our{' '}
                  <Link 
                    href="/terms-and-policies" 
                    target="_blank"
                    className="underline hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    Terms & Policies
                  </Link>
                </li>
                <li>Understand the risks and responsibilities of using Enabl Health services</li>
                <li>Acknowledge that Enabl Health is not a substitute for professional medical care</li>
                <li>Accept full responsibility for any content you upload or share</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isLogin && (
            <div className="mb-3">
              <button
                onClick={switchToReset}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}
          <button
            onClick={switchMode}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* OAuth providers */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Redirecting...' : 'Continue with Google'}
          </button>
          
          <button
            disabled
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
            Continue with Apple (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
