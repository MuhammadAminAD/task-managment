import { Router } from "express";
import { TasksController } from "../controllers/tasks/task.controller.js";
import { TaskItemsController } from "../controllers/tasks/taskItem.controller.js";

const taskRoute = Router()
const task = new TasksController()
const taskItem = new TaskItemsController()

taskRoute.post("/", task.create);
taskRoute.get("/", task.get);
taskRoute.put("/", task.put);
taskRoute.delete("/:id", task.delete);

taskRoute.post("/items", taskItem.create);
taskRoute.get("/items/:id", taskItem.get);
taskRoute.put("/items", taskItem.put);
taskRoute.delete("/items/:id", taskItem.delete);

export default taskRoute