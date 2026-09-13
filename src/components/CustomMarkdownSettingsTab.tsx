import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Check,
  Eye,
  Sliders,
  Bold,
  Italic,
  Type,
  Palette,
  Layers,
  ChevronRight,
  Code2,
  X,
  HelpCircle,
} from 'lucide-react';
import { CustomMarkdownRule } from '../types';
import { getCustomMarkdownStyle } from '../utils/markdownUtils';
import { isValidHex, normalizeHex } from '../utils/themePresets';

interface CustomMarkdownSettingsTabProps {
  rules: CustomMarkdownRule[];
  onAddRule: (rule: Omit<CustomMarkdownRule, 'id' | 'createdAt'>) => CustomMarkdownRule;
  onUpdateRule: (id: string, updates: Partial<CustomMarkdownRule>) => void;
  onDeleteRule: (id: string) => void;
  onDuplicateRule: (id: string) => CustomMarkdownRule | null;
  onResetRules: () => void;
}

const PRESET_BG_COLORS = [
  'transparent',
  '#FEF2F2', // Soft Red
  '#EFF6FF', // Soft Blue
  '#FEF3C7', // Soft Amber
  '#ECFDF5', // Soft Emerald
  '#F5F3FF', // Soft Purple
  '#FDF2F8', // Soft Pink
  '#18181B', // Dark Zinc
  '#F4F4F5', // Light Gray
];

const PRESET_TEXT_COLORS = [
  'inherit',
  '#DC2626', // Red
  '#1D4ED8', // Blue
  '#B45309', // Amber
  '#047857', // Emerald
  '#6D28D9', // Purple
  '#BE185D', // Pink
  '#09090B', // Black
  '#FFFFFF', // White
  '#22C55E', // Neon Green
];

const TEMPLATES = [
  {
    name: 'Important Alert',
    prefix: '!!',
    suffix: '!!',
    fontWeight: '700',
    isBold: true,
    isItalic: false,
    fontSize: '11px',
    backgroundColor: '#FEF2F2',
    textColor: '#DC2626',
    textTransform: 'uppercase' as const,
    rotate: 0,
    borderRadius: '3px',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  {
    name: 'Tilted Stamp',
    prefix: '^^',
    suffix: '^^',
    fontWeight: '700',
    isBold: true,
    isItalic: true,
    fontSize: '12px',
    backgroundColor: '#FEF3C7',
    textColor: '#B45309',
    textTransform: 'capitalize' as const,
    rotate: -3,
    borderRadius: '2px',
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  {
    name: 'Feature Pill',
    prefix: '@@',
    suffix: '@@',
    fontWeight: '600',
    isBold: false,
    isItalic: false,
    fontSize: '11px',
    backgroundColor: '#EFF6FF',
    textColor: '#1D4ED8',
    textTransform: 'none' as const,
    rotate: 0,
    borderRadius: '9999px',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  {
    name: 'Cyberpunk Neon',
    prefix: '%%',
    suffix: '%%',
    fontWeight: '700',
    isBold: true,
    isItalic: false,
    fontSize: '11px',
    backgroundColor: '#18181B',
    textColor: '#22C55E',
    textTransform: 'uppercase' as const,
    rotate: 0,
    borderRadius: '2px',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
];

export const CustomMarkdownSettingsTab: React.FC<CustomMarkdownSettingsTabProps> = ({
  rules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onDuplicateRule,
  onResetRules,
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(() => rules[0]?.id || '');
  const [previewSampleText, setPreviewSampleText] = useState<string>('Custom Tag');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Active selected rule
  const activeRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  const handleCreateNew = () => {
    const newRule = onAddRule({
      name: `Custom Style ${rules.length + 1}`,
      prefix: `::${rules.length + 1} `,
      suffix: ` ::`,
      fontWeight: '600',
      isBold: true,
      isItalic: false,
      fontSize: '11px',
      backgroundColor: '#EFF6FF',
      textColor: '#1D4ED8',
      textTransform: 'none',
      rotate: 0,
      scale: 1,
      skewX: 0,
      borderRadius: '4px',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#BFDBFE',
      paddingHorizontal: 6,
      paddingVertical: 1,
      letterSpacing: 0,
      textDecoration: 'none',
    });
    setSelectedRuleId(newRule.id);
  };

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    const newRule = onAddRule({
      ...tpl,
      name: `${tpl.name} (${rules.length + 1})`,
      scale: 1,
      skewX: 0,
      letterSpacing: 0,
      textDecoration: 'none',
    });
    setSelectedRuleId(newRule.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div>
          <h3 className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-black-600" />
            <span>Custom Markdown Rules & Appearance</span>
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Define custom syntax (e.g. <code className="font-mono bg-neutral-100 px-1 py-0.5">!!text!!</code> or <code className="font-mono bg-neutral-100 px-1 py-0.5">::text::</code>) and customize font weight, bold, italic, font size, background color, transform properties, and text color.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white text-xs font-medium transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Markdown</span>
          </button>

          <button
            type="button"
            onClick={onResetRules}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-xs transition-colors"
            title="Reset to default custom markdown rules"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Rule Selector on Left, Rule Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
              Defined Rules ({rules.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {rules.map((rule) => {
              const isSelected = rule.id === activeRule?.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`group relative p-2.5 border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50/60'
                      : 'border-neutral-200 hover:border-neutral-400 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-900 truncate">
                        {rule.name}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                        {rule.prefix}content{rule.suffix}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dup = onDuplicateRule(rule.id);
                          if (dup) setSelectedRuleId(dup.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                        title="Duplicate rule"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (showDeleteConfirm === rule.id) {
                              onDeleteRule(rule.id);
                              setShowDeleteConfirm(null);
                            } else {
                              setShowDeleteConfirm(rule.id);
                              setTimeout(() => setShowDeleteConfirm(null), 3000);
                            }
                          }}
                          className={`p-1 rounded transition-colors ${
                            showDeleteConfirm === rule.id
                              ? 'bg-red-500 text-white'
                              : 'text-neutral-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={showDeleteConfirm === rule.id ? 'Click again to confirm delete' : 'Delete rule'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rendered Live Preview in Card List */}
                  <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[9px] text-neutral-400">Preview:</span>
                    <span
                      className="text-[10px] pointer-events-none whitespace-nowrap"
                      style={getCustomMarkdownStyle(rule)}
                    >
                      {rule.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Presets / Templates */}
          <div className="pt-2 border-t border-neutral-200">
            <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider block mb-2">
              Quick Templates
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2 py-1.5 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-[11px] text-neutral-700 text-left truncate transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="truncate">{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Editor Panel (8 cols) */}
        {activeRule ? (
          <div className="lg:col-span-8 space-y-5 bg-neutral-50/50 p-4 border border-neutral-200">
            {/* Live Interactive Preview Box */}
            <div className="bg-white p-3.5 border border-neutral-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 border-b border-neutral-100 pb-1.5">
                <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Real-Time Appearance Preview</span>
                </span>
                <span className="font-mono text-[10px] text-neutral-400">
                  {activeRule.prefix}
                  {previewSampleText}
                  {activeRule.suffix}
                </span>
              </div>

              {/* Note Simulation Context */}
              <div className="p-4 bg-[#fffef0] border border-amber-200/60 rounded-xs text-neutral-800 space-y-2">
                <p className="text-xs text-neutral-500 italic">Sticky Note preview context:</p>
                <div className="text-xs leading-relaxed">
                  <span>Pinboard task update: </span>
                  <span
                    className="select-text inline-block transition-all"
                    style={getCustomMarkdownStyle(activeRule)}
                  >
                    {previewSampleText || activeRule.name}
                  </span>
                  <span> before deploying next release.</span>
                </div>
              </div>

              {/* Sample text quick input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-neutral-500 shrink-0">Test Text:</span>
                <input
                  type="text"
                  value={previewSampleText}
                  onChange={(e) => setPreviewSampleText(e.target.value)}
                  placeholder="Enter sample words..."
                  className="flex-1 px-2 py-1 text-xs border border-neutral-200 focus:outline-neutral-900 bg-white"
                />
              </div>
            </div>

            {/* 1. Rule Name & Syntax (Prefix & Suffix) */}
            <div className="bg-white p-3.5 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                <Code2 className="w-3.5 h-3.5 text-neutral-700" />
                <span>Rule Name & Markdown Syntax</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[11px] font-medium text-neutral-600 block">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={activeRule.name}
                    onChange={(e) => onUpdateRule(activeRule.id, { name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:outline-neutral-900 bg-white"
                    placeholder="e.g. Warning Badge"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[11px] font-medium text-neutral-600 block">
                    Opening Syntax (Prefix)
                  </label>
                  <input
                    type="text"
                    value={activeRule.prefix}
                    onChange={(e) => onUpdateRule(activeRule.id, { prefix: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-neutral-300 focus:outline-neutral-900 bg-white"
                    placeholder="e.g. !!"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-neutral-600 block">
                      Closing Syntax (Suffix)
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { suffix: activeRule.prefix })}
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Mirror prefix
                    </button>
                  </div>
                  <input
                    type="text"
                    value={activeRule.suffix}
                    onChange={(e) => onUpdateRule(activeRule.id, { suffix: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-neutral-300 focus:outline-neutral-900 bg-white"
                    placeholder="e.g. !!"
                  />
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-neutral-400" />
                <span>
                  Example note writing: Type <code className="font-mono bg-neutral-100 px-1">{activeRule.prefix}Urgent{activeRule.suffix}</code> to render as styled customized markdown.
                </span>
              </div>
            </div>

            {/* 2. Typography: Font Weight, Bold, Italic, Font Size */}
            <div className="bg-white p-3.5 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                <Type className="w-3.5 h-3.5 text-neutral-700" />
                <span>Typography (Font Weight, Bold, Italic, Size)</span>
              </div>

              {/* Bold & Italic Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-neutral-600 block">
                    Style Toggles
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { isBold: !activeRule.isBold })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border text-xs font-semibold transition-colors ${
                        activeRule.isBold
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                      <span>Bold</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { isItalic: !activeRule.isItalic })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border text-xs italic transition-colors ${
                        activeRule.isItalic
                          ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                          : 'border-neutral-300 hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                      <span>Italic</span>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-neutral-600">Font Size</span>
                    <span className="text-[11px] font-mono text-neutral-500">{activeRule.fontSize || '11px'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['10px', '11px', '12px', '13px', '14px', '16px'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => onUpdateRule(activeRule.id, { fontSize: sz })}
                        className={`px-2 py-1 text-[11px] font-mono border transition-colors ${
                          activeRule.fontSize === sz
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Font Weight Selector */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <span className="text-[11px] font-medium text-neutral-600 block">
                  Font Weight ({activeRule.fontWeight || '400'})
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                  {[
                    { label: '300 Light', val: '300' },
                    { label: '400 Regular', val: '400' },
                    { label: '500 Medium', val: '500' },
                    { label: '600 Semibold', val: '600' },
                    { label: '700 Bold', val: '700' },
                    { label: '800 Extra', val: '800' },
                    { label: '900 Black', val: '900' },
                  ].map((w) => (
                    <button
                      key={w.val}
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { fontWeight: w.val })}
                      className={`p-1.5 text-center border text-[10px] transition-colors truncate ${
                        activeRule.fontWeight === w.val
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Colors: Background Color & Text Color */}
            <div className="bg-white p-3.5 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                <Palette className="w-3.5 h-3.5 text-neutral-700" />
                <span>Colors (Background Color & Text Color)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Background Color */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-neutral-600">
                      Background Color
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { backgroundColor: 'transparent' })}
                      className={`text-[10px] px-1.5 py-0.5 border ${
                        activeRule.backgroundColor === 'transparent'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      Transparent
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 border border-neutral-300 shrink-0 overflow-hidden cursor-pointer">
                      <input
                        type="color"
                        value={isValidHex(activeRule.backgroundColor) ? normalizeHex(activeRule.backgroundColor) : '#FEF2F2'}
                        onChange={(e) => onUpdateRule(activeRule.id, { backgroundColor: e.target.value })}
                        className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                      />
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: activeRule.backgroundColor }}
                      />
                    </div>

                    <input
                      type="text"
                      value={activeRule.backgroundColor}
                      onChange={(e) => onUpdateRule(activeRule.id, { backgroundColor: e.target.value })}
                      placeholder="#FEF2F2 or transparent"
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 focus:outline-neutral-900 bg-white"
                    />
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_BG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onUpdateRule(activeRule.id, { backgroundColor: color })}
                        className={`w-5 h-5 rounded-xs border shadow-2xs flex items-center justify-center transition-transform hover:scale-110 ${
                          activeRule.backgroundColor === color ? 'ring-2 ring-neutral-900 border-neutral-900' : 'border-neutral-300'
                        }`}
                        style={{
                          backgroundColor: color === 'transparent' ? '#ffffff' : color,
                          backgroundImage: color === 'transparent' ? 'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc)' : undefined,
                          backgroundSize: '8px 8px',
                          backgroundPosition: '0 0, 4px 4px',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-neutral-600">
                      Text Color
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { textColor: 'inherit' })}
                      className={`text-[10px] px-1.5 py-0.5 border ${
                        activeRule.textColor === 'inherit'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      Inherit Note Text
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 border border-neutral-300 shrink-0 overflow-hidden cursor-pointer">
                      <input
                        type="color"
                        value={isValidHex(activeRule.textColor) ? normalizeHex(activeRule.textColor) : '#DC2626'}
                        onChange={(e) => onUpdateRule(activeRule.id, { textColor: e.target.value })}
                        className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                      />
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: activeRule.textColor === 'inherit' ? '#1e293b' : activeRule.textColor,
                        }}
                      />
                    </div>

                    <input
                      type="text"
                      value={activeRule.textColor}
                      onChange={(e) => onUpdateRule(activeRule.id, { textColor: e.target.value })}
                      placeholder="#DC2626 or inherit"
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 focus:outline-neutral-900 bg-white"
                    />
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onUpdateRule(activeRule.id, { textColor: color })}
                        className={`w-5 h-5 rounded-xs border shadow-2xs flex items-center justify-center transition-transform hover:scale-110 ${
                          activeRule.textColor === color ? 'ring-2 ring-neutral-900 border-neutral-900' : 'border-neutral-300'
                        }`}
                        style={{
                          backgroundColor: color === 'inherit' ? '#1e293b' : color,
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Transform Properties: Text-Transform, 2D Rotation, Scale, Skew */}
            <div className="bg-white p-3.5 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                <Sliders className="w-3.5 h-3.5 text-neutral-700" />
                <span>Transform Properties (Text-Transform & 2D Rotation / Tilt)</span>
              </div>

              {/* Text Transform */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-neutral-600 block">
                  Text Transform
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'None (default)' },
                    { id: 'uppercase', label: 'UPPERCASE' },
                    { id: 'lowercase', label: 'lowercase' },
                    { id: 'capitalize', label: 'Capitalize' },
                  ].map((tt) => (
                    <button
                      key={tt.id}
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { textTransform: tt.id as any })}
                      className={`py-1.5 text-center border text-[11px] transition-colors ${
                        activeRule.textTransform === tt.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700'
                      }`}
                    >
                      {tt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2D Rotation (Tilt / Stamp effect) */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-600">
                    2D Rotation / Slanted Angle
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-neutral-700">
                      {activeRule.rotate || 0}&deg;
                    </span>
                    {activeRule.rotate !== 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateRule(activeRule.id, { rotate: 0 })}
                        className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                      >
                        Reset (0&deg;)
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-400">-15&deg;</span>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={1}
                    value={activeRule.rotate || 0}
                    onChange={(e) => onUpdateRule(activeRule.id, { rotate: parseInt(e.target.value, 10) })}
                    className="flex-1 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-400">+15&deg;</span>
                </div>

                {/* Preset Angle Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {[
                    { label: '0° Flat', val: 0 },
                    { label: '-2° Subtle Stamp', val: -2 },
                    { label: '+2° Tilted Right', val: 2 },
                    { label: '-4° Stamp Slant', val: -4 },
                    { label: '+5° Dynamic', val: 5 },
                  ].map((angle) => (
                    <button
                      key={angle.label}
                      type="button"
                      onClick={() => onUpdateRule(activeRule.id, { rotate: angle.val })}
                      className={`px-2 py-1 text-[10px] border transition-colors ${
                        (activeRule.rotate || 0) === angle.val
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-600'
                      }`}
                    >
                      {angle.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2D Scale & Skew */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-neutral-600">Scale</span>
                    <span className="text-[11px] font-mono text-neutral-600">{activeRule.scale ?? 1}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.85}
                    max={1.25}
                    step={0.05}
                    value={activeRule.scale ?? 1}
                    onChange={(e) => onUpdateRule(activeRule.id, { scale: parseFloat(e.target.value) })}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-neutral-600">Skew (X Tilt)</span>
                    <span className="text-[11px] font-mono text-neutral-600">{activeRule.skewX ?? 0}&deg;</span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={2}
                    value={activeRule.skewX ?? 0}
                    onChange={(e) => onUpdateRule(activeRule.id, { skewX: parseInt(e.target.value, 10) })}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 5. Border & Corner Radius & Padding */}
            <div className="bg-white p-3.5 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                <Layers className="w-3.5 h-3.5 text-neutral-700" />
                <span>Borders, Corner Radius & Padding</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Border Style */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-neutral-600 block">Border Style</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'solid', label: 'Solid' },
                      { id: 'dashed', label: 'Dashed' },
                      { id: 'dotted', label: 'Dotted' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          onUpdateRule(activeRule.id, {
                            borderStyle: b.id as any,
                            borderWidth: b.id === 'none' ? 0 : activeRule.borderWidth || 1,
                          })
                        }
                        className={`flex-1 py-1 text-[10px] border transition-colors ${
                          (activeRule.borderStyle || 'none') === b.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-600'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Radius */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-neutral-600 block">Corner Radius</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: '0px', label: 'Sharp' },
                      { id: '3px', label: 'Subtle' },
                      { id: '6px', label: 'Rounded' },
                      { id: '9999px', label: 'Pill' },
                    ].map((cr) => (
                      <button
                        key={cr.id}
                        type="button"
                        onClick={() => onUpdateRule(activeRule.id, { borderRadius: cr.id })}
                        className={`flex-1 py-1 text-[10px] border transition-colors ${
                          (activeRule.borderRadius || '3px') === cr.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-600'
                        }`}
                      >
                        {cr.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Color */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-neutral-600 block">Border Color</span>
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-7 border border-neutral-300 shrink-0 overflow-hidden cursor-pointer">
                      <input
                        type="color"
                        value={isValidHex(activeRule.borderColor) ? normalizeHex(activeRule.borderColor) : '#BFDBFE'}
                        onChange={(e) => onUpdateRule(activeRule.id, { borderColor: e.target.value })}
                        className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                      />
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: activeRule.borderColor || '#d4d4d4' }}
                      />
                    </div>
                    <input
                      type="text"
                      value={activeRule.borderColor || ''}
                      onChange={(e) => onUpdateRule(activeRule.id, { borderColor: e.target.value })}
                      placeholder="#BFDBFE"
                      className="flex-1 px-2 py-1 text-xs font-mono border border-neutral-300 focus:outline-neutral-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-8 bg-neutral-50 border border-neutral-200 text-neutral-400 text-xs">
            Select a custom markdown rule or create a new one to begin editing.
          </div>
        )}
      </div>
    </div>
  );
};
