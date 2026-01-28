import TokenAccount from "./token-account.model.js";
import TokenTransaction from "./token-transaction.model.js";
import AppError from "../../shared/appError.js";
import { DAILY_AI_LIMITS } from "../../shared/constants/aiLimits.js";
import { getTodayTokenUsage } from "../ai-chat-logs/aiUsage.service.js";
import User from "../users/user.model.js";
import Subscription from "../subscriptions/subscription.model.js";

export async function deductTokens({ userId, amount, reason, refId }) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // 🔹 Only students & teachers use AI
  if (!["student", "teacher"].includes(user.role)) {
    throw new AppError("AI access not allowed for this role", 403);
  }

  // 🔒 Check school subscription EARLY
  if (user.school_id) {
    const subscription = await Subscription.findOne({
      where: {
        school_id: user.school_id,
        status: "active",
      },
    });

    if (!subscription) {
      throw new AppError(
        "School subscription is inactive. AI access disabled.",
        403
      );
    }
  }

  // 🔹 Skip token work if no tokens used
  if (amount <= 0) {
    return;
  }

  const dailyLimit = DAILY_AI_LIMITS[user.role];
  if (!dailyLimit) {
    throw new AppError("Daily AI limit not configured", 500);
  }

  const usedToday = await getTodayTokenUsage(userId);

  if (usedToday + amount > dailyLimit) {
    throw new AppError(
      `Daily AI limit exceeded (${dailyLimit} tokens/day)`,
      429
    );
  }

  const account = await TokenAccount.findOne({
    where: { user_id: userId },
  });

  if (!account || account.balance < amount) {
    throw new AppError("Insufficient AI tokens", 402);
  }

  account.balance -= amount;
  await account.save();

  await TokenTransaction.create({
    user_id: userId,
    change_amount: -amount,
    reason,
    reference_id: refId,
  });
}
