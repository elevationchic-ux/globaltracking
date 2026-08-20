import React, { useState } from 'react';
import { Search, MapPin, Package, Truck, Plane, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useGlobalTrack } from '../context/GlobalTrackContext';
import { useI18n } from '../i18n/I18nContext';

const Header = () => {
  const { theme, setTheme, shipments, selectShipment } = useGlobalTrack();
  const { t } = useI18n();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    if (e.key !== 'Enter') return;
    const query = searchValue.trim().toLowerCase();
    if (!query) return;
    const match = shipments.find(
      (s) => s.trackingNumber.toLowerCase() === query
    );
    if (match) selectShipment(match.id);
  };

  const themes = [
    { id: 'dark', name: 'Dark', color: 'bg-gray-900' },
    { id: 'satellite', name: 'Satellite', color: 'bg-blue-900' },
    { id: 'street', name: 'Street', color: 'bg-gray-700' },
    { id: 'light', name: 'Light', color: 'bg-gray-200' }
  ];

  // Live counts derived from the tracked fleet (no fabricated figures).
  const statusBadges = [
    { label: 'DELIVERED', count: shipments.filter((s) => s.status === 'DELIVERED').length, color: 'bg-green-500' },
    { label: 'IN TRANSIT', count: shipments.filter((s) => s.status === 'IN TRANSIT').length, color: 'bg-blue-500' },
    { label: 'OUT FOR DELIVERY', count: shipments.filter((s) => s.status === 'OUT FOR DELIVERY').length, color: 'bg-yellow-500' },
    { label: 'EXCEPTION', count: shipments.filter((s) => s.status === 'EXCEPTION').length, color: 'bg-red-500' }
  ];
  const activeCount = shipments.filter(
    (s) => s.status === 'IN TRANSIT' || s.status === 'OUT FOR DELIVERY'
  ).length;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-full mx-auto px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="flex items-center space-x-2">
              <GlobeIcon className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
              <div>
                <h1 className="text-sm md:text-xl font-bold text-white tracking-wider">GLOBALTRACK</h1>
                <p className="hidden md:block text-xs text-cyan-400 tracking-widest">REAL-TIME WORLDWIDE TRACKING · FREE</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2 md:max-w-2xl md:mx-8">
            <div className="relative">
              <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('hero.placeholder')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchSubmit}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Status Indicators  hidden on small screens (mobile cockpit) */}
          <div className="hidden md:flex items-center space-x-2">
            {statusBadges.map((badge) => (
              <div key={badge.label} className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg border border-gray-700">
                <div className={`w-2 h-2 rounded-full ${badge.color} animate-pulse`}></div>
                <span className="text-xs text-gray-300 font-medium">{badge.label}</span>
                <span className="text-xs text-cyan-400 font-mono">{badge.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Selector  desktop only */}
        <div className="hidden md:flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Map Theme:</span>
            <div className="flex space-x-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    theme === t.id
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-400 font-mono">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>UTC: {new Date().toISOString().split('T')[1].split('.')[0]}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4" />
              <span>Tracking: {shipments.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Truck className="w-4 h-4" />
              <span>Active: {activeCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GlobeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export default Header;