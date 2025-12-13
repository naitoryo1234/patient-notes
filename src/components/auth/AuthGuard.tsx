'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/components/auth/LoginScreen';

interface Staff {
    id: string;
    name: string;
    role: string;
}

interface AuthGuardProps {
    children: ReactNode;
    staffList: Staff[];
    authEnabled: boolean;
}

/**
 * AuthGuard wraps the main content and shows LoginScreen when authentication is required.
 * When auth is disabled, it simply renders children.
 */
export function AuthGuard({ children, staffList, authEnabled }: AuthGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();

    // If auth is disabled, always show content
    if (!authEnabled) {
        return <>{children}</>;
    }

    // Show loading indicator while checking auth state
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-slate-500">読み込み中...</div>
            </div>
        );
    }

    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return <LoginScreen staffList={staffList} />;
    }

    // Authenticated - show content
    return <>{children}</>;
}


