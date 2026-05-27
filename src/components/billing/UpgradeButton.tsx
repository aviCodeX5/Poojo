import { useState } from 'react';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { SuccessDialog } from '../ui/SuccessDialog';
import { useAuth } from '../../hooks/useAuth';
import { createUpgradeOrder, verifyUpgradePayment } from '../../lib/api';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export function UpgradeButton() {
  const { committee, user, isAdminAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const startUpgrade = async () => {
    if (!committee || !isAdminAccount) return;
    setLoading(true);
    try {
      await loadRazorpay();
      const committeeId = committee.id || committee.committeeId;
      const order = await createUpgradeOrder(committeeId);
      const checkout = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: {
          email: user?.email || committee.adminEmail || '',
          contact: committee.adminPhone || '',
        },
        handler: async (response: any) => {
          await verifyUpgradePayment({ committeeId, ...response });
          setUpgraded(true);
          setSuccessOpen(true);
        },
        theme: { color: '#2563eb' },
      });
      checkout.open();
    } catch (error: any) {
      setSuccessOpen(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={upgraded ? 'outline' : 'primary'}
        onClick={startUpgrade}
        disabled={!isAdminAccount || loading || upgraded}
        title={isAdminAccount ? 'Upgrade with Razorpay' : 'Only admins can upgrade'}
        className="h-9 px-4 text-[11px] uppercase tracking-widest"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : upgraded ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> : <CreditCard className="mr-2 h-4 w-4" />}
        {upgraded ? 'Upgraded' : 'Upgrade'}
      </Button>
      <SuccessDialog
        open={successOpen && upgraded}
        title="Upgradation Done"
        message="Your payment was verified and this committee is now upgraded."
        onClose={() => setSuccessOpen(false)}
      />
    </>
  );
}
