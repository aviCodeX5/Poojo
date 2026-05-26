import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

export function BrandLogo({
  showTagline = false,
  compact = false,
  className,
  light = false,
}: {
  showTagline?: boolean;
  compact?: boolean;
  className?: string;
  light?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sun shadow-sm shadow-sun/30">
        <span className="absolute h-14 w-14 rounded-full border-2 border-sun/30" />
        <span className="absolute h-8 w-8 rounded-full border border-white/60" />
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className={cn('text-xl font-black tracking-tight', light ? 'text-white' : 'text-slate-900')}>
            {t('app.name')}
          </div>
          {showTagline && (
            <div className={cn(
              'mt-1 text-[10px] font-bold uppercase tracking-[0.18em]',
              light ? 'text-white/70' : 'text-seagreen'
            )}>
              {t('app.tagline')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
