import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { ApiResponse, AccessibilitySettings } from '@/types';

/**
 * GET /api/user/accessibility
 * Get user's accessibility settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('accessibilitySettings').lean();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user.accessibilitySettings || getDefaultSettings(),
    });
  } catch (error) {
    console.error('Error fetching accessibility settings:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch accessibility settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/accessibility
 * Update user's accessibility settings
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings: Partial<AccessibilitySettings> = await req.json();

    // Validate settings
    const validatedSettings = validateSettings(settings);

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { accessibilitySettings: validatedSettings } },
      { new: true, runValidators: true }
    ).select('accessibilitySettings');

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user.accessibilitySettings,
      message: 'Accessibility settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating accessibility settings:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update accessibility settings' },
      { status: 500 }
    );
  }
}

function getDefaultSettings(): AccessibilitySettings {
  return {
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
}

function validateSettings(settings: Partial<AccessibilitySettings>): AccessibilitySettings {
  const defaults = getDefaultSettings();

  return {
    highContrast: typeof settings.highContrast === 'boolean' ? settings.highContrast : defaults.highContrast,
    colorBlindMode: ['none', 'protanopia', 'deuteranopia', 'tritanopia'].includes(settings.colorBlindMode || '')
      ? settings.colorBlindMode!
      : defaults.colorBlindMode,
    fontSize: ['small', 'medium', 'large', 'extra-large'].includes(settings.fontSize || '')
      ? settings.fontSize!
      : defaults.fontSize,
    lineSpacing: ['normal', 'relaxed', 'loose'].includes(settings.lineSpacing || '')
      ? settings.lineSpacing!
      : defaults.lineSpacing,
    fontFamily: ['default', 'dyslexia-friendly', 'monospace'].includes(settings.fontFamily || '')
      ? settings.fontFamily!
      : defaults.fontFamily,
    reduceMotion: typeof settings.reduceMotion === 'boolean' ? settings.reduceMotion : defaults.reduceMotion,
    screenReaderOptimized: typeof settings.screenReaderOptimized === 'boolean'
      ? settings.screenReaderOptimized
      : defaults.screenReaderOptimized,
    autoplayMedia: typeof settings.autoplayMedia === 'boolean' ? settings.autoplayMedia : defaults.autoplayMedia,
    keyboardOnly: typeof settings.keyboardOnly === 'boolean' ? settings.keyboardOnly : defaults.keyboardOnly,
    extendedTimeForInteractions: typeof settings.extendedTimeForInteractions === 'boolean'
      ? settings.extendedTimeForInteractions
      : defaults.extendedTimeForInteractions,
    timeMultiplier: typeof settings.timeMultiplier === 'number' && settings.timeMultiplier >= 1 && settings.timeMultiplier <= 3
      ? settings.timeMultiplier
      : defaults.timeMultiplier,
    focusIndicatorStyle: ['default', 'high-visibility'].includes(settings.focusIndicatorStyle || '')
      ? settings.focusIndicatorStyle!
      : defaults.focusIndicatorStyle,
    simplifiedLanguage: typeof settings.simplifiedLanguage === 'boolean'
      ? settings.simplifiedLanguage
      : defaults.simplifiedLanguage,
    showCaptions: typeof settings.showCaptions === 'boolean' ? settings.showCaptions : defaults.showCaptions,
  };
}
