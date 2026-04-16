import PageMeta from "../../components/common/PageMeta";
import InteractiveMap from "../../components/map/InteractiveMap";
import { authService } from "../../services/api/authService";
import { useEffect, useState } from "react";

export default function Home() {
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setUsername(user.name);
    }
  }, []);

  return (
    <>
      <PageMeta
        title="Smart City Dashboard"
        description="Smart City Management Dashboard"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
          Welcome, {username || "User"}!
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Here is the overview of the city interventions.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
              City Map
            </h3>
            <InteractiveMap />
          </div>
        </div>
      </div>
    </>
  );
}
