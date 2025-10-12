import { Router } from "express";
import { TaskController } from "../controllers/tasks/task.controller.js";

const route = Router();
const task = new TaskController();

route.get("/tasks/init", task.init);
route.post("/tasks/",  task.create);
route.get("/tasks/", task.getAll);
route.put("/tasks/:id", task.update);
route.delete("/tasks/:id", task.delete);

export default route;       
