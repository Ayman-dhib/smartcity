import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { citizenService } from "../../services/api/citizenService";
import { technicianService } from "../../services/api/technicianService";
import { Intervention } from "../../types/api.types";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import Skeleton from "../../components/common/Skeleton";

export default function InterventionsList() {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchInterventions = async () => {
            try {
                // Fetch interventions based on user role
                if (user?.role === 'TECHNICIAN') {
                    const data = await technicianService.getMyInterventions();
                    setInterventions(data);
                } else {
                    const data = await citizenService.getMyInterventions();
                    setInterventions(data.interventions);
                }
            } catch (error) {
                console.error("Failed to fetch interventions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInterventions();

        // Poll every 30 seconds
        const intervalId = setInterval(fetchInterventions, 30000);

        return () => clearInterval(intervalId);
    }, [user]);

    const handleRowClick = (id: string) => {
        if (user?.role === 'TECHNICIAN') {
            navigate(`/technician/interventions/${id}`);
        } else {
            navigate(`/interventions/${id}`);
        }
    };

    return (
        <>
            <PageMeta
                title="Interventions List | Smart City"
                description="List of all interventions in the smart city system"
            />
            <PageBreadcrumb pageTitle="Interventions" />

            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pb-6">
                <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        My Interventions
                    </h3>
                </div>

                <div className="max-w-full overflow-x-auto">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : interventions.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                            No interventions found.
                        </div>
                    ) : (
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="text-left bg-gray-50 dark:bg-white/[0.02]">
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-theme-xs">
                                        TITLE
                                    </th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-theme-xs">
                                        TYPE
                                    </th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-theme-xs">
                                        PRIORITY
                                    </th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-theme-xs">
                                        STATUS
                                    </th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-theme-xs">
                                        DATE
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {interventions.map((intervention) => (
                                    <tr
                                        key={intervention.interventionId}
                                        onClick={() => handleRowClick(intervention.interventionId)}
                                        className="border-b border-gray-100 last:border-b-0 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h5 className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                        {intervention.title}
                                                    </h5>
                                                    <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                                                        {intervention.description.substring(0, 40)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {intervention.interventionType}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${intervention.priority === "CRITICAL" || intervention.priority === "HIGH"
                                                    ? "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-500"
                                                    : intervention.priority === "MEDIUM"
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-500"
                                                        : "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-500"
                                                    }`}
                                            >
                                                {intervention.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${intervention.status === "COMPLETED"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-500"
                                                    : intervention.status === "IN_PROGRESS"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-500"
                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400"
                                                    }`}
                                            >
                                                {intervention.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {new Date(intervention.createdDate).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
