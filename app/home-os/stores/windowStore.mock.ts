import { vi } from 'vitest'
import type { MockWindowStore } from '@/src/test/types'
import type { Window } from './windowStore'

export const createMockWindowStore = (windows: Window[] = []): MockWindowStore => ({
  windows,
  addWindow: vi.fn(),
  updateWindow: vi.fn(),
  focusWindow: vi.fn(),
  minimizeWindow: vi.fn(),
  maximizeWindow: vi.fn(),
  restoreWindow: vi.fn(),
  closeWindow: vi.fn(),
})