import express from "express";
import { Container } from "typedi";
import { DecalController } from "../controllers/decal.controller";
import { authenticate } from "../../common/middlewares/auth.middleware";

const decalRouter = express.Router();
const decalController = Container.get(DecalController);

decalRouter.post(
  "/create",
  authenticate,
  decalController.createDecal.bind(decalController)
);
decalRouter.post(
  "/scan",
  authenticate,
  decalController.scanDecal.bind(decalController)
);
decalRouter.get(
  "/:decalId/scans",
  authenticate,
  decalController.getScansByDecal.bind(decalController)
);

export default decalRouter;
