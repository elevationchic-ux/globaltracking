import React from 'react';
import { Check, X, Star, Zap, Globe, Lock, Headphones, BarChart, Zap as ZapIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

const PricingPlans = () => {
  const { t } = useI18n();
  const plans = [
    {
      name: 'Basic',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for individuals and small businesses',
      features: [
        { name: '5 shipments/month', included: true },
        { name: '200+ carriers worldwide', included: true },
        { name: 'Basic tracking dashboard', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Standard support', included: true },
        { name: 'API access', included: false },
        { name: 'Branded tracking pages', included: false },
        { name: 'SMS notifications', included: false },
        { name: 'AI ETA predictions', included: false },
        { name: 'Carbon emissions tracking', included: false },
        { name: '24/7 priority support', included: false },
        { name: 'Dedicated account manager', included: false },
        { name: 'Custom integrations', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'White-label solution', included: false }
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: 'Premium',
      price: '$49',
      period: 'per month',
      description: 'Best for growing businesses with higher volume',
      features: [
        { name: 'Unlimited shipments', included: true },
        { name: '200+ carriers worldwide', included: true },
        { name: 'Advanced tracking dashboard', included: true },
        { name: 'Email + SMS notifications', included: true },
        { name: 'Priority support', included: true },
        { name: 'API access (10K calls/mo)', included: true },
        { name: 'Branded tracking pages', included: true },
        { name: 'AI ETA predictions', included: true },
        { name: 'Carbon emissions tracking', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Route optimization', included: true },
        { name: 'Bulk data export', included: true },
        { name: 'Custom alerts', included: true },
        { name: '24/7 support', included: false },
        { name: 'Dedicated account manager', included: false },
        { name: 'White-label solution', included: false }
      ],
      cta: 'Start Premium Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact sales',
      description: 'For large organizations with custom needs',
      features: [
        { name: 'Unlimited shipments', included: true },
        { name: '200+ carriers worldwide', included: true },
        { name: 'Enterprise dashboard', included: true },
        { name: 'Multi-channel notifications', included: true },
        { name: '24/7 dedicated support', included: true },
        { name: 'Unlimited API access', included: true },
        { name: 'White-label solution', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'AI ETA predictions', included: true },
        { name: 'Carbon emissions tracking', included: true },
        { name: 'Advanced analytics & BI', included: true },
        { name: 'Route optimization', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom carrier onboarding', included: true },
        { name: 'SLA guarantees', included: true },
        { name: 'Compliance tools', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="bg-gray-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Scale your logistics operations with flexible pricing designed for businesses of all sizes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-b from-indigo-600 to-purple-700 text-white scale-105 shadow-2xl'
                  : 'bg-gray-800 text-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>MOST POPULAR</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? '' : 'text-gray-500'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-white text-indigo-600 hover:bg-gray-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                onClick={() => {
                  if (plan.name === 'Enterprise') {
                    window.location.href = 'mailto:support@globaltracking.vercel.app?subject=Enterprise%20Plan%20Inquiry';
                  } else if (plan.name === 'Premium') {
                    window.location.href = '/help?topic=premium';
                  } else {
                    window.location.href = '/';
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-gray-800 rounded-full mb-2">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-white font-semibold">99.9% Uptime</p>
            <p className="text-gray-400 text-sm">SLA Guaranteed</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-gray-800 rounded-full mb-2">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-white font-semibold">200+ Carriers</p>
            <p className="text-gray-400 text-sm">Worldwide Coverage</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-gray-800 rounded-full mb-2">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-semibold">Bank-Level Security</p>
            <p className="text-gray-400 text-sm">SOC 2 Compliant</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-gray-800 rounded-full mb-2">
              <Headphones className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-white font-semibold">24/7 Support</p>
            <p className="text-gray-400 text-sm">Premium Plans</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;