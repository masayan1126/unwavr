import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, triggerGlobalShortcut } from '@/test/utils'
import LayoutChrome from './LayoutChrome'

// Mock子コンポーネント
vi.mock('@/components/SidebarConditional', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}))

vi.mock('@/components/NotificationBars', () => ({
  default: () => <div data-testid="notifications">Notifications</div>,
}))

vi.mock('@/components/OnboardingGuide', () => ({
  default: () => <div data-testid="onboarding">Onboarding</div>,
}))

vi.mock('@/components/GlobalLauncherBarConditional', () => ({
  default: () => <div data-testid="launcher">Launcher</div>,
}))

vi.mock('@/components/CookieConsentConditional', () => ({
  default: () => <div data-testid="cookie">Cookie</div>,
}))

vi.mock('@/components/MobileTabBar', () => ({
  default: () => <div data-testid="mobile-tab">Mobile Tab</div>,
}))

vi.mock('@/components/PomodoroTopBar', () => ({
  default: () => <div data-testid="pomodoro">Pomodoro</div>,
}))

vi.mock('@/components/QuickAddTaskModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div role="dialog" data-testid="quick-add-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

describe('LayoutChrome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Global Shortcut', () => {
    test('should open modal when Cmd+K is pressed', async () => {
      renderWithProviders(<LayoutChrome>Content</LayoutChrome>)

      expect(screen.queryByTestId('quick-add-modal')).not.toBeInTheDocument()

      triggerGlobalShortcut('k', { metaKey: true })

      await waitFor(() => {
        expect(screen.getByTestId('quick-add-modal')).toBeInTheDocument()
      })
    })

    test('should open modal when Ctrl+K is pressed', async () => {
      renderWithProviders(<LayoutChrome>Content</LayoutChrome>)

      triggerGlobalShortcut('k', { ctrlKey: true })

      await waitFor(() => {
        expect(screen.getByTestId('quick-add-modal')).toBeInTheDocument()
      })
    })

    test('should not open modal when only K is pressed', () => {
      renderWithProviders(<LayoutChrome>Content</LayoutChrome>)

      triggerGlobalShortcut('k')

      expect(screen.queryByTestId('quick-add-modal')).not.toBeInTheDocument()
    })
  })

  describe('Focus Detection', () => {
    test('should not trigger shortcut when input has focus', async () => {
      renderWithProviders(
        <LayoutChrome>
          <input type="text" placeholder="Test input" />
        </LayoutChrome>
      )

      const input = screen.getByPlaceholderText('Test input')
      input.focus()

      // Simulate keydown on the focused input
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: input, enumerable: true })
      window.dispatchEvent(event)

      // Modal should not open
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(screen.queryByTestId('quick-add-modal')).not.toBeInTheDocument()
    })

    test('should not trigger shortcut when textarea has focus', async () => {
      renderWithProviders(
        <LayoutChrome>
          <textarea placeholder="Test textarea" />
        </LayoutChrome>
      )

      const textarea = screen.getByPlaceholderText('Test textarea')
      textarea.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: textarea, enumerable: true })
      window.dispatchEvent(event)

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(screen.queryByTestId('quick-add-modal')).not.toBeInTheDocument()
    })
  })

  describe('Modal State Management', () => {
    test('should not open modal twice when shortcut is pressed while modal is open', async () => {
      renderWithProviders(<LayoutChrome>Content</LayoutChrome>)

      // Open modal
      triggerGlobalShortcut('k', { metaKey: true })

      await waitFor(() => {
        expect(screen.getByTestId('quick-add-modal')).toBeInTheDocument()
      })

      // Try to open again
      triggerGlobalShortcut('k', { metaKey: true })

      // Should still have only one modal
      await waitFor(() => {
        const modals = screen.getAllByTestId('quick-add-modal')
        expect(modals).toHaveLength(1)
      })
    })

    test('should close modal when close button is clicked', async () => {
      const { user } = renderWithProviders(<LayoutChrome>Content</LayoutChrome>)

      // Open modal
      triggerGlobalShortcut('k', { metaKey: true })

      await waitFor(() => {
        expect(screen.getByTestId('quick-add-modal')).toBeInTheDocument()
      })

      // Close modal
      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('quick-add-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Children Rendering', () => {
    test('should render children content', () => {
      renderWithProviders(
        <LayoutChrome>
          <div data-testid="child-content">Test Content</div>
        </LayoutChrome>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('should preserve children when modal opens', async () => {
      renderWithProviders(
        <LayoutChrome>
          <div data-testid="child-content">Persistent Content</div>
        </LayoutChrome>
      )

      triggerGlobalShortcut('k', { metaKey: true })

      await waitFor(() => {
        expect(screen.getByTestId('quick-add-modal')).toBeInTheDocument()
      })

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })
  })

  describe('Layout Components', () => {
    test('should render all layout components', () => {
      renderWithProviders(<LayoutChrome>Content</LayoutChrome>)

      expect(screen.getByTestId('pomodoro')).toBeInTheDocument()
      expect(screen.getByTestId('notifications')).toBeInTheDocument()
      expect(screen.getByTestId('onboarding')).toBeInTheDocument()
      expect(screen.getByTestId('launcher')).toBeInTheDocument()
      expect(screen.getByTestId('cookie')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-tab')).toBeInTheDocument()
    })
  })
})
