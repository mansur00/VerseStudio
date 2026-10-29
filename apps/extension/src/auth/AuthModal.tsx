import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Button,
  Checkbox,
  HugeIcon,
} from '@verse-studio/ui';
import {
  ViewIcon,
  ViewOffIcon,
  AlertCircleIcon,
  Mail01Icon,
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

  // Sync initial view when modal re-opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);

  // Validation & Error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  // OTP inputs ref
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    setOtpDigits(['', '', '', '', '', '']);
  };

  const handleSwitchView = (nextView: AuthModalView) => {
    resetForm();
    setView(nextView);
  };

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) {
      return { score: 1, label: 'Weak password', color: 'var(--color-error-default)' };
    } else if (score <= 2) {
      return { score: 2, label: 'Fair password', color: 'var(--color-warning-default)' };
    } else if (score === 3) {
      return { score: 3, label: 'Good password', color: 'var(--color-brand-default)' };
    } else {
      return { score: 4, label: 'Strong password', color: 'var(--color-brand-default)' };
    }
  };

  const pwdStrength = getPasswordStrength(password);

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
  const verificationCode = otpDigits.join('');
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const validation = verifyEmailSchema.safeParse({ code: verificationCode });
    if (!validation.success) {
      setFieldErrors({ code: validation.error.errors[0]?.message || 'Invalid 6-digit code' });
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

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      // Pasted string
      const digits = clean.slice(0, 6).split('');
      const nextOtp = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        nextOtp[i] = digits[i] || '';
      }
      setOtpDigits(nextOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const nextOtp = [...otpDigits];
    nextOtp[index] = clean;
    setOtpDigits(nextOtp);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    await resendVerificationCode();
    setResendCooldown(30);
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
      hideHeader={true}
      size="2xl"
      className="max-w-4xl p-0 overflow-hidden bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] rounded-3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[580px]">
        {/* ================= LEFT COLUMN: FORM CONTAINER ================= */}
        <div className="p-6 sm:p-10 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* VerseStudio Brand Header (Figma 17:31) */}
            <div className="flex items-center gap-2.5 select-none">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-default)] flex items-center justify-center shadow-[var(--glow-brand)] shrink-0">
                <div className="w-4 h-4 rounded-full border-2 border-[#1B1C21] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4F]" />
                </div>
              </div>
              <span className="font-bold text-lg text-[var(--color-text-primary)] tracking-tight">
                VerseStudio
              </span>
            </div>

            {/* Top Error Alert Banner (Screen 02 / 08) */}
            {formError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] text-xs font-medium animate-in fade-in-50"
              >
                <HugeIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">{formError}</div>
              </div>
            )}

            {/* ================= VIEW: SIGN UP (Screen 01, 02) ================= */}
            {view === 'sign-up' && (
              <div className="mt-6 sm:mt-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight font-h2">
                  Create your account
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 mb-6">
                  Free plan saves recordings to your own Google Drive.
                </p>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign up with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-border-subtle)]" />
                  </div>
                  <span className="relative bg-[var(--color-bg-canvas)] px-3 text-xs text-[var(--color-text-tertiary)] font-medium">
                    or
                  </span>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                    >
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rafi Ahmed"
                      className={`w-full h-11 px-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)] ${
                        fieldErrors.name
                          ? 'border-[var(--color-danger-default)]'
                          : 'border-[var(--color-border-default)]'
                      }`}
                      autoComplete="name"
                      required
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-[var(--color-danger-default)] mt-1">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rafi@acemedia.com"
                      className={`w-full h-11 px-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)] ${
                        fieldErrors.email
                          ? 'border-[var(--color-danger-default)]'
                          : 'border-[var(--color-border-default)]'
                      }`}
                      autoComplete="email"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-[var(--color-danger-default)] mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-11 px-3.5 pr-10 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)] ${
                          fieldErrors.password
                            ? 'border-[var(--color-danger-default)]'
                            : 'border-[var(--color-border-default)]'
                        }`}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        {showPassword ? (
                          <HugeIcon icon={ViewOffIcon} size={18} />
                        ) : (
                          <HugeIcon icon={ViewIcon} size={18} />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password ? (
                      <p className="text-xs text-[var(--color-danger-default)] mt-1">
                        {fieldErrors.password}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5">
                        Use 8 or more characters with a number.
                      </p>
                    )}

                    {/* 4-Segment Password Strength Indicator (Screen 01) */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((seg) => (
                            <div
                              key={seg}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  seg <= pwdStrength.score
                                    ? pwdStrength.color
                                    : 'var(--color-border-default)',
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="text-[11px] font-medium"
                          style={{ color: pwdStrength.color }}
                        >
                          {pwdStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

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
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>
              </div>
            )}

            {/* ================= VIEW: SIGN IN (Screen 07, 08) ================= */}
            {view === 'sign-in' && (
              <div className="mt-6 sm:mt-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight font-h2">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 mb-6">
                  Sign in to access your recordings and settings.
                </p>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign in with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-border-subtle)]" />
                  </div>
                  <span className="relative bg-[var(--color-bg-canvas)] px-3 text-xs text-[var(--color-text-tertiary)] font-medium">
                    or
                  </span>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label
                      htmlFor="signin-email"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rafi@acemedia.com"
                      className={`w-full h-11 px-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)] ${
                        fieldErrors.email
                          ? 'border-[var(--color-danger-default)]'
                          : 'border-[var(--color-border-default)]'
                      }`}
                      autoComplete="email"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-[var(--color-danger-default)] mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="signin-password"
                        className="text-xs font-medium text-[var(--color-text-secondary)]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSwitchView('forgot-password')}
                        className="text-xs text-[var(--color-brand-default)] hover:underline focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-11 px-3.5 pr-10 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)] ${
                          fieldErrors.password
                            ? 'border-[var(--color-danger-default)]'
                            : 'border-[var(--color-border-default)]'
                        }`}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        {showPassword ? (
                          <HugeIcon icon={ViewOffIcon} size={18} />
                        ) : (
                          <HugeIcon icon={ViewIcon} size={18} />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-[var(--color-danger-default)] mt-1">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 rounded-xl text-sm font-semibold mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </div>
            )}

            {/* ================= VIEW: VERIFY EMAIL (Screen 03) ================= */}
            {view === 'verify-email' && (
              <div className="mt-4 sm:mt-6 text-center">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--color-brand-default)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] flex items-center justify-center mx-auto mb-4">
                  <HugeIcon icon={Mail01Icon} size={24} />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight font-h2">
                  Verify your email
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1.5 mb-6">
                  Enter the 6-digit code we sent to{' '}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {unverifiedEmail || email || 'your email'}
                  </span>
                </p>

                <form onSubmit={handleVerifyEmail} className="space-y-6">
                  {/* Discrete 6-digit OTP Input Boxes */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-10 sm:w-12 h-12 sm:h-14 text-center font-bold text-xl sm:text-2xl rounded-xl bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border transition-all focus:outline-none ${
                          digit
                            ? 'border-[var(--color-brand-default)]'
                            : 'border-[var(--color-border-default)]'
                        } focus:border-2 focus:border-[var(--color-brand-default)]`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                  {fieldErrors.code && (
                    <p className="text-xs text-[var(--color-danger-default)]">
                      {fieldErrors.code}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                    disabled={isSubmitting || verificationCode.length !== 6}
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify email'}
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0}
                      className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] disabled:opacity-60 transition-colors"
                    >
                      {resendCooldown > 0
                        ? `Did not get a code? Resend in 0:${resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}`
                        : 'Did not get a code? Resend now'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= VIEW: FORGOT PASSWORD (Screen 09) ================= */}
            {view === 'forgot-password' && (
              <div className="mt-6 sm:mt-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight font-h2">
                  Forgot password
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 mb-6">
                  Enter your account email to receive a password recovery link.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rafi@acemedia.com"
                      className={`w-full h-11 px-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)] ${
                        fieldErrors.email
                          ? 'border-[var(--color-danger-default)]'
                          : 'border-[var(--color-border-default)]'
                      }`}
                      autoComplete="email"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-[var(--color-danger-default)] mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending link...' : 'Send reset link'}
                  </Button>
                </form>
              </div>
            )}

            {/* ================= VIEW: RESET SENT (Screen 10) ================= */}
            {view === 'reset-sent' && (
              <div className="mt-6 sm:mt-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--color-brand-default)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] flex items-center justify-center mx-auto mb-2">
                  <HugeIcon icon={Mail01Icon} size={24} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight font-h2">
                  Check your inbox
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  We sent a recovery link to{' '}
                  <span className="font-semibold text-[var(--color-text-primary)]">{email}</span>. Click the link to choose a new password.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full h-11 rounded-xl text-sm font-semibold mt-4"
                  onClick={() => handleSwitchView('sign-in')}
                >
                  Return to sign in
                </Button>
              </div>
            )}

            {/* ================= VIEW: RESET PASSWORD (Screen 11) ================= */}
            {view === 'reset-password' && (
              <div className="mt-6 sm:mt-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight font-h2">
                  Set new password
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 mb-6">
                  Choose a secure new password for your account.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reset-password"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                    >
                      New password
                    </label>
                    <input
                      id="reset-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border border-[var(--color-border-default)] rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reset-confirm-password"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                    >
                      Confirm new password
                    </label>
                    <input
                      id="reset-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] border border-[var(--color-border-default)] rounded-xl text-sm transition-colors focus:outline-none focus:border-[var(--color-brand-default)]"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Reset password'}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Footer Navigation Link */}
          <div className="pt-6 text-center text-xs text-[var(--color-text-tertiary)]">
            {view === 'sign-up' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('sign-in')}
                  className="text-[var(--color-brand-default)] hover:underline font-semibold ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
            {view === 'sign-in' && (
              <p>
                New to VerseStudio?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('sign-up')}
                  className="text-[var(--color-brand-default)] hover:underline font-semibold ml-1"
                >
                  Create an account
                </button>
              </p>
            )}
            {view === 'forgot-password' && (
              <button
                type="button"
                onClick={() => handleSwitchView('sign-in')}
                className="text-[var(--color-brand-default)] hover:underline font-semibold"
              >
                Back to Sign in
              </button>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: AMBIENT HERO ARTWORK ================= */}
        <div
          className="hidden md:flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden bg-[#16171B] border-l border-[var(--color-border-subtle)] select-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 30%, rgba(50, 85, 20, 0.45), #16171B 75%)',
          }}
        >
          {/* Wireframe Desktop App Window Container */}
          <div className="w-full max-w-[340px] lg:max-w-[380px] bg-[#222329] border border-[#383942] rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Window title bar with macOS traffic lights */}
            <div className="h-8 bg-[#292A31] border-b border-[#383942] px-3.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
            </div>

            {/* Window Wireframe Mockup Content */}
            <div className="p-4 space-y-3.5 pb-6">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="h-14 bg-[#292A31] border border-[#383942]/60 rounded-xl" />
                <div className="h-14 bg-[#292A31] border border-[#383942]/60 rounded-xl" />
                <div className="h-14 bg-[#292A31] border border-[#383942]/60 rounded-xl" />
              </div>

              <div className="space-y-2 pt-1 opacity-70">
                <div className="w-4/5 h-2 bg-[#383942] rounded-full" />
                <div className="w-3/5 h-2 bg-[#383942]/70 rounded-full" />
                <div className="w-2/3 h-2 bg-[#383942]/50 rounded-full" />
                <div className="w-1/2 h-2 bg-[#383942]/40 rounded-full" />
              </div>
            </div>

            {/* Floating Camera Bubble Overlapping Bottom Right */}
            <div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full border-4 border-[#16171B] bg-[#292A31] shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-[#383942] flex items-center justify-center text-[var(--color-text-secondary)]">
                <svg
                  className="w-6 h-6 opacity-75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Slogan and Bengali Subtitle */}
          <div className="w-full max-w-[340px] lg:max-w-[380px] mt-8 text-left">
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-h3 leading-snug">
              Record in 4K. Share in seconds.
            </h3>
            <p className="font-bangla text-sm lg:text-base text-[var(--color-text-secondary)] mt-1.5 font-normal">
              বাংলায় বলুন, ইংরেজিতে শুনুন
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
