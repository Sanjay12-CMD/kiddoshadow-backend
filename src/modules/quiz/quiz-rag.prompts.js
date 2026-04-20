export function buildQuizPrompt({
  topic,
  classLevel,
  difficulty,
  numQuestions,
  excludedQuestionTexts = [],
}) {
  const avoidBlock = excludedQuestionTexts.length
    ? `
Previously used questions for this same topic that MUST NOT be repeated:
${excludedQuestionTexts.map((text, index) => `${index + 1}. ${text}`).join("\n")}
`
    : "";

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
- Every question must be different from the previously used questions listed below
- Avoid repeating the same wording, idea, or correct answer pattern
- Return ONLY valid JSON
- No explanation, no markdown, no text outside JSON

${avoidBlock}

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
