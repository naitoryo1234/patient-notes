'use client';

import { useEffect } from 'react';

interface RecentPatientTrackerProps {
    patientId: string;
    patientName: string;
    patientKana: string;
}

/**
 * Client component that tracks recently viewed patients in localStorage.
 * Place this component on patient detail pages to auto-save view history.
 */
export function RecentPatientTracker({ patientId, patientName, patientKana }: RecentPatientTrackerProps) {
    useEffect(() => {
        const STORAGE_KEY = 'recent_patients';
        const MAX_RECENT = 10;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const recent = stored ? JSON.parse(stored) : [];

            // Create new entry
            const newEntry = {
                id: patientId,
                name: patientName,
                kana: patientKana,
                lastAccess: Date.now()
            };

            // Update list: add new entry, remove duplicates, limit to MAX
            const updated = [newEntry, ...recent.filter((p: { id: string }) => p.id !== patientId)].slice(0, MAX_RECENT);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to update recent patients:', e);
        }
    }, [patientId, patientName, patientKana]);

    // This component renders nothing visible
    return null;
}
