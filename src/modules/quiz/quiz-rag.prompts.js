export function buildQuizPrompt({
  topic,
  classLevel,
  difficulty,
  numQuestions,
}) {
  return `
You are a school exam question setter.

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

JSON format:
{
  "title": "...",
  "questions": [
    {
      "question_text": "...",
      "options": ["...", "...", "...", "..."],
      "correct_option_index": 0
    }
  ]
}
`;
}
