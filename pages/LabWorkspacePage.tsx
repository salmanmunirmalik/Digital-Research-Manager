/**
 * Lab Workspace Page
 * ClickUp-inspired task management system for lab management
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import LabWorkspaceSidebar from '../components/LabWorkspaceSidebar';
import TaskListView from '../components/TaskListView';
import TaskBoardView from '../components/TaskBoardView';
import TaskCalendarView from '../components/TaskCalendarView';
import TaskDetailPanel from '../components/TaskDetailPanel';
import TaskForm from '../components/TaskForm';
import ViewSwitcher, { ViewType } from '../components/ViewSwitcher';
import FilterBar, { FilterConfig } from '../components/FilterBar';
import TeamMembersView from '../components/TeamMembersView';
import DirectMessagingView from '../components/DirectMessagingView';
import ProjectsView from '../components/ProjectsView';
import InventoryView from '../components/InventoryView';
import InstrumentsView from '../components/InstrumentsView';
import LabWorkspaceInventoryForm from '../components/LabWorkspaceInventoryForm';
import LabWorkspaceInstrumentForm from '../components/LabWorkspaceInstrumentForm';
import LabWorkspaceProjectForm from '../components/LabWorkspaceProjectForm';
import LabWorkspaceTeamMemberForm from '../components/LabWorkspaceTeamMemberForm';
import LabWorkspaceInstrumentBookingForm from '../components/LabWorkspaceInstrumentBookingForm';
import LabWorkspaceMaintenanceForm from '../components/LabWorkspaceMaintenanceForm';
import InventoryTransactionForm from '../components/InventoryTransactionForm';
import InstrumentRosterView from '../components/InstrumentRosterView';
import InstrumentRosterForm from '../components/InstrumentRosterForm';
import { PlusIcon, UsersIcon, FolderIcon, BeakerIcon, WrenchScrewdriverIcon } from '../components/icons';

interface Workspace {
  id: string;
  name: string;
  spaces?: Space[];
}

interface Space {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  task_count?: number;
  folders?: Folder[];
  lists?: List[];
}

interface Folder {
  id: string;
  name: string;
  color?: string;
  task_count?: number;
  lists?: List[];
}

interface List {
  id: string;
  name: string;
  color?: string;
  task_count?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'to_do' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string | null;
  assignee_id?: string | null;
  assignee_name?: string;
  assignee_avatar?: string;
  incomplete_subtasks?: number;
  total_subtasks?: number;
  comment_count?: number;
  progress_percentage?: number;
  tags?: string[];
  list_id?: string;
  space_id?: string;
}

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
}

interface Comment {
  id: string;
  content: string;
  user_name?: string;
  user_avatar?: string;
  created_at: string;
}

interface Assignee {
  id: string;
  name: string;
  avatar_url?: string;
}

const LabWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  
  const [activeSection, setActiveSection] = useState<'teams' | 'projects' | 'tasks' | 'inventory' | 'instruments'>('teams');
  const [showDirectMessaging, setShowDirectMessaging] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [filters, setFilters] = useState<FilterConfig>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>();
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [selectedListId, setSelectedListId] = useState<string | undefined>();
  
  const [loading, setLoading] = useState(true);
  const [taskFormListId, setTaskFormListId] = useState<string>('');
  
  // Inventory form state
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any | null>(null);
  
  // Instrument form state
  const [showInstrumentForm, setShowInstrumentForm] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<any | null>(null);
  
  // Project form state
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  
  // Team member form state
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<any | null>(null);
  const [labId, setLabId] = useState<string | null>(null);
  
  // Instrument booking and maintenance state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedInstrumentForBooking, setSelectedInstrumentForBooking] = useState<any | null>(null);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedInstrumentForMaintenance, setSelectedInstrumentForMaintenance] = useState<any | null>(null);
  const [instrumentBookings, setInstrumentBookings] = useState<any[]>([]);

  // Inventory transaction state
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedItemForTransaction, setSelectedItemForTransaction] = useState<any | null>(null);

  // Instrument roster state
  const [showRosterView, setShowRosterView] = useState(false);
  const [showRosterForm, setShowRosterForm] = useState(false);
  const [selectedInstrumentForRoster, setSelectedInstrumentForRoster] = useState<any | null>(null);

  // Fetch workspace data
  useEffect(() => {
    fetchWorkspace();
  }, []);

  // Fetch data when workspace is loaded
  useEffect(() => {
    if (workspace) {
      fetchProjects();
      fetchInventory();
      fetchInstruments();
    }
  }, [workspace]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      let labId: string | null = null;
      
      if (workspace && (workspace as any).lab_id) {
        labId = (workspace as any).lab_id;
      } else {
        const labResponse = await axios.get('/api/labs/members', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { members: [] } }));
        
        if (labResponse.data.members && labResponse.data.members.length > 0) {
          labId = labResponse.data.members[0].lab_id;
        }
      }
      
      if (labId) {
        const response = await axios.get('/api/inventory', {
          headers: { Authorization: `Bearer ${token}` },
          params: { lab_id: labId }
        });
        
        setInventoryItems(response.data.items || []);
      } else {
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryItems([]);
    }
  };

  const fetchInstruments = async () => {
    try {
      const token = localStorage.getItem('token');
      let labId: string | null = null;
      
      if (workspace && (workspace as any).lab_id) {
        labId = (workspace as any).lab_id;
      } else {
        const labResponse = await axios.get('/api/labs/members', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { members: [] } }));
        
        if (labResponse.data.members && labResponse.data.members.length > 0) {
          labId = labResponse.data.members[0].lab_id;
        }
      }
      
      if (labId) {
        const response = await axios.get('/api/instruments', {
          headers: { Authorization: `Bearer ${token}` },
          params: { lab_id: labId }
        });
        
        setInstruments(response.data.instruments || []);
      } else {
        setInstruments([]);
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
      setInstruments([]);
    }
  };

  // Fetch tasks when filters or selection changes
  useEffect(() => {
    if (workspace) {
      fetchTasks();
    }
  }, [workspace, filters, selectedSpaceId, selectedListId, currentView]);

  // Fetch task details when selected
  useEffect(() => {
    if (selectedTask) {
      fetchTaskDetails(selectedTask.id);
      // Also fetch full task data if we only have partial data
      if (!selectedTask.description && !selectedTask.comment_count) {
        fetchFullTask(selectedTask.id);
      }
    }
  }, [selectedTask]);

  const fetchFullTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/lab-workspace/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.task) {
        setSelectedTask(response.data.task);
        setTasks(tasks.map(t => t.id === taskId ? response.data.task : t));
      }
    } catch (error) {
      console.error('Error fetching full task:', error);
    }
  };

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/lab-workspace', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const workspaceData = response.data.workspace;
      setWorkspace(workspaceData);
      
      // Auto-select first space/list if available
      if (workspaceData?.spaces && workspaceData.spaces.length > 0) {
        const firstSpace = workspaceData.spaces[0];
        setSelectedSpaceId(firstSpace.id);
        
        // Find first list
        const firstList = firstSpace.lists?.[0] || 
                         firstSpace.folders?.[0]?.lists?.[0];
        if (firstList) {
          setSelectedListId(firstList.id);
        }
      } else if (workspaceData && (!workspaceData.spaces || workspaceData.spaces.length === 0)) {
        // If workspace exists but has no spaces, refresh to get the default space
        setTimeout(() => fetchWorkspace(), 500);
      }
    } catch (error: any) {
      console.error('Error fetching workspace:', error);
      if (error.response?.status === 404) {
        // User not in a lab - this is expected for some users
        setWorkspace(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {
        workspace_id: workspace?.id
      };

      if (selectedSpaceId) params.space_id = selectedSpaceId;
      if (selectedListId) params.list_id = selectedListId;
      if (filters.status) params.status = filters.status.join(',');
      if (filters.priority) params.priority = filters.priority.join(',');
      if (filters.assignee_id) params.assignee_id = filters.assignee_id.join(',');
      if (filters.search) params.search = filters.search;

      let endpoint = '/api/lab-workspace/tasks';
      if (currentView === 'board') {
        endpoint = '/api/lab-workspace/tasks/board';
      } else if (currentView === 'calendar') {
        endpoint = '/api/lab-workspace/tasks/calendar';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (currentView === 'board' && response.data.board) {
        // Flatten board structure
        const allTasks: Task[] = [];
        Object.values(response.data.board).forEach((columnTasks: any) => {
          allTasks.push(...columnTasks);
        });
        setTasks(allTasks);
      } else {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch subtasks
      const subtasksResponse = await axios.get(`/api/lab-workspace/tasks/${taskId}/subtasks`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { subtasks: [] } }));
      
      // Fetch comments
      const commentsResponse = await axios.get(`/api/lab-workspace/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { comments: [] } }));

      setSubtasks(subtasksResponse.data.subtasks || []);
      setComments(commentsResponse.data.comments || []);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const fetchAssignees = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch lab members as potential assignees
      const response = await axios.get('/api/labs/members', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { members: [] } }));
      
      const members = response.data.members || [];
      setAssignees(members.map((m: any) => ({
        id: m.user_id || m.id,
        name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.name || 'Unknown',
        avatar_url: m.avatar_url
      })));
    } catch (error) {
      console.error('Error fetching assignees:', error);
    }
  };

  useEffect(() => {
    fetchAssignees();
    fetchTeamMembers();
    fetchProjects();
    fetchInventory();
    fetchInstruments();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      let labId: string | null = null;
      
      // Try to get lab_id from workspace
      if (workspace && (workspace as any).lab_id) {
        labId = (workspace as any).lab_id;
      } else {
        // Fallback: get lab_id from members
        const labResponse = await axios.get('/api/labs/members', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { members: [] } }));
        
        if (labResponse.data.members && labResponse.data.members.length > 0) {
          labId = labResponse.data.members[0].lab_id;
        }
      }
      
      if (labId) {
        const response = await axios.get('/api/project-management/projects', {
          headers: { Authorization: `Bearer ${token}` },
          params: { lab_id: labId }
        });
        
        setProjects(Array.isArray(response.data) ? response.data : []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch lab members
      const response = await axios.get('/api/labs/members', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { members: [] } }));
      
      const members = response.data.members || [];
      setTeamMembers(members.map((m: any) => ({
        id: m.user_id || m.id,
        user_id: m.user_id || m.id,
        name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.name || 'Unknown',
        email: m.email || '',
        role: m.role || m.position_title || '',
        status: m.is_active ? 'active' : 'inactive',
        avatar_url: m.avatar_url,
        team: 'Lab Team',
        account_type: m.role || 'Member',
        first_name: m.first_name,
        last_name: m.last_name,
        permissions: m.permissions
      })));
      
      // Extract lab_id from response if available
      if (response.data.lab?.id) {
        setLabId(response.data.lab.id);
      } else if (workspace && (workspace as any).lab_id) {
        setLabId((workspace as any).lab_id);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/lab-workspace/tasks', taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTasks();
      await fetchWorkspace(); // Refresh workspace to update counts
      setShowTaskForm(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create task';
      alert(errorMessage);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/lab-workspace/tasks/${taskId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
      fetchWorkspace(); // Refresh counts
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/lab-workspace/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTasks(tasks.filter(t => t.id !== taskId));
      setSelectedTask(null);
      fetchWorkspace();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/lab-workspace/tasks/${taskId}/subtasks`, {
        title
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubtasks([...subtasks, response.data.subtask]);
      fetchTaskDetails(taskId); // Refresh
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      const token = localStorage.getItem('token');
      const subtask = subtasks.find(s => s.id === subtaskId);
      if (!subtask) return;

      await axios.put(`/api/lab-workspace/subtasks/${subtaskId}`, {
        is_completed: !subtask.is_completed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubtasks(subtasks.map(s => 
        s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
      ));
      
      if (selectedTask) {
        fetchTaskDetails(selectedTask.id);
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/lab-workspace/tasks/${taskId}/comments`, {
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComments([...comments, response.data.comment]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCreateSpace = async () => {
    const name = prompt('Enter space name:');
    if (!name) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/lab-workspace/spaces', {
        name,
        workspace_id: workspace?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchWorkspace();
    } catch (error: any) {
      console.error('Error creating space:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create space';
      alert(errorMessage);
    }
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    setTaskFormListId(listId);
  };

  const handleOpenTaskForm = (status?: string) => {
    // Always allow opening the form - it will handle list selection/creation
    setShowTaskForm(true);
  };

  const handleCreateInventoryItem = async (itemData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/inventory', itemData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInventory();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateInventoryItem = async (itemId: string, itemData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/inventory/${itemId}`, itemData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInventory();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInventory();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete inventory item');
    }
  };

  const handleOpenInventoryForm = (item?: any) => {
    setSelectedInventoryItem(item || null);
    setShowInventoryForm(true);
  };

  const handleInventorySubmit = async (itemData: any) => {
    if (selectedInventoryItem) {
      await handleUpdateInventoryItem(selectedInventoryItem.id, itemData);
    } else {
      await handleCreateInventoryItem(itemData);
    }
    setShowInventoryForm(false);
    setSelectedInventoryItem(null);
  };

  const handleOpenTransactionForm = (item: any) => {
    setSelectedItemForTransaction(item);
    setShowTransactionForm(true);
  };

  const handleTransactionSubmit = async (transactionData: any) => {
    if (!selectedItemForTransaction) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/inventory/${selectedItemForTransaction.id}/transactions`, transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInventory();
      setShowTransactionForm(false);
      setSelectedItemForTransaction(null);
    } catch (error: any) {
      throw error;
    }
  };

  const handleOpenRosterView = (instrument: any) => {
    setSelectedInstrumentForRoster(instrument);
    setShowRosterView(true);
  };

  const handleOpenRosterForm = () => {
    setShowRosterForm(true);
  };

  const handleRosterSubmit = async (rosterData: any) => {
    if (!selectedInstrumentForRoster) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/instruments/${selectedInstrumentForRoster.id}/roster`, rosterData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowRosterForm(false);
      if (showRosterView) {
        // Refresh roster view if open
        setShowRosterView(false);
        setTimeout(() => setShowRosterView(true), 100);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleAcknowledgeInventoryAlert = async (alertId: string) => {
    // For now, just acknowledge locally
    // In the future, can add API endpoint if needed
    console.log('Acknowledging inventory alert:', alertId);
  };

  const handleAcknowledgeInstrumentAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/instruments/alerts/${alertId}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleCreateInstrument = async (instrumentData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/instruments', instrumentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInstruments();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateInstrument = async (instrumentId: string, instrumentData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/instruments/${instrumentId}`, instrumentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInstruments();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteInstrument = async (instrumentId: string) => {
    if (!confirm('Are you sure you want to delete this instrument?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/instruments/${instrumentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInstruments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete instrument');
    }
  };

  const handleOpenInstrumentForm = (instrument?: any) => {
    setSelectedInstrument(instrument || null);
    setShowInstrumentForm(true);
  };

  const handleInstrumentSubmit = async (instrumentData: any) => {
    if (selectedInstrument) {
      await handleUpdateInstrument(selectedInstrument.id, instrumentData);
    } else {
      await handleCreateInstrument(instrumentData);
    }
    setShowInstrumentForm(false);
    setSelectedInstrument(null);
  };

  const fetchInstrumentBookings = async (instrumentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/instruments/${instrumentId}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.bookings || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  };

  const handleCreateBooking = async (bookingData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!selectedInstrumentForBooking) {
        throw new Error('No instrument selected');
      }
      
      const response = await axios.post(`/api/instruments/${selectedInstrumentForBooking.id}/bookings`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchInstruments();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleScheduleMaintenance = async (maintenanceData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!selectedInstrumentForMaintenance) {
        throw new Error('No instrument selected');
      }
      
      // Check if maintenance API endpoint exists, otherwise use instrument update
      const response = await axios.post(`/api/instruments/${selectedInstrumentForMaintenance.id}/maintenance`, maintenanceData, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(async () => {
        // Fallback: Update instrument with maintenance info
        return await axios.put(`/api/instruments/${selectedInstrumentForMaintenance.id}`, {
          ...selectedInstrumentForMaintenance,
          maintenance_notes: maintenanceData.notes,
          calibration_due_date: maintenanceData.scheduled_date
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      });
      
      await fetchInstruments();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleOpenBookingForm = async (instrument: any) => {
    setSelectedInstrumentForBooking(instrument);
    const bookings = await fetchInstrumentBookings(instrument.id);
    setInstrumentBookings(bookings);
    setShowBookingForm(true);
  };

  const handleOpenMaintenanceForm = (instrument: any) => {
    setSelectedInstrumentForMaintenance(instrument);
    setShowMaintenanceForm(true);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    await handleCreateBooking(bookingData);
    setShowBookingForm(false);
    setSelectedInstrumentForBooking(null);
    setInstrumentBookings([]);
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/project-management/projects', projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchProjects();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateProject = async (projectId: string, projectData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/project-management/projects/${projectId}`, projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchProjects();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/project-management/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchProjects();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleOpenProjectForm = (project?: any) => {
    setSelectedProject(project || null);
    setShowProjectForm(true);
  };

  const handleProjectSubmit = async (projectData: any) => {
    if (selectedProject) {
      await handleUpdateProject(selectedProject.id, projectData);
    } else {
      await handleCreateProject(projectData);
    }
    setShowProjectForm(false);
    setSelectedProject(null);
  };

  const handleCreateTeamMember = async (memberData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!labId) {
        throw new Error('Lab ID is required');
      }
      
      const response = await axios.post(`/api/labs/${labId}/members`, memberData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchTeamMembers();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateTeamMember = async (userId: string, memberData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!labId) {
        throw new Error('Lab ID is required');
      }
      
      const response = await axios.put(`/api/labs/${labId}/members/${userId}`, memberData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchTeamMembers();
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteTeamMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!labId) {
        throw new Error('Lab ID is required');
      }
      
      await axios.delete(`/api/labs/${labId}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchTeamMembers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove team member');
    }
  };

  const handleOpenTeamMemberForm = (member?: any) => {
    setSelectedTeamMember(member || null);
    setShowTeamMemberForm(true);
  };

  const handleTeamMemberSubmit = async (memberData: any) => {
    if (selectedTeamMember) {
      await handleUpdateTeamMember(selectedTeamMember.user_id || selectedTeamMember.id, memberData);
    } else {
      await handleCreateTeamMember(memberData);
    }
    setShowTeamMemberForm(false);
    setSelectedTeamMember(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Lab Workspace</h1>
          {activeSection === 'teams' ? (
            <button
              onClick={() => handleOpenTeamMemberForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Member
            </button>
          ) : activeSection === 'tasks' ? (
            <button
              onClick={() => handleOpenTaskForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Task
            </button>
          ) : activeSection === 'projects' ? (
            <button
              onClick={() => handleOpenProjectForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Project
            </button>
          ) : activeSection === 'inventory' ? (
            <button
              onClick={() => handleOpenInventoryForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Item
            </button>
          ) : activeSection === 'instruments' ? (
            <button
              onClick={() => {
                // TODO: Implement instrument creation
                alert('Instrument creation coming soon');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Instrument
            </button>
          ) : (
            <button
              onClick={() => {/* TODO: Implement invite */}}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Invite
            </button>
          )}
        </div>
        
        {/* Section Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveSection('teams')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSection === 'teams'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Teams
          </button>
          <button
            onClick={() => setActiveSection('projects')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSection === 'projects'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderIcon className="w-4 h-4" />
            Projects
          </button>
          <button
            onClick={() => setActiveSection('tasks')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === 'tasks'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveSection('inventory')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSection === 'inventory'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BeakerIcon className="w-4 h-4" />
            Inventory
          </button>
          <button
            onClick={() => setActiveSection('instruments')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSection === 'instruments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <WrenchScrewdriverIcon className="w-4 h-4" />
            Instruments
          </button>
        </div>
      </div>

      {/* Filter Bar - Only show for tasks */}
      {activeSection === 'tasks' && (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          assignees={assignees}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Only show for tasks */}
        {activeSection === 'tasks' && (
          <LabWorkspaceSidebar
          workspace={workspace}
          selectedSpaceId={selectedSpaceId}
          selectedFolderId={selectedFolderId}
          selectedListId={selectedListId}
          onSpaceSelect={setSelectedSpaceId}
          onFolderSelect={setSelectedFolderId}
          onListSelect={handleListSelect}
          onCreateSpace={handleCreateSpace}
          onCreateFolder={(spaceId) => {
            const name = prompt('Enter folder name:');
            if (!name) return;
            const token = localStorage.getItem('token');
            axios.post('/api/lab-workspace/folders', {
              name,
              space_id: spaceId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => fetchWorkspace())
            .catch(error => {
              console.error('Error creating folder:', error);
              alert('Failed to create folder');
            });
          }}
          onCreateList={(spaceId, folderId) => {
            const name = prompt('Enter list name:');
            if (!name) return;
            const token = localStorage.getItem('token');
            axios.post('/api/lab-workspace/lists', {
              name,
              space_id: spaceId,
              folder_id: folderId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
              fetchWorkspace();
            })
            .catch(error => {
              console.error('Error creating list:', error);
              const errorMessage = error.response?.data?.error || error.message || 'Failed to create list';
              alert(errorMessage);
            });
          }}
          loading={loading}
          />
        )}

        {/* Main View Area */}
        <div className="flex-1 flex overflow-hidden">
          {activeSection === 'teams' && showDirectMessaging ? (
            <DirectMessagingView
              teamMembers={teamMembers}
              onBack={() => setShowDirectMessaging(false)}
            />
          ) : activeSection === 'teams' ? (
            <TeamMembersView
              members={teamMembers}
              onInvite={() => handleOpenTeamMemberForm()}
              onEdit={(member) => handleOpenTeamMemberForm(member)}
              onDelete={(member) => handleDeleteTeamMember(member.user_id || member.id)}
              onMessage={() => setShowDirectMessaging(true)}
              loading={loading}
            />
          ) : activeSection === 'projects' ? (
            <ProjectsView
              projects={projects}
              onCreateProject={() => handleOpenProjectForm()}
              onProjectClick={(project) => handleOpenProjectForm(project)}
              loading={loading}
            />
          ) : activeSection === 'inventory' ? (
            <InventoryView
              items={inventoryItems}
              onCreateItem={() => handleOpenInventoryForm()}
              onItemClick={(item) => handleOpenInventoryForm(item)}
              onTransaction={(item) => handleOpenTransactionForm(item)}
              loading={loading}
            />
          ) : activeSection === 'instruments' ? (
            <InstrumentsView
              instruments={instruments}
              onCreateInstrument={() => handleOpenInstrumentForm()}
              onInstrumentClick={(instrument) => handleOpenInstrumentForm(instrument)}
              onBookInstrument={(instrument) => handleOpenBookingForm(instrument)}
              onScheduleMaintenance={(instrument) => handleOpenMaintenanceForm(instrument)}
              onViewRoster={(instrument) => handleOpenRosterView(instrument)}
              loading={loading}
            />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                {/* View Switcher for Tasks */}
                <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-end">
                  <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
                </div>
                
                {currentView === 'list' && (
                  <TaskListView
                    tasks={tasks}
                    groupBy={filters.status ? 'status' : undefined}
                    onTaskClick={setSelectedTask}
                    onCreateTask={() => handleOpenTaskForm()}
                    loading={loading}
                  />
                )}
                {currentView === 'board' && (
                  <TaskBoardView
                    tasks={tasks}
                    onTaskClick={setSelectedTask}
                    onCreateTask={handleOpenTaskForm}
                    loading={loading}
                  />
                )}
                {currentView === 'calendar' && (
                  <TaskCalendarView
                    tasks={tasks}
                    onTaskClick={setSelectedTask}
                    onCreateTask={(date) => handleOpenTaskForm()}
                    loading={loading}
                  />
                )}
                {currentView === 'table' && (
                  <div className="p-4">
                    <p className="text-gray-500">Table view coming soon</p>
                  </div>
                )}
              </div>

              {/* Task Detail Panel */}
              {selectedTask && (
                <TaskDetailPanel
                  task={selectedTask}
                  subtasks={subtasks}
                  comments={comments}
                  onClose={() => setSelectedTask(null)}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onAddComment={handleAddComment}
                  assignees={assignees}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleCreateTask}
        listId={taskFormListId || selectedListId}
        spaceId={selectedSpaceId}
        folderId={selectedFolderId}
        assignees={assignees}
        workspace={workspace}
        onCreateList={async (name: string, spaceId?: string, folderId?: string) => {
          const token = localStorage.getItem('token');
          const response = await axios.post('/api/lab-workspace/lists', {
            name,
            space_id: spaceId || selectedSpaceId,
            folder_id: folderId || selectedFolderId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          await fetchWorkspace();
          const newListId = response.data.list?.id || response.data.id;
          setSelectedListId(newListId);
          setTaskFormListId(newListId);
          return newListId;
        }}
      />

      {/* Inventory Form Modal */}
      <LabWorkspaceInventoryForm
        isOpen={showInventoryForm}
        onClose={() => {
          setShowInventoryForm(false);
          setSelectedInventoryItem(null);
        }}
        onSubmit={handleInventorySubmit}
        initialData={selectedInventoryItem}
        labId={workspace ? (workspace as any).lab_id : null}
      />

      {/* Instrument Form Modal */}
      <LabWorkspaceInstrumentForm
        isOpen={showInstrumentForm}
        onClose={() => {
          setShowInstrumentForm(false);
          setSelectedInstrument(null);
        }}
        onSubmit={handleInstrumentSubmit}
        initialData={selectedInstrument}
        labId={workspace ? (workspace as any).lab_id : null}
      />

      {/* Project Form Modal */}
      <LabWorkspaceProjectForm
        isOpen={showProjectForm}
        onClose={() => {
          setShowProjectForm(false);
          setSelectedProject(null);
        }}
        onSubmit={handleProjectSubmit}
        initialData={selectedProject}
        labId={workspace ? (workspace as any).lab_id : null}
        assignees={assignees}
      />

      {/* Team Member Form Modal */}
      <LabWorkspaceTeamMemberForm
        isOpen={showTeamMemberForm}
        onClose={() => {
          setShowTeamMemberForm(false);
          setSelectedTeamMember(null);
        }}
        onSubmit={handleTeamMemberSubmit}
        initialData={selectedTeamMember}
        labId={labId || (workspace ? (workspace as any).lab_id : null)}
        existingMembers={teamMembers}
      />

      {/* Instrument Booking Form Modal */}
      <LabWorkspaceInstrumentBookingForm
        isOpen={showBookingForm}
        onClose={() => {
          setShowBookingForm(false);
          setSelectedInstrumentForBooking(null);
          setInstrumentBookings([]);
        }}
        onSubmit={handleBookingSubmit}
        instrument={selectedInstrumentForBooking}
        existingBookings={instrumentBookings}
      />

      {/* Maintenance Form Modal */}
      <LabWorkspaceMaintenanceForm
        isOpen={showMaintenanceForm}
        onClose={() => {
          setShowMaintenanceForm(false);
          setSelectedInstrumentForMaintenance(null);
        }}
        onSubmit={handleScheduleMaintenance}
        instrument={selectedInstrumentForMaintenance}
        assignees={assignees}
      />

      {/* Inventory Transaction Form Modal */}
      <InventoryTransactionForm
        isOpen={showTransactionForm}
        onClose={() => {
          setShowTransactionForm(false);
          setSelectedItemForTransaction(null);
        }}
        item={selectedItemForTransaction}
        onSubmit={handleTransactionSubmit}
      />

      {/* Instrument Roster View Modal */}
      {selectedInstrumentForRoster && (
        <InstrumentRosterView
          isOpen={showRosterView}
          onClose={() => {
            setShowRosterView(false);
            setSelectedInstrumentForRoster(null);
          }}
          instrumentId={selectedInstrumentForRoster.id}
          instrumentName={selectedInstrumentForRoster.name}
          onAddMember={handleOpenRosterForm}
        />
      )}

      {/* Instrument Roster Form Modal */}
      {selectedInstrumentForRoster && (
        <InstrumentRosterForm
          isOpen={showRosterForm}
          onClose={() => {
            setShowRosterForm(false);
          }}
          instrumentId={selectedInstrumentForRoster.id}
          instrumentName={selectedInstrumentForRoster.name}
          onSubmit={handleRosterSubmit}
        />
      )}
    </div>
  );
};

export default LabWorkspacePage;

