import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Users, MessageCircle, Calendar, TrendingUp, Flag, Shield, Eye, Download, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const engagementData = [
  { month: 'Jan', chatSessions: 450, bookings: 85, forumPosts: 120 },
  { month: 'Feb', chatSessions: 580, bookings: 98, forumPosts: 145 },
  { month: 'Mar', chatSessions: 720, bookings: 112, forumPosts: 189 },
  { month: 'Apr', chatSessions: 890, bookings: 134, forumPosts: 203 },
  { month: 'May', chatSessions: 950, bookings: 156, forumPosts: 234 },
  { month: 'Jun', chatSessions: 1100, bookings: 178, forumPosts: 267 }
];

const crisisData = [
  { category: 'Anxiety', count: 45, percentage: 35 },
  { category: 'Depression', count: 38, percentage: 29 },
  { category: 'Crisis', count: 25, percentage: 19 },
  { category: 'Academic Stress', count: 22, percentage: 17 }
];

const COLORS = ['#8B5CF6', '#3B82F6', '#EF4444', '#F59E0B'];

const flaggedContent = [
  {
    id: '1',
    type: 'forum_post',
    title: 'Feeling hopeless about everything',
    author: 'Anonymous User',
    timestamp: new Date(Date.now() - 1800000),
    severity: 'high',
    reason: 'Self-harm mentions',
    status: 'pending'
  },
  {
    id: '2',
    type: 'chat_session',
    title: 'Crisis intervention needed',
    author: 'Anonymous User',
    timestamp: new Date(Date.now() - 3600000),
    severity: 'critical',
    reason: 'Suicide ideation',
    status: 'escalated'
  },
  {
    id: '3',
    type: 'forum_post',
    title: 'Struggling with panic attacks',
    author: 'Anonymous User',
    timestamp: new Date(Date.now() - 7200000),
    severity: 'medium',
    reason: 'Crisis keywords detected',
    status: 'reviewed'
  }
];

export default function AdminPage() {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This page is only accessible to administrators.
          </p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'escalated': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'reviewed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2,847</p>
              <p className="text-sm text-green-600">+12% this month</p>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Active Users</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monthly active platform users</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
              <p className="text-sm text-green-600">+8% this week</p>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Chat Sessions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">AI chatbot interactions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">178</p>
              <p className="text-sm text-green-600">+15% this month</p>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Therapy Bookings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Professional sessions scheduled</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">13</p>
              <p className="text-sm text-red-600">Requires attention</p>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Crisis Alerts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Content flagged for review</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Platform Engagement Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line type="monotone" dataKey="chatSessions" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="forumPosts" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crisis Intervention Categories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={crisisData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {crisisData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderCrisisMonitoring = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Crisis Monitoring Dashboard
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Flagged Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Flagged Content Requiring Review
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {flaggedContent.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.type.replace('_', ' ')} • {item.author}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </button>
                      <button className="text-red-600 hover:text-red-900 flex items-center">
                        <Flag className="w-4 h-4 mr-1" />
                        Escalate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crisis Intervention Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-800 dark:text-red-300">Critical Alerts</h3>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-800 dark:text-red-300">5</p>
          <p className="text-sm text-red-600 dark:text-red-400">Immediate intervention required</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">High Priority</h3>
            <Flag className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-300">8</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Review within 2 hours</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Resolved Today</h3>
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">23</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Successfully handled</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor platform health, user engagement, and crisis intervention activities
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('crisis')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'crisis'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Crisis Monitoring
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'crisis' && renderCrisisMonitoring()}
      </div>
    </div>
  );
}