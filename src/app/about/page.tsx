"use client";

import { motion } from "framer-motion";
import { Users, Star, Heart, Phone, Mail } from "lucide-react";
import Link from "next/link";
import ImagePlaceholder from "../../components/ImagePlaceholder";
import Navigation from "../../components/Navigation";

export default function AboutPage() {
  const team = [
    {
      name: "Srinisha Chennamaneni",
      role: "Co-Founder",
      bio: "Healthcare professional with 10+ years of experience",
      image: "/girl-1.jpeg",
    },
    {
      name: "Abhishek Rao",
      role: "Co-Founder and COO",
      bio: "Operations expert specializing in scaling family-focused businesses and ensuring quality standards.",
      image: "/abhishekroy.jpeg",
    },
    {
      name: "Ashvak Sheik",
      role: "Head of Product",
      bio: "Product leader passionate about creating intuitive experiences that connect families with quality care.",
      image: "/asvaik.jpeg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Navigation Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">About Us</span>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors hover:scale-105 transition-transform"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Back to Home</span>
              </Link>
            </div>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="mb-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-blue-700 mb-4">
                About KinderBridge
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              We are on a mission to solve the Canadian childcare crisis by
              connecting parents with quality childcare providers.
            </p>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 font-medium">
                Ready to serve 10,000+ families
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Every child deserves access to quality early childhood education
                and care. We believe that finding the right KinderBridge
                location should not be overwhelming or stressful for parents.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                KinderBridge was born from a simple idea: what if we could
                create a platform that would make the daycare search process
                transparent, efficient, and trustworthy.
              </p>
              <p className="text-lg text-gray-600">
                Today, we are ready to serve thousands of families across the
                country, helping them make informed decisions about their
                children&apos;s early education journey.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Building Trust
                </h3>
                <p className="text-gray-600">
                  We verify every KinderBridge location, read through parent
                  reviews, and ensure safety standards are met before listing
                  them on our platform.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate people behind KinderBridge who are dedicated to
              making a difference in families&apos; lives.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4">
                  {member.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <ImagePlaceholder
                      width={96}
                      height={96}
                      type="team"
                      className="w-full h-full rounded-full"
                      alt={`${member.name} - ${member.role}`}
                    />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Our Story
                  </h3>
                  <p className="text-gray-600">
                    Founded in 2020, DayCare Concierge started as a small team
                    of parents and educators who experienced firsthand the
                    challenges of finding quality childcare.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                How It All Started
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Srinisha, our Co-founder, is a student mother. struggling to
                find reliable, quality childcare for her kid. After months of
                research, phone calls, and visits, she realized there had to be
                a better way.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                She teamed up with Abhishek and Ashvak, who shared her vision of
                creating a platform that would make the KinderBridge search
                process transparent, efficient, and trustworthy.
              </p>
              <p className="text-lg text-gray-600">
                Today, we are proud to have created a platform that is ready to
                help thousands of families find their perfect KinderBridge
                match, and we are just getting started.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Find Your Perfect daycare?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of parents who have found their ideal daycare
              location through our platform.
            </p>
            {/* Auto Apply Feature Promotional Card - Added by Abhishek */}
            <div className="max-w-md mx-auto mb-10 p-6 bg-white rounded-3xl border-4 border-yellow-400 shadow-xl relative text-left">
              <div className="absolute -top-4 -right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-lg uppercase">
                ONLY 100 SPOTS
              </div>
              <div className="text-center mb-4">
                <h4 className="text-xl font-black text-gray-900">Auto Apply Feature</h4>
                <p className="text-green-600 font-bold flex items-center justify-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Claim Your Free Access after our Beta Launch!
                </p>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "Submit applications to 30 daycares at once",
                  "Automated follow-up reminders",
                  "Compare daycares side-by-side",
                  "Smart follow-up scheduling",
                  "Application tracking dashboard"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 font-semibold text-xs">
                    <div className="mt-0.5 bg-green-100 rounded-full p-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 rounded-xl text-white text-center font-black bg-gradient-to-r from-blue-600 to-purple-600 shadow-md text-sm">
                CLAIM MY FREE SPOT
              </Link>
              <p className="text-center text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tight">
                🚀 NO PAYMENT REQUIRED
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/search"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Browse daycare
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">KinderBridge</h3>
              <p className="text-gray-400">
                Connecting parents with trusted Daycares for a brighter future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Parents</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/search"
                    className="hover:text-white transition-colors"
                  >
                    Find Daycare
                  </Link>
                </li>
                <li>
                  <Link
                    href="/parent/dashboard?tab=favorites"
                    className="hover:text-white transition-colors"
                  >
                    My Favorites
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Information</h4>
              <div className="space-y-2 text-gray-400">
                <p className="font-medium text-gray-300 mb-2">Email Us</p>
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>Info@kinderbridge.com</span>
                </div>
                <p className="text-sm text-gray-500">
                  We typically respond within 24 hours
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Business Hours</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Monday - Friday: 9:00 AM - 6:00 PM EST</li>
                <li>Saturday: 10:00 AM - 2:00 PM EST</li>
                <li>Sunday: Closed</li>
                <li className="text-sm text-gray-500 mt-3">
                  Emergency support available 24/7
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} KinderBridge. All rights reserved.</p>
            <div className="mt-2 flex justify-center items-center space-x-2">
              <span className="text-xs text-gray-500">
                Developed by ASH Web Solutions
              </span>
              <a
                href="https://ashwebsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-800"
                title="Visit ASH WEB Solutions"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
