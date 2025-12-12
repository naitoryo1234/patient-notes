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

export function AiUsageGuide() {
    const { showToast } = useToast();

    // シンプルなプロンプト（今回作成したもの）
    const simplePrompt = `以下のメモをSOAP形式に整理してください。
- S: 主訴（患者の訴え）
- O: 所見（客観的な観察）
- A: 施術内容
- P: 計画（次回への申し送り）

出力は「S: 〜」「O: 〜」の形式で、余計な説明は不要です。

---
（ここにメモを追記）`;

    // 詳細なプロンプト（従来のもの）
    const detailedPrompt = `以下の情報をSOAP形式でカルテの下書きにしてください。

患者の言葉:
「ここに患者さんの言葉を入力」

観察事項:
・ここに観察内容を入力
・ここに観察内容を入力

施術内容:
・ここに施術内容を入力
・ここに施術内容を入力`;

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
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 cursor-pointer hover:bg-indigo-100 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white p-1.5 rounded-md shadow-sm text-indigo-600">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <h4 className="font-bold text-indigo-900">AI活用ガイド</h4>
                    </div>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                        「どう使えばいいの？」<br />
                        AIを使ってカルテ入力を爆速化するための<br />
                        <span className="font-bold border-b border-indigo-400">プロンプト活用術</span>はこちら
                    </p>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-indigo-500" />
                        AIカルテ入力ガイド
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        GeminiやChatGPTを使って、カルテ作成を3ステップで完了！
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* かんたん3ステップ */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4">
                        <h3 className="font-bold text-lg text-indigo-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            かんたん3ステップ
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white/80 rounded-lg p-3 text-center">
                                <div className="text-2xl mb-1">📋</div>
                                <div className="text-sm font-bold text-slate-800">1. コピー</div>
                                <div className="text-xs text-slate-600">下のプロンプトをコピー</div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3 text-center">
                                <div className="text-2xl mb-1">✏️</div>
                                <div className="text-sm font-bold text-slate-800">2. メモ追記</div>
                                <div className="text-xs text-slate-600">Gemini等に貼り付けてメモ追記</div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3 text-center">
                                <div className="text-2xl mb-1">📥</div>
                                <div className="text-sm font-bold text-slate-800">3. 貼り付け</div>
                                <div className="text-xs text-slate-600">AIの返答を「AI取込」に貼り付け</div>
                            </div>
                        </div>
                    </div>

                    {/* シンプル版プロンプト */}
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-green-500 pl-3 flex items-center gap-2">
                            🌱 シンプル版
                            <span className="text-xs font-normal text-slate-500">（初めての方向け）</span>
                        </h3>
                        <p className="text-sm text-slate-600">
                            短いメモから直接SOAP形式に変換。「---」の下にメモを書くだけ！
                        </p>
                        <div className="bg-green-50 p-4 rounded-md border border-green-200 relative group">
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap pr-20">{simplePrompt}</pre>
                            <Button
                                size="sm"
                                className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={copySimplePrompt}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                コピー
                            </Button>
                        </div>
                    </section>

                    {/* 詳細版プロンプト */}
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3 flex items-center gap-2">
                            🔷 詳細版
                            <span className="text-xs font-normal text-slate-500">（より構造的に入力したい方向け）</span>
                        </h3>
                        <p className="text-sm text-slate-600">
                            患者の言葉・観察・施術を分けて入力。より正確な変換が可能。
                        </p>
                        <div className="bg-slate-100 p-4 rounded-md border border-slate-200 relative group">
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap pr-20">{detailedPrompt}</pre>
                            <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2 bg-white"
                                onClick={copyDetailedPrompt}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                コピー
                            </Button>
                        </div>
                    </section>

                    {/* 入力例 */}
                    <section className="bg-amber-50 p-4 rounded-md border-l-4 border-amber-400">
                        <p className="text-xs font-bold text-amber-800 mb-2">💡 こんな雑なメモでOK！</p>
                        <p className="text-sm text-slate-700 font-mono">
                            腰痛い、昨日重いもの持った<br />
                            右腰圧痛、前屈で増強<br />
                            腰鍼した、電気も
                        </p>
                    </section>

                    {/* AIツールへのリンク */}
                    <div className="pt-4 border-t border-slate-100 flex justify-center gap-4">
                        <a
                            href="https://gemini.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50"
                        >
                            <ExternalLink className="w-4 h-4" /> Geminiを開く
                        </a>
                        <a
                            href="https://chatgpt.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50"
                        >
                            <ExternalLink className="w-4 h-4" /> ChatGPTを開く
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

