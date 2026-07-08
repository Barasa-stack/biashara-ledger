'use client';

type FeatureGuardProps = {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function FeatureGuard({ children }: FeatureGuardProps) {
  return <>{children}</>;
}
