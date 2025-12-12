'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

export const SystemSettings = () => {
    const handleDownloadBackup = () => {
        // Trigger download via direct navigation to API route
        window.location.href = '/api/backup/download';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>データ管理</CardTitle>
                    <CardDescription>
                        システムのデータを管理します。定期的にバックアップを取得することをお勧めします。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                        <div>
                            <h3 className="font-medium text-slate-900">データベースバックアップ</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                現在のデータベースファイル (dev.db) をダウンロードします。
                            </p>
                        </div>
                        <Button
                            onClick={handleDownloadBackup}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            バックアップを保存
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Future settings sections can go here */}
        </div>
    );
};
