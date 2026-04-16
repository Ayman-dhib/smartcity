import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { authService } from "../services/api/authService";
import { adminService } from "../services/api/adminService";
import { User } from "../types/api.types";
import TechnicianProfile from "../components/technician/TechnicianProfile";

export default function UserProfiles() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);

        try {
          let fetchedUser: any = null;
          // Fetch fresh data based on role
          if (currentUser.role === 'USER_ADMIN') {
            fetchedUser = await adminService.getUserAdmin(currentUser.userId);
          } else if (currentUser.role === 'MAINTENANCE_ADMIN') {
            fetchedUser = await adminService.getMaintenanceAdmin(currentUser.userId);
          } else if (currentUser.role === 'TECHNICIAN') {
            fetchedUser = await adminService.getTechnician(currentUser.userId);
          } else if (currentUser.role === 'CITIZEN') {
            fetchedUser = await adminService.getCitizen(currentUser.userId);
          }

          if (fetchedUser) {
            setUser({ ...currentUser, ...fetchedUser });
          }
        } catch (error) {
          console.error("Failed to fetch fresh user data:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  if (!user) {
    return <div>Loading profile...</div>;
  }

  if (user.role === 'TECHNICIAN') {
    return (
      <>
        <PageMeta
          title="Technician Profile | Smart City"
          description="Technician Profile Page"
        />
        <PageBreadcrumb pageTitle="Profile" />
        <TechnicianProfile />
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="User Profile | Smart City"
        description="User Profile Page"
      />
      <PageBreadcrumb pageTitle="Profile" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          My Profile
        </h3>

        <div className="space-y-6">
          {/* User Meta Card Simplified */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col items-center gap-6 xl:flex-row">
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center xl:text-left">
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                  {user.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.role}
                </p>
              </div>
            </div>
          </div>

          {/* User Info Card Simplified */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
              Personal Information
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Full Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Role
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.role}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  User ID
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.userId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
