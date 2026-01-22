import React, { useState } from 'react';
import { Phone, ArrowRight, Loader2, Lock } from 'lucide-react';
import { requestLoginOtp, verifyLoginOtp } from '../services/storage';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
        setError('Лутфан рақами дурустро ворид кунед');
        return;
    }
    
    setLoading(true);
    setError('');
    
    try {
        await requestLoginOtp('992' + phone);
        setStep('OTP');
    } catch (err: any) {
        setError('Хатогӣ ҳангоми ирсоли SMS. Лутфан дертар кӯшиш кунед.');
    } finally {
        setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
        setError('Код бояд 6 рақам бошад');
        return;
    }

    setLoading(true);
    setError('');

    try {
        const user = await verifyLoginOtp('992' + phone, otp);
        onLoginSuccess(user);
    } catch (err: any) {
        setError('Коди нодуруст. Лутфан аз нав санҷед.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-zinc-200/50 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header Graphic */}
        <div className="bg-zinc-900 text-white p-8 text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-2xl font-bold">Д</span>
            </div>
            <h1 className="text-xl font-bold">Дафтар</h1>
            <p className="text-zinc-400 text-sm mt-1">Воридшавӣ ба система</p>
            
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
        </div>

        <div className="p-8">
            {step === 'PHONE' ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Рақами телефон</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-zinc-400 border-r border-zinc-200 pr-2 pointer-events-none">
                                <Phone size={16} />
                                <span className="font-medium text-zinc-900">+992</span>
                            </div>
                            <input 
                                type="tel" 
                                autoFocus
                                className="w-full pl-24 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-lg font-medium outline-none focus:border-zinc-900 transition-colors"
                                placeholder="900..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || phone.length < 9}
                        className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <>Войти <ArrowRight size={18} /></>}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-3">
                            <Lock size={20} />
                        </div>
                        <p className="text-zinc-600 text-sm">
                            Коди 6-рақама ба рақами <br/>
                            <span className="font-bold text-zinc-900">+992 {phone}</span> фиристода шуд
                        </p>
                        <button 
                            type="button" 
                            onClick={() => setStep('PHONE')} 
                            className="text-xs text-blue-600 mt-2 font-medium hover:underline"
                        >
                            Тағйир додани рақам
                        </button>
                    </div>

                    <div>
                        <input 
                            type="text" 
                            autoFocus
                            maxLength={6}
                            className="w-full py-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-3xl font-bold tracking-widest outline-none focus:border-zinc-900 transition-colors"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || otp.length < 6}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : "Вход"}
                    </button>
                </form>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium animate-in shake">
                    {error}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;