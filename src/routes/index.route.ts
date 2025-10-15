import { Router } from "express";
import { TaskController } from "../controllers/tasks/task.controller.js";
import { TaskItemController } from "../controllers/tasks/taskItem.controller.js";
import { GroupController } from "../controllers/tasks/groups.controller.js";
import { Ai } from "../controllers/ai/ai.controller.js";

const route = Router();
const task = new TaskController();
const taskItem = new TaskItemController();
const group = new GroupController();

route.get("/tasks/init", task.init);
route.post("/tasks/",  task.create);
route.get("/tasks/", task.getAll);
route.put("/tasks/:id", task.update);
route.delete("/tasks/:id", task.delete);

route.post("/tasks/items/:id",  taskItem.create);
route.put("/tasks/items/:id",  taskItem.status);

route.get('/groups' , group.get)
route.post('/groups' , group.create)
route.delete('/groups/:id' , group.delete)

route.post("/ai" , Ai)

export default route;       
