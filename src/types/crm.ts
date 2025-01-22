export interface User {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  headline: string;
  location: string;
  created_at: string;
  enrollments: {
    course: {
      title: string;
      level: string;
    };
    progress: number;
  }[];
  meetups: {
    title: string;
    event_date: string;
  }[];
}
