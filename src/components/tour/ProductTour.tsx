import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

const tourSteps = [
  {
    title: 'Welcome to Pooja Samiti',
    body: 'This quick tour explains the main buttons and where your committee work happens.',
  },
  {
    title: 'Dashboard',
    body: 'Use Dashboard for live collections, expenses, surplus, recent activity, and pending approval summaries.',
  },
  {
    title: 'Members',
    body: 'Admins add members, assign roles, and share permanent login codes. Members can sign in and view records.',
  },
  {
    title: 'Finance',
    body: 'Chanda, donations, and expenses show ledger details. Admins can add records; members see them in read-only mode.',
  },
  {
    title: 'Puja Editions',
    body: 'Create a yearly edition before operations begin. New editions can reuse the previous committee and roles.',
  },
  {
    title: 'Upgrade',
    body: 'Use Upgrade to open Razorpay checkout. After a successful payment, Pooja Samiti confirms the upgrade with a tick mark.',
  },
];

export function ProductTour() {
  const { user, committee } = useAuth();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  const storageKey = useMemo(() => {
    if (!user?.uid || !committee?.committeeId) return '';
    return `pooja-samiti.tour.${committee.committeeId}.${user.type}.${user.uid}`;
  }, [committee?.committeeId, user?.type, user?.uid]);

  useEffect(() => {
    if (!storageKey) return;
    if (localStorage.getItem(storageKey) !== 'done') setOpen(true);
  }, [storageKey]);

  const finish = () => {
    if (storageKey) localStorage.setItem(storageKey, 'done');
    setOpen(false);
  };

  if (!open) return null;

  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-blue-950/45 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="tour-title" className="w-full max-w-lg rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Site Tour {step + 1}/{tourSteps.length}</p>
            <h2 id="tour-title" className="mt-2 text-2xl font-black text-slate-950">{current.title}</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{current.body}</p>
          </div>
          <button type="button" onClick={finish} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close tour">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={finish}>Skip tour</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => isLast ? finish() : setStep(step + 1)}>
              {isLast ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Finish</> : <>Next <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
