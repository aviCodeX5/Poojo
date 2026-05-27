import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LanguageSelector } from '../components/language/LanguageSelector';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is too short'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loginWithAdminPassword } = useAuth();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const commId = await loginWithAdminPassword(data.email, data.password);
      navigate(`/${commId}/dashboard`);
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
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">{t('auth.adminPortal')}</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{t('auth.adminPortalSubtitle')}</p>
        </div>

        <Card className="shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <Input 
              label={t('auth.emailAddress')} 
              type="email" 
              placeholder="admin@samitibook.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input 
              label={t('auth.password')} 
              type="password" 
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            
            <Button type="submit" size="lg" className="w-full h-14" isLoading={isSubmitting}>
              {t('auth.accessDashboard')}
            </Button>
            
            <div className="text-center space-y-3 mt-4">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">{t('common.or')}</p>
              <Link to="/member-login" className="text-primary font-bold block hover:underline">
                {t('auth.memberLoginCode')}
              </Link>
              <Link to="/register" className="text-sm text-gray-600 block">
                {t('auth.signUpPrompt')} <span className="text-accent font-bold">{t('auth.signUp')}</span>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
