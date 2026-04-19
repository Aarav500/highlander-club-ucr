import React from 'react';

export default function CSAEPolicy() {
  return (
    <div className="min-h-screen bg-[#030508] text-white p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 bg-[rgba(13,18,33,0.85)] p-8 md:p-12 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
        
        <div className="border-b border-[rgba(255,255,255,0.1)] pb-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">CSAE Policy</h1>
          <p className="text-gray-400">Highlander Events' Standards Against Child Sexual Abuse and Exploitation (CSAE)</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1E6AFF]">Our Commitment</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Highlander Events has a zero-tolerance policy towards Child Sexual Abuse and Exploitation (CSAE). We are deeply committed to protecting minors and maintaining a safe, secure, and respectful community for all our users.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Prohibited Content & Actions</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            We strictly prohibit any content, messaging, or behavior that promotes, facilitates, or depicts the sexual exploitation or abuse of children. This includes, but is not limited to:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2 text-lg mt-4">
            <li>Sharing or distributing Child Sexual Abuse Material (CSAM).</li>
            <li>Grooming or attempting to exploit or abuse minors.</li>
            <li>Content that sexualizes minors.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Reporting & Enforcement</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            If you encounter any content or behavior on the Highlander Events platform that violates this policy, please report it immediately using the in-app reporting tools or by contacting our support team at <strong>support@highlanderevents.com</strong>.
          </p>
          <p className="text-gray-300 leading-relaxed text-lg">
            Any accounts found to be in violation of our CSAE policy will be permanently banned immediately without notice. Furthermore, we comply with all legal obligations and will report suspected instances of CSAE to the appropriate law enforcement authorities, including the National Center for Missing & Exploited Children (NCMEC), and provide full cooperation in any resulting investigations.
          </p>
        </section>
      </div>
    </div>
  );
}
