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
import { Copy, ExternalLink, Sparkles } from "lucide-react"

export function AiUsageGuide() {
    const promptTemplate = `以下の情報をSOAP形式でカルテの下書きにしてください。

患者の言葉:
「ここに患者さんの言葉を入力」

観察事項:
・ここに観察内容を入力
・ここに観察内容を入力

施術内容:
・ここに施術内容を入力
・ここに施術内容を入力`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(promptTemplate);
        alert("プロンプト例をコピーしました！\nChat GPTやGeminiに貼り付けて使ってください。");
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
                        AIカルテ入力活用ガイド
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Chat GPTやGeminiなどのAIチャットツールを活用して、カルテ作成時間を大幅に短縮する方法をご紹介します。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">
                            Step 1. AIにプロンプトを送る
                        </h3>
                        <p className="text-sm text-slate-600">
                            以下のテキストをコピーして、AIチャットツールに貼り付けてください。
                        </p>
                        <div className="bg-slate-100 p-4 rounded-md border border-slate-200 relative group">
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
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">
                            Step 2. 箇条書きを埋める
                        </h3>
                        <p className="text-sm text-slate-600">
                            「ここに〜を入力」の部分に、箇条書きでメモを入力してAIに送信します。
                        </p>
                        <div className="bg-indigo-50 p-4 rounded-md border-l-4 border-indigo-300">
                            <p className="text-xs font-bold text-indigo-800 mb-1">入力例（こんなに雑でOK！）</p>
                            <p className="text-sm text-slate-700 font-mono">
                                患者の言葉:<br />
                                ・腰が痛い。昨日重いもの持った。<br />
                                観察:<br />
                                ・右腰に圧痛あり。前屈で痛み増強。<br />
                                施術:<br />
                                ・腰方形筋への鍼通電。<br />
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">
                            Step 3. AIの回答を貼り付け
                        </h3>
                        <p className="text-sm text-slate-600">
                            AIがきれいな「S/O/A/P形式」で文章を作り直してくれます。<br />
                            その結果をコピーして、このシステムの「AI取込」欄に貼り付けてください。
                        </p>
                    </section>

                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                        <a
                            href="https://chatgpt.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mx-2"
                        >
                            <ExternalLink className="w-4 h-4" /> ChatGPTを開く
                        </a>
                        <a
                            href="https://gemini.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mx-2"
                        >
                            <ExternalLink className="w-4 h-4" /> Geminiを開く
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
