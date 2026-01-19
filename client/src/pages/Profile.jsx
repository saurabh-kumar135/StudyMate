import { User, Clock, Flame, Trophy, BookOpen, Brain, Target, TrendingUp } from 'lucide-react';

export default function Profile() {
  const user = {
    name: 'Student',
    email: 'student@studymate.com',
    joinedDate: 'January 2026',
    avatar: null
  };

  const stats = {
    totalHours: 45.5,
    currentStreak: 12,
    longestStreak: 18,
    quizzesCompleted: 24,
    materialsReviewed: 38,
    aiChatsCount: 156,
    averageScore: 85
  };

  const achievements = [
    { icon: Flame, title: '7-Day Streak', description: 'Study for 7 days in a row', unlocked: true },
    { icon: Trophy, title: 'Quiz Master', description: 'Complete 10 quizzes', unlocked: true },
    { icon: Brain, title: 'AI Enthusiast', description: 'Have 50 AI conversations', unlocked: true },
    { icon: BookOpen, title: 'Bookworm', description: 'Review 20 materials', unlocked: true },
    { icon: Target, title: 'Perfect Score', description: 'Get 100% on a quiz', unlocked: false },
    { icon: TrendingUp, title: 'Consistent Learner', description: 'Study 30 days in a row', unlocked: false }
  ];

  const recentActivity = [
    { date: 'Today', activities: ['Completed Biology quiz (90%)', 'AI chat about Photosynthesis', 'Summarized Chapter 5'] },
    { date: 'Yesterday', activities: ['Completed Math quiz (85%)', 'Reviewed 3 study materials'] },
    { date: '2 days ago', activities: ['AI chat about Cell Structure', 'Generated Chemistry quiz'] }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Profile</h1>
          <p className="text-gray-600">Your study journey and achievements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{user.name}</h2>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <p className="text-sm text-gray-500">Joined {user.joinedDate}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-teal-500" />
                    </div>
                    <span className="text-gray-700">Total Hours</span>
                  </div>
                  <span className="font-bold text-gray-800">{stats.totalHours}h</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-gray-700">Current Streak</span>
                  </div>
                  <span className="font-bold text-gray-800">{stats.currentStreak} days</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-gray-700">Quizzes</span>
                  </div>
                  <span className="font-bold text-gray-800">{stats.quizzesCompleted}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-gray-700">AI Chats</span>
                  </div>
                  <span className="font-bold text-gray-800">{stats.aiChatsCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Achievements & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Performance Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl">
                  <div className="text-3xl font-bold text-teal-600 mb-1">{stats.totalHours}h</div>
                  <div className="text-sm text-gray-600">Study Time</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{stats.longestStreak}</div>
                  <div className="text-sm text-gray-600">Longest Streak</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.averageScore}%</div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-1">{stats.materialsReviewed}</div>
                  <div className="text-sm text-gray-600">Materials</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      achievement.unlocked
                        ? 'border-purple-200 bg-gradient-to-br from-teal-50 to-blue-50'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-teal-500 to-cyan-500'
                          : 'bg-gray-300'
                      }`}>
                        <achievement.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-1">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        {achievement.unlocked && (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Unlocked ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((day, index) => (
                  <div key={index} className="border-l-4 border-teal-500 pl-4">
                    <h4 className="font-bold text-gray-800 mb-2">{day.date}</h4>
                    <ul className="space-y-1">
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
