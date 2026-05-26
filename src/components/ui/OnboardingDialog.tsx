import { X } from 'lucide-react';
import { Button } from './Button';

type DialogSection = {
  title: string;
  items: string[];
};

type OnboardingDialogProps = {
  open: boolean;
  title: string;
  intro: string;
  sections: DialogSection[];
  continueLabel?: string;
  onCancel: () => void;
  onContinue: () => void;
};

export function OnboardingDialog({
  open,
  title,
  intro,
  sections,
  continueLabel = 'I understand, continue',
  onCancel,
  onContinue,
}: OnboardingDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-dialog-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/20"
      >
        <div className="flex items-start justify-between gap-4 border-b border-blue-100 p-6">
          <div>
            <h2 id="onboarding-dialog-title" className="text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{intro}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-slate-700"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6">
          {sections.map(section => (
            <section key={section.title} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-seagreen">{section.title}</h3>
              <ul className="mt-3 space-y-2 text-sm font-medium leading-relaxed text-slate-700">
                {section.items.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-blue-100 bg-slate-50 p-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onContinue}>
            {continueLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
