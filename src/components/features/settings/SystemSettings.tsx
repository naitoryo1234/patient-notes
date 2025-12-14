'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Camera, Loader2, RotateCcw, HardDrive, RefreshCw, FolderOpen, Calendar } from 'lucide-react';
import { LABELS } from '@/config/labels';
import { useFeatures } from '@/contexts/FeaturesContext';
import { toggleAttachmentPluginAction, updateCalendarBusinessHoursAction } from '@/actions/settingActions';
import { CALENDAR_DEFAULTS } from '@/services/systemSettingService';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Type declaration for Electron API
declare global {
    interface Window {
        electronAPI?: {
            platform: string;
            listBackups: () => Promise<Array<{
                name: string;
                path: string;
                size: number;
                date: string;
            }>>;
            restoreBackup: (backupName: string) => Promise<{ success: boolean; error?: string }>;
            getBackupDir: () => Promise<string>;
            restartApp: () => Promise<void>;
        };
    }
}

// Format file size to human readable
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format date to locale string
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const SystemSettings = () => {
    const { features, calendarSettings } = useFeatures();
    const { showToast } = useToast();
    const [isTogglingAttachments, setIsTogglingAttachments] = useState(false);

    // Calendar settings state
    const [calendarStartHour, setCalendarStartHour] = useState(
        calendarSettings?.startHour ?? CALENDAR_DEFAULTS.weekStartHour
    );
    const [calendarEndHour, setCalendarEndHour] = useState(
        calendarSettings?.endHour ?? CALENDAR_DEFAULTS.weekEndHour
    );
    const [isSavingCalendarSettings, setIsSavingCalendarSettings] = useState(false);

    // Electron backup state
    const [isElectron, setIsElectron] = useState(false);
    const [backups, setBackups] = useState<Array<{
        name: string;
        path: string;
        size: number;
        date: string;
    }>>([]);
    const [backupDir, setBackupDir] = useState<string>('');
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

    // Check if running in Electron
    useEffect(() => {
        setIsElectron(typeof window !== 'undefined' && !!window.electronAPI);
    }, []);

    // Load backups list
    const loadBackups = useCallback(async () => {
        if (!window.electronAPI) return;

        setIsLoadingBackups(true);
        try {
            const [backupList, dir] = await Promise.all([
                window.electronAPI.listBackups(),
                window.electronAPI.getBackupDir(),
            ]);
            setBackups(backupList);
            setBackupDir(dir);
        } catch (error) {
            console.error('Failed to load backups:', error);
            showToast('バックアップ一覧の読み込みに失敗しました', 'error');
        } finally {
            setIsLoadingBackups(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (isElectron) {
            loadBackups();
        }
    }, [isElectron, loadBackups]);

    const handleDownloadBackup = () => {
        // Trigger download via direct navigation to API route
        window.location.href = '/api/backup/download';
    };

    const handleRestoreBackup = async (backupName: string) => {
        if (!window.electronAPI) return;

        setIsRestoring(true);
        setConfirmRestore(null);

        try {
            const result = await window.electronAPI.restoreBackup(backupName);
            if (result.success) {
                showToast('バックアップを復元しました。アプリを再起動します...', 'success');
                // Wait a moment then restart
                setTimeout(() => {
                    window.electronAPI?.restartApp();
                }, 1500);
            } else {
                showToast(`復元に失敗: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Restore failed:', error);
            showToast('復元中にエラーが発生しました', 'error');
        } finally {
            setIsRestoring(false);
        }
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

    const handleSaveCalendarSettings = async () => {
        if (isSavingCalendarSettings) return;

        setIsSavingCalendarSettings(true);
        try {
            const result = await updateCalendarBusinessHoursAction(calendarStartHour, calendarEndHour);
            if (result.success) {
                showToast('カレンダー設定を保存しました', 'success');
            } else {
                showToast(result.error || '設定の保存に失敗しました', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('予期せぬエラーが発生しました', 'error');
        } finally {
            setIsSavingCalendarSettings(false);
        }
    };

    // Check if calendar settings have changed
    const calendarSettingsChanged =
        calendarStartHour !== (calendarSettings?.startHour ?? CALENDAR_DEFAULTS.weekStartHour) ||
        calendarEndHour !== (calendarSettings?.endHour ?? CALENDAR_DEFAULTS.weekEndHour);

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
                    {/* Browser Backup Section (always shown) */}
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

                    {/* Electron Backup Management Section */}
                    {isElectron && (
                        <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <HardDrive className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">自動バックアップ管理</h3>
                                        <p className="text-xs text-slate-500">
                                            アプリ起動・終了時に自動でバックアップを作成します
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={loadBackups}
                                    variant="ghost"
                                    size="sm"
                                    disabled={isLoadingBackups}
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>

                            {backupDir && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <FolderOpen className="w-3 h-3" />
                                    <span className="truncate">{backupDir}</span>
                                </div>
                            )}

                            {isLoadingBackups ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : backups.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    バックアップがありません
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {backups.map((backup) => (
                                        <div
                                            key={backup.name}
                                            className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-700 truncate">
                                                    {backup.name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {formatDate(backup.date)} • {formatFileSize(backup.size)}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => setConfirmRestore(backup.name)}
                                                variant="outline"
                                                size="sm"
                                                disabled={isRestoring}
                                                className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                復元
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

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

                    {/* Calendar Settings Section */}
                    <div className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">カレンダー表示設定</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    週表示カレンダーの営業時間（表示範囲）を設定します。
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 ml-11">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600">開始</label>
                                <select
                                    value={calendarStartHour}
                                    onChange={(e) => setCalendarStartHour(Number(e.target.value))}
                                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 5).map((hour) => (
                                        <option key={hour} value={hour}>{hour}:00</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-slate-400">〜</span>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600">終了</label>
                                <select
                                    value={calendarEndHour}
                                    onChange={(e) => setCalendarEndHour(Number(e.target.value))}
                                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 12).map((hour) => (
                                        <option key={hour} value={hour}>{hour}:00</option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                onClick={handleSaveCalendarSettings}
                                variant={calendarSettingsChanged ? "default" : "outline"}
                                disabled={isSavingCalendarSettings || !calendarSettingsChanged}
                                size="sm"
                                className={calendarSettingsChanged ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            >
                                {isSavingCalendarSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {calendarSettingsChanged ? '保存' : '保存済み'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Restore Confirmation Dialog */}
            <ConfirmDialog
                open={!!confirmRestore}
                onOpenChange={(open) => !open && setConfirmRestore(null)}
                title="バックアップを復元しますか？"
                description={`${confirmRestore} を復元すると、現在のデータは上書きされます。復元前に安全バックアップが自動作成されます。復元後、アプリは自動的に再起動されます。`}
                confirmLabel="復元する"
                cancelLabel="キャンセル"
                variant="warning"
                onConfirm={() => { if (confirmRestore) handleRestoreBackup(confirmRestore); }}
            />
        </div>
    );
};

