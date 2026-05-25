import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import GoogleMaps from '../components/GoogleMaps';
import { generateCommitteeId } from '../utils/idGenerator';
import { PujaType } from '../types';
import { CheckCircle2, Copy, PlusCircle, X, MapPin } from 'lucide-react';

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

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string } | null>(null);
  const [showNewPujaTypeInput, setShowNewPujaTypeInput] = useState(false);
  const [newPujaTypeName, setNewPujaTypeName] = useState('');
  const [customPujaTypes, setCustomPujaTypes] = useState<string[]>([]);
  const [allPujaTypes, setAllPujaTypes] = useState<string[]>(DEFAULT_PUJA_TYPES);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
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

      // 1. Create Firebase Auth User first (needed for Firestore permissions)
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      // 2. Check if name already exists in this city (now authenticated)
      const q = query(collection(db, 'committees'), where('name', '==', data.name), where('city', '==', data.city));
      const existing = await getDocs(q);
      if (!existing.empty) {
        alert('A committee with this name already exists in ' + data.city);
        return;
      }

      // 3. Generate Committee ID
      const year = new Date().getFullYear();
      // For sequence, in a production app we'd use a counter or transaction.
      // Here we'll use a random 4-digit for mock sequence.
      const sequence = Math.floor(1000 + Math.random() * 9000);
      const committeeId = generateCommitteeId(data.pujaType as PujaType, year, data.city, sequence);

      // 4. Create Committee Document
      const committeeRef = doc(db, 'committees', committeeId);
      await setDoc(committeeRef, {
        committeeId,
        name: data.name,
        pujaType: data.pujaType,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        pandalAddress: selectedLocation.address,
        pandalLatLng: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        adminUID: uid,
        adminEmail: data.email,
        adminPhone: data.adminPhone.startsWith('+91') ? data.adminPhone : `+91${data.adminPhone}`,
        createdAt: new Date().toISOString(),
        isActive: true,
        foundedYear: year,
        customPujaTypes: customPujaTypes,
      });

      // 5. Add Admin as the first member record for phone login consistency
      const phone = data.adminPhone.startsWith('+91') ? data.adminPhone : `+91${data.adminPhone}`;
      const memberRef = doc(db, 'committees', committeeId, 'members', phone);
      await setDoc(memberRef, {
        memberId: phone,
        name: 'Administrator',
        phone: phone,
        role: 'ADMIN',
        addedAt: new Date().toISOString(),
        addedBy: uid,
        isActive: true,
        firebaseUID: uid
      });

      setSuccessData({ id: committeeId });
    } catch (error: any) {
      console.error(error);
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
          
          <div className="bg-orange-50 border-2 border-primary/20 rounded-2xl p-6 mb-8 flex flex-col items-center gap-2">
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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Register Committee</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Launch your professional festival operations</p>
        </div>

        <Card className="shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Committee Name" 
                placeholder="e.g. Diamond Park Kali Puja"
                {...register('name')}
                error={errors.name?.message}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 ml-1">Puja Type</label>
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
              <Input label="City" placeholder="Kolkata" {...register('city')} error={errors.city?.message} />
              <Input label="State" placeholder="West Bengal" {...register('state')} error={errors.state?.message} />
              <Input label="Pincode" placeholder="700001" {...register('pincode')} error={errors.pincode?.message} />
              <Input label="Admin Phone" placeholder="9876543210" {...register('adminPhone')} error={errors.adminPhone?.message} />
            </div>

            <hr className="border-gray-100 my-4" />
            
            {/* Pandal Location Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900">Pandal Location</h3>
                <span className="text-xs text-red-500 font-medium">*</span>
              </div>
              <p className="text-sm text-gray-500">Click on the map or search to select your pandal location</p>
              <GoogleMaps 
                onLocationSelect={(location) => setSelectedLocation(location)}
                className="mt-4"
              />
            </div>

            <hr className="border-gray-100 my-4" />
            <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-gray-100">
              <h3 className="font-bold text-gray-900">Admin Credentials</h3>
              <p className="text-sm text-gray-500 mb-2">Used for master access and committee oversight.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Admin Email" placeholder="admin@example.com" {...register('email')} error={errors.email?.message} />
                <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
              Create Committee & Account
            </Button>
            
            <p className="text-center text-sm text-gray-500">
              Already have a committee? <Link to="/login" className="text-primary font-bold">Admin Login</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
