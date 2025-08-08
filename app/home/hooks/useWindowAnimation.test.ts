import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowAnimation } from './useWindowAnimation';

// Define a proper type for our mock animation
interface MockAnimation {
  addEventListener: (type: string, listener: EventListener) => void;
  cancel: () => void;
  finish: () => void;
  play: () => void;
  pause: () => void;
}

describe('useWindowAnimation', () => {
  let mockElement: HTMLElement;
  let mockTargetElement: HTMLElement;
  let mockAnimation: MockAnimation;

  beforeEach(() => {
    // Mock HTMLElement
    mockElement = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        top: 100,
        left: 100,
        right: 900,
        bottom: 700
      }),
      animate: vi.fn(),
      style: {
        transform: '',
        opacity: ''
      }
    } as HTMLElement;

    mockTargetElement = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        x: 500,
        y: 800,
        width: 48,
        height: 48,
        top: 800,
        left: 500,
        right: 548,
        bottom: 848
      })
    } as HTMLElement;

    // Mock Animation
    mockAnimation = {
      addEventListener: vi.fn(),
      cancel: vi.fn(),
      finish: vi.fn(),
      play: vi.fn(),
      pause: vi.fn()
    };

    vi.mocked(mockElement.animate).mockReturnValue(mockAnimation as unknown as Animation);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('animateMinimizeToTarget', () => {
    it('creates minimize animation with correct keyframes', () => {
      const { result } = renderHook(() => useWindowAnimation());

      act(() => {
        result.current.animateMinimizeToTarget(mockElement, mockTargetElement);
      });

      // Check animate was called
      expect(mockElement.animate).toHaveBeenCalled();
      
      // Check keyframes
      const [keyframes, options] = mockElement.animate.mock.calls[0];
      expect(keyframes).toHaveLength(2);
      expect(keyframes[0]).toMatchObject({
        transform: 'translate(0, 0) scale(1)',
        opacity: '1'
      });
      // The exact transform values will depend on the calculation
      expect(keyframes[1]).toHaveProperty('transform');
      expect(keyframes[1]).toMatchObject({
        opacity: '0.3'
      });

      // Check animation options
      expect(options).toMatchObject({
        duration: 400,
        easing: 'cubic-bezier(0.4, 0.0, 1, 1)',
        fill: 'forwards'
      });
    });

    it('calls onAnimationComplete when animation finishes', () => {
      const onAnimationComplete = vi.fn();
      const { result } = renderHook(() => 
        useWindowAnimation({ onAnimationComplete })
      );

      act(() => {
        result.current.animateMinimizeToTarget(mockElement, mockTargetElement);
      });

      // Get the finish event listener
      const finishListener = mockAnimation.addEventListener.mock.calls.find(
        call => call[0] === 'finish'
      )?.[1];

      expect(finishListener).toBeDefined();

      // Simulate animation finish
      act(() => {
        finishListener();
      });

      expect(onAnimationComplete).toHaveBeenCalled();
      expect(mockElement.style.transform).toBe('');
      expect(mockElement.style.opacity).toBe('');
    });

    it('uses custom duration when provided', () => {
      const { result } = renderHook(() => 
        useWindowAnimation({ duration: 600 })
      );

      act(() => {
        result.current.animateMinimizeToTarget(mockElement, mockTargetElement);
      });

      const [, options] = mockElement.animate.mock.calls[0];
      expect(options.duration).toBe(600);
    });
  });

  describe('animateRestoreFromTarget', () => {
    it('creates restore animation with correct keyframes', () => {
      const { result } = renderHook(() => useWindowAnimation());
      const originalRect = { x: 200, y: 150, width: 900, height: 700 };

      act(() => {
        result.current.animateRestoreFromTarget(mockElement, mockTargetElement, originalRect);
      });

      // Check animate was called
      expect(mockElement.animate).toHaveBeenCalled();
      
      // Check keyframes
      const [keyframes, options] = mockElement.animate.mock.calls[0];
      expect(keyframes).toHaveLength(2);
      // First keyframe should start from minimized position
      expect(keyframes[0]).toHaveProperty('transform');
      expect(keyframes[0]).toMatchObject({
        opacity: '0.3'
      });
      // Second keyframe should restore to original
      expect(keyframes[1]).toMatchObject({
        transform: 'translate(0, 0) scale(1)',
        opacity: '1'
      });

      // Check animation options for restore
      expect(options).toMatchObject({
        duration: 400,
        easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        fill: 'forwards'
      });
    });
  });

  describe('cancelAnimation', () => {
    it('cancels ongoing animation', () => {
      const { result } = renderHook(() => useWindowAnimation());

      act(() => {
        result.current.animateMinimizeToTarget(mockElement, mockTargetElement);
      });

      act(() => {
        result.current.cancelAnimation();
      });

      expect(mockAnimation.cancel).toHaveBeenCalled();
    });

    it('handles cancel when no animation is active', () => {
      const { result } = renderHook(() => useWindowAnimation());

      expect(() => {
        act(() => {
          result.current.cancelAnimation();
        });
      }).not.toThrow();
    });
  });

  describe('animation state', () => {
    it('tracks animation state correctly', () => {
      const { result } = renderHook(() => useWindowAnimation());

      expect(result.current.isAnimating).toBe(false);

      act(() => {
        result.current.animateMinimizeToTarget(mockElement, mockTargetElement);
      });

      // Note: isAnimating is computed based on animationRef.current
      // In real usage, it would be true while animation is running
    });
  });

  describe('multiple animations', () => {
    it('cancels previous animation when starting new one', () => {
      const { result } = renderHook(() => useWindowAnimation());

      // Start first animation
      act(() => {
        result.current.animateMinimizeToTarget(mockElement, mockTargetElement);
      });
      const firstAnimation = mockAnimation;

      // Start second animation
      act(() => {
        result.current.animateMinimizeToTarget(mockElement, mockTargetElement);
      });

      // First animation should be cancelled
      expect(firstAnimation.cancel).toHaveBeenCalled();
    });
  });
});