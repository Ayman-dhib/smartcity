import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { adminService } from '../../services/api/adminService';
import { UserRole, EquipmentType, Skill } from '../../types/api.types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  defaultRole?: UserRole;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
  defaultRole = 'CITIZEN'
}: CreateUserModalProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Basic user info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Maintenance admin specific
  const [managedEquipmentTypes, setManagedEquipmentTypes] = useState<EquipmentType[]>([]);
  const [canConfigureScheduler, setCanConfigureScheduler] = useState(true);
  const [maxAssignmentsPerDay, setMaxAssignmentsPerDay] = useState(5);

  // Technician specific
  const [skills, setSkills] = useState<Skill[]>([]);

  // All available options
  const equipmentTypes: EquipmentType[] = Object.values(EquipmentType);
  const allSkills: Skill[] = Object.values(Skill);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setManagedEquipmentTypes([]);
    setSkills([]);
    setCanConfigureScheduler(true);
    setMaxAssignmentsPerDay(5);
    setStep(1);
    setError(null);
    setSuccessMessage(null);
    setRole(defaultRole);
  };

  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (role === 'MAINTENANCE_ADMIN' && managedEquipmentTypes.length === 0) {
      setError('Please select at least one equipment type for maintenance admin');
      return false;
    }

    if (role === 'TECHNICIAN' && skills.length === 0) {
      setError('Please select at least one skill for technician');
      return false;
    }

    if (role === 'MAINTENANCE_ADMIN' && maxAssignmentsPerDay < 1) {
      setError('Max assignments per day must be at least 1');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && !validateStep1()) {
      return;
    }
    if (step === 2 && !validateStep2()) {
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      let response;
      const baseUserData = {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      };

      switch (role) {
        case 'CITIZEN':
        case 'TECHNICIAN':
        case 'USER_ADMIN':
          response = await adminService.createUser({
            ...baseUserData,
            role,
          });
          break;

        case 'MAINTENANCE_ADMIN':
          const maintenanceAdminData = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            photoUrl: undefined,
            managedEquipmentTypes,
            canConfigureScheduler,
            maxAssignmentsPerDay,
          };
          response = await adminService.createMaintenanceAdmin(maintenanceAdminData);
          break;

        default:
          throw new Error('Invalid role selected');
      }

      if (response.success) {
        setSuccessMessage(`User created successfully! A confirmation email has been sent to ${email}.`);
        setTimeout(() => {
          onUserCreated();
          resetForm();
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipmentType = (type: EquipmentType) => {
    setManagedEquipmentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleSkill = (skill: Skill) => {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getRoleDescription = (role: UserRole): string => {
    switch (role) {
      case 'CITIZEN':
        return 'Can report issues and track progress';
      case 'TECHNICIAN':
        return 'Can handle interventions and repairs';
      case 'USER_ADMIN':
        return 'Can manage users and administrators';
      case 'MAINTENANCE_ADMIN':
        return 'Can manage maintenance operations and scheduling';
      default:
        return '';
    }
  };

  const renderRoleSpecificFields = () => {
    switch (role) {
      case 'MAINTENANCE_ADMIN':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Managed Equipment Types <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {equipmentTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleEquipmentType(type)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${managedEquipmentTypes.includes(type)
                        ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:border-brand-400 dark:text-brand-300'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                  >
                    <span className="text-sm">{type}</span>
                    {managedEquipmentTypes.includes(type) && (
                      <CheckIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    )}
                  </button>
                ))}
              </div>
              {managedEquipmentTypes.length === 0 && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Please select at least one equipment type
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Assignments Per Day
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Maximum number of assignments this admin can handle daily
                  </p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxAssignmentsPerDay}
                  onChange={(e) => setMaxAssignmentsPerDay(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="canConfigureScheduler"
                  checked={canConfigureScheduler}
                  onChange={(e) => setCanConfigureScheduler(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <label htmlFor="canConfigureScheduler" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Can configure maintenance scheduler
                </label>
              </div>
            </div>
          </div>
        );

      case 'TECHNICIAN':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Skills <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${skills.includes(skill)
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                >
                  <span className="text-sm">{skill}</span>
                  {skills.includes(skill) && (
                    <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
            {skills.length === 0 && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Please select at least one skill
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex justify-center min-h-screen px-4 pt-20 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-top sm:mt-24 sm:max-w-2xl sm:w-full">
          <div className="px-6 pt-5 pb-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create New User
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step {step} of {role === 'CITIZEN' || role === 'USER_ADMIN' ? 2 : 3}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Progress steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= stepNumber
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${step > stepNumber
                          ? 'bg-brand-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-400">{successMessage}</p>
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Select User Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['CITIZEN', 'TECHNICIAN', 'USER_ADMIN', 'MAINTENANCE_ADMIN'] as UserRole[]).map((roleOption) => (
                        <button
                          key={roleOption}
                          type="button"
                          onClick={() => setRole(roleOption)}
                          className={`p-4 rounded-lg border transition-colors ${role === roleOption
                              ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:border-brand-400 dark:text-brand-300'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <div className="text-left">
                            <div className="font-medium">{roleOption.replace('_', ' ')}</div>
                            <div className="text-xs mt-1 opacity-75">
                              {getRoleDescription(roleOption)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        At least 6 characters
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Role-Specific Information */}
              {(step === 2 && (role === 'MAINTENANCE_ADMIN' || role === 'TECHNICIAN')) && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {role.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getRoleDescription(role)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Change role
                      </button>
                    </div>
                  </div>

                  {renderRoleSpecificFields()}
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 || (role === 'CITIZEN' && step === 2) || (role === 'USER_ADMIN' && step === 2) ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Review Information</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                          <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white">{email}</p>
                        </div>
                      </div>
                      {phone && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="font-medium text-gray-900 dark:text-white">{phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {role.replace('_', ' ')}
                        </p>
                      </div>
                      {role === 'MAINTENANCE_ADMIN' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Managed Equipment Types</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {managedEquipmentTypes.map((type) => (
                                <span
                                  key={type}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Max Assignments/Day</p>
                              <p className="font-medium text-gray-900 dark:text-white">{maxAssignmentsPerDay}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Can Configure Scheduler</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {canConfigureScheduler ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      {role === 'TECHNICIAN' && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Skills</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {skills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Note:</strong> An email with login instructions will be sent to the user.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <div>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  {step < (role === 'CITIZEN' || role === 'USER_ADMIN' ? 2 : 3) ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        'Create User'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}