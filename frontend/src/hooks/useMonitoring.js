
import { useCallback, useEffect, useState } from "react";
import api from "../api";

export default function useMonitoring() {
  const [monitoring, setMonitoring] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [overviewResponse, workersResponse] = await Promise.all([
        api.get("/monitoring/overview"),
        api.get("/monitoring/workers"),
      ]);

      setMonitoring(overviewResponse.data.monitoring);
      setWorkers(workersResponse.data.workers || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load monitoring information"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const timer = setInterval(refresh, 15000);

    return () => clearInterval(timer);
  }, [refresh]);

  return {
    monitoring,
    workers,
    loading,
    error,
    refresh,
  };
}
