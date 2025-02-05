import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, supabase } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = async () => {
    try {
      setError('');
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setForgotPasswordSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset password email');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-center pb-4">
          <img
            src="https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_mCdpSYFVwXL3.png" // Replace with your logo URL
            alt="Logo"
            className="h-24"
          />
        </div>
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Sign in to your account</h2>
        </div>
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {!showForgotPassword ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {forgotPasswordSent ? (
              <div className="text-green-600">
                <p>We have sent a password reset link to your email.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Reset Password'}
                  </button>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
