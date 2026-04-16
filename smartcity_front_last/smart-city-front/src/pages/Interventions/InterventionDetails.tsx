import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { interventionService } from "../../services/api/interventionService";
import { citizenService } from "../../services/api/citizenService";
import { Intervention } from "../../types/api.types";
import Skeleton from "../../components/common/Skeleton";

export default function InterventionDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [intervention, setIntervention] = useState<Intervention | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add state for rating
    const [showRatingForm, setShowRatingForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [ratingMessage, setRatingMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchIntervention = async () => {
            if (!id) return;
            try {
                const data = await interventionService.getInterventionById(id);
                if (data) {
                    setIntervention(data);
                } else {
                    setError("Intervention not found");
                }
            } catch (err) {
                setError("Failed to load intervention details");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchIntervention();

        // Poll every 30 seconds
        const intervalId = setInterval(fetchIntervention, 30000);

        return () => clearInterval(intervalId);
    }, [id]);

    // Add function to handle rating submission
    const handleSubmitRating = async () => {
        if (!intervention || rating === 0) return;

        setIsSubmittingRating(true);
        setRatingMessage(null);

        try {
            const response = await citizenService.submitRating({
                interventionId: intervention.interventionId,
                rating: rating,
                ratingComment: ratingComment || undefined
            });

            if (response.success) {
                setRatingMessage({ type: 'success', text: response.message });
                // Update intervention with new rating
                setIntervention({
                    ...intervention,
                    rating: response.rating,
                    ratingComment: response.ratingComment
                });
                setShowRatingForm(false);
                setRating(0);
                setRatingComment("");
            } else {
                setRatingMessage({ type: 'error', text: response.message });
            }
        } catch (err: any) {
            setRatingMessage({
                type: 'error',
                text: err.response?.data?.message || "Failed to submit rating"
            });
        } finally {
            setIsSubmittingRating(false);
        }
    };

    // Add function to render stars
    const renderStars = (ratingValue: number, interactive = false) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type={interactive ? "button" : undefined}
                        onClick={interactive ? () => setRating(star) : undefined}
                        className={`text-2xl ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                        disabled={!interactive || isSubmittingRating}
                    >
                        {star <= ratingValue ? "★" : "☆"}
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="max-w-screen-2xl mx-auto p-4 md:p-6 2xl:p-10">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                            <div className="flex justify-between mb-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-64" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-8 w-24 rounded-full" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !intervention) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {error || "Intervention not found"}
                </h2>
                <button
                    onClick={() => navigate("/interventions")}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                >
                    Back to List
                </button>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title={`Intervention Details | Smart City`}
                description="View detailed information about an intervention"
            />
            <PageBreadcrumb pageTitle="Intervention Details" />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Main Info Column */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    {/* Intervention Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-1">
                                    {intervention.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {intervention.interventionId}
                                </p>
                            </div>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${intervention.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-500"
                                    : intervention.status === "IN_PROGRESS"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-500"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400"
                                    }`}
                            >
                                {intervention.status}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                                    Description
                                </h4>
                                <p className="text-gray-800 dark:text-white/90 leading-relaxed">
                                    {intervention.description}
                                </p>
                            </div>

                            {/* ============ RATING SECTION ============ */}
                            {intervention.status === "COMPLETED" && (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                                        Service Rating
                                    </h4>

                                    {intervention.rating ? (
                                        // Show existing rating
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                {renderStars(intervention.rating)}
                                                <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                                    {intervention.rating}/5
                                                </span>
                                            </div>
                                            {intervention.ratingComment && (
                                                <p className="text-gray-700 dark:text-gray-300 italic">
                                                    "{intervention.ratingComment}"
                                                </p>
                                            )}
                                        </div>
                                    ) : showRatingForm ? (
                                        // Show rating form
                                        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    How would you rate this service?
                                                </label>
                                                {renderStars(rating, true)}
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    Selected: {rating} star{rating !== 1 ? 's' : ''}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Additional feedback (optional)
                                                </label>
                                                <textarea
                                                    value={ratingComment}
                                                    onChange={(e) => setRatingComment(e.target.value)}
                                                    placeholder="Tell us about your experience..."
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                                    rows={3}
                                                    disabled={isSubmittingRating}
                                                />
                                            </div>

                                            {ratingMessage && (
                                                <div className={`p-3 rounded-lg ${ratingMessage.type === 'success'
                                                    ? 'bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-500'
                                                    : 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-500'}`}>
                                                    {ratingMessage.text}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSubmitRating}
                                                    disabled={rating === 0 || isSubmittingRating}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmittingRating ? "Submitting..." : "Submit Rating"}
                                                </button>
                                                <button
                                                    onClick={() => setShowRatingForm(false)}
                                                    disabled={isSubmittingRating}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Show "Rate Service" button
                                        <button
                                            onClick={() => setShowRatingForm(true)}
                                            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                                        >
                                            Rate This Service
                                        </button>
                                    )}
                                </div>
                            )}
                            {/* ============ END RATING SECTION ============ */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Type
                                    </h4>
                                    <p className="text-gray-800 dark:text-white/90 font-medium">
                                        {intervention.interventionType}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Priority
                                    </h4>
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
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Created Date
                                    </h4>
                                    <p className="text-gray-800 dark:text-white/90 font-medium">
                                        {new Date(intervention.createdDate).toLocaleString()}
                                    </p>
                                </div>
                                {intervention.completedDate && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            Completed Date
                                        </h4>
                                        <p className="text-gray-800 dark:text-white/90 font-medium">
                                            {new Date(intervention.completedDate).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                            Timeline
                        </h3>
                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-brand-500 border-2 border-white dark:border-gray-900"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(intervention.createdDate).toLocaleString()}
                                </p>
                                <p className="text-gray-800 dark:text-white/90 font-medium">
                                    Intervention Created
                                </p>
                            </div>
                            {intervention.assignedTechnicianId && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900"></div>
                                    <p className="text-gray-800 dark:text-white/90 font-medium">
                                        Technician Assigned
                                    </p>
                                </div>
                            )}
                            {intervention.completedDate && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"></div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(intervention.completedDate).toLocaleString()}
                                    </p>
                                    <p className="text-gray-800 dark:text-white/90 font-medium">
                                        Intervention Completed
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info Column */}
                <div className="flex flex-col gap-6">
                    {/* Equipment Details */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                            Equipment Details
                        </h3>
                        {intervention.equipment ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Name
                                    </h4>
                                    <p className="text-gray-800 dark:text-white/90 font-medium">
                                        {intervention.equipment.name}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Type
                                    </h4>
                                    <p className="text-gray-800 dark:text-white/90 font-medium">
                                        {intervention.equipment.type}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Status
                                    </h4>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${intervention.equipment.status === "ACTIVE"
                                            ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-500"
                                            : "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-500"
                                            }`}
                                    >
                                        {intervention.equipment.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">
                                No equipment details available.
                            </p>
                        )}
                    </div>

                    {/* Technician Details */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                            Assigned Technician
                        </h3>
                        {intervention.assignedTechnicianId ? (
                            <div className="space-y-4">
                                <p className="text-gray-800 dark:text-white/90 font-medium">
                                    Technician ID: {intervention.assignedTechnicianId}
                                </p>
                                {/* We could fetch technician details here if we had an endpoint */}
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-500 text-sm">
                                No technician assigned yet.
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/interventions")}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-300 dark:border-gray-700 dark:hover:bg-white/[0.05]"
                    >
                        Back to List
                    </button>
                </div>
            </div>
        </>
    );
}