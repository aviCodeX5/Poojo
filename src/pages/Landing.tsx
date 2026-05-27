import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LanguageSelector } from '../components/language/LanguageSelector';
import { OnboardingDialog } from '../components/ui/OnboardingDialog';
import { BarChart3, Landmark, MessageSquare, Search, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Landing() {
  const [activeDialog, setActiveDialog] = useState<'register' | 'member' | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background-cream selection:bg-primary/20">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <BrandLogo showTagline />
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link to="/login" className="hidden text-xs font-black uppercase tracking-widest text-accent hover:text-primary sm:inline">
            {t('landing.adminAccess')}
          </Link>
        </div>
      </header>

      <main>
        <section className="px-6 pb-20 pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-3xl"
            >
              <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-seagreen shadow-sm">
                {t('app.tagline')}
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-slate-950 md:text-7xl">
                SamitiBook
              </h1>
              <p className="mt-6 max-w-2xl text-xl font-medium leading-relaxed text-slate-600">
                {t('landing.heroCopy')}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-14 w-full px-8 text-base shadow-xl shadow-primary/15 sm:w-auto"
                  onClick={() => setActiveDialog('register')}
                >
                  {t('auth.registerCommittee')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full border-blue-100 bg-white px-8 text-base text-slate-800 hover:bg-blue-50 sm:w-auto"
                  onClick={() => setActiveDialog('member')}
                >
                  {t('auth.memberLogin')}
                </Button>
              </div>
            </motion.div>

            <div className="relative">
              <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-900/5">
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-seagreen">{t('landing.liveOverview')}</div>
                      <div className="mt-1 text-2xl font-black text-slate-900">Lakeview Puja 2026</div>
                    </div>
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-sun">
                      <span className="absolute h-20 w-20 rounded-full border border-sun/25" />
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Collections', '₹8.2L'],
                      ['Expenses', '₹2.1L'],
                      ['Members', '148'],
                      ['Surplus', '₹6.1L'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                        <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-seagreen">{t('landing.capabilities')}</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">{t('landing.builtFor')}</h2>
            </div>
            <Link to="/login" className="text-xs font-black uppercase tracking-widest text-accent hover:text-primary">
              {t('landing.adminAccess')}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<Users className="h-5 w-5" />} title={t('landing.roleAccess')} description={t('landing.roleAccessDesc')} />
            <FeatureCard icon={<Landmark className="h-5 w-5" />} title={t('landing.financeRecords')} description={t('landing.financeRecordsDesc')} />
            <FeatureCard icon={<BarChart3 className="h-5 w-5" />} title={t('landing.simpleAnalytics')} description={t('landing.simpleAnalyticsDesc')} />
            <FeatureCard icon={<MessageSquare className="h-5 w-5" />} title={t('landing.broadcasts')} description={t('landing.broadcastsDesc')} />
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title={t('landing.secureAccess')} description={t('landing.secureAccessDesc')} />
            <FeatureCard icon={<Search className="h-5 w-5" />} title={t('landing.easyLookup')} description={t('landing.easyLookupDesc')} />
          </div>
        </section>
      </main>

      <footer className="border-t border-blue-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <BrandLogo showTagline />
          <p className="text-xs font-bold text-slate-400">© 2026 SamitiBook. Transparent Festival Management.</p>
        </div>
      </footer>

      <OnboardingDialog
        open={activeDialog === 'register'}
        title="Before you register"
        intro="Registration creates a new SamitiBook workspace for one real festival committee. Please read this before creating committee data."
        sections={[
          {
            title: 'What registration creates',
            items: [
              'A committee workspace with one primary admin account.',
              'A place to manage members, roles, collections, donations, expenses, inventory, broadcasts, and settings.',
              'A committee ID that members will use to identify the correct organization.',
            ],
          },
          {
            title: 'Dos and don’ts',
            items: [
              'Register only if you are authorized to manage this committee.',
              'One real committee and location should not be registered more than once.',
              'Use the correct pandal/location details so duplicate committees are not formed.',
            ],
          },
          {
            title: 'Roles in simple words',
            items: [
              'Admin controls the committee profile, members, roles, and major settings.',
              'Secretary, cashier, incharges, and volunteers get access based on responsibility.',
              'Members can see information and perform actions only if their assigned role allows it.',
            ],
          },
        ]}
        onCancel={() => setActiveDialog(null)}
        onContinue={() => navigate('/register')}
      />

      <OnboardingDialog
        open={activeDialog === 'member'}
        title="Before member login"
        intro="Member login is for people already added by a committee admin. Your access depends on your assigned role."
        sections={[
          {
            title: 'What members can see',
            items: [
              'Committee details, dashboards, and activity that your role is allowed to view.',
              'Finance, inventory, cultural, mandap, or broadcast modules only when your role permits it.',
              'Your committee information after logging in with the phone number added by your admin.',
            ],
          },
          {
            title: 'Dos and don’ts',
            items: [
              'Use only your own phone number added by your committee admin.',
              'Do not share your permanent login code with anyone.',
              'Contact your admin if your phone number is not recognized.',
            ],
          },
        ]}
        onCancel={() => setActiveDialog(null)}
        onContinue={() => navigate('/member-login')}
      />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-blue-900/5">
      <div className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
