'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AccessibilitySettings } from '@/types';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const defaultSettings: AccessibilitySettings = {
  // Visual
  highContrast: false,
  colorBlindMode: 'none',
  fontSize: 'medium',
  lineSpacing: 'normal',
  fontFamily: 'default',

  // Motion
  reduceMotion: false,

  // Audio
  screenReaderOptimized: false,
  autoplayMedia: true,

  // Interaction
  keyboardOnly: false,
  extendedTimeForInteractions: false,
  timeMultiplier: 1,

  // Focus
  focusIndicatorStyle: 'default',

  // Content
  simplifiedLanguage: false,
  showCaptions: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage and user profile
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);

      // First, check localStorage
      const localSettings = localStorage.getItem('accessibilitySettings');
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (e) {
          console.error('Failed to parse localStorage accessibility settings:', e);
        }
      }

      // If user is logged in, fetch their saved settings
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/accessibility');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setSettings({ ...defaultSettings, ...data.data });
              // Update localStorage with server settings
              localStorage.setItem('accessibilitySettings', JSON.stringify(data.data));
            }
          }
        } catch (error) {
          console.error('Failed to fetch accessibility settings:', error);
        }
      }

      setIsLoading(false);
    };

    loadSettings();
  }, [session?.user?.id]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${settings.fontSize}`);

    // Line spacing
    root.classList.remove('line-spacing-normal', 'line-spacing-relaxed', 'line-spacing-loose');
    root.classList.add(`line-spacing-${settings.lineSpacing}`);

    // Font family
    root.classList.remove('font-default', 'font-dyslexia-friendly', 'font-monospace');
    root.classList.add(`font-${settings.fontFamily}`);

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Color blind mode
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${settings.colorBlindMode}`);
    }

    // Reduce motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Focus indicator
    root.classList.remove('focus-default', 'focus-high-visibility');
    root.classList.add(`focus-${settings.focusIndicatorStyle}`);

    // Screen reader optimization
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    // Keyboard only mode
    if (settings.keyboardOnly) {
      root.classList.add('keyboard-only');
    } else {
      root.classList.remove('keyboard-only');
    }
  }, [settings]);

  const updateSettings = useCallback(async (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(updated));

    // Save to user profile if logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/user/accessibility', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updated),
        });
      } catch (error) {
        console.error('Failed to save accessibility settings:', error);
      }
    }
  }, [settings, session?.user?.id]);

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibilitySettings');

    if (session?.user?.id) {
      try {
        await fetch('/api/user/accessibility', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(defaultSettings),
        });
      } catch (error) {
        console.error('Failed to reset accessibility settings:', error);
      }
    }
  }, [session?.user?.id]);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
