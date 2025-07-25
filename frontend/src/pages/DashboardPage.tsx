import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, Users, TrendingUp, ArrowRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const stats = [
    {
      name: 'Total Tasks',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: CheckSquare,
      href: '/tasks',
    },
    {
      name: 'In Progress',
      value: '8',
      change: '+5%',
      changeType: 'positive',
      icon: Clock,
      href: '/tasks?status=in_progress',
    },
    {
      name: 'Team Members',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Users,
      href: '/team',
    },
    {
      name: 'Completion Rate',
      value: '85%',
      change: '+3%',
      changeType: 'positive',
      icon: TrendingUp,
      href: '/projects',
    },
  ];

  const recentTasks = [
    {
      id: 1,
      title: 'Design homepage mockup',
      project: 'Website Redesign',
      assignee: 'John Doe',
      dueDate: '2024-01-15',
      priority: 'high',
      status: 'in_progress',
    },
    {
      id: 2,
      title: 'Implement user authentication',
      project: 'Mobile App',
      assignee: 'Jane Smith',
      dueDate: '2024-01-20',
      priority: 'medium',
      status: 'todo',
    },
    {
      id: 3,
      title: 'Write API documentation',
      project: 'Backend API',
      assignee: 'Mike Johnson',
      dueDate: '2024-01-18',
      priority: 'low',
      status: 'done',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
          <Link
            to="/tasks"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center"
          >
            View all tasks
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTasks.map((task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500">{task.project}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{task.assignee}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">{task.dueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 