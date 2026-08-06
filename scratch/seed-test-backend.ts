import dbConnect from "../src/lib/mongodb";
import Event from "../src/models/Event";
import Speaker from "../src/models/Speaker";
import Sponsor from "../src/models/Sponsor";
import Company from "../src/models/Company";
import Agenda from "../src/models/Agenda";
import Brochure from "../src/models/Brochure";
import Blog from "../src/models/Blog";
import Newsflash from "../src/models/Newsflash";
import Gallery from "../src/models/Gallery";
import Registration from "../src/models/Registration";
import InvestorRegistration from "../src/models/InvestorRegistration";
import CompanyRegistration from "../src/models/CompanyRegistration";
import User from "../src/models/User";
import { v4 as uuidv4 } from "uuid";

async function seedFullBackend() {
  console.log("🚀 Starting Full Backend Test Seeding...");
  await dbConnect();

  // 1. Speakers
  const speaker1 = await Speaker.findOneAndUpdate(
    { slug: "dr-sarah-jenkins" },
    {
      name: "Dr. Sarah Jenkins",
      slug: "dr-sarah-jenkins",
      title: "Chief Geologist & Energy Strategist",
      company: "Apex Mineral Explorations",
      bio: "Dr. Jenkins has 20+ years of experience leading critical mineral discovery projects across North and South America.",
      category: "Keynote Speaker",
      year: 2026,
      status: "published",
      isFeatured: true,
    },
    { upsert: true, new: true }
  );

  const speaker2 = await Speaker.findOneAndUpdate(
    { slug: "michael-ross" },
    {
      name: "Michael Ross",
      slug: "michael-ross",
      title: "Managing Director",
      company: "Global Mining Ventures",
      bio: "Focuses on ESG capital deployment and green mining innovation funds.",
      category: "Panelist",
      year: 2026,
      status: "published",
      isFeatured: false,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Speakers created/updated");

  // 2. Sponsors
  const sponsor1 = await Sponsor.findOneAndUpdate(
    { slug: "goldcorp-global" },
    {
      name: "Goldcorp Global",
      slug: "goldcorp-global",
      description: "Premier global mining enterprise financing clean extraction.",
      tier: "platinum",
      year: 2026,
      status: "published",
      isFeatured: true,
    },
    { upsert: true, new: true }
  );

  const sponsor2 = await Sponsor.findOneAndUpdate(
    { slug: "silverline-resources" },
    {
      name: "Silverline Resources",
      slug: "silverline-resources",
      description: "Leading silver production and stream financing firm.",
      tier: "gold",
      year: 2026,
      status: "published",
      isFeatured: false,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Sponsors created/updated");

  // 3. Events
  const event1 = await Event.findOneAndUpdate(
    { slug: "the-mining-investment-event-2026" },
    {
      title: "THE Mining Investment Event 2026",
      slug: "the-mining-investment-event-2026",
      description: "Canada's Only Independent Tier 1 Global Mining Investment Conference",
      content: "Join leading mining companies, institutional investors, and innovators in Quebec City.",
      year: 2026,
      startDate: new Date("2026-06-02"),
      endDate: new Date("2026-06-04"),
      location: "Quebec City, QC, Canada",
      venue: "Voltigeurs de Québec Armoury",
      speakers: [speaker1._id, speaker2._id],
      sponsors: [sponsor1._id, sponsor2._id],
      status: "published",
      isFeatured: true,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Event created/updated");

  // Link speakers/sponsors back to event
  await Speaker.updateMany(
    { _id: { $in: [speaker1._id, speaker2._id] } },
    { $addToSet: { events: event1._id } }
  );
  await Sponsor.updateMany(
    { _id: { $in: [sponsor1._id, sponsor2._id] } },
    { $addToSet: { events: event1._id } }
  );

  // 5. Companies
  await Company.findOneAndUpdate(
    { slug: "bhp-billiton-ltd" },
    {
      name: "BHP Billiton Ltd",
      slug: "bhp-billiton-ltd",
      description: "Diversified global natural resources producer.",
      ticker: "NYSE: BHP",
      type: "PRODUCER",
      location: "Melbourne, Australia",
      commodities: ["Copper", "Iron Ore", "Potash"],
      year: 2026,
      status: "published",
      isFeatured: true,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Company created/updated");

  // 6. Agendas
  await Agenda.findOneAndUpdate(
    { slug: "the-event-2026-official-schedule" },
    {
      title: "THE Event 2026 Official Schedule",
      slug: "the-event-2026-official-schedule",
      year: 2026,
      scheduleType: "interactive",
      eventDates: "June 2-4, 2026",
      venue: "Voltigeurs de Québec Armoury",
      description: "Full three-day agenda including student program, company presentations, and networking receptions.",
      status: "published",
    },
    { upsert: true, new: true }
  );
  console.log("✅ Agenda created/updated");

  // 7. Brochures
  await Brochure.findOneAndUpdate(
    { slug: "the-mining-investment-prospectus-2026" },
    {
      title: "THE Mining Investment Prospectus 2026",
      slug: "the-mining-investment-prospectus-2026",
      year: 2026,
      pdfUrl: "https://res.cloudinary.com/demo/image/upload/v1/sample.pdf",
      fileSize: "8.4 MB",
      eventDates: "June 2-4, 2026",
      venue: "Voltigeurs de Québec Armoury",
      cityCountry: "Quebec City, Canada",
      description: "Comprehensive event overview, speaker line-up, and sponsorship options.",
      status: "published",
    },
    { upsert: true, new: true }
  );
  console.log("✅ Brochure created/updated");

  // 8. Blogs
  await Blog.findOneAndUpdate(
    { slug: "top-critical-mineral-investment-trends-2026" },
    {
      title: "Top Critical Mineral Investment Trends for 2026",
      slug: "top-critical-mineral-investment-trends-2026",
      excerpt: "An analysis of lithium, nickel, and copper demand driven by energy transition mandates.",
      content: "<h3>Executive Summary</h3><p>Demand for lithium and copper continues to accelerate...</p>",
      category: "Market Insights",
      status: "published",
      isFeatured: true,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Blog created/updated");

  // 9. Newsflash
  await Newsflash.findOneAndUpdate(
    { slug: "the-mining-investment-event-announces-winners-2026" },
    {
      title: "THE Mining Investment Event Announces Winners of THE 2026 Student Partnership Program and the Recipient of the 2026 She-Co Initiative Charity",
      slug: "the-mining-investment-event-announces-winners-2026",
      subheading: "THE Mining Investment Event - THE Event is proud to announce student winners and She-Co charity recipient.",
      content: "<h3>Student Partnership Program</h3><p>THE Event supports top mining students across North America...</p>",
      date: "JUL 5",
      category: "Newsflash",
      status: "published",
      isFeatured: true,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Newsflash created/updated");

  // 10. Gallery
  await Gallery.findOneAndUpdate(
    { slug: "2025-opening-ceremony-highlights" },
    {
      title: "2025 Opening Ceremony Highlights",
      slug: "2025-opening-ceremony-highlights",
      description: "Photo gallery of keynotes, networking sessions, and award ceremonies.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
          publicId: "sample_gallery_1",
          caption: "Keynote presentation at Voltigeurs Armoury",
          order: 1,
        },
      ],
      event: event1._id,
      category: "Conference Photos",
      status: "published",
      isFeatured: true,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Gallery created/updated");

  // 11. Registration (Attendee)
  await Registration.findOneAndUpdate(
    { email: "attendee.alex@example.com" },
    {
      event: event1._id,
      name: "Alex Vance",
      email: "attendee.alex@example.com",
      phone: "+1-555-0144",
      company: "Vance Global Capital",
      jobTitle: "Investment Analyst",
      ticketType: "VIP Delegate",
      paymentStatus: "completed",
      registrationNumber: "REG-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "confirmed",
    },
    { upsert: true, new: true }
  );
  console.log("✅ Event Registration created/updated");

  // 12. Investor Registration
  await InvestorRegistration.findOneAndUpdate(
    { email: "investor.carol@vanguardfunds.com" },
    {
      companyName: "Vanguard Asset Management",
      firstName: "Carol",
      lastName: "Danvers",
      businessTitle: "Senior Portfolio Manager",
      city: "New York",
      country: "USA",
      email: "investor.carol@vanguardfunds.com",
      phone: "+1-212-555-0188",
      signUpForNews: true,
      assetsUnderManagement: "$1.2B",
      investorType: "Institutional Investor",
      registrationNumber: "INV-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "confirmed",
    },
    { upsert: true, new: true }
  );
  console.log("✅ Investor Registration created/updated");

  // 13. Company Registration
  await CompanyRegistration.findOneAndUpdate(
    { email: "corporate@goldhorizon.com" },
    {
      companyName: "Gold Horizon Resources",
      marketCap: "$850M",
      primaryExchangeTicker: "TSX: GHR",
      commodity: "Gold / Silver",
      projectStage: "Developer",
      location: "Ontario, Canada",
      email: "corporate@goldhorizon.com",
      signUpForNews: true,
      registrationNumber: "COMP-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "confirmed",
    },
    { upsert: true, new: true }
  );
  console.log("✅ Company Registration created/updated");

  // 14. User / Subscriber
  await User.findOneAndUpdate(
    { email: "subscriber.mark@example.com" },
    {
      name: "Mark Reynolds",
      email: "subscriber.mark@example.com",
      role: "user",
      status: "active",
    },
    { upsert: true, new: true }
  );
  console.log("✅ User created/updated");

  console.log("\n✨ Full backend database seeding completed successfully!");
  process.exit(0);
}

seedFullBackend().catch((err) => {
  console.error("❌ Error seeding full backend:", err);
  process.exit(1);
});
