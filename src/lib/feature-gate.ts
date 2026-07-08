export function normalizePlan(_plan?: string): 'Premium' {
  return 'Premium';
}

export function isFeatureAvailable(_featureKey: string, _plan?: string): boolean {
  return true;
}

export function getFeaturePlan(_featureKey: string): 'Premium' {
  return 'Premium';
}
