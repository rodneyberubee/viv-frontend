import React, { useState } from 'react';
import Link from 'next/link';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('Message sent!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('Failed to send. Try again later.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">VivAI Table</h1>
          <nav className="space-x-6">
            <Link href="/" className="text-gray-700 hover:text-orange-500">Home</Link>
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

          <form onSubmit={handleSubmit} className="mt-10 bg-gray-50 p-8 rounded shadow space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={5}
                placeholder="How can we help you?"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 text-white px-6 py-3 rounded shadow hover:bg-orange-600"
            >
              Send Message
            </button>
            {status && <p className="text-center mt-4 text-gray-700">{status}</p>}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white shadow mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} VivAI Table. All rights reserved.</p>
          <div className="space-x-4">
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
