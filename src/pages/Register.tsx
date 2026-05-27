import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LanguageSelector } from '../components/language/LanguageSelector';
import GoogleMaps from '../components/GoogleMaps';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, Copy, PlusCircle, X, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const DEFAULT_PUJA_TYPES = ['Durga', 'Ganesh', 'Kali', 'Saraswati', 'Lakshmi', 'Other'];

const registerSchema = z.object({
  name: z.string().min(3, 'Committee name must be at least 3 characters'),
  pujaType: z.string().min(1, 'Puja type is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  adminPhone: z.string().min(10, 'Valid phone number required (e.g. 9876543210)'),
});

const otpSchema = z.object({
  code: z.string().min(4, 'Enter the verification code from your email'),
});

type RegisterForm = z.infer<typeof registerSchema>;

function distanceInMeters(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number }
) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLat = toRadians(second.lat - first.lat);
  const deltaLng = toRadians(second.lng - first.lng);
  const firstLat = toRadians(first.lat);
  const secondLat = toRadians(second.lat);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string } | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [showNewPujaTypeInput, setShowNewPujaTypeInput] = useState(false);
  const [newPujaTypeName, setNewPujaTypeName] = useState('');
  const [customPujaTypes, setCustomPujaTypes] = useState<string[]>([]);
  const [allPujaTypes, setAllPujaTypes] = useState<string[]>(DEFAULT_PUJA_TYPES);
  const [selectedLocation, setSelectedLocation] = useState<{ lat?: number; lng?: number; address: string } | null>(null);
  const { startRegistration, confirmRegistration } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const { register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
  });

  const handleCreatePujaType = () => {
    if (newPujaTypeName.trim() && !allPujaTypes.includes(newPujaTypeName.trim())) {
      setCustomPujaTypes([...customPujaTypes, newPujaTypeName.trim()]);
      setAllPujaTypes([...allPujaTypes, newPujaTypeName.trim()]);
      setNewPujaTypeName('');
      setShowNewPujaTypeInput(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      // Validate location is selected
      if (!selectedLocation) {
        alert('Please select your pandal location on the map.');
        return;
      }

      const result = await startRegistration({
        name: data.name,
        pujaType: data.pujaType,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        pandalAddress: selectedLocation.address,
        pandalLatLng: selectedLocation.lat !== undefined && selectedLocation.lng !== undefined
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : null,
        adminEmail: data.email,
        adminPhone: data.adminPhone.startsWith('+91') ? data.adminPhone : `+91${data.adminPhone}`,
        email: data.email,
        password: data.password,
        customPujaTypes,
      });
      setPendingEmail(result.email);
      setDevCode(result.developmentCode || null);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
    if (!pendingEmail) return;
    setIsSubmitting(true);
    try {
      const committeeId = await confirmRegistration(pendingEmail, data.code);
      setSuccessData({ id: committeeId });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.id);
      alert('Committee ID copied!');
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center py-12 px-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-8">
            Your committee has been registered. Please save this unique ID. You will need it to login and share it with your members.
          </p>
          
          <div className="bg-blue-50 border-2 border-primary/20 rounded-2xl p-6 mb-8 flex flex-col items-center gap-2">
            <span className="text-xs uppercase font-bold text-primary tracking-widest">Committee ID</span>
            <span className="text-2xl font-black text-accent font-mono tracking-tight">{successData.id}</span>
            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="mt-2 h-8">
              <Copy className="w-4 h-4 mr-2" /> Copy ID
            </Button>
          </div>

          <Link to={`/${successData.id}/dashboard`} className="w-full">
            <Button size="lg" className="w-full">Go to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-cream py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" aria-label="Pooja Samiti home">
            <BrandLogo showTagline />
          </Link>
          <LanguageSelector />
        </div>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">{t('register.title')}</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{t('register.subtitle')}</p>
        </div>

        <Card className="shadow-xl">
          {pendingEmail ? (
            <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="font-black text-slate-900">Verify your admin email</h3>
                <p className="mt-2 text-sm text-slate-600">
                  We sent a verification code to {pendingEmail}. Enter it below to create your committee and admin account.
                </p>
                {devCode && <p className="mt-3 text-xs font-bold text-primary">Development code: {devCode}</p>}
              </div>
              <Input label="Email Verification Code" {...registerOtp('code')} error={otpErrors.code?.message} />
              <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
                Verify Email & Create Committee
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setPendingEmail(null)}>
                Back to details
              </Button>
            </form>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label={t('register.committeeName')} 
                placeholder="e.g. Diamond Park Kali Puja"
                {...register('name')}
                error={errors.name?.message}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 ml-1">{t('register.pujaType')}</label>
                <select
                  {...register('pujaType')}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setShowNewPujaTypeInput(true);
                    }
                  }}
                  className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                >
                  {allPujaTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="__CREATE_NEW__">+ Create New Type</option>
                </select>
                {showNewPujaTypeInput && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="New puja type name"
                      value={newPujaTypeName}
                      onChange={(e) => setNewPujaTypeName(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleCreatePujaType} size="sm">
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewPujaTypeInput(false)} size="sm">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Input label={t('register.city')} placeholder="Kolkata" {...register('city')} error={errors.city?.message} />
              <Input label={t('register.state')} placeholder="West Bengal" {...register('state')} error={errors.state?.message} />
              <Input label={t('register.pincode')} placeholder="700001" {...register('pincode')} error={errors.pincode?.message} />
              <Input label={t('register.adminPhone')} placeholder="9876543210" {...register('adminPhone')} error={errors.adminPhone?.message} />
            </div>

            <hr className="border-gray-100 my-4" />
            
            {/* Pandal Location Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900">{t('register.pandalLocation')}</h3>
                <span className="text-xs text-red-500 font-medium">*</span>
              </div>
              <p className="text-sm text-gray-500">{t('register.pandalHelp')}</p>
              <GoogleMaps 
                onLocationSelect={(location) => setSelectedLocation(location)}
                className="mt-4"
              />
            </div>

            <hr className="border-gray-100 my-4" />
            <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-gray-100">
              <h3 className="font-bold text-gray-900">{t('register.adminCredentials')}</h3>
              <p className="text-sm text-gray-500 mb-2">{t('register.adminCredentialsHelp')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t('auth.emailAddress')} placeholder="admin@example.com" {...register('email')} error={errors.email?.message} />
                <Input label={t('auth.password')} type="password" {...register('password')} error={errors.password?.message} />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
              {t('register.createAccount')}
            </Button>
            
            <p className="text-center text-sm text-gray-500">
              {t('register.alreadyRegistered')} <Link to="/login" className="text-primary font-bold">{t('auth.adminLogin')}</Link>
            </p>
          </form>
          )}
        </Card>
      </div>
    </div>
  );
}
