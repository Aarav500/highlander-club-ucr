import React from 'react';

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-[#030508] text-white p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 bg-[rgba(13,18,33,0.85)] p-8 md:p-12 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
        
        <div className="border-b border-[rgba(255,255,255,0.1)] pb-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Account Deletion Request</h1>
          <p className="text-gray-400">Highlander Events</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">How to delete your account</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            We are sorry to see you go! If you would like to permanently delete your Highlander Events account and all associated data, you can do so through the mobile application or by submitting a written request.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Method 1: Inside the App (Recommended)</h2>
          <ol className="list-decimal pl-6 text-gray-300 space-y-3 text-lg mt-4">
            <li>Open the <strong>Highlander Events</strong> app on your device.</li>
            <li>Go to the <strong>Profile</strong> tab.</li>
            <li>Tap the <strong>Settings</strong> gear icon in the top right.</li>
            <li>Scroll to the bottom and tap <strong>Delete Account</strong>.</li>
            <li>Confirm your choice. Your data will be deleted immediately.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Method 2: Email Request</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            If you no longer have access to the app, you can request account deletion by emailing our support team using your <strong>@ucr.edu</strong> email address.
          </p>
          <div className="bg-black/50 p-6 rounded-xl border border-gray-800 mt-4">
            <p className="text-gray-300 font-mono text-sm">
              <strong>To:</strong> support@highlanderevents.com<br/>
              <strong>Subject:</strong> Account Deletion Request<br/>
              <strong>Body:</strong> Please delete my Highlander Events account associated with this email address.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">What data is deleted?</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            When your account is deleted, the following data is permanently erased from our servers:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2 text-lg mt-4">
            <li>Your profile information (name, avatar, UCR NetID).</li>
            <li>Your event RSVPs and club memberships.</li>
            <li>All active sessions and authentication tokens.</li>
          </ul>
          <p className="text-gray-400 italic text-md mt-4">
            Note: For security and audit purposes, anonymized aggregate data regarding past event attendance may be retained, but it will no longer be linked to your personal identity.
          </p>
        </section>
      </div>
    </div>
  );
}
