import { vi } from 'vitest'
import type { MockWindowStore } from '@/src/test/types'
import type { Window } from './windowStore'

export const createMockWindowStore = (windows: Window[] = []): MockWindowStore => ({
  windows,
  nextZIndex: 100,
  activeWindowId: null,
  onboardingCompleted: true,
  addWindow: vi.fn(),
  removeWindow: vi.fn(),
  updateWindow: vi.fn(),
  focusWindow: vi.fn(),
  minimizeWindow: vi.fn(),
  maximizeWindow: vi.fn(),
  restoreWindow: vi.fn(),
  moveWindow: vi.fn(),
  resizeWindow: vi.fn(),
  setWindowAnimating: vi.fn(),
  closeWindow: vi.fn(),
  initializeWindows: vi.fn(),
  completeOnboarding: vi.fn(),
})