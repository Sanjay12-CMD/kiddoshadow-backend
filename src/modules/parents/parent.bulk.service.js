import db from "../../config/db.js";
import Parent from "./parent.model.js";
import User from "../users/user.model.js";

export const bulkApproveParentsService = async ({
  parent_ids,
  action,
  admin_user_id,
  school_id,
}) => {
  return db.transaction(async (t) => {
    const parents = await Parent.findAll({
      where: {
        id: parent_ids,
        approval_status: "pending",
      },
      transaction: t,
    });

    if (!parents.length) {
      return { processed: 0 };
    }

    const parentUserIds = parents.map((p) => p.user_id);

    await Parent.update(
      {
        approval_status: action === "approve" ? "approved" : "rejected",
        approved_by: admin_user_id,
        approved_at: new Date(),
      },
      {
        where: { id: parent_ids, approval_status: "pending" },
        transaction: t,
      }
    );

    if (action === "approve") {
      await User.update(
        { is_active: true },
        {
          where: {
            id: parentUserIds,
            school_id,
          },
          transaction: t,
        }
      );
    }

    return { processed: parents.length };
  });
};
