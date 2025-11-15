import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import QuickAddTaskModal from './QuickAddTaskModal'

// Mock useAppStore
const mockAddTask = vi.fn()
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn((selector) => {
    const store = {
      addTask: mockAddTask,
    }
    return selector ? selector(store) : store
  }),
}))

// Mock useToast
const mockToastShow = vi.fn()
vi.mock('@/components/Providers', () => ({
  useToast: () => ({
    show: mockToastShow,
  }),
}))

// Mock useSpeechRecognition
const mockToggleSpeech = vi.fn()
vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    listening: false,
    toggle: mockToggleSpeech,
  }),
}))

describe('QuickAddTaskModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAddTask.mockReturnValue('test-task-id')
  })

  describe('Basic Rendering', () => {
    test('should not render when isOpen is false', () => {
      renderWithProviders(
        <QuickAddTaskModal isOpen={false} onClose={mockOnClose} />
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('should render modal when isOpen is true', () => {
      renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('タスク名を入力...')).toBeInTheDocument()
    })

    test('should display keyboard shortcut hint', () => {
      renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )
      expect(
        screen.getByText(/Enter: 保存/)
      ).toBeInTheDocument()
    })
  })

  describe('Task Creation', () => {
    test('should create task when Enter is pressed', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const input = screen.getByPlaceholderText('タスク名を入力...')
      await user.type(input, 'New Task')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Task',
            type: 'backlog',
          })
        )
      })
    })

    test('should not create task with empty title', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const input = screen.getByPlaceholderText('タスク名を入力...')
      await user.click(input)
      await user.keyboard('{Enter}')

      expect(mockAddTask).not.toHaveBeenCalled()
    })

    test('should trim whitespace from title', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const input = screen.getByPlaceholderText('タスク名を入力...')
      await user.type(input, '  Spaced Task  ')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Spaced Task',
          })
        )
      })
    })

    test('should show success toast when task is created', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const input = screen.getByPlaceholderText('タスク名を入力...')
      await user.type(input, 'New Task')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.stringContaining('New Task'),
          'success'
        )
      })
    })
  })

  describe('Modal Closing', () => {
    test('should close modal on Escape key', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    test('should close modal when clicking backdrop', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50')
      if (backdrop) {
        await user.click(backdrop)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    test('should close modal when clicking close button', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const closeButton = screen.getByLabelText('閉じる')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Continuous Task Addition', () => {
    test('should clear input and keep modal open after creating task', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const input = screen.getByPlaceholderText('タスク名を入力...')

      // First task
      await user.type(input, 'Task 1')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Task 1',
          })
        )
      })

      // Input should be cleared but modal still open
      expect(input).toHaveValue('')
      expect(mockOnClose).not.toHaveBeenCalled()

      // Second task
      await user.type(input, 'Task 2')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'quick-add-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'quick-add-description')
    })

    test('should disable buttons when submitting', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const input = screen.getByPlaceholderText('タスク名を入力...')
      await user.type(input, 'Test Task')

      const saveButton = screen.getByRole('button', { name: '保存' })
      expect(saveButton).not.toBeDisabled()
    })
  })

  describe('Voice Input', () => {
    test('should render voice input button', () => {
      renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const voiceButton = screen.getByLabelText(/音声入力を開始/)
      expect(voiceButton).toBeInTheDocument()
    })

    test('should toggle speech when voice button is clicked', async () => {
      const { user } = renderWithProviders(
        <QuickAddTaskModal isOpen={true} onClose={mockOnClose} />
      )

      const voiceButton = screen.getByLabelText(/音声入力を開始/)
      await user.click(voiceButton)

      expect(mockToggleSpeech).toHaveBeenCalled()
    })
  })
})
