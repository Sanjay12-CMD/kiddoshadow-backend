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

  question_paper: ({ subject, classLevel, chapter, marks }) => `
Create a CBSE-style question paper for:

Class: ${classLevel}
Subject: ${subject}
Chapter: ${chapter}
Total Marks: ${marks}

Instructions:
- Follow CBSE exam pattern
- Include a mix of difficulty levels
- Include chapter-relevant textbook terminology

Paper structure:
Section A: MCQs  
Section B: Short answer questions  
Section C: Long answer questions  

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
