import { Op } from "sequelize";
import AiChatLog from "./ai-chat-log.model.js";

export async function getTodayTokenUsage(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const total = await AiChatLog.sum("tokens_used", {
    where: {
      user_id: userId,
      created_at: {
        [Op.gte]: startOfDay,
      },
    },
  });

  return total || 0;
}
