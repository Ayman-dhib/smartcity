import { useState } from 'react';
import {
  Citizen,
  Technician,
  UserAdmin,
  MaintenanceAdmin,
} from '../../types/api.types';
import { PencilIcon, TrashIcon, UserPlusIcon, UserMinusIcon, UsersIcon } from '@heroicons/react/24/outline';

interface UserTableProps {
  users: Array<Citizen | Technician | UserAdmin | MaintenanceAdmin>;
  type: 'citizen' | 'technician' | 'userAdmin' | 'maintenanceAdmin';
  onStatusToggle: (id: string) => void;
  onEdit: (user: any) => void;
  onDelete: (id: string) => void;
}

export default function UserTable({ users, type, onStatusToggle, onEdit, onDelete }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user as any).phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = () => {
    switch (type) {
      case 'citizen': return 'Citizen';
      case 'technician': return 'Technician';
      case 'userAdmin': return 'User Admin';
      case 'maintenanceAdmin': return 'Maintenance Admin';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto">
      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={`Search ${getRoleLabel().toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredUsers.length} of {users.length} {getRoleLabel().toLowerCase()}{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            {type === 'technician' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Skills
              </th>
            )}
            {type === 'maintenanceAdmin' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Equipment Types
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {filteredUsers.map((user) => (
            <tr key={(user as any).userId || (user as any).technicianId || (user as any).userAdminId || (user as any).maintenanceAdminId}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    {(user as any).photoUrl ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={(user as any).photoUrl}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <span className="text-brand-600 dark:text-brand-400 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {(user as any).userId?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                {(user as any).phone && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{(user as any).phone}</div>
                )}
              </td>
              {type === 'technician' && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {(user as Technician).skills?.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {skill}
                      </span>
                    )) || <span className="text-xs text-gray-400">No skills</span>}
                    {(user as Technician).skills?.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        +{(user as Technician).skills.length - 3}
                      </span>
                    )}
                  </div>
                </td>
              )}
              {type === 'maintenanceAdmin' && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {(user as MaintenanceAdmin).managedEquipmentTypes?.slice(0, 3).map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {type}
                      </span>
                    )) || <span className="text-xs text-gray-400">None</span>}
                    {(user as MaintenanceAdmin).managedEquipmentTypes?.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        +{(user as MaintenanceAdmin).managedEquipmentTypes.length - 3}
                      </span>
                    )}
                  </div>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDate((user as any).createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  {!['citizen', 'technician'].includes(type) && (
                    <button
                      onClick={() => onStatusToggle(
                        (user as any).userId ||
                        (user as any).technicianId ||
                        (user as any).userAdminId ||
                        (user as any).maintenanceAdminId
                      )}
                      className={`p-1.5 rounded-md ${user.active
                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      title={user.active ? 'Deactivate' : 'Activate'}
                    >
                      {user.active ? (
                        <UserMinusIcon className="h-4 w-4" />
                      ) : (
                        <UserPlusIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(user)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(
                      (user as any).userId ||
                      (user as any).technicianId ||
                      (user as any).userAdminId ||
                      (user as any).maintenanceAdminId
                    )}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No users match your search.' : `No ${getRoleLabel().toLowerCase()}s in the system yet.`}
          </p>
        </div>
      )}
    </div>
  );
}