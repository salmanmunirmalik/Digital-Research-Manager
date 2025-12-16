import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';

interface List {
  id: string;
  name: string;
  space_id?: string;
  folder_id?: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    assignee_id?: string;
    list_id: string;
    space_id?: string;
    folder_id?: string;
  }) => void;
  listId?: string;
  spaceId?: string;
  folderId?: string;
  assignees?: Array<{ id: string; name: string; avatar_url?: string }>;
  defaultStatus?: string;
  availableLists?: List[];
  workspace?: any;
  onCreateList?: (name: string, spaceId?: string, folderId?: string) => Promise<string>;
}

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  listId,
  spaceId,
  folderId,
  assignees = [],
  defaultStatus = 'to_do',
  availableLists = [],
  workspace,
  onCreateList
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'normal',
    due_date: '',
    assignee_id: '',
    list_id: listId || ''
  });
  const [showListSelector, setShowListSelector] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  // Update list_id when listId prop changes
  useEffect(() => {
    if (listId) {
      setFormData(prev => ({ ...prev, list_id: listId }));
    }
  }, [listId]);

  if (!isOpen) return null;

  // Get all available lists from workspace
  const getAllLists = (): List[] => {
    if (availableLists && availableLists.length > 0) {
      return availableLists;
    }
    
    if (!workspace?.spaces) return [];
    
    const lists: List[] = [];
    workspace.spaces.forEach((space: any) => {
      // Lists directly in space
      if (space.lists) {
        space.lists.forEach((list: any) => {
          lists.push({ ...list, space_id: space.id });
        });
      }
      // Lists in folders
      if (space.folders) {
        space.folders.forEach((folder: any) => {
          if (folder.lists) {
            folder.lists.forEach((list: any) => {
              lists.push({ ...list, space_id: space.id, folder_id: folder.id });
            });
          }
        });
      }
    });
    return lists;
  };

  const allLists = getAllLists();

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    if (!onCreateList) {
      alert('Cannot create list: onCreateList function not provided');
      return;
    }

    setCreatingList(true);
    try {
      const newListId = await onCreateList(newListName.trim(), spaceId, folderId);
      setFormData(prev => ({ ...prev, list_id: newListId }));
      setShowListSelector(false);
      setNewListName('');
    } catch (error: any) {
      alert(error.message || 'Failed to create list');
    } finally {
      setCreatingList(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (!formData.list_id) {
      setShowListSelector(true);
      return;
    }

    const selectedList = allLists.find(l => l.id === formData.list_id);
    const finalSpaceId = selectedList?.space_id || spaceId;
    const finalFolderId = selectedList?.folder_id || folderId;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date || undefined,
      assignee_id: formData.assignee_id || undefined,
      list_id: formData.list_id,
      space_id: finalSpaceId,
      folder_id: finalFolderId
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'normal',
      due_date: '',
      assignee_id: '',
      list_id: listId || ''
    });
    setShowListSelector(false);
    setNewListName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* List Selection */}
          {(!formData.list_id || showListSelector) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select or Create a List <span className="text-red-500">*</span>
              </label>
              
              {allLists.length > 0 ? (
                <select
                  value={formData.list_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, list_id: e.target.value }));
                    setShowListSelector(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                  required
                >
                  <option value="">-- Select a list --</option>
                  {allLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-600 mb-3">No lists available. Create one below.</p>
              )}

              {onCreateList && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter new list name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateList();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || creatingList}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingList ? 'Creating...' : 'Create List'}
                  </button>
                </div>
              )}
            </div>
          )}

          {formData.list_id && !showListSelector && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">List</p>
                <p className="text-sm text-gray-600">
                  {allLists.find(l => l.id === formData.list_id)?.name || 'Selected list'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowListSelector(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Change
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;

