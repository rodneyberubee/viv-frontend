import React from 'react';
import Link from 'next/link';

const IndexPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">VivAI Table</h1>
          <nav className="space-x-6">
            <Link href="#features" className="text-gray-700 hover:text-orange-500">Features</Link>
            <Link href="#pricing" className="text-gray-700 hover:text-orange-500">Pricing</Link>
            <Link href="#contact" className="text-gray-700 hover:text-orange-500">Contact</Link>
            <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Sign In
            </Link>
            <Link href="/signup" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
              Create Account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">
            AI-Powered Reservations for Restaurants
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Let Viv handle bookings, cancellations, and availability—so you can focus on your guests.
          </p>
          <div className="mt-8 space-x-4">
            <Link href="/signup" className="bg-orange-500 text-white px-6 py-3 rounded shadow hover:bg-orange-600">
              Get Started
            </Link>
            <Link href="#pricing" className="bg-gray-200 text-gray-700 px-6 py-3 rounded shadow hover:bg-gray-300">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-gray-900">Why Choose Viv?</h3>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded shadow">
              <h4 className="text-xl font-semibold text-orange-500">Smart AI Concierge</h4>
              <p className="mt-2 text-gray-600">
                Handles reservations, changes, and cancellations—24/7.
              </p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h4 className="text-xl font-semibold text-orange-500">Easy Setup</h4>
              <p className="mt-2 text-gray-600">
                Connect Viv to your restaurant in minutes. No tech headaches.
              </p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h4 className="text-xl font-semibold text-orange-500">Customizable</h4>
              <p className="mt-2 text-gray-600">
                Set max reservations, business hours, and blocked times with ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-gray-900">Simple Pricing</h3>
          <p className="mt-4 text-gray-600">One flat monthly rate. No hidden fees.</p>
          <div className="mt-10 flex justify-center">
            <div className="bg-gray-50 border rounded-lg shadow-lg p-8 w-full max-w-md">
              <h4 className="text-2xl font-semibold text-gray-900">Standard Plan</h4>
              <p className="mt-4 text-4xl font-bold text-orange-500">
                $100 <span className="text-lg text-gray-600">/mo</span>
              </p>
              <ul className="mt-6 space-y-2 text-gray-700">
                <li>✓ Unlimited reservations</li>
                <li>✓ AI-powered booking assistant</li>
                <li>✓ Host dashboard & reporting</li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 inline-block bg-orange-500 text-white px-6 py-3 rounded shadow hover:bg-orange-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-gray-900">Questions? Get in Touch</h3>
          <p className="mt-4 text-gray-600">We’re here to help you get started with Viv.</p>
          <Link
            href="/contact"
            className="mt-6 inline-block bg-orange-500 text-white px-6 py-3 rounded shadow hover:bg-orange-600"
          >
            Contact Us
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white shadow mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} VivAI Table. All rights reserved.</p>
          <div className="space-x-4">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
