import "dotenv/config";
import cors from "cors";
import express from "express";

import { clerkMiddleware } from "@clerk/express";

import { serve } from "inngest/express";
import { inngest, functions } from "./src/inngest/index.js"

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (req,res) => {
    console.log("Server Is Running!")
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server Is Running on ${PORT}`)
})