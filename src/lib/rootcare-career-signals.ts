/** Rule-based strengths and career tracks from basic assessment sliders (no LLM). */

export type CareerSignals = {
  strengths: string[];
  careerSuggestions: string[];
};

export function deriveCareerSignals(answers: Record<string, number>): CareerSignals {
  const q1 = answers.q1 ?? 3;
  const q2 = answers.q2 ?? 3;
  const q3 = answers.q3 ?? 3;
  const q4 = answers.q4 ?? 3;
  const q5 = answers.q5 ?? 3;

  const strengths: string[] = [];
  const careers = new Set<string>();

  if (q1 >= 4) {
    strengths.push("Analytical & technical thinking");
    careers.add("Engineering & technology");
    careers.add("Data & research");
  } else if (q1 >= 2) strengths.push("Balanced problem-solving");

  if (q2 >= 4) {
    strengths.push("Communication & leadership");
    careers.add("Product & strategy");
    careers.add("Education & training");
  }

  if (q3 >= 4) {
    strengths.push("Structure & reliability");
    careers.add("Operations & administration");
  } else if (q3 <= 2) {
    strengths.push("Adaptability in open-ended work");
    careers.add("Creative & entrepreneurial paths");
  }

  if (q4 >= 4) {
    strengths.push("Hands-on learning");
    careers.add("Applied sciences & skilled trades");
    careers.add("Healthcare support roles");
  }

  if (q5 >= 4) {
    strengths.push("Industry & trend awareness");
    careers.add("Business development");
    careers.add("Policy & social impact");
  }

  if (strengths.length === 0) strengths.push("Versatile profile — worth exploring across clusters");

  if (careers.size < 3) {
    careers.add("Digital skills & marketing");
    careers.add("Design & user experience");
  }

  return {
    strengths: strengths.slice(0, 5),
    careerSuggestions: [...careers].slice(0, 6),
  };
}
