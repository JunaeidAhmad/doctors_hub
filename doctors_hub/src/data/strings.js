import en from './stringsEn.js';
import bn from './stringsBn.js';
import { getLang } from '../hooks/useLang.js';

const tables = { en, bn };

export function t(key, vars = {}) {
  return tFor(getLang(), key, vars);
}

export function tFor(lang, key, vars = {}) {
  const table = tables[lang] || en;
  const template = table[key] ?? en[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

function pluralizeLastWord(word) {
  if (!word) return word;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  return `${word}s`;
}

export function pluralizeSpecialty(name) {
  if (!name) return '';
  return String(name)
    .split(/(\s+&\s+|\s+\/\s+)/)
    .map((part, i) => {
      if (i % 2 === 1) return part;
      const trimmed = part.trimEnd();
      const idx = trimmed.lastIndexOf(' ');
      if (idx === -1) return pluralizeLastWord(trimmed);
      return `${trimmed.slice(0, idx + 1)}${pluralizeLastWord(trimmed.slice(idx + 1))}`;
    })
    .join('');
}
