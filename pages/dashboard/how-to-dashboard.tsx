import React from 'react';
import Link from 'next/link';

const HowToDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Using the Viv Dashboard</h1>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Overview</h2>
          <p className="text-gray-700">
            The dashboard gives you a real-time view of your reservation activity. It's designed to be straightforward:
            at a glance, you can see today's confirmed bookings, how your week is shaping up, and your total for the month.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Editing Reservations</h2>
          <p className="text-gray-700">
            You can edit any reservation inline by clicking into a field. Change the time, name, party size, status—anything
            that's been entered. Once you've made changes, click <strong>Update Reservations</strong> to push the edits to Airtable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Adding a New Reservation</h2>
          <p className="text-gray-700">
            Click <strong>Add New Row</strong> to insert a blank reservation entry for the selected day. You’ll need to fill it out manually and then hit
            <strong> Update Reservations</strong> to save it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Status Options</h2>
          <p className="text-gray-700">
            Use the <strong>Status</strong> field to control how Viv treats the reservation:
          </p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li><strong>Confirmed</strong> – A guest reservation. Viv will respect it as valid.</li>
            <li><strong>Canceled</strong> – A canceled entry. Viv will treat the slot as open.</li>
            <li><strong>Blocked</strong> – Host-controlled block. No reservations can be made during this time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Day Navigation</h2>
          <p className="text-gray-700">
            Use the arrows or date selector to move between days. The dashboard always filters reservations to the currently
            selected date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Copying Your Viv AI Link</h2>
          <p className="text-gray-700">
            The link at the top of the sidebar is your restaurant’s public AI reservation link. Click <strong>Copy</strong> to
            quickly grab it. You can paste this anywhere — your site, Instagram bio, Yelp, wherever.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Need to Make Changes to Settings?</h2>
          <p className="text-gray-700">
            If you need to change your hours, cutoff window, or maximum reservations per slot, you can do that on the{' '}
            <Link href="/settings" className="text-orange-600 hover:underline font-medium">Settings</Link> page.
          </p>
        </section>

        <div className="pt-6 border-t">
          <Link href="/dashboard/mollyscafe1" className="text-sm text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowToDashboard;
