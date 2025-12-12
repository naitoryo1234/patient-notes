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
import { LABELS } from '@/config/labels';
import { useToast } from '@/components/ui/Toast';

export function AiUsageGuidePatient() {
    const { showToast } = useToast();

    // シンプル版プロンプト
    const simplePrompt = `以下のテキストから患者情報を抽出してください。

【出力形式】
氏名: 
かな: 
生年月日: 
電話: 
性別: 
Memo: 

---
（ここにLINEやメールの文章を貼り付け）`;

    // 詳細版プロンプト
    const detailedPrompt = `以下の患者情報を抽出して形式を整えてください。

【入力テキスト】
「ここにLINEやメールの文章、またはメモを貼り付け」

【出力形式】
氏名: （フルネーム、スペース区切り）
かな: （ひらがな、スペース区切り）
生年月日: YYYY-MM-DD形式
電話: ハイフン区切り
性別: 男性/女性/その他
Memo: その他の情報（持病、紹介元など）`;

    const copySimplePrompt = () => {
        navigator.clipboard.writeText(simplePrompt);
        showToast("シンプル版をコピーしました！", 'success');
    };

    const copyDetailedPrompt = () => {
        navigator.clipboard.writeText(detailedPrompt);
        showToast("詳細版をコピーしました！", 'success');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-xs transition-colors">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">{LABELS.AI_MODE.GUIDE.BUTTON}</span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        患者情報 AI取込ガイド
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        LINEやメールから患者情報を自動抽出！
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
                                <div className="text-xs font-bold text-slate-800">2. 貼り付け</div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 text-center">
                                <div className="text-xl mb-0.5">📥</div>
                                <div className="text-xs font-bold text-slate-800">3. 取込</div>
                            </div>
                        </div>
                    </div>

                    {/* シンプル版 */}
                    <section className="space-y-2">
                        <h3 className="text-base font-bold text-slate-800 border-l-4 border-green-500 pl-3 flex items-center gap-2">
                            🌱 シンプル版
                            <span className="text-xs font-normal text-slate-500">（初めての方向け）</span>
                        </h3>
                        <div className="bg-green-50 p-3 rounded-md border border-green-200 relative group">
                            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap pr-16">{simplePrompt}</pre>
                            <Button
                                size="sm"
                                className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={copySimplePrompt}
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                コピー
                            </Button>
                        </div>
                    </section>

                    {/* 詳細版 */}
                    <section className="space-y-2">
                        <h3 className="text-base font-bold text-slate-800 border-l-4 border-indigo-500 pl-3 flex items-center gap-2">
                            🔷 詳細版
                            <span className="text-xs font-normal text-slate-500">（より正確な抽出）</span>
                        </h3>
                        <div className="bg-slate-100 p-3 rounded-md border border-slate-200 relative group">
                            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap pr-16">{detailedPrompt}</pre>
                            <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2 bg-white text-xs"
                                onClick={copyDetailedPrompt}
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
                            電話は090-9876-5432。糖尿病の持病があります」
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

