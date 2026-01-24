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

Paper structure:
Section A: MCQs  
Section B: Short answer questions  
Section C: Long answer questions  

Clearly mention marks for each question.
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
