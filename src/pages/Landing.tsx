import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Users, Landmark, BarChart3, MessageSquare, ShieldCheck, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background-cream selection:bg-primary/30">
      {/* Hero Section - Editorial Style */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 animate-pulse">Next-Gen Committee OS</div>
            <h1 className="text-6xl md:text-[10rem] font-black text-accent tracking-tighter leading-[0.8] mb-8">
              PUJA<br/><span className="text-primary italic">COMMITTEE</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-tight font-medium tracking-tight">
              Digitizing India's festivals through professional-grade committee management. 
              Secure, real-time, and mobile-first.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg shadow-xl shadow-primary/20">
                  Register Committee
                </Button>
              </Link>
              <Link to="/member-login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg bg-white border-orange-100 text-slate-800 hover:bg-orange-50 active:scale-95 transition-all">
                  Member Login
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Background Decorative - Professional Polish style */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -ml-48 -mb-48" />
      </header>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <div className="text-xs font-black uppercase tracking-widest text-primary mb-2">Capabilities</div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none">
              Engineered for absolute festival control.
            </h2>
          </div>
          <div className="h-0.5 flex-1 bg-orange-100 mx-8 hidden md:block" />
          <Link to="/login" className="text-xs font-black uppercase tracking-widest text-accent hover:text-primary transition-colors border-b-2 border-accent pb-1">
            Admin Portal Access
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <FeatureCard 
            icon={<Users className="w-6 h-6" />}
            title="RBAC Identity"
            label="01"
            description="13 specialized roles from President to Volunteers with granular document permissions."
          />
          <FeatureCard 
            icon={<Landmark className="w-6 h-6" />}
            title="Finance OS"
            label="02"
            description="Bullet-proof ledger for Chanda & Large Donations with automated receipt generation."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-6 h-6" />}
            title="Smart Analytics"
            label="03"
            description="Rule-based insights detect budget leaks and collection plateaus in real-time."
          />
          <FeatureCard 
            icon={<MessageSquare className="w-6 h-6" />}
            title="Unified Comms"
            label="04"
            description="Send receipt digests and critical notifications via WhatsApp and push alerts."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Cloud Security"
            label="05"
            description="Enterprise-grade NoSQL architecture with hardened ABAC security rules."
          />
          <FeatureCard 
            icon={<Search className="w-6 h-6" />}
            title="Public Index"
            label="06"
            description="Search official puja committees across cities and verify credentials instantly."
          />
        </div>
      </section>

      {/* Modern Search CTA */}
      <section className="py-24 px-6 bg-accent text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h3 className="text-3xl md:text-5xl font-black mb-10 tracking-tight leading-none uppercase">Locate Your Pandal</h3>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search by ID (e.g. KOL-DPK-2025)..."
              className="w-full h-20 pl-16 pr-6 rounded-2xl bg-white border-2 border-transparent focus:border-primary shadow-2xl transition-all outline-none text-lg text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-xs"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus:text-primary transition-colors" />
          </div>
          <p className="mt-6 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] font-mono">Verified Committees Only</p>
        </div>
      </section>

      <footer className="py-12 text-center border-t border-orange-100 bg-white">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg mb-2">
              <span className="text-2xl">🙏</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/30">Digitizing Festivals Since 2026</p>
           <p className="text-slate-400 text-xs font-bold leading-none">© 2026 PujaCommittee. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, label }: { icon: React.ReactNode, title: string, description: string, label: string }) {
  return (
    <div className="group">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</div>
        <div className="h-px bg-orange-100 flex-1 ml-4 group-hover:bg-primary transition-colors"></div>
      </div>
      <div className="mb-4 inline-flex p-3 bg-white border border-orange-100 rounded-xl group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm shadow-orange-100">
        {icon}
      </div>
      <h4 className="text-lg font-black mb-2 text-slate-800 tracking-tight leading-none uppercase group-hover:text-primary transition-colors">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed font-bold tracking-tight">{description}</p>
    </div>
  );
}

