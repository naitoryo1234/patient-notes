'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Camera, Loader2 } from 'lucide-react';
import { LABELS } from '@/config/labels';
import { useFeatures } from '@/contexts/FeaturesContext';
import { toggleAttachmentPluginAction } from '@/actions/settingActions';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export const SystemSettings = () => {
    const { features } = useFeatures();
    const { showToast } = useToast();
    const [isTogglingAttachments, setIsTogglingAttachments] = useState(false);

    const handleDownloadBackup = () => {
        // Trigger download via direct navigation to API route
        window.location.href = '/api/backup/download';
    };

    const handleToggleAttachments = async () => {
        if (isTogglingAttachments) return;

        setIsTogglingAttachments(true);
        const newState = !features.plugins.attachments.enabled;

        try {
            const result = await toggleAttachmentPluginAction(newState);
            if (result.success) {
                showToast(
                    newState ? '画像添付機能を有効にしました' : '画像添付機能を無効にしました',
                    'success'
                );
            } else {
                showToast('設定の更新に失敗しました', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('予期せぬエラーが発生しました', 'error');
        } finally {
            setIsTogglingAttachments(false);
        }
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
                    {/* Backup Section */}
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

                    {/* Plugin Settings Section */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Camera className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">画像添付機能 (Plugin)</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    記録に画像を添付できるようにします。<br />
                                    <span className="text-xs text-slate-400">
                                        現在は{features.plugins.attachments.enabled ? '有効' : '無効'}です
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleToggleAttachments}
                                variant={features.plugins.attachments.enabled ? "default" : "outline"}
                                disabled={isTogglingAttachments}
                                className={features.plugins.attachments.enabled ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                            >
                                {isTogglingAttachments && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {features.plugins.attachments.enabled ? '有効化済み' : '有効化する'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Future settings sections can go here */}
        </div>
    );
};
