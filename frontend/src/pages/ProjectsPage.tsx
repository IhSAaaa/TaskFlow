import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Project, CreateProjectRequest, UpdateProjectRequest, ProjectFilter, ProjectMember } from '../services/api';
import ApiService from '../services/api';

interface ProjectsPageProps {
  // onNavigate: (path: string) => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<ProjectFilter>({ page: 1, limit: 10 });
  const [totalProjects, setTotalProjects] = useState(0);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // Form states
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    tags: [],
    budget: 0,
    members: []
  });

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, [filter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProjects(filter);
      setProjects(response.data);
      setTotalProjects(response.total);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      await ApiService.searchUsers('');
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadProjectMembers = async (projectId: string) => {
    try {
      const response = await ApiService.getProjectMembers(projectId);
      setMembers(response);
    } catch (error) {
      console.error('Error loading project members:', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      await ApiService.createProject(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', start_date: '', end_date: '', tags: [], budget: 0, members: [] });
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    try {
      const updateData: UpdateProjectRequest = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        tags: formData.tags,
        budget: formData.budget
      };
      await ApiService.updateProject(selectedProject.id, updateData);
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ name: '', description: '', start_date: '', end_date: '', tags: [], budget: 0, members: [] });
      loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    try {
      await ApiService.deleteProject(selectedProject.id);
      setShowDeleteModal(false);
      setSelectedProject(null);
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      tags: project.tags || [],
      budget: project.budget || 0,
      members: project.members?.map(m => m.user_id) || []
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleViewMembers = async (project: Project) => {
    setSelectedProject(project);
    await loadProjectMembers(project.id);
    setShowMembersModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search projects..."
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={filter.search || ''}
            onChange={(e) => setFilter({ ...filter, search: e.target.value, page: 1 })}
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value, page: 1 })}
          >
            <option value="">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 truncate">{project.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || 'No description available'}
              </p>

              <div className="space-y-2 mb-4">
                {project.start_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Start Date:</span>
                    <span className="text-gray-900">{formatDate(project.start_date)}</span>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">End Date:</span>
                    <span className="text-gray-900">{formatDate(project.end_date)}</span>
                  </div>
                )}
                {project.budget && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Budget:</span>
                    <span className="text-gray-900">{formatCurrency(project.budget)}</span>
                  </div>
                )}
                {project.progress !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress:</span>
                    <span className="text-gray-900">{project.progress}%</span>
                  </div>
                )}
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => {/* onNavigate(`/projects/${project.id}`) */}}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleViewMembers(project)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="View Members"
                  >
                    <UserPlusIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEditClick(project)}
                    className="text-yellow-600 hover:text-yellow-800 p-1"
                    title="Edit Project"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(project)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Project"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalProjects > filter.limit! && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setFilter({ ...filter, page: Math.max(1, (filter.page || 1) - 1) })}
              disabled={filter.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-2">
              Page {filter.page} of {Math.ceil(totalProjects / filter.limit!)}
            </span>
            <button
              onClick={() => setFilter({ ...filter, page: (filter.page || 1) + 1 })}
              disabled={filter.page! >= Math.ceil(totalProjects / filter.limit!)}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProject(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Project</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedProject.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Project Members - {selectedProject.name}</h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.user?.first_name?.[0]}{member.user?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.user?.first_name} {member.user?.last_name}</p>
                      <p className="text-sm text-gray-600">{member.user?.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                    member.role === 'admin' ? 'bg-red-100 text-red-800' :
                    member.role === 'member' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage; 