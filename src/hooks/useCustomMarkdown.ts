import { useState, useEffect, useCallback } from 'react';
import { CustomMarkdownRule } from '../types';

export const CUSTOM_MARKDOWN_STORAGE_KEY = 'pinboard_custom_markdown_rules_v1';

export const DEFAULT_CUSTOM_MARKDOWN_RULES: CustomMarkdownRule[] = [
  {
    id: 'rule_alert',
    name: 'Alert / Warning',
    prefix: '!!',
    suffix: '!!',
    fontWeight: '700',
    isBold: true,
    isItalic: false,
    fontSize: '11px',
    backgroundColor: '#FEF2F2',
    textColor: '#DC2626',
    textTransform: 'uppercase',
    rotate: 0,
    scale: 1,
    skewX: 0,
    borderRadius: '3px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#FECACA',
    paddingHorizontal: 5,
    paddingVertical: 1,
    letterSpacing: 0.5,
    textDecoration: 'none',
    createdAt: 1,
  },
  {
    id: 'rule_badge',
    name: 'Badge / Tag',
    prefix: '::',
    suffix: '::',
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
    createdAt: 2,
  },
  {
    id: 'rule_stamp',
    name: 'Rotated Stamp',
    prefix: '^^',
    suffix: '^^',
    fontWeight: '700',
    isBold: true,
    isItalic: true,
    fontSize: '12px',
    backgroundColor: '#FEF3C7',
    textColor: '#B45309',
    textTransform: 'capitalize',
    rotate: -2,
    scale: 1,
    skewX: 0,
    borderRadius: '2px',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    letterSpacing: 0.5,
    textDecoration: 'none',
    createdAt: 3,
  },
  {
    id: 'rule_pill',
    name: 'Mint Pill',
    prefix: '@@',
    suffix: '@@',
    fontWeight: '600',
    isBold: false,
    isItalic: false,
    fontSize: '11px',
    backgroundColor: '#ECFDF5',
    textColor: '#047857',
    textTransform: 'none',
    rotate: 0,
    scale: 1,
    skewX: 0,
    borderRadius: '9999px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 1,
    letterSpacing: 0,
    textDecoration: 'none',
    createdAt: 4,
  },
  {
    id: 'rule_neon',
    name: 'Neon Cyber',
    prefix: '%%',
    suffix: '%%',
    fontWeight: '700',
    isBold: true,
    isItalic: false,
    fontSize: '11px',
    backgroundColor: '#18181B',
    textColor: '#22C55E',
    textTransform: 'uppercase',
    rotate: 0,
    scale: 1,
    skewX: 0,
    borderRadius: '2px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#22C55E',
    paddingHorizontal: 5,
    paddingVertical: 1,
    letterSpacing: 1,
    textDecoration: 'none',
    createdAt: 5,
  },
];

export function useCustomMarkdown() {
  const [rules, setRules] = useState<CustomMarkdownRule[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CUSTOM_MARKDOWN_RULES;
    try {
      const stored = localStorage.getItem(CUSTOM_MARKDOWN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse custom markdown rules from localStorage:', e);
    }
    return DEFAULT_CUSTOM_MARKDOWN_RULES;
  });

  // Persist rules to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_MARKDOWN_STORAGE_KEY, JSON.stringify(rules));
    } catch (e) {
      console.warn('Failed to store custom markdown rules:', e);
    }
  }, [rules]);

  const addRule = useCallback(
    (newRule: Omit<CustomMarkdownRule, 'id' | 'createdAt'>): CustomMarkdownRule => {
      const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ruleWithId: CustomMarkdownRule = {
        ...newRule,
        id,
        createdAt: Date.now(),
      };
      setRules((prev) => [...prev, ruleWithId]);
      return ruleWithId;
    },
    []
  );

  const updateRule = useCallback((id: string, updates: Partial<CustomMarkdownRule>) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const duplicateRule = useCallback((id: string): CustomMarkdownRule | null => {
    const existing = rules.find((r) => r.id === id);
    if (!existing) return null;

    const duplicated: CustomMarkdownRule = {
      ...existing,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${existing.name} (Copy)`,
      prefix: existing.prefix ? `${existing.prefix}_` : '::',
      suffix: existing.suffix ? `_${existing.suffix}` : '::',
      createdAt: Date.now(),
    };

    setRules((prev) => [...prev, duplicated]);
    return duplicated;
  }, [rules]);

  const resetRulesToDefault = useCallback(() => {
    setRules(DEFAULT_CUSTOM_MARKDOWN_RULES);
  }, []);

  return {
    rules,
    addRule,
    updateRule,
    deleteRule,
    duplicateRule,
    resetRulesToDefault,
    resetToDefaults: resetRulesToDefault,
  };
}
