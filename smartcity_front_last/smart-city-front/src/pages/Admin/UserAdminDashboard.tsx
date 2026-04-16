import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api/adminService';
import {
  UserAdmin,
  MaintenanceAdmin,
  Citizen,
  Technician,
  AdminStats
} from '../../types/api.types';
import StatsCard from '../../components/dashboard/StatsCard';
import UserTable from '../../components/admin/UserTable';
import UserModal from '../../components/admin/UserModal';
import { UserIcon, UsersIcon, WrenchScrewdriverIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function UserAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'citizens' | 'technicians' | 'admins'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [userAdmins, setUserAdmins] = useState<UserAdmin[]>([]);
  const [maintenanceAdmins, setMaintenanceAdmins] = useState<MaintenanceAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'USER_ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [statsData, usersData] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getAllUsers()
      ]);

      setStats(statsData);
      setCitizens(usersData.citizens || []);
      setTechnicians(usersData.technicians || []);
      setUserAdmins(usersData.userAdmins || []);
      setMaintenanceAdmins(usersData.maintenanceAdmins || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const onSuccess = () => {
    setShowModal(false);
    fetchData();
  };

  const handleStatusToggle = async (userId: string, type: 'citizen' | 'technician' | 'userAdmin' | 'maintenanceAdmin') => {
    try {
      switch (type) {
        case 'citizen':
        case 'technician':
          await adminService.toggleUserStatus(userId);
          break;
        case 'userAdmin':
          await adminService.toggleUserAdminStatus(userId);
          break;
        case 'maintenanceAdmin':
          await adminService.toggleMaintenanceAdminStatus(userId);
          break;
      }
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string, type: 'citizen' | 'technician' | 'userAdmin' | 'maintenanceAdmin') => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      switch (type) {
        case 'citizen':
          await adminService.deleteCitizen(userId);
          break;
        case 'technician':
          await adminService.deleteUser(userId);
          break;
        case 'userAdmin':
          await adminService.deleteUserAdmin(userId);
          break;
        case 'maintenanceAdmin':
          await adminService.deleteMaintenanceAdmin(userId);
          break;
      }
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Administration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage citizens, technicians, and other administrators
            </p>
          </div>
          <button
            onClick={handleCreateUser}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2"
          >
            <UsersIcon className="h-5 w-5" />
            Add New User
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Citizens"
            value={citizens.length}
            icon={UserIcon}
            trend={0}
            trendLabel="Active users"
          />
          <StatsCard
            title="Total Technicians"
            value={technicians.length}
            icon={WrenchScrewdriverIcon}
            trend={technicians.length > 0 ? 100 : 0}
            trendLabel="Registered technicians"
          />
          <StatsCard
            title="User Admins"
            value={userAdmins.length}
            icon={ShieldCheckIcon}
            trend={stats?.totalAdmins ? Math.round((userAdmins.length / stats.totalAdmins) * 100) : 0}
            trendLabel="System administrators"
          />
          <StatsCard
            title="Maintenance Admins"
            value={maintenanceAdmins.length}
            icon={ShieldCheckIcon}
            trend={stats?.totalAdmins ? Math.round((maintenanceAdmins.length / stats.totalAdmins) * 100) : 0}
            trendLabel="Maintenance supervisors"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', count: citizens.length + technicians.length + userAdmins.length + maintenanceAdmins.length },
              { id: 'citizens', label: 'Citizens', count: citizens.length },
              { id: 'technicians', label: 'Technicians', count: technicians.length },
              { id: 'admins', label: 'Administrators', count: userAdmins.length + maintenanceAdmins.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${activeTab === tab.id
                  ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Total Users: {citizens.length + technicians.length + userAdmins.length + maintenanceAdmins.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Active Users: {stats?.activeUsers || 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Inactive Users: {stats?.inactiveUsers || 0}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'citizens' && (
            <UserTable
              users={citizens}
              type="citizen"
              onStatusToggle={(id) => handleStatusToggle(id, 'citizen')}
              onEdit={(user) => handleEditUser(user)}
              onDelete={(id) => handleDeleteUser(id, 'citizen')}
            />
          )}

          {activeTab === 'technicians' && (
            <UserTable
              users={technicians}
              type="technician"
              onStatusToggle={(id) => handleStatusToggle(id, 'technician')}
              onEdit={(user) => handleEditUser(user)}
              onDelete={(id) => handleDeleteUser(id, 'technician')}
            />
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-6 pt-6">User Administrators</h3>
                <UserTable
                  users={userAdmins}
                  type="userAdmin"
                  onStatusToggle={(id) => handleStatusToggle(id, 'userAdmin')}
                  onEdit={(user) => handleEditUser(user)}
                  onDelete={(id) => handleDeleteUser(id, 'userAdmin')}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-6 pt-6">Maintenance Administrators</h3>
                <UserTable
                  users={maintenanceAdmins}
                  type="maintenanceAdmin"
                  onStatusToggle={(id) => handleStatusToggle(id, 'maintenanceAdmin')}
                  onEdit={(user) => handleEditUser(user)}
                  onDelete={(id) => handleDeleteUser(id, 'maintenanceAdmin')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={editingUser}
        onSuccess={onSuccess}
      />
    </>
  );
}