import React, { useState } from 'react';
import { Users, Award, BookOpen, BarChart } from 'lucide-react';
import UserManagement from './crm/UserManagement';
import BadgeAssignment from './crm/BadgeAssignment';
import CourseProgress from './crm/CourseProgress';
import Analytics from './crm/Analytics';

type Tab = 'users' | 'badges' | 'progress' | 'analytics';

export default function CRMManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'badges', label: 'Badge Assignment', icon: Award },
    { id: 'progress', label: 'Course Progress', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b">
          <nav className="flex -mb-px">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex-1 flex items-center justify-center py-4 px-1 border-b-2 text-sm font-medium
                  ${activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'badges' && <BadgeAssignment />}
        {activeTab === 'progress' && <CourseProgress />}
        {activeTab === 'analytics' && <Analytics />}
      </div>
    </div>
  );
}
