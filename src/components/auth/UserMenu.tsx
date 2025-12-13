'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

interface UserMenuProps {
    authEnabled: boolean;
}

/**
 * UserMenu displays the current logged-in operator and provides logout functionality.
 * Only renders when auth is enabled.
 */
export function UserMenu({ authEnabled }: UserMenuProps) {
    const { operator, logout, isAuthenticated } = useAuth();

    // Don't show if auth is disabled or not authenticated
    if (!authEnabled || !isAuthenticated || !operator) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium max-w-[100px] truncate" title={operator.name}>
                    {operator.name}
                </span>
            </div>
            <button
                onClick={logout}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="ログアウト"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    );
}
