/**
 * Shared test utilities for creating properly typed mocks
 * These utilities ensure type safety across all test files
 */

import { vi, type Mock } from 'vitest'
import type { ReactNode } from 'react'

// ============================================================================
// Environment Utilities
// ============================================================================

/**
 * Type-safe NODE_ENV setter for tests
 * Uses Object.defineProperty to properly override read-only property
 */
export const setNodeEnv = (value: string): void => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  })
}

/**
 * Store original NODE_ENV and provide reset function
 */
export class NodeEnvManager {
  private originalNodeEnv: string | undefined

  constructor() {
    this.originalNodeEnv = process.env.NODE_ENV
  }

  set(value: string): void {
    setNodeEnv(value)
  }

  reset(): void {
    setNodeEnv(this.originalNodeEnv || 'test')
  }
}

// ============================================================================
// Event Mock Types and Factories
// ============================================================================

export interface MockPointerEventInit {
  preventDefault?: Mock
  stopPropagation?: Mock
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  screenX?: number
  screenY?: number
  pointerId?: number
  pointerType?: string
  isPrimary?: boolean
  button?: number
  buttons?: number
  width?: number
  height?: number
  pressure?: number
  tangentialPressure?: number
  tiltX?: number
  tiltY?: number
  twist?: number
  altitudeAngle?: number
  azimuthAngle?: number
  target?: EventTarget | null
}

/**
 * Creates a properly typed mock PointerEvent
 */
export const createMockPointerEvent = (init: MockPointerEventInit = {}): PointerEvent => {
  const event = new Event('pointermove') as PointerEvent
  
  // Override with mock values
  Object.defineProperties(event, {
    preventDefault: { value: init.preventDefault || vi.fn(), writable: true },
    stopPropagation: { value: init.stopPropagation || vi.fn(), writable: true },
    clientX: { value: init.clientX ?? 0, writable: true },
    clientY: { value: init.clientY ?? 0, writable: true },
    pageX: { value: init.pageX ?? init.clientX ?? 0, writable: true },
    pageY: { value: init.pageY ?? init.clientY ?? 0, writable: true },
    screenX: { value: init.screenX ?? init.clientX ?? 0, writable: true },
    screenY: { value: init.screenY ?? init.clientY ?? 0, writable: true },
    pointerId: { value: init.pointerId ?? 1, writable: true },
    pointerType: { value: init.pointerType ?? 'mouse', writable: true },
    isPrimary: { value: init.isPrimary ?? true, writable: true },
    button: { value: init.button ?? 0, writable: true },
    buttons: { value: init.buttons ?? 1, writable: true },
    width: { value: init.width ?? 1, writable: true },
    height: { value: init.height ?? 1, writable: true },
    pressure: { value: init.pressure ?? 0.5, writable: true },
    tangentialPressure: { value: init.tangentialPressure ?? 0, writable: true },
    tiltX: { value: init.tiltX ?? 0, writable: true },
    tiltY: { value: init.tiltY ?? 0, writable: true },
    twist: { value: init.twist ?? 0, writable: true },
    altitudeAngle: { value: init.altitudeAngle ?? Math.PI / 2, writable: true },
    azimuthAngle: { value: init.azimuthAngle ?? 0, writable: true },
    target: { value: init.target || document.createElement('div'), writable: true }
  })
  
  return event
}

export interface MockMouseEventInit {
  preventDefault?: Mock
  stopPropagation?: Mock
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  screenX?: number
  screenY?: number
  button?: number
  buttons?: number
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  target?: EventTarget | null
}

/**
 * Creates a properly typed mock MouseEvent
 */
export const createMockMouseEvent = (type: string, init: MockMouseEventInit = {}): MouseEvent => {
  const event = new MouseEvent(type, {
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    screenX: init.screenX ?? init.clientX ?? 0,
    screenY: init.screenY ?? init.clientY ?? 0,
    button: init.button ?? 0,
    buttons: init.buttons ?? 1,
    ctrlKey: init.ctrlKey ?? false,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
    metaKey: init.metaKey ?? false,
  })
  
  if (init.preventDefault) {
    Object.defineProperty(event, 'preventDefault', { value: init.preventDefault, writable: true })
  }
  if (init.stopPropagation) {
    Object.defineProperty(event, 'stopPropagation', { value: init.stopPropagation, writable: true })
  }
  if (init.target) {
    Object.defineProperty(event, 'target', { value: init.target, writable: true })
  }
  
  return event
}

// ============================================================================
// DOM Element Mock Factories
// ============================================================================

export interface MockHTMLElementInit {
  getBoundingClientRect?: Mock
  style?: Partial<CSSStyleDeclaration>
  addEventListener?: Mock
  removeEventListener?: Mock
  setPointerCapture?: Mock
  releasePointerCapture?: Mock
  animate?: Mock
  offsetWidth?: number
  offsetHeight?: number
  offsetLeft?: number
  offsetTop?: number
  clientWidth?: number
  clientHeight?: number
  scrollWidth?: number
  scrollHeight?: number
  classList?: {
    add?: Mock
    remove?: Mock
    toggle?: Mock
    contains?: Mock
  }
}

/**
 * Creates a properly typed mock HTMLElement
 */
export const createMockHTMLElement = (init: MockHTMLElementInit = {}): HTMLElement => {
  const element = document.createElement('div')
  
  // Override methods
  if (init.getBoundingClientRect) {
    element.getBoundingClientRect = init.getBoundingClientRect
  }
  
  if (init.addEventListener) {
    element.addEventListener = init.addEventListener as unknown as typeof element.addEventListener
  }
  
  if (init.removeEventListener) {
    element.removeEventListener = init.removeEventListener as unknown as typeof element.removeEventListener
  }
  
  if (init.setPointerCapture) {
    element.setPointerCapture = init.setPointerCapture as unknown as typeof element.setPointerCapture
  }
  
  if (init.releasePointerCapture) {
    element.releasePointerCapture = init.releasePointerCapture as unknown as typeof element.releasePointerCapture
  }
  
  if (init.animate) {
    element.animate = init.animate as unknown as typeof element.animate
  }
  
  // Override style
  if (init.style) {
    Object.assign(element.style, init.style)
  }
  
  // Override dimensions
  Object.defineProperties(element, {
    offsetWidth: { value: init.offsetWidth ?? 100, writable: true },
    offsetHeight: { value: init.offsetHeight ?? 100, writable: true },
    offsetLeft: { value: init.offsetLeft ?? 0, writable: true },
    offsetTop: { value: init.offsetTop ?? 0, writable: true },
    clientWidth: { value: init.clientWidth ?? 100, writable: true },
    clientHeight: { value: init.clientHeight ?? 100, writable: true },
    scrollWidth: { value: init.scrollWidth ?? 100, writable: true },
    scrollHeight: { value: init.scrollHeight ?? 100, writable: true }
  })
  
  // Override classList if provided
  if (init.classList) {
    Object.assign(element.classList, {
      add: init.classList.add || vi.fn(),
      remove: init.classList.remove || vi.fn(),
      toggle: init.classList.toggle || vi.fn(),
      contains: init.classList.contains || vi.fn(() => false)
    })
  }
  
  return element
}

/**
 * Creates a mock DOMRect
 */
export const createMockDOMRect = (x = 0, y = 0, width = 100, height = 100): DOMRect => {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({ x, y, width, height, top: y, left: x, right: x + width, bottom: y + height })
  } as DOMRect
}

// ============================================================================
// Animation Mock Factories
// ============================================================================

export interface MockAnimationInit {
  play?: Mock
  pause?: Mock
  cancel?: Mock
  finish?: Mock
  reverse?: Mock
  addEventListener?: Mock
  removeEventListener?: Mock
  playState?: AnimationPlayState
  finished?: Promise<Animation>
}

/**
 * Creates a mock Animation object
 */
export const createMockAnimation = (init: MockAnimationInit = {}): Animation => {
  const animation = {
    play: init.play || vi.fn(),
    pause: init.pause || vi.fn(),
    cancel: init.cancel || vi.fn(),
    finish: init.finish || vi.fn(),
    reverse: init.reverse || vi.fn(),
    addEventListener: init.addEventListener || vi.fn(),
    removeEventListener: init.removeEventListener || vi.fn(),
    playState: init.playState || 'idle',
    finished: init.finished || Promise.resolve({} as Animation),
    id: 'mock-animation',
    effect: null,
    timeline: null,
    startTime: null,
    currentTime: null,
    playbackRate: 1,
    ready: Promise.resolve({} as Animation),
    onfinish: null,
    oncancel: null,
    onremove: null,
    replaceState: 'active' as AnimationReplaceState,
    pending: false,
    commitStyles: vi.fn(),
    persist: vi.fn(),
    updatePlaybackRate: vi.fn(),
    dispatchEvent: vi.fn(),
  }
  
  return animation as unknown as Animation
}

// ============================================================================
// Store Mock Utilities
// ============================================================================

export interface MockStoreInit<T> {
  getState?: () => T
  setState?: (state: Partial<T>) => void
  subscribe?: Mock
}

/**
 * Creates a mock Zustand store
 */
export const createMockStore = <T>(initialState: T, overrides?: MockStoreInit<T>) => {
  let state = { ...initialState }
  
  const store = vi.fn(() => state) as unknown as ReturnType<typeof vi.fn> & {
    getState: () => T
    setState: (state: Partial<T>) => void
    subscribe: Mock
  }
  
  // Add getState method
  Object.defineProperty(store, 'getState', {
    value: overrides?.getState || (() => state),
    writable: true,
    configurable: true
  })
  
  // Add setState method
  Object.defineProperty(store, 'setState', {
    value: overrides?.setState || ((newState: Partial<T>) => {
      state = { ...state, ...newState }
    }),
    writable: true,
    configurable: true
  })
  
  // Add subscribe method
  Object.defineProperty(store, 'subscribe', {
    value: overrides?.subscribe || vi.fn(),
    writable: true,
    configurable: true
  })
  
  return store
}

// ============================================================================
// Logger Mock Utilities
// ============================================================================

export interface MockLoggerInit {
  workspace?: {
    creating?: Mock
    installing?: Mock
    starting?: Mock
    ready?: Mock
    checking?: Mock
    retry?: Mock
  }
  logWorkspace?: Mock
  logError?: Mock
  info?: Mock
  success?: Mock
  warn?: Mock
  debug?: Mock
  error?: Mock
  progress?: Mock
  child?: Mock
  setLevel?: Mock
  isEnabled?: Mock
}

/**
 * Creates a mock logger with all required methods
 */
export const createMockLogger = (init: MockLoggerInit = {}) => {
  return {
    workspace: {
      creating: init.workspace?.creating || vi.fn(),
      installing: init.workspace?.installing || vi.fn(),
      starting: init.workspace?.starting || vi.fn(),
      ready: init.workspace?.ready || vi.fn(),
      checking: init.workspace?.checking || vi.fn(),
      retry: init.workspace?.retry || vi.fn(),
      ...init.workspace
    },
    logWorkspace: init.logWorkspace || vi.fn(),
    logError: init.logError || vi.fn(),
    info: init.info || vi.fn(),
    success: init.success || vi.fn(),
    warn: init.warn || vi.fn(),
    debug: init.debug || vi.fn(),
    error: init.error || vi.fn(),
    progress: init.progress || vi.fn(),
    child: init.child || vi.fn(),
    setLevel: init.setLevel || vi.fn(),
    isEnabled: init.isEnabled || vi.fn(() => true)
  }
}

// ============================================================================
// Mobile App Icon Mock Utilities
// ============================================================================

export interface MobileAppIcon {
  emoji?: string
  url?: string
  icon?: ReactNode
  fallback: string
}

/**
 * Creates a properly typed mobile app icon
 */
export const createMockAppIcon = (icon: string | MobileAppIcon): MobileAppIcon => {
  if (typeof icon === 'string') {
    return { fallback: icon }
  }
  return icon
}

// ============================================================================
// Window and Document Mock Utilities
// ============================================================================

/**
 * Mock window dimensions
 */
export const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true, configurable: true })
}

/**
 * Mock matchMedia for responsive tests
 */
export const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// ============================================================================
// Request Animation Frame Mock
// ============================================================================

/**
 * Creates mock requestAnimationFrame and cancelAnimationFrame
 */
export const createAnimationFrameMocks = () => {
  let animationFrameId = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  
  const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = ++animationFrameId
    callbacks.set(id, callback)
    // Execute callback immediately in tests
    setTimeout(() => {
      const cb = callbacks.get(id)
      if (cb) {
        cb(performance.now())
        callbacks.delete(id)
      }
    }, 0)
    return id
  })
  
  const mockCancelAnimationFrame = vi.fn((id: number) => {
    callbacks.delete(id)
  })
  
  // Flush all pending callbacks
  const flushAnimationFrames = () => {
    const time = performance.now()
    callbacks.forEach((callback) => callback(time))
    callbacks.clear()
  }
  
  return {
    mockRequestAnimationFrame,
    mockCancelAnimationFrame,
    flushAnimationFrames
  }
}

// ============================================================================
// Type Guards and Assertions
// ============================================================================

/**
 * Type guard to check if a value is a Mock function
 */
export const isMockFunction = (value: unknown): value is Mock => {
  return typeof value === 'function' && 'mock' in value
}

/**
 * Assert that a value is a Mock function
 */
export const assertMockFunction = (value: unknown): asserts value is Mock => {
  if (!isMockFunction(value)) {
    throw new Error('Value is not a mock function')
  }
}