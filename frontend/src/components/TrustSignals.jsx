import React from 'react';
import { Shield, Award, Globe, Lock, CheckCircle, Star, Users, Zap, Package } from 'lucide-react';

const TrustSignals = () => {
  const certifications = [
    { name: 'SOC 2 Type II', icon: Shield, description: 'Security & Compliance' },
    { name: 'ISO 27001', icon: Lock, description: 'Information Security' },
    { name: 'GDPR Compliant', icon: Globe, description: 'Data Protection' },
    { name: 'PCI DSS', icon: Award, description: 'Payment Security' }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Logistics Director, TechCorp',
      content: 'GLOBALTRACK reduced our WISMO calls by 67% and improved customer satisfaction scores by 23%. The AI predictions are incredibly accurate.',
      rating: 5
    },
    {
      name: 'Michael Roberts',
      role: 'CEO, GlobalShip Inc',
      content: 'The enterprise plan transformed our supply chain visibility. We now have real-time insights across 200+ carriers in one dashboard.',
      rating: 5
    },
    {
      name: 'Emma Wilson',
      role: 'Operations Manager, RetailMax',
      content: 'Outstanding support team and the API integration was seamless. Our developers had it up and running in less than a day.',
      rating: 5
    }
  ];

  const stats = [
    { value: '2.5M+', label: 'Shipments Tracked Daily', icon: Globe },
    { value: '99.9%', label: 'Uptime SLA', icon: Zap },
    { value: '200+', label: 'Carrier Integrations', icon: Globe },
    { value: '15K+', label: 'Enterprise Clients', icon: Users }
  ];

  return (
    <div className="bg-gray-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Industry Certifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 text-center">
                <div className="p-4 bg-indigo-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <cert.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold mb-1">{cert.name}</h3>
                <p className="text-gray-400 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Trusted by Industry Leaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="text-white font-bold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Enterprise-Grade Security</h3>
              <ul className="space-y-3">
                {[
                  'End-to-end encryption for all data',
                  'Multi-factor authentication',
                  'Role-based access control',
                  'Regular security audits',
                  '24/7 threat monitoring',
                  'Compliance with major standards'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-white">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-24 h-24 text-white mx-auto mb-4" />
                <div className="text-white text-lg font-bold">SOC 2 Type II Certified</div>
                <div className="text-indigo-200">Annual audit completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSignals;