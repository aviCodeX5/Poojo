import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LanguageSelector } from '../components/language/LanguageSelector';
import { Phone, ArrowRight, MessageSquare } from 'lucide-react';

export default function MemberLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha resolved');
        }
      });
    }
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!confirmationResult) throw new Error('Refresh page and try again');
      const userCredential = await confirmationResult.confirm(otp);
      const phone = userCredential.user.phoneNumber;

      // Find the committee where this phone is a member
      const committeesRef = collection(db, 'committees');
      const allComm = await getDocs(committeesRef);
      
      let foundCommitteeId = null;
      for (const commDoc of allComm.docs) {
        if (phone) {
           const memberRef = doc(db, 'committees', commDoc.id, 'members', phone);
           const memberSnap = await getDoc(memberRef);
           if (memberSnap.exists()) {
             foundCommitteeId = commDoc.id;
             break;
           }
        }
      }

      if (foundCommitteeId) {
        navigate(`/${foundCommitteeId}/dashboard`);
      } else {
        setError("Your phone number is authenticated, but you are not registered with any committee. Please contact your committee admin.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError('Invalid OTP or verification expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div id="recaptcha-container"></div>
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" aria-label="SamitiBook home">
            <BrandLogo showTagline />
          </Link>
          <LanguageSelector />
        </div>
        
        <div className="text-center mb-8">
           <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-blue-100">
             <Phone className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Member Sync</h1>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Access your committee via Phone OTP</p>
        </div>

        <Card className="shadow-2xl">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-4">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-4">
                <Input 
                  label="Phone Number" 
                  placeholder="9876543210" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-lg font-bold tracking-widest text-center"
                />
                <p className="text-xs text-gray-500 text-center px-4 leading-relaxed">
                  We'll send a 6-digit one-time password to verify your identity. Local charges may apply.
                </p>
              </div>
              <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
                Send SMS OTP <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-4">
                <Input 
                  label="Enter 6-digit OTP" 
                  placeholder="••••••" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-2xl font-black tracking-[1em] text-center pl-[0.5em]"
                  maxLength={6}
                />
                <div className="flex justify-between items-center text-xs px-1">
                  <span className="text-gray-500">OTP sent to {phoneNumber}</span>
                  <button type="button" onClick={() => setStep('phone')} className="text-primary font-bold">Change Number</button>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
                Verify & Continue
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="text-accent font-bold hover:underline inline-flex items-center">
               Admin Login with Email <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
