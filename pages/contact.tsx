import React from 'react';
import Link from 'next/link';

const ContactPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">VivAI Table</h1>
          <nav className="space-x-6">
            <Link href="/" className="text-gray-700 hover:text-orange-500">Home</Link>
            <Link href="/#features" className="text-gray-700 hover:text-orange-500">Features</Link>
            <Link href="/#pricing" className="text-gray-700 hover:text-orange-500">Pricing</Link>
            <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Sign In
            </Link>
            <Link href="/account" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
              Create Account
            </Link>
          </nav>
        </div>
      </header>

      {/* Contact Section */}
      <section className="flex-1 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-extrabold text-center text-gray-900">Contact Us</h2>
          <p className="mt-4 text-lg text-gray-600 text-center">
            Have questions about VivAI Table? We’d love to hear from you. Fill out the form below and we’ll get back to you.
          </p>

          <form className="mt-10 bg-gray-50 p-8 rounded shadow space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Message</label>
              <textarea
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={5}
                placeholder="How can we help you?"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 text-white px-6 py-3 rounded shadow hover:bg-orange-600"
            >
              Send Message
            </button>
          </form>
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

export default ContactPage;
