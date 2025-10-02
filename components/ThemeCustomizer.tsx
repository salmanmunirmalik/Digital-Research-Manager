import React, { useState, useEffect } from 'react';
import { 
  PaletteIcon, 
  EyeIcon, 
  SaveIcon, 
  XMarkIcon,
  ArrowPathIcon,
  SparklesIcon,
  ColorSwatchIcon
} from '@heroicons/react/24/outline';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ThemeCustomizerProps {
  currentTheme: CustomTheme;
  onThemeChange: (theme: CustomTheme) => void;
  onClose: () => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  currentTheme,
  onThemeChange,
  onClose
}) => {
  const [customTheme, setCustomTheme] = useState<CustomTheme>(currentTheme);
  const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'spacing' | 'effects'>('colors');
  const [previewMode, setPreviewMode] = useState(false);

  const colorPresets = [
    {
      name: 'Ocean Blue',
      colors: {
        primary: '#0ea5e9',
        secondary: '#64748b',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    {
      name: 'Forest Green',
      colors: {
        primary: '#059669',
        secondary: '#6b7280',
        accent: '#10b981',
        background: '#ffffff',
        surface: '#f0fdf4',
        text: '#064e3b',
        textSecondary: '#6b7280',
        border: '#d1fae5',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    {
      name: 'Sunset Orange',
      colors: {
        primary: '#ea580c',
        secondary: '#6b7280',
        accent: '#f97316',
        background: '#ffffff',
        surface: '#fff7ed',
        text: '#9a3412',
        textSecondary: '#6b7280',
        border: '#fed7aa',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    {
      name: 'Royal Purple',
      colors: {
        primary: '#7c3aed',
        secondary: '#6b7280',
        accent: '#8b5cf6',
        background: '#ffffff',
        surface: '#faf5ff',
        text: '#581c87',
        textSecondary: '#6b7280',
        border: '#e9d5ff',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    }
  ];

  const fontOptions = [
    { name: 'Inter', value: 'Inter', category: 'Modern Sans' },
    { name: 'Roboto', value: 'Roboto', category: 'Modern Sans' },
    { name: 'Open Sans', value: 'Open Sans', category: 'Modern Sans' },
    { name: 'Lato', value: 'Lato', category: 'Modern Sans' },
    { name: 'Montserrat', value: 'Montserrat', category: 'Modern Sans' },
    { name: 'Poppins', value: 'Poppins', category: 'Modern Sans' },
    { name: 'Times New Roman', value: 'Times New Roman', category: 'Serif' },
    { name: 'Georgia', value: 'Georgia', category: 'Serif' },
    { name: 'Merriweather', value: 'Merriweather', category: 'Serif' },
    { name: 'Playfair Display', value: 'Playfair Display', category: 'Serif' },
    { name: 'Fira Code', value: 'Fira Code', category: 'Monospace' },
    { name: 'Source Code Pro', value: 'Source Code Pro', category: 'Monospace' },
    { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'Monospace' }
  ];

  const updateColor = (colorKey: keyof ThemeColors, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const updateFont = (fontKey: keyof ThemeFonts, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [fontKey]: value
      }
    }));
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setCustomTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...preset.colors
      }
    }));
  };

  const generateAIColorScheme = async () => {
    // Simulate AI color scheme generation
    const aiColors = {
      primary: '#6366f1',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };

    setCustomTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...aiColors
      }
    }));
  };

  const saveTheme = () => {
    const savedTheme = {
      ...customTheme,
      id: customTheme.id || `custom-${Date.now()}`,
      name: customTheme.name || 'Custom Theme',
      isCustom: true,
      updatedAt: new Date().toISOString()
    };
    
    onThemeChange(savedTheme);
    onClose();
  };

  const resetTheme = () => {
    setCustomTheme(currentTheme);
  };

  const colorInputs = [
    { key: 'primary' as keyof ThemeColors, label: 'Primary', description: 'Main brand color' },
    { key: 'secondary' as keyof ThemeColors, label: 'Secondary', description: 'Secondary brand color' },
    { key: 'accent' as keyof ThemeColors, label: 'Accent', description: 'Highlight color' },
    { key: 'background' as keyof ThemeColors, label: 'Background', description: 'Page background' },
    { key: 'surface' as keyof ThemeColors, label: 'Surface', description: 'Card/surface background' },
    { key: 'text' as keyof ThemeColors, label: 'Text', description: 'Primary text color' },
    { key: 'textSecondary' as keyof ThemeColors, label: 'Text Secondary', description: 'Secondary text color' },
    { key: 'border' as keyof ThemeColors, label: 'Border', description: 'Border color' },
    { key: 'success' as keyof ThemeColors, label: 'Success', description: 'Success state color' },
    { key: 'warning' as keyof ThemeColors, label: 'Warning', description: 'Warning state color' },
    { key: 'error' as keyof ThemeColors, label: 'Error', description: 'Error state color' },
    { key: 'info' as keyof ThemeColors, label: 'Info', description: 'Info state color' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customize Theme</h2>
              <p className="text-gray-600 mt-1">Create your perfect presentation theme</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  previewMode
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <EyeIcon className="w-4 h-4 inline mr-1" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4">
              <input
                type="text"
                value={customTheme.name}
                onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Theme name"
              />
              <textarea
                value={customTheme.description}
                onChange={(e) => setCustomTheme(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                placeholder="Theme description"
                rows={2}
              />
            </div>

            <nav className="flex-1 px-4">
              <div className="space-y-1">
                {[
                  { id: 'colors', label: 'Colors', icon: PaletteIcon },
                  { id: 'fonts', label: 'Typography', icon: ColorSwatchIcon },
                  { id: 'spacing', label: 'Spacing', icon: ArrowPathIcon },
                  { id: 'effects', label: 'Effects', icon: SparklesIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-gray-200 space-y-2">
              <button
                onClick={saveTheme}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <SaveIcon className="w-4 h-4" />
                Save Theme
              </button>
              <button
                onClick={resetTheme}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'colors' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Presets</h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyColorPreset(preset)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex gap-2 mb-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.primary }}></div>
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.secondary }}></div>
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.accent }}></div>
                        </div>
                        <div className="font-medium text-gray-900">{preset.name}</div>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={generateAIColorScheme}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    Generate AI Color Scheme
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  {colorInputs.map((color) => (
                    <div key={color.key} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: customTheme.colors[color.key] }}
                      ></div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {color.label}
                        </label>
                        <input
                          type="color"
                          value={customTheme.colors[color.key]}
                          onChange={(e) => updateColor(color.key, e.target.value)}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <p className="text-xs text-gray-500">{color.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'fonts' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography</h3>
                <div className="space-y-6">
                  {[
                    { key: 'heading', label: 'Heading Font', description: 'Used for titles and headings' },
                    { key: 'body', label: 'Body Font', description: 'Used for main content' },
                    { key: 'mono', label: 'Monospace Font', description: 'Used for code and technical content' }
                  ].map((font) => (
                    <div key={font.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {font.label}
                      </label>
                      <select
                        value={customTheme.fonts[font.key as keyof ThemeFonts]}
                        onChange={(e) => updateFont(font.key as keyof ThemeFonts, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {fontOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.name} ({option.category})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">{font.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'spacing' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Spacing & Layout</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spacing Scale
                    </label>
                    <div className="space-y-3">
                      {Object.entries(customTheme.spacing).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="w-8 text-sm font-medium text-gray-600">{key}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setCustomTheme(prev => ({
                              ...prev,
                              spacing: { ...prev.spacing, [key]: e.target.value }
                            }))}
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Effects</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Border Radius
                    </label>
                    <div className="space-y-3">
                      {Object.entries(customTheme.borderRadius).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="w-8 text-sm font-medium text-gray-600">{key}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setCustomTheme(prev => ({
                              ...prev,
                              borderRadius: { ...prev.borderRadius, [key]: e.target.value }
                            }))}
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shadows
                    </label>
                    <div className="space-y-3">
                      {Object.entries(customTheme.shadows).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="w-8 text-sm font-medium text-gray-600">{key}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setCustomTheme(prev => ({
                              ...prev,
                              shadows: { ...prev.shadows, [key]: e.target.value }
                            }))}
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
