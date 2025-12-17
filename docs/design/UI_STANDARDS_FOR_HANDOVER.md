# Patient Notes UI Standards & Migration Guide

このドキュメントは、「Patient Notes」のデザインシステム（Soft & Trustworthy UI）を、分離プロジェクト（Handover Notebook）に移植するためのガイドラインです。

## 🎨 デザインコンセプト
- **Soft & Trustworthy**: 医療/対人支援の現場に馴染む、柔らかく清潔感のあるデザイン。
- **Vanilla CSS & Tailwind v4**: 余計な抽象化を避け、標準的なCSS変数とTailwind v4の機能を使用。
- **Inter Font**: 視認性が高く、数字が美しいフォント。

## 🛠️ 技術スタック要件
オリジナルのプロジェクトは以下のバージョンを使用しています。
- **Next.js**: 15+ (App Router)
- **Tailwind CSS**: v4 (Alpha/Beta)
- **Icons**: Lucide React

### 1. 依存パッケージのインストール
以下のパッケージをインストールしてください。

```bash
npm install lucide-react clsx tailwind-merge class-variance-authority @radix-ui/react-dialog
# Tailwind v4 environment setup usually involves @tailwindcss/postcss
npm install -D tailwindcss@4 @tailwindcss/postcss@4
```

---

## 📂 必須ファイルの移植

### 1. `src/lib/utils.ts` (Utility)
Tailwindのクラス結合用ユーティリティです。

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2. `src/app/globals.css` (Global Styles)
**重要**: Tailwind v4の `@theme` 構文を使用しています。v3系を使う場合は `tailwind.config.ts` に変換する必要があります。

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";

/* Dark Mode Variant */
@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

:root {
  --radius: 0.625rem;
  /* Soft & Trustworthy Palette (OKLCH) */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  /* Sidebar & Charts omitted for brevity, add if needed */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* Dark mode overrides... see original file for full set */
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 🧩 主要コンポーネント (Core Components)

### 1. Button (`src/components/ui/button.tsx`)

```tsx
import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const variants = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
    link: "text-slate-900 underline-offset-4 hover:underline",
}

export type ButtonVariant = keyof typeof variants

interface ButtonVariantProps {
    variant?: ButtonVariant
    className?: string
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const buttonVariants = ({ variant = "default", size = "default", className }: ButtonVariantProps = {}) => {
    const sizeClasses = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    }

    return cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizeClasses[size],
        className
    )
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                className={buttonVariants({ variant, size, className })}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
```

### 2. Card (`src/components/ui/card.tsx`)

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-xl border bg-card text-card-foreground shadow",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

// 他のサブコンポーネント (Footer, Description) も同様のパターンに従います
export { Card, CardHeader, CardTitle, CardContent }
```

## 📐 レイアウト推奨 (`src/app/layout.tsx`)

`RootLayout` では以下のクラス構造を推奨します。

```tsx
<body className={`${inter.className} h-full overflow-hidden`}>
  <div className="h-full flex flex-col bg-slate-50 text-slate-900">
    <header className="flex-none z-10 w-full border-b bg-white/80 backdrop-blur-sm">
      {/* Header Content */}
    </header>
    <main className="flex-1 min-h-0 container mx-auto px-4 py-4 md:py-6 overflow-hidden flex flex-col">
       {children}
    </main>
  </div>
</body>
```

- **`bg-slate-50`**: 全体の背景色をわずかにグレーにすることで、白背景のカード(`bg-white` or `bg-card`)を際立たせます。
- **`backdrop-blur-sm`**: ヘッダーにすりガラス効果を与え、モダンな印象にします。
- **`container mx-auto`**: コンテンツ幅を適切に制限します。

---

*End of Guide*
