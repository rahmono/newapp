
import React from 'react';
import { ArrowLeft, Trash2, AlertTriangle, Mail, Clock, CheckCircle2 } from 'lucide-react';

const DeleteAccount: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <a href="/" className="p-2 hover:bg-zinc-100 rounded-full transition-colors mr-2" aria-label="Go home">
                <ArrowLeft size={20} className="text-zinc-600" />
             </a>
             <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">Д</div>
             <span className="font-bold text-lg tracking-tight">Daftar</span>
          </div>
          <h1 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider hidden sm:block">Account Deletion</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-6 md:p-10 bg-white shadow-sm min-h-screen">
        
        <div className="mb-8 border-b border-zinc-100 pb-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 size={32} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Request Account Deletion</h1>
            <p className="text-zinc-500 text-lg">
                We value your privacy. If you wish to delete your account and associated data from the <strong>Daftar</strong> application, please follow the instructions below.
            </p>
        </div>

        <div className="space-y-10 leading-relaxed">
            
            {/* Instruction Section */}
            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <Mail size={20} className="text-blue-600" />
                    How to request deletion
                </h2>
                <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
                    <p className="mb-4 font-medium">To initiate the deletion process, please send an email to our support team:</p>
                    
                    <div className="space-y-3 pl-4 border-l-2 border-zinc-300">
                        <p><strong>To:</strong> <a href="mailto:investplus40@gmail.com" className="text-blue-600 underline">investplus40@gmail.com</a></p>
                        <p><strong>Subject:</strong> Account Deletion Request - [Your Phone Number]</p>
                        <p><strong>Body:</strong> Please include the phone number registered with the app and a brief statement confirming your request.</p>
                    </div>
                    
                    <p className="mt-4 text-sm text-zinc-500">
                        * Note: We may ask for additional verification (such as an OTP sent to your phone) to ensure you are the owner of the account before processing the deletion.
                    </p>
                </div>
            </section>

            {/* Data Details Section */}
            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-500" />
                    What data will be deleted?
                </h2>
                <p className="mb-4">Once your request is processed, the following data will be permanently removed from our active servers:</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                    <li className="flex items-start gap-2 text-sm text-zinc-700 bg-zinc-50 p-3 rounded-lg">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Personal Info:</strong> Your name, phone number, and profile photo.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-zinc-700 bg-zinc-50 p-3 rounded-lg">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Authentication Data:</strong> Login sessions and tokens.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-zinc-700 bg-zinc-50 p-3 rounded-lg">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Store Data:</strong> Verification documents (Patents/Certificates) uploaded by you.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-zinc-700 bg-zinc-50 p-3 rounded-lg">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Debtor Lists:</strong> Lists of debtors and transaction history created by you.</span>
                    </li>
                </ul>
            </section>

            {/* Data Retention Section */}
            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-zinc-500" />
                    Retention & Timeline
                </h2>
                <div className="space-y-4 text-zinc-700">
                    <p>
                        <strong>Processing Time:</strong> Account deletion requests are typically processed within <strong>30 days</strong> of receiving a verified request.
                    </p>
                    <p>
                        <strong>Retained Data:</strong> Some anonymized data (such as transaction aggregates) may be retained for analytical purposes or as required by local tax/financial regulations, but it will no longer be linked to your personal identity.
                    </p>
                </div>
            </section>

            <section className="pt-6 border-t border-zinc-100">
                <p className="text-sm text-zinc-500">
                    If you have any questions before deleting your account, please contact us at <a href="mailto:investplus40@gmail.com" className="text-blue-600">investplus40@gmail.com</a>.
                </p>
            </section>
        </div>

      </main>
      
      <footer className="text-center p-6 text-zinc-400 text-sm bg-zinc-50">
        &copy; 2026 Daftar. All rights reserved.
      </footer>
    </div>
  );
};

export default DeleteAccount;
