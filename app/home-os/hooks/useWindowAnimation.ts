import { useCallback, useRef } from 'react';

export interface AnimationState {
  isAnimating: boolean;
  type: 'minimize' | 'restore' | null;
  windowId: string | null;
}

export interface WindowAnimationConfig {
  onAnimationComplete?: () => void;
  duration?: number;
}

export function useWindowAnimation({ 
  onAnimationComplete, 
  duration = 400 
}: WindowAnimationConfig = {}) {
  const animationRef = useRef<Animation | null>(null);

  const animateToPosition = useCallback((
    element: HTMLElement,
    targetRect: { x: number; y: number; width: number; height: number },
    type: 'minimize' | 'restore'
  ) => {
    const currentRect = element.getBoundingClientRect();
    
    // Calculate transform values
    const scaleX = targetRect.width / currentRect.width;
    const scaleY = targetRect.height / currentRect.height;
    const translateX = targetRect.x - currentRect.x + (targetRect.width - currentRect.width) / 2;
    const translateY = targetRect.y - currentRect.y + (targetRect.height - currentRect.height) / 2;

    // Cancel any existing animation
    if (animationRef.current) {
      animationRef.current.cancel();
    }

    // Create animation keyframes
    const keyframes = type === 'minimize' 
      ? [
          { 
            transform: 'translate(0, 0) scale(1)', 
            opacity: '1' 
          },
          { 
            transform: `translate(${translateX}px, ${translateY}px) scale(${Math.min(scaleX, scaleY)})`, 
            opacity: '0.3' 
          }
        ]
      : [
          { 
            transform: `translate(${translateX}px, ${translateY}px) scale(${Math.min(scaleX, scaleY)})`, 
            opacity: '0.3' 
          },
          { 
            transform: 'translate(0, 0) scale(1)', 
            opacity: '1' 
          }
        ];

    // Create the animation
    animationRef.current = element.animate(keyframes, {
      duration,
      easing: type === 'minimize' ? 'cubic-bezier(0.4, 0.0, 1, 1)' : 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      fill: 'forwards'
    });

    // Handle animation completion
    animationRef.current.addEventListener('finish', () => {
      element.style.transform = '';
      element.style.opacity = '';
      onAnimationComplete?.();
    });

    return animationRef.current;
  }, [duration, onAnimationComplete]);

  const animateMinimizeToTarget = useCallback((
    windowElement: HTMLElement,
    targetElement: HTMLElement
  ) => {
    const targetRect = targetElement.getBoundingClientRect();
    const dockIconSize = 48; // Dock icon size in pixels
    
    return animateToPosition(windowElement, {
      x: targetRect.x + (targetRect.width - dockIconSize) / 2,
      y: targetRect.y + (targetRect.height - dockIconSize) / 2,
      width: dockIconSize,
      height: dockIconSize
    }, 'minimize');
  }, [animateToPosition]);

  const animateRestoreFromTarget = useCallback((
    windowElement: HTMLElement,
    targetElement: HTMLElement,
    originalRect: { x: number; y: number; width: number; height: number }
  ) => {
    const targetRect = targetElement.getBoundingClientRect();
    const dockIconSize = 48;

    // First, position the window at the dock icon
    windowElement.style.transform = `translate(${
      targetRect.x + (targetRect.width - dockIconSize) / 2 - windowElement.getBoundingClientRect().x
    }px, ${
      targetRect.y + (targetRect.height - dockIconSize) / 2 - windowElement.getBoundingClientRect().y
    }px) scale(${dockIconSize / windowElement.getBoundingClientRect().width})`;
    windowElement.style.opacity = '0.3';

    // Then animate back to original position
    return animateToPosition(windowElement, originalRect, 'restore');
  }, [animateToPosition]);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
  }, []);

  return {
    animateMinimizeToTarget,
    animateRestoreFromTarget,
    cancelAnimation,
    isAnimating: animationRef.current !== null
  };
}