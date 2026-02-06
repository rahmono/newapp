
import React from 'react';
import { ArrowRight, Play, MessageCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-100 selection:text-zinc-900">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm z-50 border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white font-bold text-xs">Д</div>
            <span className="font-bold text-lg tracking-tight">Daftar.</span>
          </div>
          <a 
            href="https://steppay.fun" 
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Вход / Web
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center">
        <div className="inline-block px-3 py-1 mb-6 border border-zinc-200 rounded-full bg-zinc-50">
           <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Версияи 1.0 дастрас аст</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-zinc-900 leading-[0.95]">
          Қарзҳоро <br/>
          осон идора кунед.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-500 mb-10 leading-relaxed max-w-lg mx-auto font-normal">
          Дафтари рақамии содда барои мағозаҳои хурд. <br/>
          Ҳисоби шаффоф. Боварии дутарафа.
        </p>

        {/* Downloads */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            {/* Android Button */}
            <a 
                href="https://play.google.com/store/apps/details?id=com.daftarapp.tj"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
            >
                <Play size={20} fill="currentColor" />
                <div className="text-left">
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 leading-none mb-0.5">Available on</p>
                    <p className="text-sm font-bold leading-none">Google Play</p>
                </div>
            </a>

            {/* iOS Button (Telegram) */}
            <a 
                href="https://t.me/daftartjbot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-[#0088cc] text-white rounded-xl hover:bg-[#0077b5] transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
            >
                <MessageCircle size={24} fill="currentColor" />
                <div className="text-left">
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 leading-none mb-0.5">iOS Version via</p>
                    <p className="text-sm font-bold leading-none">Telegram Bot</p>
                </div>
            </a>
        </div>
        
        <p className="mt-6 text-xs text-zinc-400">
           Барои iOS ҳоло тариқи Telegram Bot дастрас аст.
        </p>
      </section>

      {/* Minimal Features Grid */}
      <section className="py-20 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-left">
            
            <div className="space-y-3">
              <div className="w-10 h-10 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-900 font-bold bg-zinc-50">1</div>
              <h3 className="text-lg font-bold">Сабти қарзҳо</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Ҳамаи қарзҳо ва пардохтҳоро дар як ҷо сабт кунед. Дигар дафтари қоғазӣ лозим нест.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-900 font-bold bg-zinc-50">2</div>
              <h3 className="text-lg font-bold">SMS Огоҳинома</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Ба мизоҷон ба таври худкор паёмак фиристед. Қарзҳоро тезтар баргардонед.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-900 font-bold bg-zinc-50">3</div>
              <h3 className="text-lg font-bold">100% Бехатар</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Маълумоти шумо дар сервери ҳимояшуда нигоҳ дошта мешавад ва ҳеҷ гоҳ гум намешавад.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-20 bg-zinc-50 border-t border-zinc-100">
         <div className="max-w-xl mx-auto px-6 text-center">
             <h2 className="text-2xl font-bold mb-4">Омодаед?</h2>
             <p className="text-zinc-500 mb-8">
                Корро ҳозир оғоз кунед. Ройгон аст.
             </p>
             <a href="https://steppay.fun" className="inline-flex items-center gap-2 text-zinc-900 font-bold hover:underline">
                Кушодани веб-версия <ArrowRight size={18} />
             </a>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-zinc-200 rounded flex items-center justify-center text-[10px] font-bold text-zinc-500">Д</div>
                <span className="text-sm font-semibold text-zinc-400">© 2026 Daftar</span>
           </div>
           
           <div className="flex gap-6 text-sm text-zinc-500 font-medium">
               <a href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</a>
               <a href="/terms" className="hover:text-zinc-900 transition-colors">Terms</a>
               <a href="/delete-account" className="hover:text-red-600 transition-colors">Delete Account</a>
           </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
