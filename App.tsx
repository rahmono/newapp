
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  ChevronRight, 
  MessageCircle, 
  PhoneCall, 
  History, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Store, 
  Loader2, 
  ShieldAlert, 
  Send, 
  FileText, 
  MessageCircleQuestion, 
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  UserCircle2,
  PieChart,
  Settings,
  Languages,
  Check,
  X,
  Info,
  Calendar,
  CreditCard,
  Zap,
  Gift,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { Debtor, Transaction, TransactionType, ViewState, TelegramUser, Store as StoreType, Collaborator, CollaboratorPermissions, WithdrawalRequest } from './types';
import { 
    getDebtors, 
    saveDebtor, 
    updateDebtorTransaction, 
    deleteDebtor, 
    deleteTransaction, 
    formatCurrency, 
    formatDate, 
    setTelegramId, 
    getStores, 
    createStore, 
    setStoreId, 
    syncUser, 
    getCollaborators, 
    addCollaborator, 
    removeCollaborator, 
    saveLastActiveStore, 
    updateDebtor, 
    saveLanguage, 
    submitVerificationRequest, 
    sendSmsReminder, 
    createSubscriptionInvoice,
    getStoreWallet,
    requestStoreWithdrawal
} from './services/storage';
import { translations, Language } from './utils/translations';
import TransactionModal from './components/TransactionModal';
import AddDebtorModal from './components/AddDebtorModal';
import EditDebtorModal from './components/EditDebtorModal';
import AddStoreModal from './components/AddStoreModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import VerificationView from './components/VerificationView';
import ConnectPhoneModal from './components/ConnectPhoneModal';

// --- SUB-COMPONENTS ---

const Header: React.FC<{ 
  view: ViewState; 
  title?: string; 
  onProfileClick?: () => void;
  currentUser?: string;
  telegramPhoto?: string;
  currentStoreName?: string;
  onEditDebtor?: () => void;
  onDeleteDebtor?: () => void;
  t: (key: string) => string;
}> = ({ view, title, onProfileClick, currentUser, telegramPhoto, currentStoreName, onEditDebtor, onDeleteDebtor, t }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200 h-16 px-4 flex items-center justify-between">
      {view === 'DASHBOARD' ? (
        <>
          <div className="flex items-center gap-2 max-w-[60%]">
             <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
               <span className="text-white font-bold text-lg">Д</span>
             </div>
             <div className="flex flex-col overflow-hidden">
               <h1 className="text-sm font-bold tracking-tight text-zinc-900 leading-none">{t('app_name')}</h1>
               <span className="text-[10px] text-zinc-500 truncate">{currentStoreName || t('loading')}</span>
             </div>
          </div>
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 bg-zinc-50 hover:bg-zinc-100 py-1.5 px-3 rounded-full transition-colors border border-zinc-100"
          >
            <span className="text-xs font-medium text-zinc-600 hidden sm:block max-w-[100px] truncate">{currentUser}</span>
            <div className="w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 overflow-hidden">
               {telegramPhoto ? (
                 <img src={telegramPhoto} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User size={16} />
               )}
            </div>
          </button>
        </>
      ) : view === 'PROFILE' ? (
        <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('profile_title')}</h1>
        </div>
      ) : view === 'ANALYTICS' ? (
        <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('analytics_title')}</h1>
        </div>
      ) : view === 'SETTINGS' ? (
        <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('settings')}</h1>
        </div>
      ) : view === 'VERIFICATION' ? (
         <div className="w-full flex items-center justify-center relative">
          <h1 className="text-sm font-semibold text-zinc-900">{t('verification_title')}</h1>
        </div>
      ) : view === 'TARIFFS' ? (
          <div className="w-full flex items-center justify-center relative">
              <h1 className="text-sm font-semibold text-zinc-900">{t('tariffs_title')}</h1>
          </div>
      ) : view === 'WALLET' ? (
          <div className="w-full flex items-center justify-center relative">
              <h1 className="text-sm font-semibold text-zinc-900">Ҳамён</h1>
          </div>
      ) : view === 'TERMS' ? (
          <div className="w-full flex items-center justify-center relative">
              <h1 className="text-sm font-semibold text-zinc-900">{t('terms_of_service')}</h1>
          </div>
      ) : view === 'STORES' ? (
          <div className="w-full flex items-center justify-center relative">
              <h1 className="text-sm font-semibold text-zinc-900">{t('my_stores')}</h1>
          </div>
      ) : view === 'COLLABORATORS' ? (
          <div className="w-full flex items-center justify-center relative">
              <h1 className="text-sm font-semibold text-zinc-900">{t('collaborators')}</h1>
          </div>
      ) : view === 'FAQ' ? (
          <div className="w-full flex items-center justify-center relative">
              <h1 className="text-sm font-semibold text-zinc-900">{t('faq_title')}</h1>
          </div>
      ) : (
        <>
          <h1 className="text-sm font-semibold text-zinc-900 truncate max-w-[200px]">{title}</h1>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && view === 'DEBTOR_DETAIL' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-10 bg-white shadow-xl rounded-xl z-50 py-1.5 border border-zinc-100 w-48 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <button 
                    onClick={() => { onEditDebtor?.(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex items-center gap-2 text-zinc-700"
                  >
                    <Edit2 size={16} />
                    {t('edit')}
                  </button>
                  <button 
                    onClick={() => { onDeleteDebtor?.(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 size={16} />
                    {t('delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
      <Search size={24} className="text-zinc-300" />
    </div>
    <p className="text-zinc-400 text-sm">{message}</p>
  </div>
);

const TransactionDetailsModal: React.FC<{
    transaction: Transaction | null;
    onClose: () => void;
    onDelete: (id: string) => void;
    showCreator: boolean;
    t: (key: string) => string;
}> = ({ transaction, onClose, onDelete, showCreator, t }) => {
    if (!transaction) return null;

    let balanceBefore = 0;
    if (transaction.balanceAfter !== undefined && transaction.balanceAfter !== null) {
        if (transaction.type === TransactionType.DEBT) {
            balanceBefore = Number(transaction.balanceAfter) - Number(transaction.amount);
        } else {
            balanceBefore = Number(transaction.balanceAfter) + Number(transaction.amount);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-zinc-50">
                    <h3 className="font-medium text-zinc-900">{t('transaction_detail_title')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                        transaction.type === TransactionType.DEBT ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                        {transaction.type === TransactionType.DEBT ? <ArrowUpRight size={32} /> : <ArrowDownLeft size={32} />}
                    </div>
                    <h2 className={`text-3xl font-bold mb-1 ${
                         transaction.type === TransactionType.DEBT ? 'text-red-600' : 'text-green-600'
                    }`}>
                         {transaction.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(transaction.amount)}
                    </h2>
                    <p className="text-sm text-zinc-500">{formatDate(transaction.date)}</p>
                    {transaction.description && <p className="text-sm text-zinc-800 font-medium mt-2">"{transaction.description}"</p>}
                </div>
                <div className="px-6 pb-6 space-y-4">
                    {showCreator && (
                        <div className="bg-zinc-50 p-3 rounded-xl flex items-center gap-3">
                             <div className="w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400">
                                <User size={20} />
                             </div>
                             <div>
                                <p className="text-xs text-zinc-400 uppercase font-semibold">{t('performed_by')}</p>
                                <p className="text-sm font-medium text-zinc-900">{transaction.createdBy}</p>
                             </div>
                        </div>
                    )}
                    {transaction.balanceAfter !== undefined && transaction.balanceAfter !== null ? (
                         <div className="space-y-2 border-t border-zinc-100 pt-4">
                             <p className="text-xs text-zinc-400 uppercase font-semibold text-center mb-2">{t('balance_change')}</p>
                             <div className="flex items-center justify-between text-sm">
                                 <span className="text-zinc-500">{t('prev_debt')}</span>
                                 <span className="font-medium">{formatCurrency(balanceBefore)}</span>
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                 <span className="text-zinc-500">{t('amount')}</span>
                                 <span className={transaction.type === TransactionType.DEBT ? 'text-red-600' : 'text-green-600'}>
                                     {transaction.type === TransactionType.DEBT ? '+' : '-'}{formatCurrency(transaction.amount)}
                                 </span>
                             </div>
                             <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-zinc-100">
                                 <span className="text-zinc-900">{t('new_debt')}</span>
                                 <span className={Number(transaction.balanceAfter) > 0 ? 'text-red-600' : 'text-zinc-500'}>
                                     {formatCurrency(Number(transaction.balanceAfter))}
                                 </span>
                             </div>
                         </div>
                    ) : (
                        <div className="text-center p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                            <Info size={14} className="inline mr-1 -mt-0.5" />
                            {t('old_data_info')}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-zinc-50 border-t border-zinc-100">
                    <button 
                        onClick={() => {
                            if (window.confirm(t('delete_transaction_confirm'))) {
                                onDelete(transaction.id);
                                onClose();
                            }
                        }}
                        className="w-full py-3 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                    >
                        <Trash2 size={16} />
                        {t('delete_transaction')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: Wallet View (To match existing design) ---
const WalletView: React.FC<{
    t: (key: string) => string;
}> = ({ t }) => {
    const [balance, setBalance] = useState(0);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    
    // Withdraw Form
    const [amount, setAmount] = useState('');
    const [card, setCard] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadWallet();
    }, []);

    const loadWallet = async () => {
        setIsLoading(true);
        const data = await getStoreWallet();
        setBalance(data.balance);
        setWithdrawals(data.withdrawals);
        setIsLoading(false);
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await requestStoreWithdrawal(parseFloat(amount), card, phone);
            alert("Дархост қабул шуд!");
            setShowWithdrawModal(false);
            setAmount('');
            setCard('');
            loadWallet(); // Refresh
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-10">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Баланси дастрас</p>
                    <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</h2>
                    <p className="text-xs text-zinc-500 mt-2">Маблағ аз пардохтҳои онлайн ҷамъ шудааст.</p>
                    
                    <button 
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={balance <= 0}
                        className="mt-6 bg-white text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <CreditCard size={16} />
                        Хуруҷи маблағ
                    </button>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10">
                    <Wallet size={120} />
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="font-bold text-zinc-900 text-sm">Таърихи дархостҳо</h3>
                </div>
                {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-sm">
                        Таърих холӣ аст.
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {withdrawals.map(w => (
                            <div key={w.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-zinc-900">{formatCurrency(w.amount)}</p>
                                    <p className="text-xs text-zinc-500">{new Date(w.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    w.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    w.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {w.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-zinc-900">Дархости хуруҷ</h3>
                            <button onClick={() => setShowWithdrawModal(false)}><X size={20} className="text-zinc-400" /></button>
                        </div>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Маблағ</label>
                                <input type="number" required max={balance} value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Рақами Корт (Корти миллӣ)</label>
                                <input type="text" required value={card} onChange={e => setCard(e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900" placeholder="5058..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Рақами телефон</label>
                                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900" placeholder="992..." />
                            </div>
                            <button disabled={submitting} type="submit" className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold mt-2">
                                {submitting ? '...' : 'Равон кардан'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsView: React.FC<{
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: (key: string) => string;
}> = ({ language, onLanguageChange, t }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
         <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
            <Languages size={16} className="text-zinc-500" />
            <h3 className="font-medium text-sm text-zinc-900">{t('language')}</h3>
         </div>
         <div className="p-4 space-y-3">
            <p className="text-sm text-zinc-500 mb-2">{t('select_language')}</p>
            <button 
              onClick={() => onLanguageChange('tg')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                language === 'tg' 
                ? 'bg-zinc-900 text-white border-zinc-900' 
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
               <span className="font-medium">Тоҷикӣ</span>
               {language === 'tg' && <Check size={16} />}
            </button>
            <button 
              onClick={() => onLanguageChange('ru')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                language === 'ru' 
                ? 'bg-zinc-900 text-white border-zinc-900' 
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
               <span className="font-medium">Русский</span>
               {language === 'ru' && <Check size={16} />}
            </button>
         </div>
      </div>
    </div>
  );
};

const TermsView: React.FC = () => {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-6 space-y-6 text-sm text-zinc-700 leading-relaxed">
                <h2 className="text-lg font-bold text-center text-zinc-900 mb-6 uppercase">
                    СОЗИШНОМАИ ИСТИФОДАБАРАНДА (ОФЕРТА)<br/>
                    <span className="text-xs font-normal text-zinc-500">Таҳрири №1 аз 27.01.2026</span>
                </h2>
                <section>
                    <h3 className="font-bold text-zinc-900 mb-2">1. МУҚАРРАРОТИ УМУМӢ</h3>
                    <p className="mb-2">1.1. Ин ҳуҷҷат шартномаи расмӣ байни Маъмурияти барномаи «Дафтар» (минбаъд – «Платформа») ва шахси воқеӣ ё ҳуқуқӣ (минбаъд – «Корбар») мебошад.</p>
                    <p className="mb-2">1.2. Бо гузоштани аломат (галочка) дар банди «Розиям», Корбар тамоми шартҳои ин созишномаро бечунучаро қабул мекунад.</p>
                    <p>1.3. Платформа хизматрасонии баҳисобгирии қарзҳо ва идоракунии муносибатҳои молиявиро пешниҳод мекунад.</p>
                </section>
                <section>
                    <h3 className="font-bold text-zinc-900 mb-2">2. УҲДАДОРИҲОИ КОРБАР (МАҒОЗАДОР)</h3>
                    <p className="mb-2">2.1. Корбар вазифадор аст, ки ҳангоми сабти ном маълумоти дуруст ва воқеӣ (аз ҷумла Рақами телефон, Ном, ИНН ва маълумоти Патент/Шаҳодатнома)-ро пешниҳод намояд.</p>
                    <p className="mb-2">2.2. Масъулияти маълумот: Корбар барои дурустии қарзҳои сабтшуда дар назди мизоҷони худ ҷавобгар аст. Платформа барои баҳсҳои молиявии байни Мағозадор ва Харидор масъулият надорад.</p>
                    <p>2.3. Корбар уҳдадор мешавад, ки аккаунти худро ба шахсони сеюм намедиҳад.</p>
                </section>
                <section>
                    <h3 className="font-bold text-zinc-900 mb-2">3. СИЁСАТИ ИРСОЛИ ПАЁМАКҲО (ANTI-SPAM)</h3>
                    <p className="mb-2">3.1. Платформа ба Корбар имконияти ирсоли SMS-огоҳиномаҳоро ба қарздорон фароҳам меорад.</p>
                    <p className="mb-2">3.2. Манъи қатъии спам: Истифодаи Платформа барои ирсоли паёмакҳои таҳқиромез, таҳдидомез, таблиғоти беиҷозат (спам) ё қаллобӣ қатъиян манъ аст.</p>
                    <p>3.3. Дар ҳолати шикоят аз ҷониби гирандагони SMS, Платформа ҳуқуқ дорад аккаунти Корбарро бидуни огоҳӣ маҳкам (блок) кунад ва маълумоти ӯро ба мақомоти ҳифзи ҳуқуқ пешниҳод намояд.</p>
                </section>
                <section>
                    <h3 className="font-bold text-zinc-900 mb-2">4. МАХФИЯТ ВА АМНИЯТ</h3>
                    <p className="mb-2">4.1. Платформа уҳдадор мешавад, ки маълумоти шахсии Корбар ва рӯйхати қарздорони ӯро ба шахсони сеюм фош накунад (ғайр аз ҳолатҳои пешбининамудаи қонунгузории ҶТ).</p>
                    <p>4.2. Боргузории ҳуҷҷатҳо (Патент/ИНН) танҳо барои тасдиқи шахсият (Верификатсия) истифода мешавад ва дастраси омма намегардад.</p>
                </section>
                <section>
                    <h3 className="font-bold text-zinc-900 mb-2">5. РАДДИ МАСЪУЛИЯТ</h3>
                    <p className="mb-2">5.1. «Дафтар» танҳо воситаи техникӣ (дафтар) аст. Мо кафолат намедиҳем, ки қарздор қарзи худро бармегардонад.</p>
                    <p>5.2. Платформа барои зарарҳои техникӣ ё қатъшавии муваққатии барнома ҷавобгар нест, гарчанде тамоми кӯшишро барои кори устувор ба харҷ медиҳад.</p>
                </section>
                <div className="pt-6 mt-4 border-t border-zinc-100 text-center text-xs text-zinc-400">
                    &copy; 2026 Дафтар. Ҳамаи ҳуқуқҳо ҳифз шудаанд.
                </div>
            </div>
        </div>
    );
};

const FaqView: React.FC<{ t: (key: string) => string }> = ({ t }) => {
  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
    { q: t('faq_q6'), a: t('faq_a6') },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {faqs.map((faq, idx) => (
        <div key={idx} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">?</div>
              <div>
                  <h3 className="font-bold text-zinc-900 mb-2 text-sm">{faq.q}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
          </div>
        </div>
      ))}
      <div className="text-center p-6 bg-blue-50/50 rounded-xl mt-6 border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-2">{t('contact_support_title')}</h3>
        <button 
            onClick={() => window.open('https://t.me/daftartj_support', '_blank')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <MessageCircle size={16} />
          {t('contact_support_btn')}
        </button>
      </div>
    </div>
  );
};

const TariffView: React.FC<{
    currentStore: StoreType | undefined;
    t: (key: string, params?: any) => string;
}> = ({ currentStore, t }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null); // 'STANDARD' | 'PRO' | null

    const handleSubscribe = async (plan: 'STANDARD' | 'PRO') => {
        setIsLoading(plan);
        try {
            const checkoutUrl = await createSubscriptionInvoice(plan);
            if (!checkoutUrl) {
                alert('Хатогӣ: Истиноди пардохт ёфт нашуд. Лутфан ба дастгирӣ муроҷиат кунед.');
                return;
            }
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(checkoutUrl);
            } else {
                window.location.href = checkoutUrl;
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(null);
        }
    };
    
    const PlanCard = ({ title, price, features, color, active, planType, showSubscribe }: { title: string, price: string, features: string[], color: string, active?: boolean, planType?: 'STANDARD' | 'PRO', showSubscribe?: boolean }) => (
        <div className={`rounded-xl border p-5 relative overflow-hidden transition-all ${
            active ? 'border-2 border-blue-500 bg-blue-50/20 shadow-md' : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}>
            {active && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                    Active
                </div>
            )}
            <h3 className={`font-bold text-lg mb-1 ${color}`}>{title}</h3>
            <p className="text-sm font-semibold text-zinc-900 mb-4">{price}</p>
            <ul className="space-y-2 mb-4">
                {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600">
                        <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            {showSubscribe && planType && (
                <button 
                    onClick={() => handleSubscribe(planType)}
                    disabled={isLoading !== null}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isLoading === planType 
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                >
                    {isLoading === planType ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    Пайваст шудан
                </button>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-10">
            
            {/* Current Status Header */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-sm font-medium text-zinc-400 uppercase mb-1">{t('current_plan')}</h2>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-yellow-400" fill="currentColor" size={24} />
                        <span className="text-2xl font-bold">
                            {currentStore?.isVerified 
                                ? t('tariff_plan', { plan: currentStore.subscriptionPlan || 'Standard' }) 
                                : t('plan_free')}
                        </span>
                    </div>

                    {currentStore?.isVerified && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs opacity-90">
                                <span>{t('sms_usage')}</span>
                                <span>{currentStore.smsUsed || 0} / {currentStore.smsLimit || 100}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-white h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(((currentStore.smsUsed || 0) / (currentStore.smsLimit || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-zinc-400 mt-2">
                                {t('tariff_end_date', { date: new Date(currentStore.subscriptionEndDate!).toLocaleDateString() })}
                            </p>
                        </div>
                    )}
                </div>
                {/* Decoration */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Verification Bonus - Only show if NOT verified */}
            {!currentStore?.isVerified && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                    <Gift className="text-indigo-600 mt-1 shrink-0" size={20} />
                    <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                        {t('verification_bonus')}
                    </p>
                </div>
            )}

            {/* Plans */}
            <div className="space-y-4">
                <h3 className="font-bold text-zinc-900 px-1">{t('tariffs_title')}</h3>
                
                <PlanCard 
                    title={t('plan_free')} 
                    price={t('price_free')} 
                    color="text-zinc-600"
                    features={[
                        t('feat_all_access'),
                        t('feat_no_sms')
                    ]}
                    active={!currentStore?.isVerified}
                />

                <PlanCard 
                    title={t('plan_standard')} 
                    price={t('price_standard')} 
                    color="text-blue-600"
                    features={[
                        t('feat_all_access'),
                        t('feat_sms_100'),
                        t('feat_limit_3_days')
                    ]}
                    active={currentStore?.isVerified && (currentStore?.subscriptionPlan === 'TRIAL' || currentStore?.subscriptionPlan === 'STANDARD')}
                    planType="STANDARD"
                    showSubscribe={currentStore?.isVerified && currentStore?.subscriptionPlan !== 'STANDARD'}
                />

                <PlanCard 
                    title={t('plan_pro')} 
                    price={t('price_pro')} 
                    color="text-purple-600"
                    features={[
                        t('feat_all_access'),
                        t('feat_sms_300'),
                        t('feat_limit_2_days')
                    ]}
                    active={currentStore?.subscriptionPlan === 'PRO'}
                    planType="PRO"
                    showSubscribe={currentStore?.isVerified && currentStore?.subscriptionPlan !== 'PRO'}
                />
            </div>

        </div>
    );
};

const StoresList: React.FC<{
  stores: StoreType[];
  currentStoreId: string;
  onSwitchStore: (id: string) => void;
  onCreateStore: () => void;
  t: (key: string) => string;
}> = ({ stores, currentStoreId, onSwitchStore, onCreateStore, t }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {stores.map(store => (
        <div 
          key={store.id}
          onClick={() => onSwitchStore(store.id)}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
            store.id === currentStoreId 
              ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' 
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold">{store.name}</h3>
                {store.isVerified && <Check size={14} className={store.id === currentStoreId ? 'text-green-400' : 'text-green-600'} />}
              </div>
              <p className={`text-xs ${store.id === currentStoreId ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {store.isOwner ? t('my_stores') : t('collaborator')}
              </p>
          </div>
          {store.id === currentStoreId && <div className="bg-white/20 p-1.5 rounded-full"><Check size={16} /></div>}
        </div>
      ))}
      <button 
        onClick={onCreateStore}
        className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-500 font-medium hover:border-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        {t('new_store')}
      </button>
    </div>
  );
};

const CollaboratorsList: React.FC<{
  collaborators: Collaborator[];
  onAddCollaborator: () => void;
  onRemoveCollaborator: (id: string) => void;
  t: (key: string) => string;
}> = ({ collaborators, onAddCollaborator, onRemoveCollaborator, t }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {collaborators.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-zinc-200">
          <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
             <Users size={20} className="text-zinc-300" />
          </div>
          <p className="text-zinc-400 text-sm">{t('no_collaborators')}</p>
        </div>
      ) : (
        collaborators.map(c => (
          <div key={c.userTelegramId} className="bg-white p-4 rounded-xl border border-zinc-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center overflow-hidden border border-zinc-100">
                {c.photoUrl ? <img src={c.photoUrl} className="w-full h-full object-cover" /> : <User size={18} className="text-zinc-400" />}
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-900">{c.firstName}</p>
                <p className="text-xs text-zinc-500">@{c.username || 'unknown'}</p>
              </div>
            </div>
            <button 
              onClick={() => onRemoveCollaborator(c.userTelegramId)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))
      )}
      <button 
        onClick={onAddCollaborator}
        className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-medium shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <Plus size={18} />
        {t('add_collaborator_title')}
      </button>
    </div>
  );
};

const UserProfile: React.FC<{
  currentUser: string;
  telegramUser: TelegramUser | null;
  phoneNumber: string | null;
  currentStore: StoreType | undefined;
  onViewAnalytics: () => void;
  onOpenSettings: () => void;
  onOpenTerms: () => void;
  onVerifyStore: () => void;
  onOpenStores: () => void;
  onOpenCollaborators: () => void;
  onOpenFaq: () => void;
  onOpenTariffs: () => void;
  onOpenWallet: () => void;
  t: (key: string) => string;
}> = ({ currentUser, telegramUser, phoneNumber, currentStore, onViewAnalytics, onOpenSettings, onOpenTerms, onVerifyStore, onOpenStores, onOpenCollaborators, onOpenFaq, onOpenTariffs, onOpenWallet, t }) => {
  return (
    <div className="space-y-6 pb-10">
      {/* User Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-center relative overflow-hidden">
        <div className="w-20 h-20 bg-zinc-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative z-10">
          {telegramUser?.photo_url ? (
            <img src={telegramUser.photo_url} className="w-full h-full object-cover" />
          ) : (
            <User size={32} className="text-zinc-300" />
          )}
        </div>
        <h2 className="text-xl font-bold text-zinc-900 relative z-10">{currentUser}</h2>
        <p className="text-zinc-500 text-sm mt-1 relative z-10 font-medium">{phoneNumber ? `+${phoneNumber}` : t('guest_mode')}</p>
        
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-zinc-50 to-white"></div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
        <button onClick={onOpenStores} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Store size={18} /></div>
            <span className="font-semibold text-sm text-zinc-700">{t('my_stores')}</span>
          </div>
          <ChevronRight size={18} className="text-zinc-300" />
        </button>
        
        {currentStore?.isOwner && (
            <button onClick={onOpenWallet} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Wallet size={18} /></div>
                    <span className="font-semibold text-sm text-zinc-700">Ҳамён (Wallet)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {currentStore?.walletBalance ? formatCurrency(currentStore.walletBalance) : '0 TJS'}
                    </span>
                    <ChevronRight size={18} className="text-zinc-300" />
                </div>
            </button>
        )}

        {currentStore?.isOwner && (
          <button onClick={onOpenCollaborators} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Users size={18} /></div>
              <span className="font-semibold text-sm text-zinc-700">{t('collaborators')}</span>
            </div>
            <ChevronRight size={18} className="text-zinc-300" />
          </button>
        )}

        <button onClick={onViewAnalytics} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><BarChart3 size={18} /></div>
            <span className="font-semibold text-sm text-zinc-700">{t('analytics_title')}</span>
          </div>
          <ChevronRight size={18} className="text-zinc-300" />
        </button>

        {currentStore?.isOwner && (
          <button onClick={onVerifyStore} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldAlert size={18} /></div>
              <span className="font-semibold text-sm text-zinc-700">{t('verify_store')}</span>
            </div>
            <div className="flex items-center gap-2">
                {currentStore?.isVerified ? (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">{t('verified')}</span>
                ) : (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{t('not_verified')}</span>
                )}
                <ChevronRight size={18} className="text-zinc-300" />
            </div>
          </button>
        )}
        
        {currentStore?.isOwner && (
             <button onClick={onOpenTariffs} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Zap size={18} /></div>
                    <span className="font-semibold text-sm text-zinc-700">{t('tariffs_title')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                        {currentStore?.subscriptionPlan || 'FREE'}
                    </span>
                    <ChevronRight size={18} className="text-zinc-300" />
                </div>
            </button>
        )}
      </div>
      
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
        <button onClick={onOpenSettings} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-50 text-zinc-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Settings size={18} /></div>
            <span className="font-semibold text-sm text-zinc-700">{t('settings')}</span>
          </div>
          <ChevronRight size={18} className="text-zinc-300" />
        </button>
        <button onClick={onOpenFaq} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-50 text-zinc-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><MessageCircleQuestion size={18} /></div>
            <span className="font-semibold text-sm text-zinc-700">{t('faq')}</span>
          </div>
          <ChevronRight size={18} className="text-zinc-300" />
        </button>
        <button onClick={onOpenTerms} className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-50 text-zinc-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={18} /></div>
            <span className="font-semibold text-sm text-zinc-700">{t('terms_of_service')}</span>
          </div>
          <ChevronRight size={18} className="text-zinc-300" />
        </button>
      </div>

      <p className="text-center text-xs text-zinc-400 pt-4">Version 2.0.0 (Enterprise)</p>
    </div>
  );
};

const AnalyticsDashboard: React.FC<{
  debtors: Debtor[];
  showCreator: boolean;
  t: (key: string) => string;
}> = ({ debtors, showCreator, t }) => {
    const totalDebts = debtors.reduce((sum, d) => sum + (d.balance > 0 ? d.balance : 0), 0);
    
    return (
        <div className="space-y-6 pb-10">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1 relative z-10">{t('total_debts')}</p>
                    <p className="text-xl font-bold text-red-600 relative z-10">{formatCurrency(totalDebts)}</p>
                    <div className="absolute right-0 bottom-0 w-12 h-12 bg-red-50 rounded-tl-xl z-0"></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1 relative z-10">{t('results') || 'Active Debtors'}</p>
                    <p className="text-xl font-bold text-zinc-900 relative z-10">{debtors.length}</p>
                    <div className="absolute right-0 bottom-0 w-12 h-12 bg-zinc-50 rounded-tl-xl z-0"></div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-50 pb-2">
                    <PieChart size={20} className="text-zinc-400" />
                    <h3 className="font-bold text-zinc-900 text-sm">{t('detailed_list')}</h3>
                </div>
                <div className="space-y-3">
                    {debtors
                        .filter(d => d.balance > 0)
                        .sort((a, b) => b.balance - a.balance)
                        .slice(0, 5)
                        .map((d, i) => (
                        <div key={d.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    i === 1 ? 'bg-zinc-100 text-zinc-700' :
                                    i === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-zinc-50 text-zinc-500'
                                }`}>{i + 1}</span>
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-700">{d.name}</span>
                                    {showCreator && <span className="text-[10px] text-zinc-400">{d.createdBy}</span>}
                                </div>
                            </div>
                            <span className="font-bold text-zinc-900">{formatCurrency(d.balance)}</span>
                        </div>
                    ))}
                    {debtors.filter(d => d.balance > 0).length === 0 && (
                        <p className="text-center text-zinc-400 text-sm py-4">{t('no_transactions')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Current User Simulation & Telegram Logic
  const [currentUser, setCurrentUser] = useState('Соҳибкор (Меҳмон)');
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isTelegramSession, setIsTelegramSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Phone Number Logic
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isConnectPhoneOpen, setIsConnectPhoneOpen] = useState(false);
  const [forcePhoneConnect, setForcePhoneConnect] = useState(false);
  
  // Language State
  const [language, setLanguage] = useState<Language>('tg');

  // Store Logic
  const [stores, setStores] = useState<StoreType[]>([]);
  const [currentStoreId, setCurrentStoreIdState] = useState<string>('');
  
  // Collaborators List
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  
  // Selected Transaction for Detail Modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>(TransactionType.DEBT);

  // Reminder Modal State
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Computed Values
  const currentStore = useMemo(() => stores.find(s => s.id === currentStoreId), [stores, currentStoreId]);

  const showCreatorInfo = useMemo(() => {
    if (!currentStore) return false;
    if (!currentStore.isOwner) return true; // Shared store
    return collaborators.length > 0; // Owned store, depends on collaborators
  }, [currentStore, collaborators]);

  // Modal States
  const [isAddDebtorOpen, setIsAddDebtorOpen] = useState(false);
  const [isEditDebtorOpen, setIsEditDebtorOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isAddCollabOpen, setIsAddCollabOpen] = useState(false);
  
  // Translation Helper
  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[language][key] || key;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
    }
    return text;
  };

  const syncUserData = async (user: TelegramUser) => {
    const syncResult = await syncUser(user);
    
    if (syncResult.requirePhone) {
        setForcePhoneConnect(true);
        setLoading(false);
        return null;
    } else {
        setForcePhoneConnect(false);
    }
    
    if (syncResult.language) {
        setLanguage(syncResult.language);
    }
    
    setPhoneNumber(syncResult.phoneNumber);
    if (!syncResult.phoneNumber) {
        setIsConnectPhoneOpen(true);
    } else {
        setIsConnectPhoneOpen(false);
    }
    
    return syncResult.lastActiveStoreId;
  };

  // Initialize Telegram WebApp
  useEffect(() => {
    const startApp = async () => {
        let lastStoreId: string | null = null;

        if (window.Telegram?.WebApp?.initData) {
          const tg = window.Telegram.WebApp;
          setIsTelegramSession(true);
          setIsAuthenticated(true);

          tg.ready();
          tg.expand();
          try { tg.setHeaderColor('#ffffff'); } catch (e) {}

          if (tg.initDataUnsafe?.user) {
            const user = tg.initDataUnsafe.user;
            setTelegramUser(user);
            setTelegramId(user.id.toString());
            lastStoreId = await syncUserData(user);
            
            const displayName = user.first_name + (user.last_name ? ` ${user.last_name[0]}.` : '');
            setCurrentUser(displayName);
          }
        } 
        else {
             window.location.href = 'https://daftarapp.tj/';
             return;
        }

        if ((window.Telegram?.WebApp?.initData) && lastStoreId !== null) { 
             await initApp(lastStoreId);
        } else {
            setLoading(false);
        }
    };

    startApp();
  }, []);

  // Handle Telegram Back Button
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleBack = () => {
        if (view !== 'DASHBOARD' && view !== 'PROFILE') {
            setView('PROFILE');
        } else if (view === 'PROFILE') {
            setView('DASHBOARD');
        } else {
            // Already at dashboard
        }
    };

    if (view !== 'DASHBOARD') {
        tg.BackButton.show();
        tg.BackButton.onClick(handleBack);
    } else {
        tg.BackButton.hide();
    }

    return () => {
        tg.BackButton.offClick(handleBack);
    };
  }, [view]);

  const initApp = async (preferredStoreId: string | null) => {
      setLoading(true);
      const loadedStores = await getStores();
      setStores(loadedStores);

      if (loadedStores.length > 0) {
          let targetStoreId = loadedStores[0].id;
          if (preferredStoreId && loadedStores.some(s => s.id === preferredStoreId)) {
              targetStoreId = preferredStoreId;
          }
          handleSwitchStore(targetStoreId, false);
      } else {
          setLoading(false);
      }
  };

  const handleSwitchStore = async (storeId: string, shouldSave = true) => {
      setCurrentStoreIdState(storeId);
      setStoreId(storeId);
      
      if (shouldSave) {
          saveLastActiveStore(storeId);
      }
      
      const selectedStore = stores.find(s => s.id === storeId);
      if (selectedStore?.isOwner) {
          try {
             const collabs = await getCollaborators(storeId);
             setCollaborators(collabs);
          } catch (e) {
             console.error("Failed to fetch collaborators", e);
             setCollaborators([]);
          }
      } else {
          setCollaborators([]); 
      }

      setLoading(true);
      const data = await getDebtors();
      setDebtors(data);
      setLoading(false);
  };

  const handleCreateStore = async (name: string) => {
      const newStore = await createStore(name);
      if (newStore) {
          setStores(prev => [...prev, newStore]);
          handleSwitchStore(newStore.id);
          setView('STORES'); 
      }
  };

  const handleAddCollaborator = async (userId: string, permissions: CollaboratorPermissions) => {
    await addCollaborator(currentStoreId, userId, permissions);
    const collabs = await getCollaborators(currentStoreId);
    setCollaborators(collabs);
  };

  const handleRemoveCollaborator = async (userId: string) => {
     await removeCollaborator(currentStoreId, userId);
     setCollaborators(prev => prev.filter(c => c.userTelegramId !== userId));
  };

  const handleVerificationSubmit = async (docType: string, imageBase64: string, customStoreName: string) => {
     await submitVerificationRequest(currentStoreId, docType, imageBase64, customStoreName);
     const updatedStores = await getStores();
     setStores(updatedStores);
  };

  const fetchData = async () => {
    setLoading(true);
    const data = await getDebtors();
    setDebtors(data);
    setLoading(false);
  };

  const currentStoreName = currentStore?.name;
  const totalReceivable = useMemo(() => debtors.reduce((sum, d) => sum + (d.balance > 0 ? Number(d.balance) : 0), 0), [debtors]);

  const filteredDebtors = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return debtors.filter(d => 
      d.name.toLowerCase().includes(lowerSearch) || 
      d.phone.includes(lowerSearch)
    );
  }, [debtors, searchTerm]);

  const selectedDebtor = useMemo(() => 
    debtors.find(d => d.id === selectedDebtorId), 
  [debtors, selectedDebtorId]);

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await saveLanguage(lang);
  };

  const handleCheckPhoneAgain = async () => {
      if (telegramUser) {
          const storeId = await syncUserData(telegramUser);
          if (storeId !== null) {
              setLoading(true);
              await initApp(storeId);
          } else {
              alert("Лутфан аввал рақамро тасдиқ кунед!");
          }
      }
  };

  const handleAddDebtor = async (name: string, phone: string) => {
    let creatorName = currentUser;
    if (telegramUser) {
        const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ');
        if (telegramUser.username) {
            creatorName = `${fullName} (@${telegramUser.username})`;
        } else {
            creatorName = fullName;
        }
    }

    const newDebtor: Debtor = {
      id: Date.now().toString(),
      name,
      phone,
      balance: 0,
      lastActivity: new Date().toISOString(),
      transactions: [],
      createdBy: creatorName
    };
    await saveDebtor(newDebtor);
    await fetchData(); 
  };

  const handleEditDebtor = async (name: string, phone: string) => {
      if (!selectedDebtorId) return;
      await updateDebtor(selectedDebtorId, name, phone);
      await fetchData();
  };

  const handleAddTransaction = async (amount: number, type: TransactionType, description: string) => {
    if (!selectedDebtorId) return;

    if (currentStore && !currentStore.isOwner) {
        if (type === TransactionType.DEBT && !currentStore.permissions?.canAddDebt) {
            alert('Шумо ҳуқуқи иловаи қарзро надоред.');
            return;
        }
        if (type === TransactionType.PAYMENT && !currentStore.permissions?.canAddPayment) {
            alert('Шумо ҳуқуқи иловаи пардохтро надоред.');
            return;
        }
    }

    let creatorName = currentUser;
    if (telegramUser) {
        const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ');
        if (telegramUser.username) {
            creatorName = `${fullName} (@${telegramUser.username})`;
        } else {
            creatorName = fullName;
        }
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount,
      type,
      description,
      date: new Date().toISOString(),
      createdBy: creatorName
    };

    await updateDebtorTransaction(selectedDebtorId, newTransaction);
    await fetchData(); 
  };

  const handleDeleteDebtor = async () => {
    if (!selectedDebtorId) return;

    if (currentStore && !currentStore.isOwner && !currentStore.permissions?.canDeleteDebtor) {
        alert('Шумо ҳуқуқи нест кардани мизоҷро надоред.');
        return;
    }

    if (window.confirm("Шумо мутмаин ҳастед, ки мехоҳед ин мизоҷро пурра нест кунед? Ин амал барқарорнашаванда аст.")) {
      await deleteDebtor(selectedDebtorId);
      await fetchData();
      setView('DASHBOARD');
      setSelectedDebtorId(null);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (currentStore && !currentStore.isOwner && !currentStore.permissions?.canDeleteDebtor) { 
        alert('Шумо ҳуқуқи нест кардани амалиётҳоро надоред.');
        return;
    }
    await deleteTransaction(transactionId);
    await fetchData();
    setSelectedTransaction(null);
  };

  const navigateToDetail = (id: string) => {
    setSelectedDebtorId(id);
    setView('DEBTOR_DETAIL');
    window.scrollTo(0, 0);
  };

  const sendReminder = () => {
    setIsReminderOpen(true);
  };

  const confirmSendSms = async () => {
      if (!selectedDebtorId) return;
      setIsSendingSms(true);
      try {
          await sendSmsReminder(selectedDebtorId);
          alert(t('sms_sent_success'));
          setIsReminderOpen(false);
      } catch (e: any) {
          alert(`Error: ${e.message}`);
      } finally {
          setIsSendingSms(false);
      }
  };

  if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      );
  }

  if (forcePhoneConnect) {
      return (
          <div className="min-h-screen bg-zinc-50">
              <ConnectPhoneModal 
                  isOpen={true} 
                  botUsername="daftartjbot" 
                  onCheckAgain={handleCheckPhoneAgain}
                  t={t}
              />
          </div>
      );
  }

  if (loading && view === 'DASHBOARD' && debtors.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
        <p className="text-zinc-400 text-sm">{t('loading_store')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Header 
        view={view} 
        title={selectedDebtor?.name}
        onProfileClick={() => setView('PROFILE')}
        currentUser={currentUser}
        telegramPhoto={telegramUser?.photo_url}
        currentStoreName={currentStoreName}
        onEditDebtor={() => setIsEditDebtorOpen(true)}
        onDeleteDebtor={handleDeleteDebtor}
        t={t}
      />

      {/* DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
        <main className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in duration-300">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200/60">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">{t('total_amount')}</p>
            <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">{formatCurrency(totalReceivable)}</h2>
          </section>

          <section className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-3 top-3.5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden min-h-[300px]">
              {filteredDebtors.length === 0 ? (
                 <EmptyState message={searchTerm ? t('nothing_found') : t('list_empty')} />
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {filteredDebtors.map(debtor => (
                    <li 
                      key={debtor.id} 
                      onClick={() => navigateToDetail(debtor.id)}
                      className="p-4 hover:bg-zinc-50 active:bg-zinc-100 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">{debtor.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <History size={12} className="text-zinc-400" />
                          <span className="text-xs text-zinc-400">{formatDate(debtor.lastActivity)}</span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className={`font-semibold ${debtor.balance > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                          {formatCurrency(debtor.balance)}
                        </span>
                        <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <button 
            onClick={() => setIsAddDebtorOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-lg shadow-zinc-900/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </main>
      )}

      {/* USER PROFILE VIEW */}
      {view === 'PROFILE' && (
        <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
           <UserProfile 
              currentUser={currentUser}
              telegramUser={telegramUser} 
              phoneNumber={phoneNumber}
              currentStore={currentStore}
              onViewAnalytics={() => setView('ANALYTICS')}
              onOpenSettings={() => setView('SETTINGS')}
              onOpenTerms={() => setView('TERMS')}
              onVerifyStore={() => setView('VERIFICATION')}
              onOpenStores={() => setView('STORES')}
              onOpenCollaborators={() => setView('COLLABORATORS')}
              onOpenFaq={() => setView('FAQ')}
              onOpenTariffs={() => setView('TARIFFS')}
              onOpenWallet={() => setView('WALLET')}
              t={t}
           />
        </main>
      )}

      {view === 'STORES' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <StoresList 
                stores={stores}
                currentStoreId={currentStoreId}
                onSwitchStore={handleSwitchStore}
                onCreateStore={() => setIsAddStoreOpen(true)}
                t={t}
              />
          </main>
      )}

      {view === 'COLLABORATORS' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <CollaboratorsList 
                collaborators={collaborators}
                onAddCollaborator={() => setIsAddCollabOpen(true)}
                onRemoveCollaborator={handleRemoveCollaborator}
                t={t}
              />
          </main>
      )}

      {view === 'SETTINGS' && (
         <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
            <SettingsView language={language} onLanguageChange={handleLanguageChange} t={t} />
         </main>
      )}
      
      {view === 'TERMS' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <TermsView />
          </main>
      )}

      {view === 'FAQ' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <FaqView t={t} />
          </main>
      )}

      {view === 'TARIFFS' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <TariffView currentStore={currentStore} t={t} />
          </main>
      )}

      {view === 'WALLET' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <WalletView t={t} />
          </main>
      )}

      {view === 'ANALYTICS' && (
          <main className="max-w-md mx-auto p-4 animate-in slide-in-from-right duration-300">
              <AnalyticsDashboard debtors={debtors} showCreator={showCreatorInfo} t={t} />
          </main>
      )}

      {view === 'VERIFICATION' && (
         <main className="max-w-md mx-auto p-0 animate-in slide-in-from-right duration-300">
             <VerificationView 
                onSubmit={handleVerificationSubmit}
                initialStoreName={currentStoreName || ''}
                t={t}
                onBack={() => setView('PROFILE')}
                currentStatus={currentStore?.verificationStatus || 'NONE'}
             />
         </main>
      )}

      {view === 'DEBTOR_DETAIL' && selectedDebtor && (
        <main className="max-w-md mx-auto p-4 space-y-6 animate-in slide-in-from-right duration-300 pb-24">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-zinc-100 rounded-full mx-auto flex items-center justify-center mb-4 text-zinc-300">
              <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{selectedDebtor.name}</h2>
            <p className="text-zinc-500 text-sm mb-6">{selectedDebtor.phone}</p>
            
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <p className="text-xs text-zinc-400 uppercase mb-1">{t('current_debt')}</p>
              <p className={`text-2xl font-bold ${selectedDebtor.balance > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                {formatCurrency(selectedDebtor.balance)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
               <button 
                onClick={sendReminder}
                className="flex flex-1 items-center justify-center gap-2 py-2.5 px-4 bg-white border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 active:scale-95 transition-all"
              >
                 <MessageCircle size={16} />
                 {t('reminder')}
               </button>
               <button 
                 onClick={() => window.open(`tel:${selectedDebtor.phone}`)}
                 className="flex items-center justify-center w-12 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 active:scale-95 transition-all"
               >
                 <PhoneCall size={18} />
               </button>
            </div>

            {showCreatorInfo && (
                <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-center gap-2 text-zinc-400">
                    <span className="text-[10px] uppercase tracking-wider">{t('created_by')}</span>
                    <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
                        <UserCircle2 size={12} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600">{selectedDebtor.createdBy}</span>
                    </div>
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={() => {
                   setTransactionModalType(TransactionType.DEBT);
                   setIsTransactionOpen(true);
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1"
             >
                <ArrowUpRight size={24} />
                {t('i_gave_debt')}
             </button>
             
             <button 
                onClick={() => {
                    setTransactionModalType(TransactionType.PAYMENT);
                    setIsTransactionOpen(true);
                }}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md shadow-green-600/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1"
             >
                <ArrowDownLeft size={24} />
                {t('i_received_money')}
             </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
              <Calendar size={16} className="text-zinc-400" />
              <h3 className="font-medium text-sm text-zinc-900">{t('transaction_history')}</h3>
            </div>
            
            {(selectedDebtor.transactions || []).length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                {t('no_transactions')}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {(selectedDebtor.transactions || []).map((trx) => (
                  <li 
                      key={trx.id} 
                      onClick={() => setSelectedTransaction(trx)}
                      className="p-4 flex items-center justify-between group cursor-pointer hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            trx.type === TransactionType.DEBT 
                              ? 'bg-red-50 text-red-700' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {trx.type === TransactionType.DEBT ? t('debt') : t('payment')}
                          </span>
                          <span className="text-xs text-zinc-400">{formatDate(trx.date)}</span>
                      </div>
                      {trx.description && (
                        <p className="text-sm text-zinc-600 mb-1">{trx.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${
                        trx.type === TransactionType.DEBT ? 'text-zinc-900' : 'text-green-600'
                      }`}>
                        {trx.type === TransactionType.PAYMENT ? '+' : ''}{formatCurrency(trx.amount)}
                      </span>
                      <ChevronRight size={16} className="text-zinc-300" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
        </main>
      )}

      {isReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsReminderOpen(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm text-center animate-in fade-in zoom-in duration-200 shadow-xl border border-zinc-100" onClick={(e) => e.stopPropagation()}>
                 {currentStore?.isVerified ? (
                     <>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <Send size={24} />
                        </div>
                        <h3 className="font-bold text-zinc-900 mb-2">{t('sms_reminder_title')}</h3>
                        <p className="text-zinc-500 font-medium mb-6 text-sm leading-relaxed">{t('sms_send_confirm')}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsReminderOpen(false)} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-colors">
                                {t('back')}
                            </button>
                            <button 
                                onClick={confirmSendSms} 
                                disabled={isSendingSms}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isSendingSms && <Loader2 size={16} className="animate-spin" />}
                                {t('send_sms_btn')}
                            </button>
                        </div>
                     </>
                 ) : (
                     <>
                        <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="font-bold text-zinc-900 mb-2">{t('sms_verification_required_title')}</h3>
                        <p className="text-zinc-500 font-medium mb-6 text-sm leading-relaxed">{t('sms_verification_required_desc')}</p>
                        <button 
                            onClick={() => {
                                setIsReminderOpen(false);
                                setView('VERIFICATION');
                            }} 
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium transition-colors"
                        >
                            {t('go_to_verify')}
                        </button>
                     </>
                 )}
            </div>
        </div>
      )}

      {/* MODALS */}
      <AddDebtorModal 
        isOpen={isAddDebtorOpen}
        onClose={() => setIsAddDebtorOpen(false)}
        onSubmit={handleAddDebtor}
      />

      <EditDebtorModal 
        isOpen={isEditDebtorOpen}
        onClose={() => setIsEditDebtorOpen(false)}
        onSubmit={handleEditDebtor}
        initialName={selectedDebtor?.name || ''}
        initialPhone={selectedDebtor?.phone || ''}
      />
      
      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSubmit={handleAddTransaction}
        debtorName={selectedDebtor?.name || ''}
        initialType={transactionModalType}
      />

      <AddStoreModal
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        onSubmit={handleCreateStore}
      />

      <AddCollaboratorModal
        isOpen={isAddCollabOpen}
        onClose={() => setIsAddCollabOpen(false)}
        onSubmit={handleAddCollaborator}
      />

      <TransactionDetailsModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)}
          onDelete={handleDeleteTransaction}
          showCreator={showCreatorInfo}
          t={t}
      />
      
      <ConnectPhoneModal 
          isOpen={isConnectPhoneOpen}
          botUsername="daftartjbot"
          onCheckAgain={handleCheckPhoneAgain}
          t={t}
      />

    </div>
  );
}

export default App;
