import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

const SetPassword = () => {
  const supabase = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return url && publicKey
      ? createClient(url, publicKey, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
      })
      : null;
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (!supabase) {
      setError('Company supervisor invitation setup is not configured.');
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      else if (data.session?.user?.email) setEmail(data.session.user.email);
      else setError('This invitation link is invalid or has expired. Ask an administrator to send a new invitation.');
      setLoading(false);
    }).catch((sessionError) => {
      if (!active) return;
      setError(sessionError.message || 'Could not verify the invitation link.');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase || password.length < 8 || password !== confirmPassword) {
      setError(password.length < 8 ? 'Password must be at least 8 characters.' : 'Passwords do not match.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not sign in after setting the password.');
      if (data.role !== 'company_supervisor') {
        throw new Error('This invitation is not linked to a company supervisor account.');
      }

      login(data.token, data, true);
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/company-supervisor/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Password setup failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Set your password</h1>
        <p className="text-sm text-gray-600">Complete your company supervisor invitation.</p>
        {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <p className="text-sm text-gray-500">Verifying invitation...</p> : (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input value={email} readOnly className="mt-1 w-full rounded border bg-gray-50 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              New password
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Confirm password
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <button type="submit" disabled={saving || !email} className="w-full rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving...' : 'Set password and continue'}
            </button>
          </>
        )}
      </form>
    </main>
  );
};

export default SetPassword;
