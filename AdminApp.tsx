

import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle, XCircle, Eye, User, Store, Calendar, LogOut, Users, Search, ChevronLeft, ChevronRight, Menu, ArrowRight, ArrowLeft, History, Phone, CreditCard, BarChart, ShieldAlert, Monitor, RefreshCw, Trash2 } from 'lucide-react';
import { VerificationRequest, AdminUser, Store as StoreType, Debtor, OtpLog } from './types';
import { formatCurrency, formatDate } from './services/storage'; // Reusing existing helper

// API endpoints helper
const API_URL = '/api';

const AdminApp: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'verifications' | 'users' | 'ratelimits'>('verifications');
  const [loading, setLoading] = useState(false);

  // Verifications State
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  // Rate Limits State
  const [otpLogs, setOtpLogs] = useState<OtpLog[]>([]);

  // Drill-down State (Users -> Stores -> Debtors)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userStores, setUserStores] = useState<(StoreType & { debtors_count: number })[]>([]);
  
  const [selectedStore, setSelectedStore] = useState<(StoreType & { debtors_count: number }) | null>(null);
  const [storeDebtors, setStoreDebtors] = useState<Debtor[]>([]);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- Login Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server error');
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
    setSelectedUser(null);
    setSelectedStore(null);
    setSelectedRequest(null);
  };

  // --- Fetch Logic ---
  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/verifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setRequests(data);
      // If a request is currently selected, update it with fresh data
      if (selectedRequest) {
          const updated = data.find((r: VerificationRequest) => r.id === selectedRequest.id);
          if (updated) setSelectedRequest(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
        const query = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            q: userSearch
        });
        const res = await fetch(`${API_URL}/admin/users?${query}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
            logout();
            return;
        }
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const fetchUserStores = async (telegramId: string) => {
    if (!token) return;
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/admin/users/${telegramId}/stores`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUserStores(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const fetchStoreDebtors = async (storeId: string) => {
    if (!token) return;
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/admin/stores/${storeId}/debtors`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStoreDebtors(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const fetchOtpLogs = async () => {
      if (!token) return;
      setLoading(true);
      try {
          const res = await fetch(`${API_URL}/admin/otp-logs`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setOtpLogs(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- Effects ---
  useEffect(() => {
    if (token) {
        if (activeTab === 'verifications') fetchRequests();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'ratelimits') fetchOtpLogs();
    }
  }, [token, activeTab, page]); // Reload when tab or page changes

  // Debounced User Search
  useEffect(() => {
      const timer = setTimeout(() => {
          if (activeTab === 'users' && token && !selectedUser) {
              setPage(1); // Reset to page 1 on search
              fetchUsers();
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [userSearch]);

  // When selected User changes
  useEffect(() => {
      if (selectedUser) {
          fetchUserStores(selectedUser.telegram_id);
          setSelectedStore(null); // Reset deep state
      }
  }, [selectedUser]);

  // When selected Store changes
  useEffect(() => {
      if (selectedStore) {
          fetchStoreDebtors(selectedStore.id);
      }
  }, [selectedStore]);


  // --- Actions ---
  const updateStatus = async (id: number, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!confirm(`Are you sure you want to change status to ${status}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/admin/verifications/${id}/status`, {
        method: 'PUT',
        headers: { 
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests(); // Refresh list and update selectedRequest automatically via effect
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const resetLimit = async (type: 'phone' | 'ip', value: string) => {
      if (!confirm(`Are you sure you want to RESET limits for this ${type}: ${value}? This will clear all recent logs.`)) return;

      try {
          const res = await fetch(`${API_URL}/admin/otp-logs/reset`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ type, value })
          });
          if (res.ok) {
              alert('Limit reset successfully');
              fetchOtpLogs();
          } else {
              alert('Failed to reset limit');
          }
      } catch (e) {
          alert('Server error');
      }
  };

  // --- Login View ---
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-zinc-100">
          <div className="flex justify-center mb-6 text-zinc-900">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center">
                <Shield size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-zinc-900 mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
              <input 
                type="text" 
                className="w-full p-3 border border-zinc-300 rounded-lg outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
              <input 
                type="password" 
                className="w-full p-3 border border-zinc-300 rounded-lg outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button className="w-full bg-zinc-900 text-white py-3 rounded-lg font-bold hover:bg-zinc-800 transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Admin Layout ---
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
         <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
             <Shield className="text-blue-600" />
             <span className="font-bold text-xl text-zinc-900">Daftar Admin</span>
         </div>
         <nav className="p-4 space-y-2">
             <button 
                onClick={() => { setActiveTab('verifications'); setSelectedUser(null); setSelectedRequest(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'verifications' 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
             >
                 <CheckCircle size={18} />
                 Requests
             </button>
             <button 
                onClick={() => { setActiveTab('users'); setSelectedUser(null); setSelectedRequest(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'users' 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
             >
                 <Users size={18} />
                 Users
             </button>
             <button 
                onClick={() => { setActiveTab('ratelimits'); setSelectedUser(null); setSelectedRequest(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'ratelimits' 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
             >
                 <ShieldAlert size={18} />
                 Rate Limits
             </button>
         </nav>
         <div className="p-4 mt-auto border-t border-zinc-100">
             <button onClick={logout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 w-full hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={16} /> Logout
             </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto h-screen">
        
        {/* === VERIFICATIONS VIEW === */}
        {activeTab === 'verifications' && (
            <div className="max-w-5xl mx-auto">
                {!selectedRequest ? (
                    // LIST VIEW
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-zinc-800">Verification Requests</h1>
                            <button onClick={fetchRequests} className="text-sm text-blue-600 hover:underline">Refresh</button>
                        </div>

                        {loading && requests.length === 0 ? (
                            <div className="text-center py-10 text-zinc-400">Loading...</div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-zinc-200 text-zinc-400">
                                No verification requests found.
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {requests.map(req => (
                                    <div 
                                        key={req.id} 
                                        onClick={() => setSelectedRequest(req)}
                                        className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col md:flex-row cursor-pointer hover:shadow-md transition-shadow group"
                                    >
                                        <div className="w-full md:w-32 h-32 bg-zinc-100 flex items-center justify-center relative">
                                            <img src={req.image_base64} className="w-full h-full object-cover" alt="Document" />
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-zinc-900 group-hover:text-blue-600 transition-colors">
                                                    {req.custom_store_name}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-500 mb-2">{req.owner_name} • {req.document_type}</p>
                                            <p className="text-xs text-zinc-400 mt-auto">{new Date(req.created_at).toLocaleString()}</p>
                                        </div>
                                        
                                        <div className="p-4 flex items-center justify-center border-l border-zinc-100">
                                            <ChevronRight className="text-zinc-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    // DETAIL VIEW
                    <div className="animate-in slide-in-from-right duration-300">
                        <button 
                            onClick={() => setSelectedRequest(null)}
                            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 font-medium text-sm transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to List
                        </button>

                        <div className="flex flex-col lg:flex-row gap-8">
                            
                            {/* Left Column: Image & Basic Info */}
                            <div className="flex-1 space-y-6">
                                {/* Image Viewer */}
                                <div 
                                    className="bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 relative group cursor-pointer"
                                    onClick={() => setViewingImage(selectedRequest.image_base64)}
                                >
                                    <img src={selectedRequest.image_base64} className="w-full object-contain max-h-[500px]" alt="Document" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                            <Eye size={16} /> View Fullscreen
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Status Actions - ALWAYS VISIBLE */}
                                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Manage Status</h3>
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => updateStatus(selectedRequest.id, 'APPROVED')}
                                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                                                selectedRequest.status === 'APPROVED' 
                                                ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2' 
                                                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                                            }`}
                                        >
                                            <CheckCircle size={18} /> 
                                            {selectedRequest.status === 'APPROVED' ? 'Current: APPROVED' : 'Set to APPROVED'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => updateStatus(selectedRequest.id, 'REJECTED')}
                                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                                                selectedRequest.status === 'REJECTED' 
                                                ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2' 
                                                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                            }`}
                                        >
                                            <XCircle size={18} />
                                            {selectedRequest.status === 'REJECTED' ? 'Current: REJECTED' : 'Set to REJECTED'}
                                        </button>

                                        <button 
                                            onClick={() => updateStatus(selectedRequest.id, 'PENDING')}
                                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                                                selectedRequest.status === 'PENDING' 
                                                ? 'bg-yellow-500 text-white ring-2 ring-yellow-500 ring-offset-2' 
                                                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200'
                                            }`}
                                        >
                                            <History size={18} />
                                            {selectedRequest.status === 'PENDING' ? 'Current: PENDING' : 'Set to PENDING'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-4 text-center">
                                        Note: Changing status to APPROVED will verify the store. Changing to other statuses will un-verify the store.
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Detailed Info */}
                            <div className="w-full lg:w-96 space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                    <h2 className="text-xl font-bold text-zinc-900 mb-1">{selectedRequest.custom_store_name}</h2>
                                    <p className="text-zinc-500 text-sm mb-6">Store ID: {selectedRequest.store_id}</p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Owner Name</label>
                                            <div className="flex items-center gap-2 text-zinc-900 font-medium">
                                                <User size={18} className="text-zinc-400" />
                                                {selectedRequest.owner_name}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Phone Number</label>
                                            <div className="flex items-center gap-2 text-zinc-900 font-medium">
                                                <Phone size={18} className="text-zinc-400" />
                                                {selectedRequest.owner_phone ? `+${selectedRequest.owner_phone}` : 'Not provided'}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Telegram Username</label>
                                            <div className="text-blue-600 font-medium">
                                                {selectedRequest.owner_username ? `@${selectedRequest.owner_username}` : 'N/A'}
                                            </div>
                                        </div>

                                        <hr className="border-zinc-100 my-4" />
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                                <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Debtors</label>
                                                <div className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                                                    <Users size={20} className="text-blue-500" />
                                                    {selectedRequest.debtors_count || 0}
                                                </div>
                                            </div>
                                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                                <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Transactions</label>
                                                <div className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                                                    <CreditCard size={20} className="text-green-500" />
                                                    {selectedRequest.transaction_count || 0}
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-zinc-100 my-4" />

                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Document Type</label>
                                            <div className="text-zinc-900 font-medium capitalize">
                                                {selectedRequest.document_type}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Submission Date</label>
                                            <div className="text-zinc-900 font-medium">
                                                {new Date(selectedRequest.created_at).toLocaleString()}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        )}

        {/* === USERS VIEW === */}
        {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto">
                
                {/* 1. Main User List (Level 0) */}
                {!selectedUser && (
                    <>
                        <h1 className="text-2xl font-bold text-zinc-800 mb-6">User Management</h1>
                        
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 mb-6 flex items-center gap-3 shadow-sm">
                            <Search className="text-zinc-400" />
                            <input 
                                type="text" 
                                placeholder="Search users by name, username or phone..." 
                                className="flex-1 outline-none text-sm text-zinc-700"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase">
                                            <th className="p-4 font-semibold">User</th>
                                            <th className="p-4 font-semibold">Phone</th>
                                            <th className="p-4 font-semibold">Username</th>
                                            <th className="p-4 font-semibold">Telegram ID</th>
                                            <th className="p-4 font-semibold">Lang</th>
                                            <th className="p-4 font-semibold">Last Seen</th>
                                            <th className="p-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 text-sm">
                                        {loading && users.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-zinc-400">Loading users...</td></tr>
                                        ) : users.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-zinc-400">No users found.</td></tr>
                                        ) : (
                                            users.map(user => (
                                                <tr key={user.telegram_id} className="hover:bg-zinc-50 transition-colors">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-zinc-200 rounded-full overflow-hidden flex items-center justify-center text-zinc-500 shrink-0">
                                                            {user.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover" /> : <User size={16} />}
                                                        </div>
                                                        <span className="font-medium text-zinc-900">{user.first_name}</span>
                                                    </td>
                                                    <td className="p-4 text-zinc-600">{user.phone_number ? `+${user.phone_number}` : '-'}</td>
                                                    <td className="p-4 text-blue-600">{user.username ? `@${user.username}` : '-'}</td>
                                                    <td className="p-4 text-zinc-500 font-mono text-xs">{user.telegram_id}</td>
                                                    <td className="p-4 text-zinc-600 uppercase text-xs">{user.language}</td>
                                                    <td className="p-4 text-zinc-500 text-xs">{new Date(user.last_seen).toLocaleString()}</td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => setSelectedUser(user)}
                                                            className="p-2 hover:bg-zinc-200 rounded-full text-zinc-500 hover:text-zinc-900 transition-colors"
                                                            title="View Profile"
                                                        >
                                                            <ArrowRight size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <span className="text-sm text-zinc-600">
                                Page <span className="font-bold text-zinc-900">{page}</span> of <span className="font-bold text-zinc-900">{totalPages || 1}</span>
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* 2. User Detail & Stores List (Level 1) */}
                {selectedUser && !selectedStore && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 font-medium text-sm transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Users
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-zinc-200 rounded-full overflow-hidden flex items-center justify-center text-zinc-500 border-2 border-white shadow-md">
                                {selectedUser.photo_url ? <img src={selectedUser.photo_url} className="w-full h-full object-cover" /> : <User size={32} />}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">{selectedUser.first_name}</h1>
                                <p className="text-zinc-500">@{selectedUser.username || 'No username'} • {selectedUser.phone_number ? `+${selectedUser.phone_number}` : 'No phone'}</p>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                            <Store size={20} /> User's Stores
                        </h2>

                        <div className="grid gap-4">
                            {userStores.length === 0 ? (
                                <div className="p-8 bg-white border border-zinc-200 rounded-xl text-center text-zinc-400">
                                    No stores found for this user.
                                </div>
                            ) : (
                                userStores.map(store => (
                                    <div 
                                        key={store.id}
                                        onClick={() => setSelectedStore(store)}
                                        className="bg-white p-6 rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                                    >
                                        <div>
                                            <h3 className="font-bold text-lg text-zinc-900 mb-1">{store.name}</h3>
                                            <p className="text-sm text-zinc-500">Created: {new Date(store.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <span className="block text-2xl font-bold text-zinc-900">{store.debtors_count}</span>
                                                <span className="text-xs text-zinc-500 uppercase font-medium">Debtors</span>
                                            </div>
                                            <ChevronRight size={20} className="text-zinc-300 group-hover:text-blue-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Store Detail & Debtors List (Level 2) */}
                {selectedUser && selectedStore && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
                            <button onClick={() => { setSelectedUser(null); setSelectedStore(null); }} className="hover:text-zinc-900">Users</button>
                            <ChevronRight size={14} />
                            <button onClick={() => setSelectedStore(null)} className="hover:text-zinc-900">{selectedUser.first_name}</button>
                            <ChevronRight size={14} />
                            <span className="text-zinc-900 font-medium">{selectedStore.name}</span>
                        </div>

                        <div className="flex items-center gap-4 mb-6 border-b border-zinc-200 pb-6">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <Store size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-zinc-900">{selectedStore.name}</h1>
                                <p className="text-sm text-zinc-500">ID: {selectedStore.id}</p>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                            <Users size={20} /> Debtors List
                        </h2>

                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase">
                                            <th className="p-4 font-semibold">Name</th>
                                            <th className="p-4 font-semibold">Phone</th>
                                            <th className="p-4 font-semibold">Last Activity</th>
                                            <th className="p-4 font-semibold text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 text-sm">
                                        {storeDebtors.length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-zinc-400">No debtors in this store.</td></tr>
                                        ) : (
                                            storeDebtors.map(debtor => (
                                                <tr key={debtor.id} className="hover:bg-zinc-50 transition-colors">
                                                    <td className="p-4 font-medium text-zinc-900">{debtor.name}</td>
                                                    <td className="p-4 text-zinc-600">{debtor.phone}</td>
                                                    <td className="p-4 text-zinc-500">
                                                        <div className="flex items-center gap-1">
                                                            <History size={14} />
                                                            {new Date(debtor.lastActivity).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className={`p-4 text-right font-bold ${debtor.balance > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                                                        {formatCurrency(debtor.balance)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* === RATE LIMITS VIEW === */}
        {activeTab === 'ratelimits' && (
             <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-zinc-800">Rate Limit Logs</h1>
                    <button onClick={fetchOtpLogs} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase">
                                <th className="p-4 font-semibold">Time</th>
                                <th className="p-4 font-semibold">Phone</th>
                                <th className="p-4 font-semibold">IP Address</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-sm">
                            {loading && otpLogs.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-zinc-400">Loading logs...</td></tr>
                            ) : otpLogs.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-zinc-400">No recent OTP requests.</td></tr>
                            ) : (
                                otpLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="p-4 text-zinc-500">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="p-4 font-medium text-zinc-900">{log.phone_number}</td>
                                        <td className="p-4 text-zinc-600 font-mono text-xs">{log.ip_address}</td>
                                        <td className="p-4 text-right flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => resetLimit('phone', log.phone_number)}
                                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors border border-zinc-200"
                                            >
                                                Reset Phone
                                            </button>
                                            <button 
                                                onClick={() => resetLimit('ip', log.ip_address)}
                                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors border border-zinc-200"
                                            >
                                                Reset IP
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
        )}

      </main>

      {/* Image Modal (Global for Verifications) */}
      {viewingImage && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
              <img src={viewingImage} className="max-w-full max-h-full rounded-lg" alt="Full view" />
              <button className="absolute top-4 right-4 text-white p-2">
                  <XCircle size={32} />
              </button>
          </div>
      )}
    </div>
  );
};

export default AdminApp;