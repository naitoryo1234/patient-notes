# モーダル・ダイアログ実装ガイド

本ドキュメントは、Radix UI DialogとReactを使用したモーダル・ダイアログ実装時の注意点とベストプラクティスをまとめたものです。

---

## 🎯 対象コンポーネント

- `@radix-ui/react-dialog` (shadcn/ui経由)
- カスタム確認ダイアログ (`ConfirmDialog`)
- ポータル経由のオーバーレイダイアログ

---

## ⚠️ 遭遇した問題と解決策

### 1. 複数ダイアログのz-index競合

**症状**: 確認ダイアログがメインモーダルの後ろに表示されてクリックできない

**原因**: Radix UIの`DialogPortal`は独自のスタッキングコンテキストを作成し、内部のz-indexが外部に影響しない

**解決策**: `createPortal`で確認ダイアログを直接`document.body`に描画
```tsx
import { createPortal } from 'react-dom';

// SSR対応のためmounted状態を追加
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

// レンダリング
{mounted && showConfirm && createPortal(
    <div style={{ zIndex: 99999 }}>
        {/* ダイアログ内容 */}
    </div>,
    document.body
)}
```

---

### 2. pointer-eventsの問題

**症状**: ボタンがクリックできない、背景のモーダルが操作可能

**原因**: z-indexだけでなくpointer-eventsも適切に設定する必要がある

**解決策**: 明示的に`pointerEvents: 'auto'`を設定
```tsx
<div style={{ zIndex: 99999, pointerEvents: 'auto' }}>
    <div 
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
    >
        <button style={{ pointerEvents: 'auto' }}>
            ボタン
        </button>
    </div>
</div>
```

---

### 3. useState非同期更新によるタイミング問題

**症状**: `setShowConfirm(false)`した直後に別のハンドラが呼ばれ、古い状態で判定される

**原因**: useStateの更新は非同期。`setState`呼び出し直後は古い値が残っている可能性がある

**解決策**: `useRef`で即時反映するフラグを使用
```tsx
const returningFromConfirmRef = useRef(false);

// ダイアログを閉じる前にフラグをセット（即時反映）
const handleGoBack = () => {
    returningFromConfirmRef.current = true;
    setShowConfirm(false);
};

// ハンドラでフラグをチェック
const handleSafeClose = () => {
    if (returningFromConfirmRef.current) {
        returningFromConfirmRef.current = false;
        return; // スキップ
    }
    // 通常の処理
};
```

---

### 4. Dialog閉じるイベントの多重発火

**症状**: 確認ダイアログ表示中にメインDialogの`onOpenChange`が発火

**原因**: ポータル経由のダイアログがイベントを発火させる場合がある

**解決策**: 全てのDialogイベントハンドラで状態チェック
```tsx
<Dialog 
    open={isOpen} 
    onOpenChange={(open) => {
        // 確認ダイアログ表示中は無視
        if (showSubmitConfirm || returningRef.current) {
            returningRef.current = false;
            return;
        }
        if (!open) handleSafeClose();
    }}
>
    <DialogContent
        onPointerDownOutside={(e) => {
            e.preventDefault();
            if (showSubmitConfirm || returningRef.current) return;
            // 通常の処理
        }}
        onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (showSubmitConfirm || returningRef.current) return;
            // 通常の処理
        }}
        onInteractOutside={(e) => e.preventDefault()}
    >
```

---

## 🎨 UIベストプラクティス

### 選択状態の明確化

検索結果と選択済み状態を明確に区別する：

```tsx
// 選択済み（緑の枠線 + バッジ）
<div className="bg-green-50 border-2 border-green-400">
    <span className="bg-green-500 text-white text-[10px] px-1.5 rounded">
        ✓ 選択済み
    </span>
    <div className="font-bold text-lg">{name}</div>
</div>

// 検索結果（通常のリスト）
<button className="hover:bg-indigo-50 rounded-md">
    <span className="text-sm">{name}</span>
</button>
```

---

### IME変換候補との共存

**問題**: IME変換候補が左側に表示され、検索結果のテキストを隠す

**解決策**: 検索結果を右詰めにする
```tsx
<button className="flex items-center justify-end gap-2">
    <span className="truncate">{kana}</span>
    <span className="font-bold">{name}</span>
    <span className="bg-slate-100">No.{id}</span>
</button>
```

---

## 📝 チェックリスト

ダイアログ実装時のチェックリスト：

- [ ] 複数ダイアログを重ねる場合は`createPortal`を使用
- [ ] z-indexを十分に高く設定（99999推奨）
- [ ] `pointerEvents: 'auto'`を明示的に設定
- [ ] 全ての`onClick`で`e.stopPropagation()`
- [ ] `onMouseDown`/`onTouchStart`でも`e.stopPropagation()`
- [ ] SSR対応のため`mounted`状態を使用
- [ ] 閉じる処理では`useRef`フラグを使用（useState非同期問題回避）
- [ ] メインDialogの全イベントハンドラで子ダイアログ状態をチェック

---

*最終更新: 2025-12-14*
