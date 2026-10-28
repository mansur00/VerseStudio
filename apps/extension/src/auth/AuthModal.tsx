import React, { useState } from 'react';
import {
  Modal,
  Button,
  Input,
  Checkbox,
  HugeIcon,
} from '@verse-studio/ui';
import {
  Mail01Icon,
  LockIcon,
  UserIcon,
  ViewIcon,
  ViewOffIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Key01Icon,
} from '@hugeicons/core-free-icons';
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  getTranslation,
  type SupportedLanguage,
} from '@verse-studio/shared';
import { useAuthStore } from './authStore';

export type AuthModalView =
  | 'sign-in'
  | 'sign-up'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-sent'
  | 'reset-password';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthModalView;
  lang?: SupportedLanguage;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'sign-in',
  lang = 'en',
  onSuccess,
}) => {
  const [view, setView] = useState<AuthModalView>(initialView);
  const t = getTranslation(lang);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');

  // Validation & Error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    signUp,
    signIn,
    signInWithGoogle,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword: storeResetPassword,
    unverifiedEmail,
  } = useAuthStore();

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setFieldErrors({});
    setFormError(null);
  };

  const handleSwitchView = (nextView: AuthModalView) => {
    resetForm();
    setView(nextView);
  };

  // 01 Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    if (!termsAgreed) {
      setFieldErrors({ terms: 'You must agree to the Terms of Service to continue' });
      return;
    }

    const validation = signUpSchema.safeParse({ name, email, password });
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(name, email, password);
    setIsSubmitting(false);

    if (result.success) {
      setView('verify-email');
    } else {
      setFormError(result.error || 'Failed to create account');
    }
  };

  // 07 Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setFormError(result.error || t.auth.invalidCredentials);
    }
  };

  // Google OAuth Handler
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setFormError(null);
    const result = await signInWithGoogle();
    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setFormError(result.error || 'Failed to authenticate with Google');
    }
  };

  // 03 Verify Email Code Handler
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const validation = verifyEmailSchema.safeParse({ code: verificationCode });
    if (!validation.success) {
      setFieldErrors({ code: validation.error.errors[0]?.message || 'Invalid code' });
      return;
    }

    setIsSubmitting(true);
    const result = await verifyEmail(verificationCode);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setFormError(result.error || 'Verification code failed');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    await resendVerificationCode();
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 09 Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldErrors({ email: validation.error.errors[0]?.message || 'Invalid email' });
      return;
    }

    setIsSubmitting(true);
    await forgotPassword(email);
    setIsSubmitting(false);
    setView('reset-sent');
  };

  // 11 Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    setIsSubmitting(true);
    await storeResetPassword(password);
    setIsSubmitting(false);
    setView('sign-in');
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => !o && onClose()}
      title={
        view === 'sign-up'
          ? t.auth.signUp
          : view === 'sign-in'
          ? t.auth.signIn
          : view === 'verify-email'
          ? t.auth.verifyEmail
          : view === 'forgot-password'
          ? t.auth.forgotPassword
          : view === 'reset-sent'
          ? t.auth.resetSentTitle
          : t.auth.resetPassword
      }
      description={
        view === 'sign-up'
          ? t.auth.signUpSubtitle
          : view === 'sign-in'
          ? t.auth.signInSubtitle
          : view === 'verify-email'
          ? `${t.auth.codeSentTo} ${unverifiedEmail || email || 'your email'}`
          : view === 'forgot-password'
          ? 'Enter your account email to receive a password recovery link'
          : view === 'reset-sent'
          ? t.auth.resetSentDesc
          : 'Choose a secure new password for your account'
      }
    >
      <div className="space-y-4 pt-1">
        {/* Top Error Alert Banner (Screen 02 / 08) */}
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] text-xs font-medium animate-in fade-in-50"
          >
            <HugeIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* ================= VIEW: SIGN IN ================= */}
        {view === 'sign-in' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 border-[var(--color-border-input)]"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.auth.continueWithGoogle}</span>
            </Button>

            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border-subtle)]" />
              </div>
              <span className="relative bg-[var(--color-bg-surface)] px-2.5 text-[11px] uppercase font-medium text-[var(--color-text-tertiary)]">
                {t.auth.orWithEmail}
              </span>
            </div>

            <Input
              id="signin-email"
              type="email"
              label={t.auth.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              leadingIcon={<HugeIcon icon={Mail01Icon} size={16} />}
              error={fieldErrors.email}
              autoComplete="email"
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="signin-password"
                  className="text-xs font-medium text-[var(--color-text-secondary)]"
                >
                  {t.auth.password}
                </label>
                <button
                  type="button"
                  onClick={() => handleSwitchView('forgot-password')}
                  className="text-xs text-[var(--color-brand-default)] hover:underline focus:outline-none"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leadingIcon={<HugeIcon icon={LockIcon} size={16} />}
                  error={fieldErrors.password}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  {showPassword ? <HugeIcon icon={ViewOffIcon} size={16} /> : <HugeIcon icon={ViewIcon} size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : t.auth.signIn}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleSwitchView('sign-up')}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {t.auth.noAccount}
              </button>
            </div>
          </form>
        )}

        {/* ================= VIEW: SIGN UP (Screen 01, 02) ================= */}
        {view === 'sign-up' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 border-[var(--color-border-input)]"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.auth.continueWithGoogle}</span>
            </Button>

            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border-subtle)]" />
              </div>
              <span className="relative bg-[var(--color-bg-surface)] px-2.5 text-[11px] uppercase font-medium text-[var(--color-text-tertiary)]">
                {t.auth.orWithEmail}
              </span>
            </div>

            <Input
              id="signup-name"
              label={t.auth.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              leadingIcon={<HugeIcon icon={UserIcon} size={16} />}
              error={fieldErrors.name}
              autoComplete="name"
              required
            />

            <Input
              id="signup-email"
              type="email"
              label={t.auth.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              leadingIcon={<HugeIcon icon={Mail01Icon} size={16} />}
              error={fieldErrors.email}
              autoComplete="email"
              required
            />

            <div className="space-y-1">
              <label
                htmlFor="signup-password"
                className="text-xs font-medium text-[var(--color-text-secondary)]"
              >
                {t.auth.password}
              </label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  leadingIcon={<HugeIcon icon={LockIcon} size={16} />}
                  error={fieldErrors.password}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  {showPassword ? <HugeIcon icon={ViewOffIcon} size={16} /> : <HugeIcon icon={ViewIcon} size={16} />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <Checkbox
                id="signup-terms"
                checked={termsAgreed}
                onCheckedChange={(c) => setTermsAgreed(Boolean(c))}
                label={
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                }
                error={fieldErrors.terms}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : t.auth.signUp}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleSwitchView('sign-in')}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {t.auth.haveAccount}
              </button>
            </div>
          </form>
        )}

        {/* ================= VIEW: VERIFY EMAIL (Screen 03) ================= */}
        {view === 'verify-email' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl text-center space-y-1">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Enter the 6-digit code sent to your inbox. Demo code: <span className="font-mono font-bold text-[var(--color-brand-default)]">123456</span>
              </p>
            </div>

            <Input
              id="verify-code"
              type="text"
              label="6-Digit Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              leadingIcon={<HugeIcon icon={Key01Icon} size={16} />}
              error={fieldErrors.code}
              className="font-mono text-center tracking-widest text-lg"
              autoFocus
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || verificationCode.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email & Continue'}
            </Button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => handleSwitchView('sign-up')}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                Change email
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className="text-[var(--color-brand-default)] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0
                  ? `${t.auth.resendIn} ${resendCooldown}s`
                  : t.auth.resendCode}
              </button>
            </div>
          </form>
        )}

        {/* ================= VIEW: FORGOT PASSWORD (Screen 09) ================= */}
        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Input
              id="forgot-email"
              type="email"
              label={t.auth.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              leadingIcon={<HugeIcon icon={Mail01Icon} size={16} />}
              error={fieldErrors.email}
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleSwitchView('sign-in')}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                {t.auth.backToSignIn}
              </button>
            </div>
          </form>
        )}

        {/* ================= VIEW: RESET EMAIL SENT (Screen 10) ================= */}
        {view === 'reset-sent' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success-default)] flex items-center justify-center mx-auto">
              <HugeIcon icon={CheckmarkCircle01Icon} size={24} />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              We have dispatched an email containing your password reset link. Please check your inbox and spam folder.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleSwitchView('reset-password')}
              >
                Simulate Reset Link
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleSwitchView('sign-in')}
              >
                {t.auth.backToSignIn}
              </Button>
            </div>
          </div>
        )}

        {/* ================= VIEW: RESET PASSWORD (Screen 11) ================= */}
        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <Input
              id="reset-new-password"
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              leadingIcon={<HugeIcon icon={LockIcon} size={16} />}
              error={fieldErrors.password}
              required
              autoFocus
            />

            <Input
              id="reset-confirm-password"
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              leadingIcon={<HugeIcon icon={LockIcon} size={16} />}
              error={fieldErrors.confirmPassword}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Password & Sign In'}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};
