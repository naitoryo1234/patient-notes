'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Staff {
    id: string;
    name: string;
    role: string;
}

interface LoginScreenProps {
    staffList: Staff[];
}

export function LoginScreen({ staffList }: LoginScreenProps) {
    const { login, isAuthenticated } = useAuth();
    const [pin, setPin] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [error, setError] = useState('');

    // If already authenticated, don't show login
    if (isAuthenticated) {
        return null;
    }

    const activeStaff = staffList.filter(s => s.role !== 'inactive');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const selectedStaff = staffList.find(s => s.id === selectedStaffId);
        if (!selectedStaff) {
            setError('スタッフを選択してください');
            return;
        }

        const success = login(pin, { id: selectedStaff.id, name: selectedStaff.name });
        if (!success) {
            setError('PINが正しくありません');
            setPin('');
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Clinic Notebook
                    </h1>
                    <p className="text-gray-500 text-sm">
                        ログインしてください
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Staff Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            操作者を選択
                        </label>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">選択してください</option>
                            {activeStaff.map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.name} ({staff.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PIN Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            PIN
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="4桁のPINを入力"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!selectedStaffId || pin.length < 4}
                        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ログイン
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-400">
                    v1.3 - 操作者追跡機能付き
                </p>
            </div>
        </div>
    );
}
