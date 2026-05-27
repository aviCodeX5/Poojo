import { CheckCircle2, X } from 'lucide-react';
import { Button } from './Button';

export function SuccessDialog({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="success-dialog-title" className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 id="success-dialog-title" className="text-xl font-black text-slate-900">{title}</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">{message}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Button onClick={onClose} className="mt-6 w-full">Done</Button>
      </div>
    </div>
  );
}
