import type { HealthStatus } from "../types/index.js";

export const healthService = {
  getHealthStatus(): HealthStatus {
    return {
      status: "ok",
      service: "fortyguard-server",
      timestamp: new Date().toISOString(),
    };
  },
};

export default healthService;
