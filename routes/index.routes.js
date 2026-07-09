// routes/index.routes.js
const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const sendResponse = require("../utils/responseHandler");

// Health Check (Public)
router.get("/health", (req, res) => {
  return sendResponse(res, 200, true, "Multi-Auth Service is Healthy");
});

// Root Route
router.get("/", (req, res) => {
  return sendResponse(res, 200, true, "System Works");
});

// Authentication Routes
router.use("/auth", authRoutes);

// 404 Route
router.use((req, res) => {
  return sendResponse(res, 404, false, "Route not found");
});

module.exports = router;
