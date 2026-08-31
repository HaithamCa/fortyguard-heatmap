import app from "./app.js";

const PORT = process.env.PORT || 8088;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  if (process.env.DEV_MOCK === "true") {
    console.log("🧪 DEV_MOCK enabled — FortyGuard API calls are simulated");
  }
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
});
