import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * カスタムレンダー関数（必要に応じてProviderを追加）
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  }
}

/**
 * キーボードイベントのヘルパー
 */
export function createKeyboardEvent(
  key: string,
  options: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  })
}

/**
 * グローバルショートカットをシミュレート
 */
export function triggerGlobalShortcut(
  key: string,
  modifiers: { metaKey?: boolean; ctrlKey?: boolean } = {}
) {
  const event = createKeyboardEvent(key, {
    ...modifiers,
    bubbles: true,
  })
  window.dispatchEvent(event)
  return event
}
