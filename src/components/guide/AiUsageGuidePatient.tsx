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
import { Copy, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react"
import { LABELS, TERMS } from '@/config/labels';
import { useToast } from '@/components/ui/Toast';

export function AiUsageGuidePatient() {
    const { showToast } = useToast();

    // 統合版プロンプト（出力安定化）
    // TERMSを使用して業態に応じた文言に対応
    const patientPrompt = `以下のテキストから${TERMS.PATIENT}情報を抽出してください。

【出力ルール】
- 結果のみをコードブロック（\`\`\`）で囲んで出力
- Markdown記号（#, *, **）は使わずプレーンテキストで

【出力形式】
氏名: （フルネーム、スペース区切り）
かな: （ひらがな、スペース区切り）
生年月日: YYYY-MM-DD形式
電話: ハイフン区切り
性別: 男性/女性/その他
Memo: その他の情報

---
（ここにLINEやメールの文章を貼り付け）`;

    const copyPrompt = () => {
        navigator.clipboard.writeText(patientPrompt);
        showToast("プロンプトをコピーしました！", 'success');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-xs transition-colors">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">{LABELS.AI_MODE.GUIDE.BUTTON}</span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        {TERMS.PATIENT}情報 AI取込ガイド
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        LINEやメールから{TERMS.PATIENT}情報を自動抽出！
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
                                <div className="text-xl mb-0.5">📨</div>
                                <div className="text-xs font-bold text-slate-800">2. AI送信</div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 text-center">
                                <div className="text-xl mb-0.5">📥</div>
                                <div className="text-xs font-bold text-slate-800">3. 取込</div>
                            </div>
                        </div>
                    </div>

                    {/* プロンプト */}
                    <section className="space-y-2">
                        <h3 className="text-base font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">
                            📝 プロンプト
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 relative">
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap pr-16">{patientPrompt}</pre>
                            <Button
                                size="sm"
                                className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                                onClick={copyPrompt}
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                コピー
                            </Button>
                        </div>
                    </section>

                    {/* 入力例 */}
                    <section className="bg-amber-50 p-3 rounded-md border-l-4 border-amber-400">
                        <p className="text-xs font-bold text-amber-800 mb-1">💡 こんなテキストからでもOK！</p>
                        <p className="text-xs text-slate-700 font-mono leading-relaxed">
                            「佐藤花子です。1985年3月15日生まれ、女性です。<br />
                            電話は090-9876-5432。{TERMS.PATIENT_EXAMPLE_MEMO}」
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

