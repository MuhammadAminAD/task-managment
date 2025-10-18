import { Router } from "express";
import { GroupsController } from "../controllers/tasks/groups.controller.js";
const groupRoute = Router()
const group = new GroupsController();
groupRoute.get('', group.get)
groupRoute.post('', group.create)
groupRoute.put('/', group.put)
groupRoute.delete('/:id', group.delete)

export default groupRoute