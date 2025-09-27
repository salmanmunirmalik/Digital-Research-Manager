import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  DocumentTextIcon,
  LightBulbIcon
} from '../components/icons';

interface ProblemFormProps {
  onSubmit: (problem: ProblemData) => void;
  onCancel: () => void;
  initialData?: Partial<ProblemData>;
}

interface ProblemData {
  title: string;
  description: string;
  problem_type: 'equipment' | 'protocol' | 'data' | 'safety' | 'collaboration' | 'resource' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reported_by: string;
  assigned_to: string;
  affected_experiments: string[];
  affected_equipment: string[];
  symptoms: string[];
  possible_causes: string[];
  attempted_solutions: SolutionAttempt[];
  current_solution: string;
  resolution: string;
  prevention_measures: string[];
  lessons_learned: string;
  follow_up_date: string;
  tags: string[];
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

interface SolutionAttempt {
  solution: string;
  attempted_by: string;
  date: string;
  result: 'successful' | 'failed' | 'partial';
  notes: string;
}

const ProblemForm: React.FC<ProblemFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProblemData>({
    title: '',
    description: '',
    problem_type: 'equipment',
    severity: 'medium',
    status: 'reported',
    priority: 'medium',
    reported_by: user?.username || '',
    assigned_to: '',
    affected_experiments: [''],
    affected_equipment: [''],
    symptoms: [''],
    possible_causes: [''],
    attempted_solutions: [],
    current_solution: '',
    resolution: '',
    prevention_measures: [''],
    lessons_learned: '',
    follow_up_date: '',
    tags: [''],
    lab_id: '',
    privacy_level: 'lab',
    ...initialData
  });

  const [newItem, setNewItem] = useState({
    experiment: '',
    equipment: '',
    symptom: '',
    cause: '',
    measure: '',
    tag: ''
  });

  const problemTypes = [
    { value: 'equipment', label: 'Equipment Issue' },
    { value: 'protocol', label: 'Protocol Problem' },
    { value: 'data', label: 'Data Issue' },
    { value: 'safety', label: 'Safety Concern' },
    { value: 'collaboration', label: 'Collaboration Issue' },
    { value: 'resource', label: 'Resource Problem' },
    { value: 'other', label: 'Other' }
  ];

  const severities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const statuses = [
    { value: 'reported', label: 'Reported' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const handleInputChange = (field: keyof ProblemData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemAdd = (field: keyof ProblemData, item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), item.trim()]
      }));
    }
  };

  const handleArrayItemRemove = (field: keyof ProblemData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSolutionAttemptAdd = () => {
    setFormData(prev => ({
      ...prev,
      attempted_solutions: [...prev.attempted_solutions, {
        solution: '',
        attempted_by: '',
        date: '',
        result: 'failed',
        notes: ''
      }]
    }));
  };

  const handleSolutionAttemptUpdate = (index: number, field: keyof SolutionAttempt, value: any) => {
    setFormData(prev => ({
      ...prev,
      attempted_solutions: prev.attempted_solutions.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSolutionAttemptRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attempted_solutions: prev.attempted_solutions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-red-500" />
              Report Problem
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Problem Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Problem Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief, descriptive title of the problem"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Detailed description of the problem..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Problem Type *</label>
                    <Select
                      value={formData.problem_type}
                      onChange={(e) => handleInputChange('problem_type', e.target.value)}
                      options={problemTypes}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                    <Select
                      value={formData.severity}
                      onChange={(e) => handleInputChange('severity', e.target.value)}
                      options={severities}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      options={statuses}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      options={priorities}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reported By *</label>
                    <Input
                      value={formData.reported_by}
                      onChange={(e) => handleInputChange('reported_by', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                    <Input
                      value={formData.assigned_to}
                      onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                      placeholder="Person responsible for resolution"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Impact Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Affected Experiments</label>
                  {formData.affected_experiments.map((experiment, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={experiment}
                        onChange={(e) => {
                          const newExperiments = [...formData.affected_experiments];
                          newExperiments[index] = e.target.value;
                          handleInputChange('affected_experiments', newExperiments);
                        }}
                        placeholder="Experiment name or ID"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('affected_experiments', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.experiment}
                      onChange={(e) => setNewItem(prev => ({ ...prev, experiment: e.target.value }))}
                      placeholder="Add affected experiment"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('affected_experiments', newItem.experiment);
                        setNewItem(prev => ({ ...prev, experiment: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Affected Equipment</label>
                  {formData.affected_equipment.map((equipment, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={equipment}
                        onChange={(e) => {
                          const newEquipment = [...formData.affected_equipment];
                          newEquipment[index] = e.target.value;
                          handleInputChange('affected_equipment', newEquipment);
                        }}
                        placeholder="Equipment name or ID"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('affected_equipment', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.equipment}
                      onChange={(e) => setNewItem(prev => ({ ...prev, equipment: e.target.value }))}
                      placeholder="Add affected equipment"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('affected_equipment', newItem.equipment);
                        setNewItem(prev => ({ ...prev, equipment: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Symptoms and Causes */}
            <Card>
              <CardHeader>
                <CardTitle>Symptoms & Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observed Symptoms</label>
                  {formData.symptoms.map((symptom, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={symptom}
                        onChange={(e) => {
                          const newSymptoms = [...formData.symptoms];
                          newSymptoms[index] = e.target.value;
                          handleInputChange('symptoms', newSymptoms);
                        }}
                        placeholder="Describe the symptom"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('symptoms', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.symptom}
                      onChange={(e) => setNewItem(prev => ({ ...prev, symptom: e.target.value }))}
                      placeholder="Add symptom"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('symptoms', newItem.symptom);
                        setNewItem(prev => ({ ...prev, symptom: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Possible Causes</label>
                  {formData.possible_causes.map((cause, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={cause}
                        onChange={(e) => {
                          const newCauses = [...formData.possible_causes];
                          newCauses[index] = e.target.value;
                          handleInputChange('possible_causes', newCauses);
                        }}
                        placeholder="Possible cause"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('possible_causes', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.cause}
                      onChange={(e) => setNewItem(prev => ({ ...prev, cause: e.target.value }))}
                      placeholder="Add possible cause"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('possible_causes', newItem.cause);
                        setNewItem(prev => ({ ...prev, cause: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Solution Attempts */}
            <Card>
              <CardHeader>
                <CardTitle>Solution Attempts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.attempted_solutions.map((attempt, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <Input
                        value={attempt.solution}
                        onChange={(e) => handleSolutionAttemptUpdate(index, 'solution', e.target.value)}
                        placeholder="Solution attempted"
                      />
                      <Input
                        value={attempt.attempted_by}
                        onChange={(e) => handleSolutionAttemptUpdate(index, 'attempted_by', e.target.value)}
                        placeholder="Attempted by"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSolutionAttemptRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={attempt.date}
                        onChange={(e) => handleSolutionAttemptUpdate(index, 'date', e.target.value)}
                        placeholder="Date attempted"
                      />
                      <Select
                        value={attempt.result}
                        onChange={(e) => handleSolutionAttemptUpdate(index, 'result', e.target.value)}
                        options={[
                          { value: 'successful', label: 'Successful' },
                          { value: 'failed', label: 'Failed' },
                          { value: 'partial', label: 'Partial Success' }
                        ]}
                      />
                    </div>
                    <textarea
                      value={attempt.notes}
                      onChange={(e) => handleSolutionAttemptUpdate(index, 'notes', e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Notes about the attempt"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSolutionAttemptAdd}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Solution Attempt
                </Button>
              </CardContent>
            </Card>

            {/* Resolution and Prevention */}
            <Card>
              <CardHeader>
                <CardTitle>Resolution & Prevention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Solution</label>
                  <textarea
                    value={formData.current_solution}
                    onChange={(e) => handleInputChange('current_solution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Current solution being implemented..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Resolution</label>
                  <textarea
                    value={formData.resolution}
                    onChange={(e) => handleInputChange('resolution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Final resolution details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prevention Measures</label>
                  {formData.prevention_measures.map((measure, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={measure}
                        onChange={(e) => {
                          const newMeasures = [...formData.prevention_measures];
                          newMeasures[index] = e.target.value;
                          handleInputChange('prevention_measures', newMeasures);
                        }}
                        placeholder="Prevention measure"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('prevention_measures', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.measure}
                      onChange={(e) => setNewItem(prev => ({ ...prev, measure: e.target.value }))}
                      placeholder="Add prevention measure"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('prevention_measures', newItem.measure);
                        setNewItem(prev => ({ ...prev, measure: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lessons Learned</label>
                  <textarea
                    value={formData.lessons_learned}
                    onChange={(e) => handleInputChange('lessons_learned', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Key lessons learned from this problem..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                  <Input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                    placeholder="When to follow up on this problem"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags and Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Tags & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleArrayItemRemove('tags', index)}
                          className="ml-1 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.tag}
                      onChange={(e) => setNewItem(prev => ({ ...prev, tag: e.target.value }))}
                      placeholder="Add tag"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('tags', newItem.tag);
                        setNewItem(prev => ({ ...prev, tag: '' }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
                  <Select
                    value={formData.privacy_level}
                    onChange={(e) => handleInputChange('privacy_level', e.target.value)}
                    options={[
                      { value: 'personal', label: 'Only Me' },
                      { value: 'team', label: 'My Team' },
                      { value: 'lab', label: 'My Lab' },
                      { value: 'institution', label: 'My Institution' },
                      { value: 'global', label: 'Global (Public)' }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-slate-800 hover:bg-slate-700"
            >
              Report Problem
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemForm;
