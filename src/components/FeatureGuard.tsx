'use client';

import { useAuth } from '@/lib/auth-context';
import { isFeatureAvailable, normalizePlan } from '@/lib/feature-gate';

type FeatureGuardProps = {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const { user } = useAuth();
  const plan = normalizePlan(user?.subscriptionPlan);
  const allowedModules = user?.allowedModules ? (() => {
    try { return JSON.parse(user.allowedModules); } catch { return undefined; }
  })() : undefined;

  const available = isFeatureAvailable(feature, plan, allowedModules);

  if (!available) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}
