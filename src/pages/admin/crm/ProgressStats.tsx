import React from 'react';
import { Award, BookOpen, Clock } from 'lucide-react';
import type { User } from '../../../types/crm';

interface ProgressStatsProps {
  user: User;
}

export default function ProgressStats({ user }: ProgressStatsProps) {
  const totalCourses = user.enrollments?.length || 0;
  const averageProgress = user.enrollments?.length
    ? Math.round(
        user.enrollments.reduce((acc, curr) => acc + curr.progress, 0) /
          user.enrollments.length
      )
    : 0;
  const totalTime = user.enrollments?.reduce(
    (acc, curr) => acc + curr.course.duration,
    0
  ) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-2xl font-semibold">{totalCourses}</p>
          </div>
          <BookOpen className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Average Progress</p>
            <p className="text-2xl font-semibold">{averageProgress}%</p>
          </div>
          <Award className="w-8 h-8 text-green-500" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Time</p>
            <p className="text-2xl font-semibold">{totalTime} mins</p>
          </div>
          <Clock className="w-8 h-8 text-purple-500" />
        </div>
      </div>
    </div>
  );
}
