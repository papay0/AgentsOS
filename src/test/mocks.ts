import { vi } from 'vitest'

// Define proper interfaces for mock PointerEvent
export interface MockPointerEventInit {
  preventDefault?: () => void
  stopPropagation?: () => void
  clientX: number
  clientY: number
  pointerId: number
  target?: {
    setPointerCapture?: (pointerId: number) => void
    releasePointerCapture?: (pointerId: number) => void
  }
}

// Create a mock PointerEvent that matches the real interface
export const createMockPointerEvent = (init: MockPointerEventInit): PointerEvent => {
  const mockEvent = {
    preventDefault: init.preventDefault || vi.fn(),
    stopPropagation: init.stopPropagation || vi.fn(),
    clientX: init.clientX,
    clientY: init.clientY,
    pointerId: init.pointerId,
    target: init.target || null,
    currentTarget: null,
    type: 'pointerdown',
    bubbles: true,
    cancelable: true,
    composed: true,
    defaultPrevented: false,
    eventPhase: 2,
    isTrusted: true,
    timeStamp: Date.now(),
    // Add other required PointerEvent properties with defaults
    altKey: false,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    metaKey: false,
    movementX: 0,
    movementY: 0,
    relatedTarget: null,
    screenX: 0,
    screenY: 0,
    shiftKey: false,
    detail: 0,
    view: null,
    which: 1,
    charCode: 0,
    keyCode: 0,
    location: 0,
    repeat: false,
    locale: '',
    key: '',
    code: '',
    getModifierState: vi.fn(() => false),
    initEvent: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    AT_TARGET: 2,
    BUBBLING_PHASE: 3,
    CAPTURING_PHASE: 1,
    NONE: 0,
    composedPath: vi.fn(() => []),
    // PointerEvent specific properties
    height: 1,
    isPrimary: true,
    pointerType: 'mouse' as const,
    pressure: 0.5,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    width: 1,
    getCoalescedEvents: vi.fn(() => []),
    getPredictedEvents: vi.fn(() => []),
    // Additional required properties for PointerEvent
    altitudeAngle: Math.PI / 2,
    azimuthAngle: 0,
    layerX: init.clientX,
    layerY: init.clientY,
    offsetX: init.clientX,
    offsetY: init.clientY,
    pageX: init.clientX,
    pageY: init.clientY,
    x: init.clientX,
    y: init.clientY,
    dispatchEvent: vi.fn(() => true),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    srcElement: null,
    returnValue: true,
    cancelBubble: false
  } as unknown as PointerEvent
  
  return mockEvent
}

// Mock Animation interface for useWindowAnimation tests
export interface MockAnimation {
  addEventListener: (type: string, listener: EventListener) => void
  cancel: () => void
  finish: () => void
  play: () => void
  pause: () => void
}

// Create a mock Animation that matches the real interface
export const createMockAnimation = (): MockAnimation => ({
  addEventListener: vi.fn(),
  cancel: vi.fn(),
  finish: vi.fn(),
  play: vi.fn(),
  pause: vi.fn()
})

// Type-safe function to set NODE_ENV in tests
export const setNodeEnv = (env: string): void => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: env,
    writable: true,
    configurable: true
  })
}

// Mock HTMLElement with common properties used in tests
export const createMockHTMLElement = (overrides: Partial<HTMLElement> = {}): HTMLElement => {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    getBoundingClientRect: vi.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100
    }),
    animate: vi.fn(),
    style: {},
    ...overrides
  } as unknown as HTMLElement
}

// Mock MobileApp icon type that matches the AppMetadata interface
export const createMockMobileAppIcon = (overrides: { emoji?: string; url?: string; fallback: string } = { fallback: '📱' }) => ({
  emoji: overrides.emoji,
  url: overrides.url,
  fallback: overrides.fallback
})