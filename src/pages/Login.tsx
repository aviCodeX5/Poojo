import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LanguageSelector } from '../components/language/LanguageSelector';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is too short'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // Find the committee this admin belongs to
      const q = query(collection(db, 'committees'), where('adminUID', '==', userCredential.user.uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const commId = snap.docs[0].id;
        navigate(`/${commId}/dashboard`);
      } else {
        setError("Account found but no committee associated with this admin.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials.');
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
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Admin Portal</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Master access for authorized organizers</p>
        </div>

        <Card className="shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="admin@samitibook.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            
            <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
              Access Dashboard
            </Button>
            
            <div className="text-center space-y-3 mt-4">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">or</p>
              <Link to="/member-login" className="text-primary font-bold block hover:underline">
                Login as Member with Phone OTP
              </Link>
              <Link to="/register" className="text-sm text-gray-600 block">
                Need to register a new committee? <span className="text-accent font-bold">Sign Up</span>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
