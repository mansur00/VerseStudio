import React, { useState } from 'react';
import {
  Modal,
  Button,
  Input,
  Toggle,
  ProgressBar,
  PlanCard,
  Avatar,
  StatusChip,
} from '@verse-studio/ui';
import {
  User,
  HelpCircle,
  AlertTriangle,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  changePasswordSchema,
  updateProfileSchema,
  twoFactorSetupSchema,
  deleteAccountSchema,
  getTranslation,
  type SupportedLanguage,
  type UserPlan,
} from '@verse-studio/shared';
import { useAuthStore } from './authStore';

export type AccountModalType =
  | 'profile'
  | 'security'
  | 'plan'
  | 'upgrade'
  | 'delete'
  | 'help'
  | null;

export interface AccountModalsProps {
  activeModal: AccountModalType;
  onClose: () => void;
  lang?: SupportedLanguage;
  onOpenUpgrade?: () => void;
  onOpenDelete?: () => void;
}

export const AccountModals: React.FC<AccountModalsProps> = ({
  activeModal,
  onClose,
  lang = 'en',
  onOpenUpgrade,
  onOpenDelete,
}) => {
  const t = getTranslation(lang);
  const {
    user,
    activeSessions,
    updateProfile,
    changePassword,
    toggle2FA,
    upgradePlan,
    revokeSession,
    deleteAccount,
  } = useAuthStore();

  // Profile State (Screen 57)
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Security State (Screen 58)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState<string | null>(null);
  const [showTotpPrompt, setShowTotpPrompt] = useState(false);

  // Upgrade Plan State (Screen 60)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Delete Account State (Screen 61)
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Help & Support State (Screen 62)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    const validation = updateProfileSchema.safeParse({
      name: profileName,
      avatarUrl: profileAvatarUrl,
    });

    if (!validation.success) {
      setProfileError(validation.error.errors[0]?.message || 'Invalid profile information');
      return;
    }

    await updateProfile(profileName, profileAvatarUrl);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword: confirmPassword,
    });

    if (!validation.success) {
      setPasswordError(validation.error.errors[0]?.message || 'Invalid password details');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(result.error || 'Failed to update password');
    }
  };

  // Handle 2FA Toggle
  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled) {
      setShowTotpPrompt(true);
    } else {
      await toggle2FA(false);
      setShowTotpPrompt(false);
    }
  };

  const handleConfirm2FA = async () => {
    setTotpError(null);
    const validation = twoFactorSetupSchema.safeParse({ code: totpCode });
    if (!validation.success) {
      setTotpError('Please enter a valid 6-digit authenticator code');
      return;
    }

    const result = await toggle2FA(true, totpCode);
    if (result.success) {
      setShowTotpPrompt(false);
      setTotpCode('');
    } else {
      setTotpError(result.error || 'Invalid 2FA code');
    }
  };

  // Handle Plan Upgrade
  const handleSelectPlan = async (plan: UserPlan) => {
    setIsUpgrading(true);
    await upgradePlan(plan);
    setIsUpgrading(false);
    onClose();
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    const validation = deleteAccountSchema.safeParse({ confirmation: deleteConfirmation });
    if (!validation.success) {
      setDeleteError(t.account.typeDeleteToConfirm);
      return;
    }

    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
    onClose();
  };

  return (
    <>
      {/* ================= SCREEN 57: PROFILE MODAL ================= */}
      {activeModal === 'profile' && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && onClose()}
          title={t.account.profile}
          description="Manage your account profile details and avatar"
        >
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-1">
            {profileError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] text-xs font-medium"
              >
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div
                role="status"
                className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-success-subtle)] border border-[var(--color-success-default)] text-[var(--color-success-default)] text-xs font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully</span>
              </div>
            )}

            <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
              <Avatar name={profileName || user?.name || 'User'} src={profileAvatarUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {user?.name}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] truncate">
                  {user?.email}
                </div>
              </div>
              <StatusChip
                status={user?.plan === 'pro' ? 'pro' : 'default'}
                label={user?.plan.toUpperCase() || 'FREE'}
                size="sm"
              />
            </div>

            <Input
              id="profile-name"
              label={t.auth.name}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your full name"
              leadingIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              id="profile-avatar"
              label="Avatar Image URL"
              value={profileAvatarUrl}
              onChange={(e) => setProfileAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {t.account.saveChanges}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= SCREEN 58: SECURITY & 2FA MODAL ================= */}
      {activeModal === 'security' && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && onClose()}
          title={t.account.security}
          description="Manage your account password, 2FA, and active sessions"
        >
          <div className="space-y-6 pt-1">
            {/* Password section */}
            <form onSubmit={handleChangePassword} className="space-y-3 pb-5 border-b border-[var(--color-border-subtle)]">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Change Password
              </h4>

              {passwordError && (
                <div className="p-2.5 rounded-lg bg-[var(--color-error-subtle)] text-[var(--color-error-default)] text-xs font-medium">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-2.5 rounded-lg bg-[var(--color-success-subtle)] text-[var(--color-success-default)] text-xs font-medium">
                  Password changed successfully
                </div>
              )}

              <Input
                id="sec-current-pwd"
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                leadingIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="sec-new-pwd"
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  leadingIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <Input
                  id="sec-confirm-pwd"
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  leadingIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="secondary" size="sm">
                  Update Password
                </Button>
              </div>
            </form>

            {/* 2FA Section */}
            <div className="space-y-3 pb-5 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                    {t.account.twoFactorTitle}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.account.twoFactorDesc}
                  </p>
                </div>
                <Toggle
                  checked={Boolean(user?.twoFactorEnabled)}
                  onCheckedChange={handleToggle2FA}
                  label="Two Factor Authentication"
                />
              </div>

              {showTotpPrompt && (
                <div className="p-3.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] space-y-3 mt-3 animate-in fade-in-50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                    <Smartphone className="w-4 h-4 text-[var(--color-brand-default)]" />
                    <span>Authenticator App Setup</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Enter the 6-digit verification code from Google Authenticator or 1Password. Demo code: <span className="font-mono font-bold text-[var(--color-brand-default)]">123456</span>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="totp-code"
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      error={totpError || undefined}
                      className="font-mono text-center tracking-widest max-w-[160px]"
                    />
                    <Button variant="primary" size="sm" onClick={handleConfirm2FA}>
                      Confirm 2FA
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowTotpPrompt(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Sessions Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                {t.account.activeSessions}
              </h4>
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                            {session.browser}
                          </span>
                          {session.isCurrent && (
                            <StatusChip status="active" label="This Device" size="sm" />
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-tertiary)]">
                          {session.location} • {session.lastActive}
                        </div>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                        className="text-[var(--color-error-default)] hover:bg-[var(--color-error-subtle)]"
                      >
                        {t.account.revoke}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Account Link */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDelete?.();
                }}
                className="text-xs text-[var(--color-error-default)] hover:underline font-medium"
              >
                {t.account.deleteAccount}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= SCREEN 59: PLAN & BILLING MODAL ================= */}
      {activeModal === 'plan' && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && onClose()}
          title={t.account.planBilling}
          description="Manage your subscription tier, billing period, and AI quotas"
        >
          <div className="space-y-5 pt-1">
            {/* Current plan card */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-brand-default)] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    {t.account.currentPlan}
                  </span>
                  <div className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2 mt-0.5">
                    <span>{user?.plan === 'pro' ? t.account.proPlan : t.account.freePlan}</span>
                    <StatusChip
                      status={user?.plan === 'pro' ? 'pro' : 'default'}
                      label={user?.plan === 'pro' ? 'ACTIVE' : 'FREE'}
                      size="sm"
                    />
                  </div>
                </div>

                {user?.plan === 'free' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenUpgrade?.();
                    }}
                    trailingIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    {t.account.upgradeToPro}
                  </Button>
                )}
              </div>

              {/* AI Minutes quota progress */}
              <div className="pt-2 space-y-1.5 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)] font-medium">
                    {t.account.aiMinutesRemaining}
                  </span>
                  <span className="font-mono font-semibold text-[var(--color-text-primary)]">
                    {user?.aiMinutesUsed || 0} / {user?.aiMinutesLimit || 30} mins
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(100, Math.round(((user?.aiMinutesUsed || 0) / (user?.aiMinutesLimit || 30)) * 100))}
                  variant={
                    (user?.aiMinutesUsed || 0) / (user?.aiMinutesLimit || 30) > 0.8
                      ? 'record'
                      : 'brand'
                  }
                />
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  Monthly quota renews on the 1st of every month. Unlimited Google Drive video storage.
                </p>
              </div>
            </div>

            {/* Google Drive connected notice */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Google Drive Storage
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">
                    {user?.googleDriveConnected ? 'Connected (Zero server fees)' : 'Not connected'}
                  </div>
                </div>
              </div>
              <StatusChip
                status={user?.googleDriveConnected ? 'active' : 'default'}
                label={user?.googleDriveConnected ? 'Connected' : 'Offline'}
                size="sm"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ================= SCREEN 60: UPGRADE PLAN MODAL ================= */}
      {activeModal === 'upgrade' && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && onClose()}
          title="Upgrade to VerseStudio Pro"
          description="Unlock 4K 60FPS recordings, 300 minutes of AI voice & subtitles, and custom branding"
        >
          <div className="space-y-5 pt-1">
            {/* Billing cycle toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center p-1 rounded-xl bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {t.account.monthlyBilling}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <span>{t.account.annualBilling}</span>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlanCard
                planId="free"
                name="Free Starter"
                price="$0"
                period="forever"
                description="Everything you need for personal screen recording and Google Drive syncing."
                isCurrentPlan={user?.plan === 'free'}
                onSelectPlan={() => handleSelectPlan('free')}
                features={[
                  { text: 'Up to 4K 60FPS screen recording', included: true },
                  { text: 'Direct save to personal Google Drive', included: true },
                  { text: 'Spotlight, laser pen & teleprompter', included: true },
                  { text: '30 mins/mo live Bangla-English subtitles', included: true },
                  { text: 'AI neural voice dubbing & mixed audio', included: false },
                  { text: 'Custom brand logo & watermark removal', included: false },
                ]}
              />

              <PlanCard
                planId="pro"
                name="Pro 4K Creator"
                price={billingCycle === 'annual' ? '$12' : '$15'}
                period="/month"
                description="For tech educators, developers, and creators requiring full AI voice and high quotas."
                isPopular={true}
                isCurrentPlan={user?.plan === 'pro'}
                isLoading={isUpgrading}
                onSelectPlan={() => handleSelectPlan('pro')}
                features={[
                  { text: 'Up to 4K 60FPS screen recording', included: true },
                  { text: 'Direct save to personal Google Drive', included: true },
                  { text: 'Spotlight, laser pen & teleprompter', included: true },
                  { text: '300 mins/mo live Bangla-English subtitles', included: true, highlight: true },
                  { text: 'English AI voice dubbing & 20% mixed audio', included: true, highlight: true },
                  { text: 'Automated Markdown tutorial guide generation', included: true, highlight: true },
                  { text: 'Priority phone camera WebRTC pairing', included: true },
                ]}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ================= SCREEN 61: DELETE ACCOUNT MODAL ================= */}
      {activeModal === 'delete' && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && onClose()}
          title={t.account.deleteAccount}
          description={t.account.deleteAccountDesc}
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-[var(--color-danger-default)]/10 border border-[var(--color-danger-default)] text-[var(--color-danger-default)] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Irreversible Action</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                This will delete your VerseStudio profile, quota tracking, and active sessions. Videos previously uploaded to your Google Drive folder will not be touched.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="del-confirm"
                className="text-xs font-medium text-[var(--color-text-secondary)]"
              >
                {t.account.typeDeleteToConfirm}
              </label>
              <Input
                id="del-confirm"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                error={deleteError || undefined}
                className="font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= SCREEN 62: HELP & SUPPORT MODAL ================= */}
      {activeModal === 'help' && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && onClose()}
          title={t.account.helpSupport}
          description="Guides, keyboard shortcuts, and community support channels"
        >
          <div className="space-y-4 pt-1">
            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] transition-colors text-xs font-semibold text-[var(--color-text-primary)]"
              >
                <MessageSquare className="w-4 h-4 text-[var(--color-brand-default)]" />
                <span>Join Discord</span>
              </a>

              <a
                href="mailto:support@versestudio.app"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] transition-colors text-xs font-semibold text-[var(--color-text-primary)]"
              >
                <HelpCircle className="w-4 h-4 text-[var(--color-brand-default)]" />
                <span>Email Support</span>
              </a>
            </div>

            {/* Keyboard Shortcuts Table */}
            <div className="p-3.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-2">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Global Shortcuts
              </h4>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Spotlight Tool', key: 'Alt + S' },
                  { label: 'Laser Pen Tool', key: 'Alt + L' },
                  { label: 'Keystroke HUD', key: 'Alt + K' },
                  { label: 'Privacy Blur', key: 'Alt + P' },
                  { label: 'Teleprompter', key: 'Alt + T' },
                ].map((sc) => (
                  <div key={sc.label} className="flex items-center justify-between py-1">
                    <span className="text-[var(--color-text-secondary)]">{sc.label}</span>
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                      {sc.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Frequently Asked Questions
              </h4>
              {[
                {
                  q: 'Where are my recorded videos stored?',
                  a: 'All recordings are saved directly into your personal Google Drive in a folder named VerseStudio. We never store video binaries on external servers.',
                },
                {
                  q: 'How does bilingual AI speech work?',
                  a: 'VerseStudio listens to spoken Bengali and generates real-time English subtitles during recording, and can synthesize a natural English neural voiceover in Post-Studio.',
                },
                {
                  q: 'What if Chrome crashes mid-recording?',
                  a: 'VerseStudio writes video chunks sequentially to IndexedDB/OPFS. When you reopen the studio, a crash recovery prompt lets you restore and export the video.',
                },
              ].map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="border border-[var(--color-border-default)] rounded-xl overflow-hidden bg-[var(--color-bg-surface)]"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-3 pt-0 text-xs text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
