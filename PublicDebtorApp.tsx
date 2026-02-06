
import React, { useEffect, useState } from 'react';
import { Loader2, Store, User, Calendar, CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { formatCurrency, formatDate, getPublicDebtor, initiateDebtPayment } from './services/storage';
import { Transaction, TransactionType } from './types';

const PublicDebtorApp: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ id: string, name: string, balance: number, storeName: string, transactions: Transaction[] } | null>(null);
  const [error, setError] = useState(false);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchDebtor = async () => {
      // Extract ID from URL: /debtor/:id
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id) {
          setError(true);
          setLoading(false);
          return;
      }

      const result = await getPublicDebtor(id);
      if (result) {
          setData(result);
          // Set default payment amount to total balance if positive
          if (result.balance > 0) {
              setPayAmount(result.balance.toString());
          }
      } else {
          setError(true);
      }
      setLoading(false);
    };

    fetchDebtor();
  }, []);

  const handlePay = async () => {
      if (!data) return;
      const amount = parseFloat(payAmount);
      if (isNaN(amount) || amount <= 0) {
          alert("Лутфан маблағи дурустро ворид кунед.");
          return;
      }
      
      setPaying(true);
      try {
          const checkoutUrl = await initiateDebtPayment(data.id, amount);
          window.location.href = checkoutUrl;
      } catch (e: any) {
          alert(`Хатогӣ: ${e.message}`);
          setPaying(false);
      }
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-zinc-400" size={32} />
              <p className="text-zinc-400 text-sm">Маълумот боргирӣ шуда истодааст...</p>
          </div>
      );
  }

  if (error || !data) {
      return (
          <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                  <User size={32} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Мизоҷ ёфт нашуд</h2>
              <p className="text-zinc-500 mt-2">Мумкин аст ссылка нодуруст бошад ё профил нест карда шудааст.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-10">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-center relative">
              <h1 className="font-bold text-zinc-900">Профили қарз</h1>
          </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 animate-in slide-in-from-bottom duration-500">
          
          {/* Store Info */}
          <div className="flex items-center justify-center gap-2 text-zinc-500">
               <Store size={16} />
               <span className="font-medium">{data.storeName}</span>
          </div>

          {/* Balance Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/50 text-center border border-zinc-100 relative overflow-hidden">
             <div className="relative z-10">
                 <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Қарзи ҷории шумо</p>
                 <h2 className={`text-4xl font-black tracking-tight ${data.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                     {formatCurrency(data.balance)}
                 </h2>
                 
                 {data.balance > 0 ? (
                    <button 
                        onClick={() => setIsPayModalOpen(true)}
                        className="mt-6 w-full py-3.5 bg-zinc-900 text-white rounded-xl font-bold shadow-lg shadow-zinc-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <CreditCard size={18} />
                        Пардохти қарз (Online)
                    </button>
                 ) : (
                     <div className="mt-4 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 px-4 rounded-full w-fit mx-auto">
                         <CheckCircle2 size={16} />
                         <span className="text-sm font-bold">Қарз надоред!</span>
                     </div>
                 )}
             </div>
             {/* Decorative blob */}
             <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${data.balance > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
             <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${data.balance > 0 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
          </div>

          {/* Transactions List */}
          <div>
              <div className="flex items-center gap-2 mb-4 px-2">
                  <CreditCard size={18} className="text-zinc-400" />
                  <h3 className="font-bold text-zinc-900">Таърихи амалиётҳо</h3>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                  {data.transactions.length === 0 ? (
                      <div className="p-8 text-center text-zinc-400 text-sm">
                          Ҳанӯз ягон амалиёт нест
                      </div>
                  ) : (
                      <ul className="divide-y divide-zinc-100">
                          {data.transactions.map((trx) => (
                              <li key={trx.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                  <div className="flex items-start gap-3">
                                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                          trx.type === TransactionType.DEBT ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                      }`}>
                                          {trx.type === TransactionType.DEBT ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                      </div>
                                      <div>
                                          <p className="text-sm font-medium text-zinc-900">{trx.description || (trx.type === TransactionType.DEBT ? 'Қарз' : 'Пардохт')}</p>
                                          <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                                              <Calendar size={10} />
                                              {formatDate(trx.date)}
                                          </div>
                                      </div>
                                  </div>
                                  <span className={`font-bold text-sm ${
                                      trx.type === TransactionType.DEBT ? 'text-zinc-900' : 'text-green-600'
                                  }`}>
                                      {trx.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(trx.amount)}
                                  </span>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
          </div>

          <p className="text-center text-xs text-zinc-400 pt-6 pb-4">
              Daftar - Ҳисоби шаффоф, боварии дутарафа.
          </p>
      </main>

      {/* Payment Modal */}
      {isPayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                      <h3 className="font-bold text-zinc-900">Пардохти қарз</h3>
                      <button onClick={() => setIsPayModalOpen(false)} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-zinc-500 mb-4 text-center">Шумо метавонед қарзро пурра ё қисман пардохт кунед.</p>
                      
                      <div className="relative mb-6">
                           <input
                            type="number"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="w-full text-4xl font-bold text-center text-zinc-900 outline-none border-b-2 border-zinc-200 focus:border-zinc-900 pb-2 bg-transparent"
                            placeholder="0"
                            autoFocus
                           />
                           <span className="block text-center text-xs text-zinc-400 mt-2">сомонӣ</span>
                      </div>

                      <button 
                        onClick={handlePay}
                        disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                        className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {paying ? <Loader2 size={20} className="animate-spin" /> : 'Пардохт кардан'}
                      </button>
                      <div className="mt-4 flex items-center justify-center gap-1 text-xs text-zinc-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Бехатар бо SmartPay
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PublicDebtorApp;
