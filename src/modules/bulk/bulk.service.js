import db from "../../config/db.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import User from "../users/user.model.js";
import Teacher from "../teachers/teacher.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
// School import removed as it is not used directly in creation logic here
import AppError from "../../shared/appError.js";

function generateUsername(prefix, index) {
  // Use a simpler unique suffix to ensure uniqueness within the batch and generally
  // Random 4 digit number + timestamp subset
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${Date.now().toString().slice(-6)}${suffix}_${index}`;
}

function generateDefaultPassword(username) {
  return `${username}@123`;
}

export const bulkCreateDataService = async ({
  school_id,
  classes,
  teacher_count,
  students_per_section,
}) => {
  return db.transaction(async (t) => {
    // 1. Create Teachers
    const createdTeachers = [];
    const teacherCount = Number(teacher_count) || 50;
    const defaultStudentCount = Number(students_per_section) || 20;

    for (let i = 0; i < teacherCount; i++) {
      const username = generateUsername("TCH", i);
      const password = generateDefaultPassword(username);

      const user = await User.create(
        {
          school_id,
          role: "teacher",
          username,
          password,
          name: `Teacher ${i + 1}`,
          is_active: true,
          first_login: true,
        },
        { transaction: t }
      );

      const teacher = await Teacher.create(
        {
          user_id: user.id,
          school_id,
          employee_id: `EMP_${username}`, // simple employee id generation
          joining_date: new Date(),
          is_active: true,
        },
        { transaction: t }
      );
      createdTeachers.push(teacher);
    }

    // 2. Process Classes & Sections & Students & Parents
    let classEntries = [];
    if (Array.isArray(classes)) {
      classEntries = classes.map((c) => {
        if (typeof c === 'string') {
          return {
            name: c,
            sections: [{ name: "Section A", students: defaultStudentCount }]
          };
        }
        return {
          name: c.name || "Unnamed",
          sections: Array.isArray(c.sections) ? c.sections : [{ name: "Section A", students: defaultStudentCount }],
        };
      });
    } else if (classes && typeof classes === "object") {
      classEntries = Object.entries(classes).map(([name, config]) => ({
        name,
        sections: Array.isArray(config.sections) ? config.sections : [{ name: "Section A", students: defaultStudentCount }],
      }));
    }

    const details = [];
    let classesCreatedCount = 0;
    let studentsCreatedCount = 0;

    for (const classData of classEntries) {
      // Create Class
      const newClass = await Class.create(
        {
          school_id,
          class_name: classData.name,
          capacity: 30, // Default capacity
        },
        { transaction: t }
      );
      classesCreatedCount++;

      const sectionDetails = [];

      for (const sectionData of classData.sections) {
        // Create Section
        const newSection = await Section.create(
          {
            school_id,
            class_id: newClass.id,
            name: sectionData.name,
            capacity: 30,
          },
          { transaction: t }
        );

        const studentCount = Number(sectionData.students) || 0;
        studentsCreatedCount += studentCount;

        // Create Students for this Section
        for (let k = 0; k < studentCount; k++) {
          const sUsername = generateUsername("STO", k);
          const sPassword = generateDefaultPassword(sUsername);

          // Create Student User
          const sUser = await User.create(
            {
              school_id,
              role: "student",
              username: sUsername,
              password: sPassword,
              name: `Student ${classData.name} ${sectionData.name} ${k + 1}`,
              is_active: true,
              first_login: true,
            },
            { transaction: t }
          );

          // Create Student Profile
          const newStudent = await Student.create(
            {
              user_id: sUser.id,
              school_id,
              class_id: newClass.id,
              section_id: newSection.id, // Fixed: Assigning section_id
              admission_no: `ADM_${sUsername}`,
              approval_status: "pending", // Needs profile completion
              family_income: 0, // Default
            },
            { transaction: t }
          );

          // Create Parent for this Student
          const pUsername = generateUsername("PAR", k);
          const pPassword = generateDefaultPassword(pUsername);

          // Create Parent User
          const pUser = await User.create(
            {
              school_id, // Linked to school? Model says AllowNull: true, but commonly linked.
              role: "parent",
              username: pUsername,
              password: pPassword,
              name: `Parent of ${sUser.name}`,
              is_active: true,
              first_login: true,
            },
            { transaction: t }
          );

          // Create Parent Profile
          await Parent.create(
            {
              user_id: pUser.id,
              student_id: newStudent.id,
              relation_type: "guardian", // Default
              approval_status: "pending",
            },
            { transaction: t }
          );
        }

        sectionDetails.push({
          name: newSection.name,
          students: studentCount,
        });
      }

      details.push({
        name: newClass.class_name,
        teachers_allocated: 0, // Logic for allocation not specified, keeping 0 for now as per previous stub
        sections: sectionDetails,
      });
    }

    return {
      school_id,
      classes_created: classesCreatedCount,
      teachers_created: teacherCount,
      students_created: studentsCreatedCount,
      details,
    };
  });
};
