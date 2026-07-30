const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv(envPath) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      let val = trimmed.slice(idx + 1);
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[key] = val;
    }
    return env;
  } catch (e) {
    return {};
  }
}

const root = path.resolve(__dirname, '..');
const env = loadEnv(path.join(root, '.env'));
const MONGODB_URI = process.env.MONGODB_URI || env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment or .env file');
  process.exit(1);
}

const eventDoc = {
  title: 'The Agenda — The Mining Investment Event 2027',
  slug: 'agenda-2027-quebec-city',
  description: 'Interactive agenda extracted from the PDF — June 1-3, 2027 Quebec City',
  content: '',
  year: 2027,
  startDate: new Date('2027-05-31'),
  endDate: new Date('2027-06-03'),
  location: 'Quebec City',
  venue: 'Centre des Congrés de Québec',
  status: 'published',
  agenda: [
    {
      day: 'May 31, 2027 - Monday',
      date: '2027-05-31',
      items: [
        { time: '6:45 AM - 3:30 PM', title: 'Iconic Golf Day – La Tempête', description: 'Networking', speaker: '', location: '' },
        { time: '5:00 PM - 9:00 PM', title: 'Welcome Event & Pre-Registration', description: 'Presented by CAUR Technologies & ITFA — The Connect Lounge', speaker: '', location: 'Centre des Congrès de Québec' },
        { time: '5:30 PM - 6:30 PM', title: 'ITFA Panel (to be confirmed)', description: 'Presentation Room - 400C', speaker: '', location: '400C' },
      ],
    },
    {
      day: 'June 1, 2027 - Tuesday',
      date: '2027-06-01',
      items: [
        { time: '7:00 AM', title: 'Registration', description: 'Buffet Breakfast & Lunch - Food Hall | Presentations - 400 C', speaker: '', location: 'Lobby/400 C' },
        { time: '7:00 AM - 5:00 PM', title: '1x1 Meetings', description: 'Presented by Ventum Capital Markets — 400 A-B', speaker: '', location: '400 A-B' },
        { time: '8:00 AM', title: 'Opening Remarks', description: 'Joanne Jobin, CEO & Founder, THE Event', speaker: 'Joanne Jobin', location: '400 C' },
        { time: 'TBD', title: 'Keynote', description: 'TBD', speaker: '', location: '400 C' },
        { time: '5:00 PM', title: 'Closing Address', description: 'TBD', speaker: '', location: '' },
        { time: '6:30 PM', title: 'Sponsors Gala & Casino Networking Event', description: 'The Quebec Armoury — Shuttle Service @ 6:00 PM', speaker: '', location: 'Quebec Armoury' },
      ],
    },
    {
      day: 'June 2, 2027 - Wednesday',
      date: '2027-06-02',
      items: [
        { time: '7:00 AM', title: 'Registration', description: 'Lobby Area | Buffet Breakfast & Lunch - Food Hall', speaker: '', location: 'Lobby' },
        { time: '7:00 AM - 5:00 PM', title: '1x1 Meetings', description: 'Presented by Ventum Capital Markets — 400 A-B', speaker: '', location: '400 A-B' },
        { time: '8:00 AM', title: 'Opening Remarks', description: 'Joanne Jobin, CEO & Founder, THE Event', speaker: 'Joanne Jobin', location: '400 C' },
        { time: 'TBD', title: 'Keynote', description: 'TBD', speaker: '', location: '400 C' },
        { time: 'Evening', title: 'Networking — After Dark', description: 'The Connect Lounge — QCC', speaker: '', location: 'The Connect Lounge' },
      ],
    },
    {
      day: 'June 3, 2027 - Thursday',
      date: '2027-06-03',
      items: [
        { time: '7:00 AM', title: 'Registration', description: 'Lobby Area | Buffet Breakfast & Lunch - Food Hall', speaker: '', location: 'Lobby' },
        { time: '8:00 AM', title: 'Opening Remarks', description: 'Joanne Jobin, CEO & Founder, THE Event', speaker: 'Joanne Jobin', location: '400 C' },
        { time: '8:05 AM', title: 'Keynote', description: 'TBD', speaker: '', location: '400 C' },
        { time: '3:15 PM', title: 'Closing Remarks', description: 'Joanne Jobin, CEO & Founder', speaker: 'Joanne Jobin', location: '' },
        { time: '4:00 PM - 6:00 PM', title: 'Au Revoir Cocktails', description: 'Presented by IRINC — The Connect Lounge', speaker: '', location: 'The Connect Lounge' },
      ],
    },
  ],
  interactiveAgenda: [],
};

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'investment-db', maxPoolSize: 5 });
    console.log('Connected to MongoDB');

    // ensure interactiveAgenda mirrors agenda
    eventDoc.interactiveAgenda = eventDoc.agenda;

    const col = mongoose.connection.collection('events');
    const existing = await col.findOne({ slug: eventDoc.slug });
    if (existing) {
      console.log('Event with same slug exists. Updating existing document.');
      const res = await col.updateOne({ _id: existing._id }, { $set: eventDoc });
      console.log('Updated:', res.modifiedCount);
    } else {
      const res = await col.insertOne(eventDoc);
      console.log('Inserted event id:', res.insertedId.toString());
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
})();
