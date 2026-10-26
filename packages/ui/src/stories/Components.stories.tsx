import { useState } from 'react';
import { Input } from '../components/Input/Input';
import { Toggle } from '../components/Toggle/Toggle';
import { StatusChip } from '../components/StatusChip/StatusChip';
import { RecordButton } from '../components/RecordButton/RecordButton';
import { Mail, Lock } from 'lucide-react';

export default {
  title: 'Foundations/Components',
};

export const InputAndToggleStories = () => {
  const [toggleVal, setToggleVal] = useState(true);
  const [recStatus, setRecStatus] = useState<'idle' | 'recording' | 'paused'>('idle');

  return (
    <div className="flex flex-col gap-8 p-8 bg-[var(--color-bg-canvas)] min-h-screen text-[var(--color-text-primary)] max-w-xl">
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[var(--color-text-secondary)]">Inputs with Validation</h3>
        <Input
          label="Email Address"
          placeholder="name@example.com"
          leadingIcon={<Mail className="w-4 h-4" />}
          hint="We will send your verification code here"
        />
        <Input
          label="Password"
          type="password"
          leadingIcon={<Lock className="w-4 h-4" />}
          error="Password must be at least 8 characters"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-[var(--color-text-secondary)]">Accessible Toggles</h3>
        <Toggle
          label="Auto Zoom and Pan"
          description="Smooth 2x zoom toward mouse clicks"
          checked={toggleVal}
          onCheckedChange={setToggleVal}
        />
        <Toggle
          label="Reduce Motion"
          description="Disables layout morph animations"
          checked={false}
          onCheckedChange={() => {}}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-[var(--color-text-secondary)]">Status Chips</h3>
        <div className="flex flex-wrap gap-2">
          <StatusChip status="recording" />
          <StatusChip status="shared" />
          <StatusChip status="private" />
          <StatusChip status="uploading" />
          <StatusChip status="failed" />
          <StatusChip status="active" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-[var(--color-text-secondary)]">Record Button States</h3>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <RecordButton status={recStatus} onClick={() => setRecStatus(recStatus === 'idle' ? 'recording' : recStatus === 'recording' ? 'paused' : 'idle')} />
            <span className="text-xs text-[var(--color-text-tertiary)] capitalize">{recStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
