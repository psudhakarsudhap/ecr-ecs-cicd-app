import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const faculties = [];
// Routes setup
app.post("/api/v1/faculties", async (req, res) => {
  try {
    const newFaculty = req.body;
    faculties.push(newFaculty);
    res
      .status(201)
      .json({ message: "Faculty created successfully", data: newFaculty });
  } catch (error) {
    res.status(500).json({ error: "Failed to create faculty" });
  }
});

app.get("/api/v1/faculties", async (req, res) => {
  try {
    res.json({ message: "Faculties fetched successfully", data: faculties });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculties" });
  }
});

app.put("/api/v1/faculties/:id", async (req, res) => {
  try {
    const faculty = faculties.find((f) => f.id === req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    Object.assign(faculty, req.body);
    res.json({ message: "Faculty updated successfully", data: faculty });
  } catch (error) {
    res.status(500).json({ error: "Failed to update faculty" });
  }
});

app.delete("/api/v1/faculties/:id", async (req, res) => {
  try {
    const index = faculties.findIndex((f) => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    const deletedFaculty = faculties.splice(index, 1)[0];
    res.json({ message: "Faculty deleted successfully", data: deletedFaculty });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete faculty" });
  }
});

//Test route
app.get("/", (_req, res) => {
  res.json({ message: "API is working with Docker and ECS" });
});
// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
