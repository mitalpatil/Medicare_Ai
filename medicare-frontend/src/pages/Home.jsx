"use client";

import { Link } from "react-router-dom";
import {
  Hospital,
  Users,
  FileText,
  Brain,
  Shield,
  Activity,
  ArrowRight,
  CheckCircle,
  Stethoscope,
  Star,
} from "lucide-react";
import { useState } from "react";

const Home = () => {
  const features = [
    {
      icon: Hospital,
      title: "Hospital Onboarding",
      description: "Seamless registration and setup for healthcare facilities",
      color: "blue",
      benefits: ["Quick registration process", "Centralized hospital management", "Multi-location support"],
    },
    {
      icon: FileText,
      title: "Document Processing",
      description: "AI-powered document scanning and data extraction",
      color: "green",
      benefits: ["Prescription scanning", "Report digitization", "Structured data extraction"],
    },
    {
      icon: Brain,
      title: "AI Diagnostics",
      description: "LLM-powered diagnostic suggestions and treatment guidance",
      color: "purple",
      benefits: ["Disease classification", "Treatment suggestions", "Continuous learning"],
    },
    {
      icon: Users,
      title: "Patient Management",
      description: "Comprehensive patient onboarding and history tracking",
      color: "orange",
      benefits: ["Digital intake forms", "Medical history timeline", "Cross-hospital records"],
    },
    {
      icon: Shield,
      title: "Data Security",
      description: "HIPAA-compliant data sharing with patient consent",
      color: "red",
      benefits: ["Consent management", "Encrypted storage", "Audit trails"],
    },
    {
      icon: Activity,
      title: "Analytics Dashboard",
      description: "Real-time insights and performance metrics",
      color: "teal",
      benefits: ["Patient flow tracking", "Diagnostic accuracy", "Usage analytics"],
    },
  ];

  const stats = [
    { label: "Hospitals Registered", value: "150+", icon: Hospital },
    { label: "Patients Onboarded", value: "25,000+", icon: Users },
    { label: "Documents Processed", value: "100,000+", icon: FileText },
    { label: "AI Accuracy Rate", value: "94%", icon: Brain },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      hospital: "Metropolitan General Hospital",
      content:
        "MediCare AI has revolutionized our patient onboarding process. The AI-powered document processing saves us hours of manual work every day.",
      rating: 5,
    },
    {
      name: "Dr. Michael Chen",
      role: "Emergency Department Director",
      hospital: "City Medical Center",
      content:
        "The diagnostic suggestions from the AI assistant have been incredibly helpful, especially for complex cases. It's like having a medical expert available 24/7.",
      rating: 5,
    },
    {
      name: "Lisa Rodriguez",
      role: "Hospital Administrator",
      hospital: "Regional Healthcare Network",
      content:
        "The seamless data sharing between our facilities has improved patient care coordination significantly. The security features give us complete peace of mind.",
      rating: 5,
    },
  ];

  return (
    <div className="text-gray-800">
      {/* Hero */}
      <section className="text-center py-12 bg-blue-50 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Intelligent Patient Care <span className="text-blue-600">Powered by AI</span>
          </h1>
          <p className="text-lg mb-6">
            Streamline hospital onboarding, digitize records, and access LLM-powered diagnostics with MediCare AI.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 flex items-center gap-2">
              Register Hospital <ArrowRight size={18} />
            </Link>
           
          </div>

        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-10 px-6 bg-white text-center">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx}>
              <Icon size={24} className="mx-auto mb-2 text-blue-600" />
              <h3 className="text-xl font-bold">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-10 px-6">
        <h2 className="text-3xl font-bold text-center mb-6">Platform Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-5 rounded shadow hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-blue-700">
                  <Icon size={20} />
                  {feature.title}
                </div>
                <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  {feature.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-6 bg-white">
        <h2 className="text-3xl font-bold text-center mb-6">Trusted by Professionals</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="border p-4 rounded shadow">
              <div className="flex mb-2 text-yellow-500">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} size={16} />
                ))}
              </div>
              <p className="text-sm mb-3 italic">"{t.content}"</p>
              <div className="text-sm text-gray-700">
                <strong>{t.name}</strong> – {t.role}
                <br />
                <span className="text-xs text-gray-500">{t.hospital}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-10 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Healthcare?</h2>
        <p className="mb-6">Join 150+ hospitals using MediCare AI for better, smarter care delivery.</p>
        <div className="flex justify-center gap-4">
          
          
        </div>
      </section>
    </div>
  );
};

export default Home;
