'use client'

import { motion, Variants, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * PageTransitionコンポーネントのプロパティ
 */
interface PageTransitionProps {
  /**
   * アニメーション対象の子要素
   */
  children: React.ReactNode
  /**
   * 追加のCSSクラス名（オプション）
   */
  className?: string
}

/**
 * ページ遷移時のフェード＆スライドアニメーションを提供するコンポーネント
 *
 * このコンポーネントは、ページ遷移時に滑らかなフェード＆スライドアニメーションを実現します。
 * アクセシビリティを考慮し、ユーザーの`prefers-reduced-motion`設定に自動的に対応します。
 *
 * ## 特徴
 * - Framer Motionを使用した滑らかなアニメーション
 * - `prefers-reduced-motion`設定に自動対応（WCAG 2.1準拠）
 * - パフォーマンス最適化（GPU加速）
 *
 * ## アニメーション仕様
 * ### 通常モード（モーション有効時）
 * - **初期状態**: 透明度 0%、Y軸 +20px
 * - **表示状態**: 透明度 100%、Y軸 0px、0.3秒でフェードイン
 * - **イージング**: ease-out
 *
 * ### 減速モード（prefers-reduced-motion: reduce）
 * - **初期状態**: 透明度 100%、Y軸 0px（即座に表示）
 * - **遷移時間**: 0.1秒（最小限）
 *
 * @component
 *
 * @example
 * ```tsx
 * // 基本的な使用例
 * export default function Layout({ children }) {
 *   return (
 *     <PageTransition>
 *       {children}
 *     </PageTransition>
 *   )
 * }
 * ```
 *
 * @param {PageTransitionProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} アニメーション効果を持つコンテンツ
 *
 * @see {@link useReducedMotion} - モーション設定を検出するカスタムフック
 */
export default function PageTransition({
  children,
  className = ''
}: PageTransitionProps) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  /**
   * アニメーションバリアント定義
   * パフォーマンス最適化:
   * - exitアニメーションは透明度のみ（高速化）
   * - Y軸移動を削減（10px）
   * - アニメーション時間を短縮（0.2秒）
   */
  const variants: Variants = {
    initial: {
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : 10, // 20px → 10px に削減
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0, // Y軸移動なし（パフォーマンス向上）
    },
  }

  const transition = {
    duration: prefersReducedMotion ? 0.05 : 0.2, // 0.3秒 → 0.2秒 に短縮
    ease: [0.4, 0, 0.2, 1] as const, // easeOut equivalent
  }

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        className={className}
        style={{
          willChange: 'opacity',
          position: 'relative',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
