export interface HealthStatus {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
}
