import React, { useEffect, useState } from 'react';
import { Loader2, Store, User, Calendar, CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate, getPublicDebtor } from './services/storage';
import { Transaction, TransactionType } from './types';

const PublicDebtorApp: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ id: string, name: string, balance: number, storeName: string, transactions: Transaction[] } | null>(null);
  const [error, setError] = useState(false);

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
      } else {
          setError(true);
      }
      setLoading(false);
    };

    fetchDebtor();
  }, []);

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
                 {data.balance <= 0 && (
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
    </div>
  );
};

export default PublicDebtorApp;