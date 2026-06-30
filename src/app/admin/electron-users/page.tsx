'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldElectronRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/offline'); }, [router]);
  return null;
}
