/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE users
      SET avatar_url = students.profile_pic
      FROM students
      WHERE students.user_id = users.id
        AND students.profile_pic IS NOT NULL
        AND (users.avatar_url IS NULL OR users.avatar_url = '')
    `);

    await queryInterface.removeColumn("students", "profile_pic");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("students", "profile_pic", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
