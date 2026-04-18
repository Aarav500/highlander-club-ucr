import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030508] text-white p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 bg-[rgba(13,18,33,0.85)] p-8 md:p-12 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
        
        <div className="border-b border-[rgba(255,255,255,0.1)] pb-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: April 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">1. Introduction</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Welcome to Highlander Events ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share your information when you use our mobile application and website (the "Platform").
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">2. Information We Collect</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            We collect personal information that you voluntarily provide to us when you register on the Platform, express an interest in obtaining information about us or our products and services, or otherwise contact us.
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-3 text-lg mt-4">
            <li><strong className="text-white">Personal Information:</strong> Name, email address (including university credentials), and profile picture.</li>
            <li><strong className="text-white">Usage Data:</strong> Information about your interactions with the Platform, such as RSVPs, club memberships, and events viewed.</li>
            <li><strong className="text-white">Device Data:</strong> Information such as IP address, browser type, operating system, and device identifiers.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">3. How We Use Your Information</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            We use the information we collect or receive to:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-3 text-lg mt-4">
            <li>Facilitate account creation and logon process securely using CAS SSO.</li>
            <li>Manage user accounts and provide requested services (e.g., event RSVPs, club memberships).</li>
            <li>Send administrative information to you, such as updates to our terms, conditions, and policies.</li>
            <li>Improve our Platform, troubleshoot bugs, and enhance user experience.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">4. Sharing Your Information</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal information to third parties. Public interactions (like RSVPing to a public event) may be visible to other verified members of the platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">5. Data Security</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">6. Your Rights</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Depending on your location, you may have certain rights regarding your personal information, such as the right to request access, correction, or deletion of your data. To exercise these rights, please contact us or delete your account through the mobile application settings.
          </p>
        </section>

        <section className="space-y-4 pt-4">
          <p className="text-gray-400 italic">
            This Privacy Policy is necessary for compliance with Google Play Store guidelines and protects user privacy within the Highlander Events community.
          </p>
        </section>
      </div>
    </div>
  );
}
