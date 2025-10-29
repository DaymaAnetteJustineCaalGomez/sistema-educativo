// backend/routes/recomendaciones.routes.js
import { Router } from "express";

import { getRecommendationsForUser } from "../services/recommendations.service.js";

const router = Router();

router.get("/:usuarioId", async (req, res, next) => {
  try {
    const { usuarioId } = req.params;
    const debug = String(req.query.debug || "") === "1";
    const { items, debug: info } = await getRecommendationsForUser(usuarioId, {
      debug,
    });

    if (debug && info) {
      return res.json({ debug: info, data: items });
    }

    return res.json(items);
  } catch (err) {
    return next(err);
  }
});

export default router;
