import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  BuildingOfficeIcon,
  AcademicCapIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  UserIcon,
  UsersIcon,
  ClipboardDocumentListIcon
} from '../components/icons';
import UniversityEmailValidator from '../server/services/universityEmailValidator';

interface LabCreationForm {
  // Basic Information
  name: string;
  description: string;
  institution: string;
  department: string;
  
  // Contact Information
  contact_email: string;
  contact_phone: string;
  address: string;
  website_url: string;
  
  // Research Areas
  research_areas: string[];
  
  // Lab Setup
  lab_type: 'academic' | 'research_institute' | 'government' | 'industry' | 'nonprofit';
  established_year: number;
  principal_investigator: string;
  
  // Additional Information
  funding_sources: string[];
  collaborations: string[];
  equipment: string[];
  certifications: string[];
}

interface LabCreationWizardProps {
  onLabCreated?: (lab: any) => void;
  onCancel?: () => void;
}

const LabCreationWizard: React.FC<LabCreationWizardProps> = ({ onLabCreated, onCancel }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    institution?: string;
    country?: string;
    verified: boolean;
  } | null>(null);

  const [formData, setFormData] = useState<LabCreationForm>({
    name: '',
    description: '',
    institution: '',
    department: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website_url: '',
    research_areas: [],
    lab_type: 'academic',
    established_year: new Date().getFullYear(),
    principal_investigator: user?.first_name + ' ' + user?.last_name || '',
    funding_sources: [],
    collaborations: [],
    equipment: [],
    certifications: []
  });

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Lab name and description' },
    { id: 2, title: 'Institution Details', description: 'University and department info' },
    { id: 3, title: 'Contact Information', description: 'Email, phone, and address' },
    { id: 4, title: 'Research Areas', description: 'Focus areas and specializations' },
    { id: 5, title: 'Lab Setup', description: 'Type, year, and PI information' },
    { id: 6, title: 'Review & Submit', description: 'Review all information' }
  ];

  const handleInputChange = (field: keyof LabCreationForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate email if it's the contact_email field
    if (field === 'contact_email') {
      const validation = UniversityEmailValidator.validateUniversityEmail(value);
      setEmailValidation(validation);
      
      // Auto-populate institution if email is valid
      if (validation.isValid && validation.institution) {
        setFormData(prev => ({ ...prev, institution: validation.institution! }));
      }
    }
  };

  const handleArrayFieldChange = (field: keyof LabCreationForm, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: keyof LabCreationForm, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        onLabCreated?.(result.lab);
      } else {
        const error = await response.json();
        alert(`Error creating lab: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating lab:', error);
      alert('Failed to create lab. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 2:
        return formData.institution.trim() !== '' && formData.department.trim() !== '';
      case 3:
        return formData.contact_email.trim() !== '' && emailValidation?.isValid === true;
      case 4:
        return formData.research_areas.length > 0;
      case 5:
        return formData.principal_investigator.trim() !== '' && formData.established_year > 1900;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Molecular Biology Research Laboratory"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your lab's research focus, mission, and key areas of study..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution *
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => handleInputChange('institution', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Harvard University"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Department of Molecular Biology"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="lab@university.edu"
              />
              {emailValidation && (
                <div className={`mt-2 p-3 rounded-lg ${
                  emailValidation.isValid 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {emailValidation.isValid ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`text-sm ${
                      emailValidation.isValid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {emailValidation.isValid 
                        ? `✓ Valid university email (${emailValidation.institution})`
                        : '✗ Please use a valid university email address'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Building, Room, Street Address, City, State, ZIP"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourlab.university.edu"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Areas *
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add research area..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleArrayFieldChange('research_areas', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add research area..."]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        handleArrayFieldChange('research_areas', input.value);
                        input.value = '';
                      }
                    }}
                    variant="outline"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.research_areas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {area}
                      <button
                        onClick={() => removeArrayItem('research_areas', index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Type
              </label>
              <select
                value={formData.lab_type}
                onChange={(e) => handleInputChange('lab_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="academic">Academic Institution</option>
                <option value="research_institute">Research Institute</option>
                <option value="government">Government Lab</option>
                <option value="industry">Industry Lab</option>
                <option value="nonprofit">Non-profit Organization</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Established Year
              </label>
              <input
                type="number"
                value={formData.established_year}
                onChange={(e) => handleInputChange('established_year', parseInt(e.target.value))}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Investigator *
              </label>
              <input
                type="text"
                value={formData.principal_investigator}
                onChange={(e) => handleInputChange('principal_investigator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dr. Jane Smith"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Lab Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {formData.name}</p>
                    <p><span className="font-medium">Description:</span> {formData.description}</p>
                    <p><span className="font-medium">Institution:</span> {formData.institution}</p>
                    <p><span className="font-medium">Department:</span> {formData.department}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Email:</span> {formData.contact_email}</p>
                    <p><span className="font-medium">Phone:</span> {formData.contact_phone || 'Not provided'}</p>
                    <p><span className="font-medium">Address:</span> {formData.address || 'Not provided'}</p>
                    <p><span className="font-medium">Website:</span> {formData.website_url || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Research Areas</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.research_areas.map((area, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lab Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Type:</span> {formData.lab_type.replace('_', ' ')}</p>
                    <p><span className="font-medium">Established:</span> {formData.established_year}</p>
                    <p><span className="font-medium">PI:</span> {formData.principal_investigator}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Lab</h2>
            <p className="text-gray-600">
              Set up your research laboratory on our platform. Only users with verified university email addresses can create labs.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="flex items-center"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {onCancel && (
                <Button onClick={onCancel} variant="outline">
                  Cancel
                </Button>
              )}
              
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className="flex items-center"
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid(currentStep)}
                  className="flex items-center"
                >
                  {loading ? 'Creating...' : 'Create Lab'}
                  <CheckCircleIcon className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LabCreationWizard;
