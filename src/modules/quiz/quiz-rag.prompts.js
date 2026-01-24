export function buildQuizPrompt({
  topic,
  classLevel,
  difficulty,
  numQuestions,
  context,
}) {
  return `
You are a CBSE school exam question setter.

You MUST use ONLY the textbook content below.
DO NOT use outside knowledge.

Create a quiz for:
Class: ${classLevel}
Topic: ${topic}
Difficulty: ${difficulty}
Number of questions: ${numQuestions}

Rules:
- Each question must have 4 options
- Only one correct option
- Difficulty must match
- Questions must be suitable for Class ${classLevel}
- Return ONLY valid JSON
- No explanation, no markdown, no text outside JSON

Textbook content:
${context}

JSON format:
{
  "title": "...",
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_index": 0
    }
  ]
}
`;
}
