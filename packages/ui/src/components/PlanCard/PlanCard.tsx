import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '../Button/Button';
import { StatusChip } from '../StatusChip/StatusChip';
import { cn } from '../../utils/cn';

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanCardProps {
  planId: 'free' | 'pro';
  name: string;
  price: string;
  period?: string;
  description: string;
  features: PlanFeature[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelectPlan?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  planId,
  name,
  price,
  period = '/month',
  description,
  features,
  isCurrentPlan = false,
  isPopular = false,
  onSelectPlan,
  isLoading = false,
  className,
}) => {
  const isPro = planId === 'pro';

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between p-6 rounded-2xl transition-all duration-200 text-left',
        'bg-[var(--color-bg-surface)] border',
        isPro
          ? 'border-[var(--color-brand-default)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-brand-default)]'
          : 'border-[var(--color-border-default)] shadow-[var(--shadow-sm)]',
        className
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 px-3 py-1 bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
            <Sparkles className="w-3 h-3 fill-current" />
            Most Popular
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            {name}
          </h3>
          {isCurrentPlan && (
            <StatusChip status="default" label="Current Plan" size="sm" />
          )}
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] min-h-[32px] mb-4">
          {description}
        </p>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-3xl font-extrabold text-[var(--color-text-primary)]">
            {price}
          </span>
          {period && (
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {period}
            </span>
          )}
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 pt-4 border-t border-[var(--color-border-subtle)]">
          <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
            What's included:
          </p>
          <ul className="space-y-2">
            {features.map((feature, idx) => (
              <li
                key={idx}
                className={cn(
                  'flex items-start gap-2.5 text-xs',
                  feature.included
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-disabled)] line-through'
                )}
              >
                <Check
                  className={cn(
                    'w-4 h-4 shrink-0 mt-0.5',
                    feature.included
                      ? 'text-[var(--color-brand-default)]'
                      : 'text-[var(--color-text-disabled)]'
                  )}
                />
                <span className={feature.highlight ? 'font-medium text-[var(--color-brand-default)]' : ''}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-4">
        {isCurrentPlan ? (
          <Button variant="secondary" className="w-full" disabled>
            Active Plan
          </Button>
        ) : (
          <Button
            variant={isPro ? 'primary' : 'secondary'}
            className="w-full"
            onClick={onSelectPlan}
            isLoading={isLoading}
          >
            {isPro ? 'Upgrade to Pro' : 'Get Started'}
          </Button>
        )}
      </div>
    </div>
  );
};
