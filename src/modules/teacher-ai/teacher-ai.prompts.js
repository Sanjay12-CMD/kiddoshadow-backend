const isStemSubject = (subject = "") => {
  const normalized = String(subject).trim().toLowerCase();
  return ["math", "maths", "mathematics", "physics", "chemistry"].includes(normalized);
};

const buildStemGuidance = (subject = "") => {
  if (!isStemSubject(subject)) return "";

  return `
Additional STEM requirements:
- Include all relevant formulas and symbolic equations from the chapter where applicable.
- For numericals, include equation-based and formula-substitution style questions.
- For geometry, optics, circuits, graphs, chemical structures, apparatus, ray diagrams, free-body diagrams, or labelled scientific diagrams, explicitly ask students to draw neat labelled diagrams wherever relevant.
- Preserve scientific notation, units, chemical equations, mathematical symbols, and formula formatting.
- Do not replace formulas with plain descriptive text if the chapter uses equations.
`;
};

const resolveQuestionPatternText = (questionPattern = {}) => {
  const selectedOneMarkType = String(questionPattern?.one_mark_type ?? questionPattern?.oneMarkType ?? "choose").replace(/_/g, " ");
  const selectedOneMarkCount = Number(questionPattern?.one_mark_count ?? questionPattern?.oneMarkCount ?? 4) || 0;
  const oneMarkChooseCount = Number(questionPattern?.one_mark_choose_count ?? questionPattern?.oneMarkChooseCount ?? 0) || 0;
  const oneMarkFillCount = Number(questionPattern?.one_mark_fill_count ?? questionPattern?.oneMarkFillCount ?? 0) || 0;
  const oneMarkMatchCount = Number(questionPattern?.one_mark_match_count ?? questionPattern?.oneMarkMatchCount ?? 0) || 0;
  const oneMarkTrueFalseCount = Number(questionPattern?.one_mark_true_false_count ?? questionPattern?.oneMarkTrueFalseCount ?? 0) || 0;
  const splitOneMarkCount = oneMarkChooseCount + oneMarkFillCount + oneMarkMatchCount + oneMarkTrueFalseCount;
  const oneMarkCount = splitOneMarkCount || selectedOneMarkCount;
  const twoMarkCount = Number(questionPattern?.two_mark_count ?? questionPattern?.twoMarkCount ?? 4) || 0;
  const threeMarkCount = Number(questionPattern?.three_mark_count ?? questionPattern?.threeMarkCount ?? 2) || 0;
  const fiveMarkCount = Number(questionPattern?.five_mark_count ?? questionPattern?.fiveMarkCount ?? 1) || 0;
  const totalMarks = oneMarkCount + twoMarkCount * 2 + threeMarkCount * 3 + fiveMarkCount * 5;

  return [
    `Section A: ${oneMarkCount} questions x 1 mark`,
    `  - Selected 1 mark type: ${selectedOneMarkType}`,
    `  - Choose the correct answer: ${splitOneMarkCount ? oneMarkChooseCount : selectedOneMarkType === "choose" ? oneMarkCount : 0}`,
    `  - Fill in the blanks: ${oneMarkFillCount}`,
    `  - Match the following: ${oneMarkMatchCount}`,
    `  - True or False: ${oneMarkTrueFalseCount}`,
    `Section B: ${twoMarkCount} questions x 2 marks`,
    `Section C: ${threeMarkCount} questions x 3 marks`,
    `Section D: ${fiveMarkCount} questions x 5 marks`,
    `Total Marks: ${totalMarks}`,
  ].join("\n");
};

export const PROMPTS = {
  lesson_summary: ({ topic, classLevel, subject }) => `
You are a school teacher preparing for a class.

Create a clear lesson summary for:
Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}

The summary should:
- Be structured
- Include key concepts
- Be easy to explain to students
- Fit a 30–40 minute class
${buildStemGuidance(subject)}
`,

  question_paper: ({ subject, classLevel, chapter, marks, question_pattern: questionPattern, questionPattern: camelQuestionPattern }) => `
Create a CBSE-style question paper for:

Class: ${classLevel}
Subject: ${subject}
Chapter: ${chapter}
Total Marks: ${marks}

Instructions:
- Follow CBSE exam pattern
- Include a mix of difficulty levels
- Include chapter-relevant textbook terminology
- Follow this exact marks split:
${resolveQuestionPatternText(questionPattern || camelQuestionPattern)}

Paper structure:
Section A: One mark questions
  - Choose the correct answer
  - Fill in the blanks
  - Match the following
  - True or False
Section B: Two mark questions
Section C: Three mark questions
Section D: Five mark questions

Clearly mention marks for each question.
${buildStemGuidance(subject)}
`,

  quiz: ({ topic, classLevel }) => `
Create a quiz for:
Class: ${classLevel}
Topic: ${topic}

Rules:
- 10 multiple choice questions
- 4 options per question
- Clearly mark the correct answer
`,

  homework: ({ topic, classLevel, subject }) => `
Create homework for:
Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}

Include:
- 5 theory questions
- 5 application-based questions
- Clear instructions for students
`,
};
