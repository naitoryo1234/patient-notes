'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { LABELS } from '@/config/labels';

export const SystemSettings = () => {
    const handleDownloadBackup = () => {
        // Trigger download via direct navigation to API route
        window.location.href = '/api/backup/download';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{LABELS.SETTINGS.TITLE}</CardTitle>
                    <CardDescription>
                        {LABELS.SETTINGS.DESC}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                        <div>
                            <h3 className="font-medium text-slate-900">{LABELS.SETTINGS.BACKUP_SECTION}</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {LABELS.SETTINGS.BACKUP_DESC}
                            </p>
                        </div>
                        <Button
                            onClick={handleDownloadBackup}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            {LABELS.SETTINGS.BACKUP_BTN}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Future settings sections can go here */}
        </div>
    );
};
