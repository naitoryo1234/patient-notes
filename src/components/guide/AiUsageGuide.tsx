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
import { Copy, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react"
import { useToast } from '@/components/ui/Toast'
import { TERMS, LABELS } from '@/config/labels';

export function AiUsageGuide() {
    const { showToast } = useToast();

    // 統合版プロンプト（出力安定化）
    // TERMSを使用して業態に応じた文言に対応
    const recordPrompt = `以下の情報を${TERMS.RECORD}の下書きにしてください。

【出力ルール】
- 結果のみをコードブロック（\`\`\`）で囲んで出力
- Markdown記号（#, *, **）は使わずプレーンテキストで
- 各項目は「項目名: 内容」の形式で

---
（ここにメモを入力）`;

    const copyPrompt = () => {
        navigator.clipboard.writeText(recordPrompt);
        showToast("プロンプトをコピーしました！", 'success');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-xs transition-colors">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">プロンプトをコピー</span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        AI {TERMS.RECORD}入力ガイド
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        GeminiやChatGPTで{TERMS.RECORD}作成をサポート
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                    {/* かんたん3ステップ */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4">
                        <h3 className="font-bold text-base text-indigo-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            かんたん3ステップ
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/80 rounded-lg p-2 text-center">
                                <div className="text-xl mb-0.5">📋</div>
                                <div className="text-xs font-bold text-slate-800">1. コピー</div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 text-center">
                                <div className="text-xl mb-0.5">✏️</div>
                                <div className="text-xs font-bold text-slate-800">2. AI送信</div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 text-center">
                                <div className="text-xl mb-0.5">📥</div>
                                <div className="text-xs font-bold text-slate-800">3. 貼り付け</div>
                            </div>
                        </div>
                    </div>

                    {/* プロンプト */}
                    <section className="space-y-2">
                        <h3 className="text-base font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">
                            📝 プロンプト
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 relative">
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap pr-16">{recordPrompt}</pre>
                            <Button
                                size="sm"
                                className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={copyPrompt}
                            >
                                <Copy className="w-4 h-4 mr-1" />
                                コピー
                            </Button>
                        </div>
                    </section>

                    {/* 入力例 */}
                    <section className="bg-amber-50 p-3 rounded-md border-l-4 border-amber-400">
                        <p className="text-xs font-bold text-amber-800 mb-1">💡 こんな雑なメモでOK！</p>
                        <p className="text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-line">
                            {TERMS.RECORD_EXAMPLE_MEMO}
                        </p>
                    </section>

                    {/* AIツールへのリンク */}
                    <div className="pt-3 border-t border-slate-100 flex justify-center gap-4">
                        <a
                            href="https://gemini.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                        >
                            <ExternalLink className="w-3 h-3" /> Gemini
                        </a>
                        <a
                            href="https://chatgpt.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                        >
                            <ExternalLink className="w-3 h-3" /> ChatGPT
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

