import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import Speaker from "@/models/Speaker";
import Sponsor from "@/models/Sponsor";
import Registration from "@/models/Registration";
import Company from "@/models/Company";
import Blog from "@/models/Blog";
import Brochure from "@/models/Brochure";
import Exhibitor from "@/models/Exhibitor";
import Agenda from "@/models/Agenda";
import Gallery from "@/models/Gallery";
import User from "@/models/User";
import InvestorRegistration from "@/models/InvestorRegistration";
import CompanyRegistration from "@/models/CompanyRegistration";
import Newsflash from "@/models/Newsflash";
import { successResponse, handleApiError } from "@/lib/response";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const notDeleted = { isDeleted: { $ne: true } };

    const [
      eventsCount,
      speakersCount,
      sponsorsCount,
      registrationsCount,
      companiesCount,
      blogsCount,
      brochuresCount,
      exhibitorsCount,
      agendasCount,
      galleryCount,
      usersCount,
      investorRegistrationsCount,
      companyRegistrationsCount,
      newsflashCount,
      recentRegistrations,
      recentEvents,
    ] = await Promise.all([
      Event.countDocuments(notDeleted),
      Speaker.countDocuments(notDeleted),
      Sponsor.countDocuments(notDeleted),
      Registration.countDocuments(notDeleted),
      Company.countDocuments(notDeleted),
      Blog.countDocuments(notDeleted),
      Brochure.countDocuments(notDeleted),
      Exhibitor.countDocuments(notDeleted),
      Agenda.countDocuments(notDeleted),
      Gallery.countDocuments(notDeleted),
      User.countDocuments(notDeleted),
      InvestorRegistration.countDocuments(notDeleted),
      CompanyRegistration.countDocuments(notDeleted),
      Newsflash.countDocuments(notDeleted),
      Registration.find(notDeleted)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("event", "title slug")
        .lean(),
      Event.find(notDeleted)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title slug year startDate location status")
        .lean(),
    ]);

    return successResponse({
      counts: {
        events: eventsCount,
        speakers: speakersCount,
        sponsors: sponsorsCount,
        registrations: registrationsCount,
        companies: companiesCount,
        blogs: blogsCount,
        brochures: brochuresCount,
        exhibitors: exhibitorsCount,
        agendas: agendasCount,
        gallery: galleryCount,
        users: usersCount,
        investorRegistrations: investorRegistrationsCount,
        companyRegistrations: companyRegistrationsCount,
        newsflash: newsflashCount,
      },
      recentRegistrations,
      recentEvents,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
