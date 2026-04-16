import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { technicianService } from '../../services/api/technicianService';
import { Technician, Skill } from '../../types/api.types';
import LocationPicker from '../LocationPicker';
import { toast } from 'react-toastify';

const TechnicianProfile: React.FC = () => {
  const { user } = useAuth();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Location State
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ x: number; y: number } | null>(null);

  // Skills State
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  // Available Skills
  const AVAILABLE_SKILLS: Skill[] = Object.values(Skill);

  useEffect(() => {
    const fetchTechnician = async () => {
      if (user?.userId) {
        try {
          const data = await technicianService.getTechnicianById(user.userId);
          setTechnician(data);
          setSelectedSkills(data.skills || []);
        } catch (error) {
          console.error('Failed to fetch technician profile', error);
          toast.error('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTechnician();
  }, [user]);

  // --- Location Handlers ---
  const handleLocationSelect = (location: { x: number; y: number }) => {
    setSelectedLocation(location);
  };

  const handleConfirmLocation = async () => {
    if (!technician || !selectedLocation) return;

    setUpdating(true);
    try {
      // Backend expects { lat, lng }
      const locationUpdate = {
        lat: selectedLocation.y,
        lng: selectedLocation.x
      };

      const updatedTechnician = await technicianService.updateLocation(technician.technicianId, locationUpdate);
      setTechnician(updatedTechnician);
      toast.success('Location updated successfully');
      setIsEditingLocation(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Failed to update location', error);
      toast.error('Failed to update location');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelLocation = () => {
    setIsEditingLocation(false);
    setSelectedLocation(null);
  };

  // --- Skills Handlers ---
  const toggleSkill = (skill: Skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSaveSkills = async () => {
    if (!technician) return;
    setUpdating(true);
    try {
      const updatedTechnician = await technicianService.updateSkills(technician.technicianId, selectedSkills);
      setTechnician(updatedTechnician);
      toast.success('Skills updated successfully');
      setIsEditingSkills(false);
    } catch (error) {
      console.error('Failed to update skills', error);
      toast.error('Failed to update skills');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelSkills = () => {
    setIsEditingSkills(false);
    setSelectedSkills(technician?.skills || []);
  };

  if (loading) {
    return <div className="p-4 text-gray-600 dark:text-gray-300">Loading profile...</div>;
  }

  if (!technician) {
    return <div className="p-4 text-red-500">Technician profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-boxdark rounded-lg shadow-md transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Technician Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Basic Info & Skills */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{technician.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-lg text-gray-900 dark:text-gray-200">{technician.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <p className="text-lg text-gray-900 dark:text-gray-200">{technician.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${technician.available
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                {technician.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Rating</label>
              <p className="text-lg text-gray-900 dark:text-gray-200">{technician.rating} / 5.0</p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Skills</h3>
              {!isEditingSkills ? (
                <button
                  onClick={() => setIsEditingSkills(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Edit Skills
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleSaveSkills}
                    disabled={updating}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelSkills}
                    disabled={updating}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {isEditingSkills ? (
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SKILLS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedSkills.includes(skill)
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 border'
                      : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 border hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {skill.replace('_', ' ')}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {technician.skills && technician.skills.length > 0 ? (
                  technician.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {skill.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No skills added yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Location */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Current Location</label>
            <div className="space-x-2">
              {!isEditingLocation ? (
                <button
                  onClick={() => setIsEditingLocation(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Change Location
                </button>
              ) : (
                <>
                  <button
                    onClick={handleConfirmLocation}
                    disabled={updating || !selectedLocation}
                    className={`px-3 py-1 text-sm text-white rounded transition-colors ${updating || !selectedLocation
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                      }`}
                  >
                    {updating ? 'Updating...' : 'Confirm'}
                  </button>
                  <button
                    onClick={handleCancelLocation}
                    disabled={updating}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
            <LocationPicker
              initialLocation={
                selectedLocation
                  ? selectedLocation
                  : (technician.location
                    ? { x: technician.location.coordinates[0], y: technician.location.coordinates[1] }
                    : null)
              }
              onLocationSelect={isEditingLocation ? handleLocationSelect : () => { }}
            />
          </div>
          {isEditingLocation && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {selectedLocation
                ? "Location selected. Click 'Confirm' to save."
                : "Click on the map to select your new location."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianProfile;
