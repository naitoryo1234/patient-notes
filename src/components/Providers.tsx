'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';

interface ProvidersProps {
    children: ReactNode;
    authEnabled: boolean;
    authPin: string;
}

export function Providers({ children, authEnabled, authPin }: ProvidersProps) {
    return (
        <AuthProvider authEnabled={authEnabled} authPin={authPin}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </AuthProvider>
    );
}

