import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LanguageSelector } from '../components/language/LanguageSelector';
import { useAuth } from '../hooks/useAuth';
import { Phone, ArrowRight, KeyRound } from 'lucide-react';

export default function MemberLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loginWithMemberCode } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const committeeId = await loginWithMemberCode(phoneNumber, loginCode);
      navigate(`/${committeeId}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Unable to login with this mobile number and code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full">
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
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Access with mobile number and permanent code</p>
        </div>

        <Card className="shadow-2xl">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <Input 
                label="Phone Number" 
                placeholder="9876543210" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg font-bold tracking-widest text-center"
                required
              />
              <Input 
                label="Permanent Login Code" 
                placeholder="SEC2026" 
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                className="text-lg font-black tracking-widest text-center uppercase"
                required
              />
              <p className="text-xs text-gray-500 text-center px-4 leading-relaxed">
                Use the permanent code shared by your committee admin. Do not share this code with anyone outside your committee.
              </p>
            </div>
            <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
              Access Member Dashboard <KeyRound className="ml-2 w-5 h-5" />
            </Button>
          </form>

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
