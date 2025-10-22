import { Router } from "express";
import { GroupsController } from "../controllers/tasks/group.controller.js";
import { IconController } from "../controllers/icons/icon.controller.js";
const iconRoute = Router()
const icon = new IconController();
iconRoute.get('/', icon.getAll)

export default iconRoute