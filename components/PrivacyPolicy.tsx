
import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
          <h1 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider hidden sm:block">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-6 md:p-10 bg-white shadow-sm min-h-screen">
        
        <div className="mb-8 border-b border-zinc-100 pb-6">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-zinc-500">Effective as of 2026-01-28</p>
        </div>

        <div className="space-y-8 leading-relaxed">
            <section>
                <p>
                    This privacy policy applies to the <strong>Daftar</strong> app (hereby referred to as "Application") for mobile devices that was created by <strong>Jovid Rahmonov</strong> (hereby referred to as "Service Provider") as a Free service. This service is intended for use "AS IS".
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Information Collection and Use</h2>
                <p className="mb-4">
                    The Application collects information when you download and use it. This information may include information such as:
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-4 text-zinc-700">
                    <li>Your device's Internet Protocol address (e.g. IP address)</li>
                    <li>The pages of the Application that you visit, the time and date of your visit, the time spent on those pages</li>
                    <li>The time spent on the Application</li>
                    <li>The operating system you use on your mobile device</li>
                </ul>
                <p className="mb-4">The Application does not gather precise information about the location of your mobile device.</p>
                <p className="mb-4">
                    The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.
                </p>
                <p>
                    For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information. The information that the Service Provider request will be retained by them and used as described in this privacy policy.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Third Party Access</h2>
                <p className="mb-4">
                    Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and their service. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.
                </p>
                <p className="mb-4">
                    Please note that the Application utilizes third-party services that have their own Privacy Policy about handling data. Below are the links to the Privacy Policy of the third-party service providers used by the Application:
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-4 text-blue-600 underline">
                    <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Play Services</a></li>
                </ul>
                <p className="mb-4">The Service Provider may disclose User Provided and Automatically Collected Information:</p>
                <ul className="list-disc pl-5 space-y-2 text-zinc-700">
                    <li>as required by law, such as to comply with a subpoena, or similar legal process;</li>
                    <li>when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;</li>
                    <li>with their trusted services providers who work on their behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Opt-Out Rights</h2>
                <p>
                    You can stop all collection of information by the Application easily by uninstalling it. You may use the standard uninstall processes as may be available as part of your mobile device or via the mobile application marketplace or network.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Data Retention Policy</h2>
                <p>
                    The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you'd like them to delete User Provided Data that you have provided via the Application, please contact them at <a href="mailto:investplus40@gmail.com" className="text-blue-600 underline">investplus40@gmail.com</a> and they will respond in a reasonable time.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Children</h2>
                <p className="mb-4">
                    The Service Provider does not use the Application to knowingly solicit data from or market to children under the age of 13.
                </p>
                <p>
                    The Application does not address anyone under the age of 13. The Service Provider does not knowingly collect personally identifiable information from children under 13 years of age. In the case the Service Provider discover that a child under 13 has provided personal information, the Service Provider will immediately delete this from their servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact the Service Provider (<a href="mailto:investplus40@gmail.com" className="text-blue-600 underline">investplus40@gmail.com</a>) so that they will be able to take the necessary actions.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Security</h2>
                <p>
                    The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, electronic, and procedural safeguards to protect information the Service Provider processes and maintains.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Changes</h2>
                <p>
                    This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Your Consent</h2>
                <p>
                    By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.
                </p>
            </section>

            <section className="bg-zinc-50 p-6 rounded-xl border border-zinc-100 mt-8">
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Contact Us</h2>
                <p>
                    If you have any questions regarding privacy while using the Application, or have questions about the practices, please contact the Service Provider via email at <a href="mailto:investplus40@gmail.com" className="text-blue-600 font-medium hover:underline">investplus40@gmail.com</a>.
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

export default PrivacyPolicy;
