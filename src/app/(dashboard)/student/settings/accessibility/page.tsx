'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Type,
  Volume2,
  Keyboard,
  Clock,
  Palette,
  Monitor,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Spinner,
} from '@/components/ui';
import { AccessibilitySettings } from '@/types';

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  colorBlindMode: 'none',
  fontSize: 'medium',
  lineSpacing: 'normal',
  fontFamily: 'default',
  reduceMotion: false,
  screenReaderOptimized: false,
  autoplayMedia: true,
  keyboardOnly: false,
  extendedTimeForInteractions: false,
  timeMultiplier: 1,
  focusIndicatorStyle: 'default',
  simplifiedLanguage: false,
  showCaptions: true,
};

export default function AccessibilitySettingsPage() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/accessibility');
      const result = await response.json();
      if (result.success && result.data) {
        setSettings({ ...defaultSettings, ...result.data });
      }
    } catch (err) {
      console.error('Failed to fetch accessibility settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/accessibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Settings saved successfully!');
        // Apply settings to document
        applySettings(settings);
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  const applySettings = (s: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    root.style.setProperty('--base-font-size', fontSizes[s.fontSize]);

    // Line spacing
    const lineSpacings = {
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    };
    root.style.setProperty('--line-height', lineSpacings[s.lineSpacing]);

    // Font family
    const fontFamilies = {
      default: 'system-ui, sans-serif',
      'dyslexia-friendly': 'OpenDyslexic, Comic Sans MS, sans-serif',
      monospace: 'ui-monospace, monospace',
    };
    root.style.setProperty('--font-family', fontFamilies[s.fontFamily]);

    // High contrast
    if (s.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduce motion
    if (s.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Color blind mode
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (s.colorBlindMode !== 'none') {
      root.classList.add(s.colorBlindMode);
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/student/settings"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Accessibility Settings</h1>
        <p className="text-muted mt-1">
          Customize your learning experience for better accessibility
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error text-error text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-success/10 border border-success text-success text-sm">
          {success}
        </div>
      )}

      {/* Visual Settings */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visual Settings
          </CardTitle>
          <CardDescription>
            Adjust visual elements for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">High Contrast Mode</p>
              <p className="text-sm text-muted">
                Increase color contrast for better visibility
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.highContrast}
                onChange={e => updateSetting('highContrast', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Color Blind Mode */}
          <div>
            <p className="font-medium text-foreground mb-2">Color Blind Mode</p>
            <p className="text-sm text-muted mb-3">
              Adjust colors for different types of color vision deficiency
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'none', label: 'None' },
                { value: 'protanopia', label: 'Protanopia (Red)' },
                { value: 'deuteranopia', label: 'Deuteranopia (Green)' },
                { value: 'tritanopia', label: 'Tritanopia (Blue)' },
              ].map(option => (
                <button
                  key={option.value}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    settings.colorBlindMode === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                  onClick={() => updateSetting('colorBlindMode', option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Reduce Motion</p>
              <p className="text-sm text-muted">
                Minimize animations and transitions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.reduceMotion}
                onChange={e => updateSetting('reduceMotion', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Text Settings */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Text Settings
          </CardTitle>
          <CardDescription>
            Customize text appearance for easier reading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div>
            <p className="font-medium text-foreground mb-2">Font Size</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
                { value: 'extra-large', label: 'Extra Large' },
              ].map(option => (
                <button
                  key={option.value}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    settings.fontSize === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                  onClick={() => updateSetting('fontSize', option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Spacing */}
          <div>
            <p className="font-medium text-foreground mb-2">Line Spacing</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'normal', label: 'Normal' },
                { value: 'relaxed', label: 'Relaxed' },
                { value: 'loose', label: 'Loose' },
              ].map(option => (
                <button
                  key={option.value}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    settings.lineSpacing === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                  onClick={() => updateSetting('lineSpacing', option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <p className="font-medium text-foreground mb-2">Font Family</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'default', label: 'Default' },
                { value: 'dyslexia-friendly', label: 'Dyslexia Friendly' },
                { value: 'monospace', label: 'Monospace' },
              ].map(option => (
                <button
                  key={option.value}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    settings.fontFamily === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                  onClick={() => updateSetting('fontFamily', option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simplified Language */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Simplified Language</p>
              <p className="text-sm text-muted">
                Use simpler language in AI responses
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.simplifiedLanguage}
                onChange={e => updateSetting('simplifiedLanguage', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Audio & Media Settings */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio & Media
          </CardTitle>
          <CardDescription>
            Configure audio and media preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto-play Media</p>
              <p className="text-sm text-muted">
                Automatically play videos and audio
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoplayMedia}
                onChange={e => updateSetting('autoplayMedia', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Show Captions</p>
              <p className="text-sm text-muted">
                Display captions on videos
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.showCaptions}
                onChange={e => updateSetting('showCaptions', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Screen Reader Optimized</p>
              <p className="text-sm text-muted">
                Optimize content for screen readers
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.screenReaderOptimized}
                onChange={e => updateSetting('screenReaderOptimized', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Input & Navigation */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Input & Navigation
          </CardTitle>
          <CardDescription>
            Configure keyboard and interaction settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Keyboard Only Mode</p>
              <p className="text-sm text-muted">
                Navigate entirely with keyboard
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.keyboardOnly}
                onChange={e => updateSetting('keyboardOnly', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div>
            <p className="font-medium text-foreground mb-2">Focus Indicator Style</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'default', label: 'Default' },
                { value: 'high-visibility', label: 'High Visibility' },
              ].map(option => (
                <button
                  key={option.value}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    settings.focusIndicatorStyle === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                  onClick={() => updateSetting('focusIndicatorStyle', option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Settings */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Settings
          </CardTitle>
          <CardDescription>
            Adjust timing for interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Extended Time</p>
              <p className="text-sm text-muted">
                Get more time for timed interactions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.extendedTimeForInteractions}
                onChange={e => updateSetting('extendedTimeForInteractions', e.target.checked)}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {settings.extendedTimeForInteractions && (
            <div>
              <p className="font-medium text-foreground mb-2">
                Time Multiplier: {settings.timeMultiplier}x
              </p>
              <input
                type="range"
                min="1"
                max="3"
                step="0.5"
                value={settings.timeMultiplier}
                onChange={e => updateSetting('timeMultiplier', parseFloat(e.target.value))}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>1x (Normal)</span>
                <span>2x (Double)</span>
                <span>3x (Triple)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
