import express from "express";
import cookieParser from "cookie-parser";
import { env, dashboardConfig } from "./config.ts";
import { AppCache } from "./cache.ts";
import { authRouter } from "./auth/router.ts";
import { projectRouter } from "./routes/project.ts";
import { issuesRouter } from "./routes/issues.ts";
import { teamRouter } from "./routes/team.ts";
import { jiraRouter } from "./routes/jira.ts";
import { configRouter } from "./routes/config.ts";
import { milestoneRouter } from "./routes/milestone.ts";

const app = express();
const cache = new AppCache({ stdTTL: dashboardConfig.polling.cacheTtlMs / 1000 });

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/config", configRouter);
app.use("/api/project", projectRouter(cache));
app.use("/api", issuesRouter(cache));
app.use("/api/team", teamRouter);
app.use("/api/jira", jiraRouter(cache));
app.use("/api/github/milestone", milestoneRouter(cache));

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
