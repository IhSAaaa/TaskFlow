import React from 'react';
import { Plus, Filter, Search } from 'lucide-react';

export const TasksPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage and track your tasks</p>
          </div>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select className="input">
              <option>All Status</option>
              <option>Todo</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
            <select className="input">
              <option>All Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <button className="btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Tasks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Design homepage mockup</h3>
                <p className="text-sm text-gray-500">Website Redesign</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">John Doe</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  High
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  In Progress
                </span>
                <span className="text-sm text-gray-500">Jan 15</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Implement user authentication</h3>
                <p className="text-sm text-gray-500">Mobile App</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Jane Smith</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  Medium
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  Todo
                </span>
                <span className="text-sm text-gray-500">Jan 20</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Write API documentation</h3>
                <p className="text-sm text-gray-500">Backend API</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Mike Johnson</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Low
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Done
                </span>
                <span className="text-sm text-gray-500">Jan 18</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 