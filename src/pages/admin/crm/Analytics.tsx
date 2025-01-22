import React from 'react';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold">1,234</p>
              <p className="text-sm text-green-600">+12% this month</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Course Enrollments</p>
              <p className="text-2xl font-semibold">3,456</p>
              <p className="text-sm text-green-600">+8% this month</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Badges Awarded</p>
              <p className="text-2xl font-semibold">789</p>
              <p className="text-sm text-green-600">+15% this month</p>
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-semibold">68%</p>
              <p className="text-sm text-green-600">+5% this month</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts would go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
            <p className="text-gray-500">User Growth Chart</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Course Engagement</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
            <p className="text-gray-500">Course Engagement Chart</p>
          </div>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Top Performing Courses</h3>
        <div className="space-y-4">
          {[
            { name: 'Web Development Basics', enrollments: 245, completion: 78 },
            { name: 'Advanced JavaScript', enrollments: 189, completion: 65 },
            { name: 'UI/UX Design', enrollments: 156, completion: 82 }
          ].map(course => (
            <div key={course.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{course.name}</h4>
                <p className="text-sm text-gray-500">{course.enrollments} enrollments</p>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="text-sm text-gray-500">Completion Rate</div>
                  <div className="font-medium">{course.completion}%</div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${course.completion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
