import { useState, useEffect, useCallback } from 'react';
import { CustomMarkdownRule } from '../types';

export const CUSTOM_MARKDOWN_STORAGE_KEY = 'pinboard_custom_markdown_rules_v1';

export const DEFAULT_CUSTOM_MARKDOWN_RULES: CustomMarkdownRule[] = [
  {
    id: 'rule_alert',
    name: 'Alert / Warning',
    prefix: '!!',
    suffix: '!!',
    fontWeight: '900',
    isBold: false,
    isItalic: false,
    fontSize: '11px',
    backgroundColor: 'transparent',
    textColor: '#DC2626',
    textTransform: 'uppercase',
    rotate: 0,
    scale: 1.2,
    skewX: 0,
    borderRadius: '0px',
    borderWidth: 1,
    borderStyle: 'none',
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
    fontWeight: '200',
    isBold: false,
    isItalic: false,
    fontSize: '6px',
    backgroundColor: 'transparent',
    textColor: '#828282',
    textTransform: 'none',
    rotate: 0,
    scale: 1,
    skewX: 0,
    borderRadius: '2px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#858585',
    paddingHorizontal: 6,
    paddingVertical: 1,
    letterSpacing: 0,
    textDecoration: 'none',
    createdAt: 2,
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
