import React, { useState, useEffect } from 'react';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import TaskListView from '../components/TaskListView';
import TaskBoardView from '../components/TaskBoardView';
import TaskCalendarView from '../components/TaskCalendarView';
import TaskDetailPanel from '../components/TaskDetailPanel';
import TaskForm from '../components/TaskForm';
import ViewSwitcher, { ViewType } from '../components/ViewSwitcher';
import type { FilterConfig } from '../components/FilterBar';
import TeamMembersView from '../components/TeamMembersView';
import ProjectsView from '../components/ProjectsView';
import LabResourcesView from '../components/LabResourcesView';
import LabWorkspaceInventoryForm from '../components/LabWorkspaceInventoryForm';
import LabWorkspaceInstrumentForm from '../components/LabWorkspaceInstrumentForm';
import LabWorkspaceProjectForm from '../components/LabWorkspaceProjectForm';
import LabWorkspaceTeamMemberForm from '../components/LabWorkspaceTeamMemberForm';
import LabWorkspaceInstrumentBookingForm from '../components/LabWorkspaceInstrumentBookingForm';
import LabWorkspaceMaintenanceForm from '../components/LabWorkspaceMaintenanceForm';
import InventoryTransactionForm from '../components/InventoryTransactionForm';
import InstrumentRosterView from '../components/InstrumentRosterView';
import InstrumentRosterForm from '../components/InstrumentRosterForm';
import LabCreateModal from '../components/LabCreateModal';
import LabShowcaseModal from '../components/LabShowcaseModal';
import TeamMessagingPage from './TeamMessagingPage';
import { notifyDashboardSync } from '../utils/dashboardSync';
import DocumentImportModal from '../components/DocumentImportModal';
import { smartParseProjectText } from '../utils/projectImport';
import {
  PlusIcon,
  UsersIcon,
  FolderIcon,
  ClipboardListIcon,
  CubeIcon,
  GlobeAltIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from '../components/icons';
import { PageHeader } from '../components/PageHeader';

const ACTIVE_LAB_KEY = 'lab-workspace-active-lab';

const authHeaders = () => ({ Authorization: `Bearer ${getAuthToken() || ''}` });

type LabSection = 'tasks' | 'projects' | 'resources' | 'teams' | 'messages';

const SECTIONS: { id: LabSection; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'tasks', label: 'Tasks', icon: ClipboardListIcon },
  { id: 'projects', label: 'Projects', icon: FolderIcon },
  { id: 'resources', label: 'Resources', icon: CubeIcon },
  { id: 'teams', label: 'Team', icon: UsersIcon },
  { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
];

const LEGACY_SECTIONS: Record<string, LabSection> = {
  experiments: 'tasks',
  inventory: 'resources',
  instruments: 'resources',
  messaging: 'messages',
};

const isLabSection = (value: string | null): value is LabSection =>
  !!value && SECTIONS.some((s) => s.id === value);


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
  protocol_id?: string | null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  
  const [activeSection, setActiveSection] = useState<LabSection>(() => {
    const section = searchParams.get('section');
    // Legacy: messages lived under Team
    if (section === 'teams' && searchParams.get('tab') === 'messages') return 'messages';
    if (section && LEGACY_SECTIONS[section]) return LEGACY_SECTIONS[section];
    return isLabSection(section) ? section : 'tasks';
  });

  useEffect(() => {
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');

    // Redirect legacy Team → Messages nested tab
    if (section === 'teams' && tab === 'messages') {
      const next = new URLSearchParams(searchParams);
      next.set('section', 'messages');
      next.delete('tab');
      setSearchParams(next, { replace: true });
      setActiveSection('messages');
      return;
    }

    if (section && LEGACY_SECTIONS[section]) {
      const mapped = LEGACY_SECTIONS[section];
      const next = new URLSearchParams(searchParams);
      next.set('section', mapped);
      next.delete('tab');
      setSearchParams(next, { replace: true });
      if (mapped !== activeSection) setActiveSection(mapped);
      return;
    }
    if (isLabSection(section) && section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const switchSection = (section: LabSection) => {
    setActiveSection(section);
    const next = new URLSearchParams(searchParams);
    next.set('section', section);
    next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [filters, setFilters] = useState<FilterConfig>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true); 
  // Inventory form state
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any | null>(null);
  
  // Instrument form state
  const [showInstrumentForm, setShowInstrumentForm] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<any | null>(null);
  
  // Project form state
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProjectImport, setShowProjectImport] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  
  // Team member form state
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<any | null>(null);
  const [labId, setLabId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_LAB_KEY) || null
  );
  const [myLabs, setMyLabs] = useState<any[]>([]);
  const [showCreateLab, setShowCreateLab] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showcaseLab, setShowcaseLab] = useState<any | null>(null);
  
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

  // Fetch workspace data when active lab changes
  useEffect(() => {
    fetchWorkspace();
  }, [labId]);

  // Fetch data when workspace is loaded
  useEffect(() => {
    if (workspace) {
      fetchProjects();
      fetchInventory();
      fetchInstruments();
      fetchTeamMembers();
    }
  }, [workspace]);

  const activeLab = myLabs.find((l) => l.id === labId) || myLabs[0] || null;
  const canManageShowcase =
    activeLab &&
    ['principal_researcher', 'admin'].includes(activeLab.membership_role || '');

  const switchLab = (nextLabId: string) => {
    if (!nextLabId || nextLabId === labId) return;
    localStorage.setItem(ACTIVE_LAB_KEY, nextLabId);
    setLabId(nextLabId);
    setSelectedTask(null);
  };
  const fetchInventory = async () => {
    try {
      const token = getAuthToken();
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
      const token = getAuthToken();
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

  // Fetch tasks when filters or view changes
  useEffect(() => {
    if (workspace) {
      fetchTasks();
    }
  }, [workspace, filters, currentView]);
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
      const token = getAuthToken();
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
      const token = getAuthToken();
      const params: Record<string, string> = {};
      if (labId) params.lab_id = labId;
      const response = await axios.get('/api/lab-workspace', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const workspaceData = response.data.workspace;
      const labs = response.data.labs || [];
      const activeId = response.data.activeLabId || workspaceData?.lab_id || null;
      setMyLabs(labs);
      if (activeId && activeId !== labId) {
        setLabId(activeId);
        localStorage.setItem(ACTIVE_LAB_KEY, activeId);
      } else if (activeId) {
        localStorage.setItem(ACTIVE_LAB_KEY, activeId);
      }
      setWorkspace(workspaceData);
    } catch (error: any) {
      console.error('Error fetching workspace:', error);
      if (error.response?.status === 404) {
        setWorkspace(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = getAuthToken();
      const params: any = {
        workspace_id: workspace?.id,
        sort_by: 'due_date',
        sort_order: 'ASC',
      };

      if (filters.status) params.status = filters.status.join(',');
      if (filters.priority) params.priority = filters.priority.join(',');
      if (filters.search) params.search = filters.search;
      if (filters.assignee_id) params.assignee_id = filters.assignee_id.join(',');

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
      const token = getAuthToken();
      
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
      const active = labId || (workspace as any)?.lab_id;
      const response = await axios
        .get('/api/labs/members', {
          headers: { Authorization: `Bearer ${token}` },
          params: active ? { lab_id: active } : undefined,
        })
        .catch(() => ({ data: { members: [] } }));

      const members = response.data.members || [];
      setTeamMembers(
        members.map((m: any) => ({
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
          permissions: m.permissions,
        }))
      );

      if (response.data.lab_id) {
        setLabId(response.data.lab_id);
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
      const token = getAuthToken();
      await axios.post('/api/lab-workspace/tasks', taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTasks();
      await fetchWorkspace(); // Refresh workspace to update counts
      setShowTaskForm(false);
      notifyDashboardSync('lab-workspace');
    } catch (error: any) {
      console.error('Error creating task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create task';
      alert(errorMessage);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const token = getAuthToken();
      await axios.put(`/api/lab-workspace/tasks/${taskId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
      fetchWorkspace(); // Refresh counts
      notifyDashboardSync('lab-workspace');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const token = getAuthToken();
      await axios.delete(`/api/lab-workspace/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTasks(tasks.filter(t => t.id !== taskId));
      setSelectedTask(null);
      fetchWorkspace();
      notifyDashboardSync('lab-workspace');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    try {
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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

  const handleOpenTaskForm = () => {
    setShowTaskForm(true);
  };

  const handleCreateInventoryItem = async (itemData: any) => {
    try {
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
      await axios.post(`/api/instruments/alerts/${alertId}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleCreateInstrument = async (instrumentData: any) => {
    try {
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
    if (selectedProject?.id) {
      await handleUpdateProject(selectedProject.id, projectData);
    } else {
      await handleCreateProject(projectData);
    }
    setShowProjectForm(false);
    setSelectedProject(null);
  };

  const handleCreateTeamMember = async (memberData: any) => {
    try {
      const token = getAuthToken();
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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-50/95 via-white to-slate-50/80 border-b border-sky-100 px-6 pt-5 pb-0">
        <PageHeader
          className="mb-5 !rounded-none !border-0 !shadow-none !ring-0 !bg-transparent !px-0 !py-0"
          title="Lab workspace"
          accent="sky"
          icon={<CubeIcon />}
          subtitle={
            activeLab?.name ? (
              <>
                Working in <span className="font-medium text-slate-800">{activeLab.name}</span>
                {Number(activeLab.is_showcased) ? ' · live on Networking' : ''}
              </>
            ) : (
              <>
                Tasks, projects, resources, and team messaging for your lab.
              </>
            )
          }
          actions={
            <>
              {myLabs.length > 1 && (
                <select
                  aria-label="Switch lab"
                  className="rounded-md border border-sky-200 bg-white/90 px-2.5 py-2 text-[13px] text-slate-800 max-w-[11rem]"
                  value={labId || activeLab?.id || ''}
                  onChange={(e) => switchLab(e.target.value)}
                >
                  {myLabs.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Landing (Tasks): lab-level actions + New task */}
              {(myLabs.length === 0 || activeSection === 'tasks') && (
                <button
                  type="button"
                  onClick={() => setShowCreateLab(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-sky-900 bg-white/90 border border-sky-200 rounded-md hover:bg-sky-50 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create lab
                </button>
              )}
              {activeSection === 'tasks' && canManageShowcase && (
                <button
                  type="button"
                  onClick={() => {
                    setShowcaseLab(activeLab);
                    setShowShowcase(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-sky-900 bg-white/90 border border-sky-200 rounded-md hover:bg-sky-50 transition-colors"
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  {Number(activeLab?.is_showcased) ? 'Edit showcase' : 'Showcase'}
                </button>
              )}
              {activeSection === 'tasks' && (
                <button
                  type="button"
                  onClick={() => handleOpenTaskForm()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  New task
                </button>
              )}
              {activeSection === 'projects' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowProjectImport(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-sky-900 bg-white/90 border border-sky-200 rounded-md hover:bg-sky-50 transition-colors"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenProjectForm()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    New project
                  </button>
                </>
              )}
              {activeSection === 'resources' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenInventoryForm()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-sky-900 bg-white/90 border border-sky-200 rounded-md hover:bg-sky-50 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Consumable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenInstrumentForm()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Instrument
                  </button>
                </>
              )}
              {activeSection === 'teams' && (
                <button
                  type="button"
                  onClick={() => handleOpenTeamMemberForm()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Invite
                </button>
              )}
            </>
          }
        />
        <div className="flex gap-1 overflow-x-auto">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchSection(id)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap ${
                activeSection === id
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {activeSection === id && (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-slate-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {!workspace && !loading && (
        <div className="mx-6 mt-6 bg-white border border-slate-200/80 rounded-xl p-8 text-center">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-2">Setting up your lab workspace</h2>
          <p className="text-[13px] text-slate-500 max-w-md mx-auto">
            We could not load your workspace yet. Refresh the page, or check that you are signed in.
            A personal lab is created automatically on first visit.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main View Area */}
        <div className="flex-1 flex overflow-hidden">
          {activeSection === 'messages' ? (
            <div className="flex-1 overflow-hidden min-h-0">
              <TeamMessagingPage embedded teamMembers={teamMembers} />
            </div>
          ) : activeSection === 'teams' ? (
            <TeamMembersView
              members={teamMembers}
              onInvite={() => handleOpenTeamMemberForm()}
              onEdit={(member) => handleOpenTeamMemberForm(member)}
              onDelete={(member) => handleDeleteTeamMember(member.user_id || member.id)}
              loading={loading}
            />
          ) : activeSection === 'projects' ? (
            <ProjectsView
              projects={projects}
              onCreateProject={() => handleOpenProjectForm()}
              onImportProject={() => setShowProjectImport(true)}
              onProjectClick={(project) => handleOpenProjectForm(project)}
              onDeleteProject={(project) => handleDeleteProject(project.id)}
              loading={loading}
            />
          ) : activeSection === 'resources' ? (
            <LabResourcesView
              inventory={inventoryItems}
              instruments={instruments}
              onCreateConsumable={() => handleOpenInventoryForm()}
              onCreateEquipment={() => handleOpenInstrumentForm()}
              onConsumableClick={(item) => handleOpenInventoryForm(item)}
              onEquipmentClick={(instrument) => handleOpenInstrumentForm(instrument)}
              onTransaction={(item) => handleOpenTransactionForm(item)}
              onBookInstrument={(instrument) => handleOpenBookingForm(instrument)}
              onScheduleMaintenance={(instrument) => handleOpenMaintenanceForm(instrument)}
              onViewRoster={(instrument) => handleOpenRosterView(instrument)}
              loading={loading}
              hideCreateMenu
            />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[12rem] max-w-sm">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search tasks…"
                      value={filters.search || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, search: e.target.value || undefined }))
                      }
                      className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                    />
                  </div>
                  <span className="text-[12px] text-slate-500 tabular-nums">
                    {tasks.length} task{tasks.length === 1 ? '' : 's'}
                  </span>
                  <div className="ml-auto">
                    <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
                  </div>
                </div>

                {currentView === 'list' && (
                  <TaskListView
                    tasks={tasks}
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
                    onCreateTask={() => handleOpenTaskForm()}
                    loading={loading}
                  />
                )}
              </div>

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
        assignees={assignees}
        workspaceId={workspace?.id}
        defaultAssigneeId={user?.id || ''}
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
        key={selectedProject?.id || selectedProject?.project_title || 'new-project'}
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

      {showProjectImport && (
        <DocumentImportModal
          title="Import project brief"
          subtitle="Upload a proposal or paste aims — we’ll draft the project title and description."
          parseText={smartParseProjectText}
          onCancel={() => setShowProjectImport(false)}
          onParsed={(result) => {
            setShowProjectImport(false);
            setSelectedProject({
              ...result.payload,
              // mark as create (no id)
            });
            setShowProjectForm(true);
          }}
        />
      )}

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

      <LabCreateModal
        open={showCreateLab}
        onClose={() => setShowCreateLab(false)}
        onCreated={(lab) => {
          localStorage.setItem(ACTIVE_LAB_KEY, lab.id);
          setLabId(lab.id);
          setShowCreateLab(false);
          setShowcaseLab(lab);
          setShowShowcase(true);
        }}
      />

      <LabShowcaseModal
        open={showShowcase}
        lab={showcaseLab}
        onClose={() => {
          setShowShowcase(false);
          setShowcaseLab(null);
        }}
        onSaved={() => {
          void fetchWorkspace();
        }}
      />
    </div>
  );
};

export default LabWorkspacePage;

