import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

// Analytics tracking utilities for AgentsOS
export const trackEvent = (eventName: string, parameters?: Record<string, string | number | boolean>) => {
  if (analytics && typeof window !== 'undefined') {
    logEvent(analytics, eventName, parameters);
  }
};

// Workspace-specific events
export const trackWorkspaceCreated = (sandboxId: string) => {
  trackEvent('workspace_created', {
    sandbox_id: sandboxId,
    timestamp: new Date().toISOString()
  });
};

export const trackWorkspaceStarted = (sandboxId: string) => {
  trackEvent('workspace_started', {
    sandbox_id: sandboxId,
    timestamp: new Date().toISOString()
  });
};

export const trackWorkspaceStopped = (sandboxId: string) => {
  trackEvent('workspace_stopped', {
    sandbox_id: sandboxId,
    timestamp: new Date().toISOString()
  });
};

// Page view tracking
export const trackPageView = (page: string) => {
  trackEvent('page_view', {
    page_title: page,
    timestamp: new Date().toISOString()
  });
};

// User engagement events
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location,
    timestamp: new Date().toISOString()
  });
};

// Feature usage tracking
export const trackFeatureUsed = (feature: string, details?: Record<string, string | number | boolean>) => {
  trackEvent('feature_used', {
    feature_name: feature,
    ...details,
    timestamp: new Date().toISOString()
  });
};