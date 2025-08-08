import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const TermsOfService = () => {
  return (
    <>
      <Head>
        <title>Terms of Service & Privacy Policy - Viv AI</title>
        <meta name="description" content="Terms of service and privacy policy for Viv AI reservation system" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service & Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            <Link href="/" className="inline-block mt-4 text-orange-600 hover:underline">
              ← Back to Home
            </Link>
          </div>

          {/* Terms of Service */}
          <section className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Terms of Service</h2>
            
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">1. Service Description</h3>
                <p>Viv AI provides an AI-powered reservation management system for restaurants. Our service allows restaurants to manage bookings through an automated chatbot interface and dashboard system.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">2. Acceptance of Terms</h3>
                <p>By using our service, you agree to these terms. If you disagree with any part of these terms, you may not use our service.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">3. User Responsibilities</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate information and notify us immediately of any unauthorized use.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">4. Service Availability</h3>
                <p>We strive to maintain high service availability but do not guarantee uninterrupted service. We may perform maintenance that temporarily affects service availability.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">5. Payment and Billing</h3>
                <p>Subscription fees are charged in advance. Failure to pay may result in service suspension. Refunds are handled on a case-by-case basis.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">6. Limitation of Liability</h3>
                <p>We provide this service "as is" without warranty. We are not liable for any indirect, incidental, or consequential damages arising from your use of our service.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">7. Termination</h3>
                <p>Either party may terminate service at any time. Upon termination, your access will be suspended, but your data will be preserved according to our data retention policy.</p>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Privacy Policy</h2>
            
            <div className="space-y-6 text-gray-700">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                <h3 className="text-lg font-medium text-orange-800 mb-2">Our Privacy Commitment</h3>
                <p className="text-orange-700">
                  <strong>We do not sell, rent, or share your personal data with third parties for marketing purposes.</strong> 
                  We believe your data belongs to you, not to data brokers or advertisers.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">1. Information We Collect</h3>
                <p><strong>Restaurant Information:</strong> Business name, contact details, operating hours, and reservation preferences.</p>
                <p><strong>Reservation Data:</strong> Customer names, contact information, party sizes, and reservation times submitted through our system.</p>
                <p><strong>Usage Data:</strong> Basic analytics about how you use our dashboard and system performance metrics.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">2. How We Use Your Information</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>To provide and maintain our reservation service</li>
                  <li>To process payments and manage subscriptions</li>
                  <li>To provide customer support</li>
                  <li>To improve our service functionality</li>
                  <li>To send important service notifications</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">3. Data Storage and Security</h3>
                <p>Your data is stored securely using industry-standard practices. We use encrypted connections and secure databases to protect your information. Data is backed up regularly to prevent loss.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">4. Third-Party Services</h3>
                <p>We use the following third-party services that may have access to limited data:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li><strong>Airtable:</strong> Database storage for reservation data</li>
                  <li><strong>Paddle:</strong> Payment processing (financial transactions only)</li>
                  <li><strong>OpenAI:</strong> AI processing for chatbot functionality (conversation data only)</li>
                </ul>
                <p className="mt-2">These services are bound by their own privacy policies and are used solely to provide our service functionality.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">5. Your Rights</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Export:</strong> Download your reservation data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">6. Data Retention</h3>
                <p>We retain your data as long as your account is active. When you cancel your subscription, your data is preserved for 90 days in case you wish to reactivate, then permanently deleted unless required by law to retain longer.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">7. Contact Us</h3>
                <p>If you have questions about these terms or our privacy practices, please contact us through our support channels.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center mt-8">
            <Link href="/" className="text-orange-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
