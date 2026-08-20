import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Package, Clock, AlertTriangle, CheckCircle, Truck, Plane, Ship } from 'lucide-react';

const AnalyticsDashboard = () => {
  const shipmentData = [
    { name: 'Jan', delivered: 65, inTransit: 28, delayed: 7 },
    { name: 'Feb', delivered: 59, inTransit: 35, delayed: 6 },
    { name: 'Mar', delivered: 80, inTransit: 15, delayed: 5 },
    { name: 'Apr', delivered: 81, inTransit: 18, delayed: 1 },
    { name: 'May', delivered: 56, inTransit: 39, delayed: 5 },
    { name: 'Jun', delivered: 55, inTransit: 40, delayed: 5 }
  ];

  const carrierPerformance = [
    { name: 'DHL', onTime: 92, delayed: 8 },
    { name: 'FedEx', onTime: 89, delayed: 11 },
    { name: 'UPS', onTime: 87, delayed: 13 },
    { name: 'Maersk', onTime: 85, delayed: 15 },
    { name: 'CMA CGM', onTime: 82, delayed: 18 }
  ];

  const transportModes = [
    { name: 'Air Freight', value: 35, color: '#3b82f6' },
    { name: 'Ocean Freight', value: 45, color: '#10b981' },
    { name: 'Ground', value: 20, color: '#f59e0b' }
  ];

  const stats = [
    { label: 'Total Shipments', value: '12,847', change: '+12%', icon: Package, trend: 'up' },
    { label: 'On-Time Delivery', value: '94.2%', change: '+2.1%', icon: CheckCircle, trend: 'up' },
    { label: 'Avg Transit Time', value: '4.2 days', change: '-0.5 days', icon: Clock, trend: 'down' },
    { label: 'Exceptions', value: '127', change: '-18%', icon: AlertTriangle, trend: 'down' }
  ];

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Real-time insights into your logistics performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-600 rounded-lg">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Shipment Trends */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Shipment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shipmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="delivered" stackId="a" fill="#10b981" name="Delivered" />
                <Bar dataKey="inTransit" stackId="a" fill="#3b82f6" name="In Transit" />
                <Bar dataKey="delayed" stackId="a" fill="#ef4444" name="Delayed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Carrier Performance */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Carrier Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={carrierPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="onTime" fill="#10b981" name="On-Time" />
                <Bar dataKey="delayed" fill="#ef4444" name="Delayed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transport Modes */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Transport Mode Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={transportModes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {transportModes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Carbon Footprint */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Carbon Footprint Reduction</h3>
              <p className="text-green-100">Your optimized routes have reduced CO2 emissions by 23% this month</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">-23%</div>
              <div className="text-green-100 text-sm">vs last month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;