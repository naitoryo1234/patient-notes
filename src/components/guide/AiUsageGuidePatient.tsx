'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Sparkles } from "lucide-react"

export function AiUsageGuidePatient() {
    const promptTemplate = `以下の患者情報を抽出して形式を整えてください。

【入力テキスト】
「ここにLINEやメールの文章、またはメモを貼り付け」

【出力形式】
氏名: 
かな: 
生年月日: 
電話: 
性別: 
Memo: 
`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(promptTemplate);
        alert("プロンプト例をコピーしました！");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-xs transition-colors mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">プロンプトをコピー</span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        新規登録用プロンプト
                    </DialogTitle>
                    <DialogDescription>
                        LINEやメールでの問い合わせ文章から、患者登録データを抽出するためのプロンプトです。AIチャットツールに貼り付けてご使用ください。
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-100 p-4 rounded-md border border-slate-200 relative group mt-2">
                    <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap">{promptTemplate}</pre>
                    <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={copyToClipboard}
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        コピー
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
