import { Button } from '../components/Button/Button';
import { Sparkles, Trash2, ArrowRight } from 'lucide-react';

export default {
  title: 'Foundations/Button',
  component: Button,
};

export const AllVariants = () => (
  <div className="flex flex-col gap-6 p-8 bg-[var(--color-bg-canvas)] min-h-screen text-[var(--color-text-primary)]">
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Primary Buttons</h3>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
        <Button variant="primary" leadingIcon={<Sparkles className="w-4 h-4" />}>With Icon</Button>
        <Button variant="primary" isLoading>Loading</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Secondary Buttons</h3>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm">Small</Button>
        <Button variant="secondary" size="md">Medium</Button>
        <Button variant="secondary" size="lg">Large</Button>
        <Button variant="secondary" trailingIcon={<ArrowRight className="w-4 h-4" />}>Next Step</Button>
        <Button variant="secondary" disabled>Disabled</Button>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Danger & Ghost Buttons</h3>
      <div className="flex items-center gap-3">
        <Button variant="danger" leadingIcon={<Trash2 className="w-4 h-4" />}>Delete Recording</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="ghost" disabled>Disabled Ghost</Button>
      </div>
    </div>
  </div>
);
