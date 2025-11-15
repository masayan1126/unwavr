import { useEffect, useState } from 'react'

/**
 * ユーザーのモーション設定（prefers-reduced-motion）を検出するカスタムフック
 *
 * このフックは、ユーザーがOSやブラウザで「アニメーションを減らす」設定を有効にしているかどうかを検出します。
 * WCAG 2.1のSuccess Criterion 2.3.3 (Animation from Interactions)に準拠するために使用されます。
 *
 * @returns {boolean} ユーザーのモーション設定
 * - `true`: モーションを減らす設定が有効（アニメーションを最小限にすべき）
 * - `false`: モーションを減らす設定が無効（通常のアニメーションを使用可能）
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   return (
 *     <div
 *       className={prefersReducedMotion ? 'no-animation' : 'with-animation'}
 *     >
 *       コンテンツ
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion MDN: prefers-reduced-motion}
 * @see {@link https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html WCAG 2.1: Animation from Interactions}
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // ブラウザがmatchMediaをサポートしているか確認（SSR対応）
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    /**
     * メディアクエリの変更を監視するイベントハンドラ
     * ユーザーがリアルタイムで設定を変更した場合に対応
     */
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // イベントリスナーを登録
    mediaQuery.addEventListener('change', handleChange)

    // クリーンアップ関数
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}
