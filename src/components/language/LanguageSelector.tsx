import { LANGUAGES, useLanguage, type LanguageCode } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

export function LanguageSelector({ className, light = false }: { className?: string; light?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={cn('inline-flex items-center gap-2 text-xs font-bold', light ? 'text-white/80' : 'text-slate-600', className)}>
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label="Language"
        value={language}
        onChange={event => setLanguage(event.target.value as LanguageCode)}
        className={cn(
          'h-9 rounded-lg border px-3 text-xs font-bold outline-none transition-colors',
          light
            ? 'border-white/15 bg-white/10 text-white hover:bg-white/15 focus:ring-2 focus:ring-white/40'
            : 'border-blue-100 bg-white text-slate-700 hover:border-primary focus:ring-2 focus:ring-primary/20'
        )}
      >
        {LANGUAGES.map(option => (
          <option key={option.code} value={option.code} className="text-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
