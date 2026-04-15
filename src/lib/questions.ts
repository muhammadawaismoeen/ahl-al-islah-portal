/**
 * Question Set Registry
 * ----------------------------------------------------------------
 * Each position references a `questionSet` by id. Application
 * forms are rendered dynamically from these question sets, so you
 * can create tailored forms for different roles without writing
 * new form code.
 *
 * To add a new question set:
 *   1. Add a new entry to the QUESTION_SETS object.
 *   2. Define sections → fields.
 *   3. Reference the set id from positions.ts.
 */

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "url";

export interface FieldOption {
  label: string;
  value: string;
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  options?: FieldOption[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  // For checkbox groups: minimum required selections
  minSelected?: number;
  // Conditional rendering: only show if `dependsOn.fieldId` equals any of `dependsOn.values`
  dependsOn?: { fieldId: string; values: string[] };
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  arabicTitle?: string;
  fields: Field[];
}

export interface QuestionSet {
  id: string;
  name: string;
  description: string;
  sections: Section[];
}

// ---------------------------------------------------------------
// Head Application (for Male Head & Female Head positions)
// ---------------------------------------------------------------
const HEAD_APPLICATION: QuestionSet = {
  id: "head-application",
  name: "Head Application",
  description:
    "Application for the Head position in either wing of Ahl Al-Islah.",
  sections: [
    {
      id: "basic",
      title: "Basic Information",
      arabicTitle: "المعلومات الأساسية",
      description: "Tell us who you are.",
      fields: [
        {
          id: "fullName",
          type: "text",
          label: "Full name (as per official records)",
          placeholder: "e.g., Abdullah bin Ahmad",
          required: true,
          minLength: 3,
          maxLength: 100,
        },
        {
          id: "kunyah",
          type: "text",
          label: "Kunyah or preferred name (optional)",
          placeholder: "e.g., Abu Yusuf",
          required: false,
          maxLength: 80,
        },
        {
          id: "email",
          type: "email",
          label: "Email",
          placeholder: "you@example.com",
          required: true,
          help: "We will use this only for application correspondence.",
        },
        {
          id: "phone",
          type: "tel",
          label: "WhatsApp number (with country code)",
          placeholder: "+92 3XX XXXXXXX",
          required: true,
          help: "Preferred channel for interview scheduling.",
        },
        {
          id: "age",
          type: "number",
          label: "Age",
          required: true,
          min: 17,
          max: 40,
        },
        {
          id: "city",
          type: "text",
          label: "City of residence",
          placeholder: "e.g., Lahore",
          required: true,
        },
      ],
    },
    {
      id: "academic",
      title: "Academic Information",
      arabicTitle: "المعلومات الأكاديمية",
      fields: [
        {
          id: "institution",
          type: "text",
          label: "Medical college / institution",
          placeholder: "Full institution name",
          required: true,
        },
        {
          id: "yearOfStudy",
          type: "select",
          label: "Current year of study",
          required: true,
          options: [
            { label: "1st year MBBS / BDS", value: "1st" },
            { label: "2nd year MBBS / BDS", value: "2nd" },
            { label: "3rd year MBBS / BDS", value: "3rd" },
            { label: "4th year MBBS / BDS", value: "4th" },
            { label: "Final year MBBS / BDS", value: "final" },
            { label: "House officer / intern", value: "house" },
            { label: "Other", value: "other" },
          ],
        },
        {
          id: "rollNumber",
          type: "text",
          label: "Roll number / student ID",
          required: true,
        },
        {
          id: "gpa",
          type: "text",
          label: "Current CGPA or academic standing (optional)",
          placeholder: "e.g., 3.6 or A grade",
          required: false,
          help: "Not a selection criterion — just context.",
        },
      ],
    },
    {
      id: "position",
      title: "Position & Wing Confirmation",
      arabicTitle: "تأكيد المنصب",
      description:
        "Ahl Al-Islah operates two fully separate wings. The Male Head and Female Head never interact directly — all coordination flows through the Advisor.",
      fields: [
        {
          id: "wingConfirm",
          type: "radio",
          label: "I am applying as a:",
          required: true,
          options: [
            { label: "Brother (applying for Male Head)", value: "male" },
            { label: "Sister (applying for Female Head)", value: "female" },
          ],
        },
        {
          id: "readStructureDoc",
          type: "radio",
          label:
            "Have you read the Ahl Al-Islah Department Structure & Strategic Roadmap document?",
          required: true,
          options: [
            { label: "Yes, I have read it in full", value: "yes-full" },
            { label: "Yes, but only portions", value: "yes-partial" },
            { label: "No, not yet", value: "no" },
          ],
          help: "If no, please request a copy from the Advisor before submitting.",
        },
      ],
    },
    {
      id: "deen",
      title: "Deen & Character",
      arabicTitle: "الدين والخلق",
      description:
        "These questions are not a test — they help us understand where you are in your journey so we can support you well. Be honest. There is no wrong answer except dishonesty.",
      fields: [
        {
          id: "prayers",
          type: "radio",
          label: "Commitment to the 5 daily prayers (salah)",
          required: true,
          options: [
            {
              label:
                "I pray all 5 daily — in jamaa'ah (for brothers) or on time (for sisters)",
              value: "consistent-jamaah",
            },
            {
              label: "I pray all 5 daily, though not always on time",
              value: "consistent",
            },
            {
              label: "I pray most prayers but occasionally miss one",
              value: "mostly",
            },
            {
              label: "I am working on being consistent",
              value: "improving",
            },
          ],
        },
        {
          id: "quranEngagement",
          type: "textarea",
          label:
            "Describe your current relationship with the Qur'an (recitation, memorization, reflection, study)",
          required: true,
          minLength: 50,
          maxLength: 1000,
          placeholder:
            "e.g., 'I recite daily after Fajr, have memorized Juz 'Amma, and study tafsir weekly…'",
        },
        {
          id: "islamicLearning",
          type: "textarea",
          label:
            "How do you currently engage in Islamic learning? (classes, teachers, books, lectures)",
          required: true,
          minLength: 50,
          maxLength: 1000,
          placeholder:
            "Name any teachers you study with, courses you've taken, or ongoing learning commitments.",
        },
        {
          id: "hayaUnderstanding",
          type: "textarea",
          label:
            "In your own words, what is haya' (modesty), and how does it shape how you interact with the opposite gender?",
          required: true,
          minLength: 100,
          maxLength: 1500,
          help: "We want to hear your understanding, not a textbook answer.",
        },
        {
          id: "zeroInteractionAgreement",
          type: "radio",
          label:
            "Ahl Al-Islah's core structure is zero cross-gender interaction at the team level — the Advisor is the sole bridge between wings. Do you understand and agree with this?",
          required: true,
          options: [
            {
              label:
                "Yes — I understand it, agree with it, and will uphold it without exception",
              value: "agree-strong",
            },
            {
              label:
                "Yes, I agree in principle but have questions I'd like to discuss in the interview",
              value: "agree-questions",
            },
            {
              label: "I have serious reservations about this",
              value: "disagree",
            },
          ],
        },
        {
          id: "boundaryScenario",
          type: "textarea",
          label:
            "Scenario: A member of your wing quietly tells you they have been messaging someone from the other wing 'about department work.' What do you do, and why?",
          required: true,
          minLength: 150,
          maxLength: 2000,
          help: "There is no single right answer — we want to see how you think.",
        },
      ],
    },
    {
      id: "leadership",
      title: "Leadership & Experience",
      arabicTitle: "القيادة والخبرة",
      fields: [
        {
          id: "priorLeadership",
          type: "textarea",
          label:
            "Previous leadership experience (Islamic or otherwise). Include roles, duration, and outcomes.",
          required: true,
          minLength: 100,
          maxLength: 2000,
          placeholder:
            "e.g., 'Led my college MSA for a year, grew membership from 10 to 40, organized 6 events…'",
        },
        {
          id: "whyThisRole",
          type: "textarea",
          label: "Why do you want this role?",
          required: true,
          minLength: 150,
          maxLength: 2500,
          help: "Be specific. 'To serve Allah' is true but insufficient — why this role, why now, why you?",
        },
        {
          id: "vision",
          type: "textarea",
          label:
            "What is your 12-month vision for your wing of Ahl Al-Islah? Describe 2–3 concrete initiatives you'd want to lead.",
          required: true,
          minLength: 200,
          maxLength: 3000,
        },
        {
          id: "strengths",
          type: "textarea",
          label: "What are the top 3 qualities you bring to this role?",
          required: true,
          minLength: 80,
          maxLength: 1000,
        },
        {
          id: "weaknesses",
          type: "textarea",
          label:
            "What is one weakness or gap you are aware of, and how will you compensate for it?",
          required: true,
          minLength: 80,
          maxLength: 1000,
          help: "Self-awareness matters more than perfection.",
        },
      ],
    },
    {
      id: "practical",
      title: "Practical Commitment",
      arabicTitle: "الالتزام العملي",
      fields: [
        {
          id: "weeklyHours",
          type: "select",
          label:
            "How many hours per week can you realistically commit during academic terms?",
          required: true,
          options: [
            { label: "Less than 4 hours", value: "<4" },
            { label: "4–6 hours", value: "4-6" },
            { label: "6–8 hours (recommended)", value: "6-8" },
            { label: "8–10 hours", value: "8-10" },
            { label: "More than 10 hours", value: "10+" },
          ],
          help: "The role requires 6–8 hours/week on average.",
        },
        {
          id: "examConflicts",
          type: "textarea",
          label:
            "Are there known periods (exams, rotations, postings) when your availability will drop? How will you handle continuity?",
          required: true,
          minLength: 50,
          maxLength: 1500,
        },
        {
          id: "termCommitment",
          type: "radio",
          label:
            "The term is 1 academic year. Can you commit to completing the full term?",
          required: true,
          options: [
            { label: "Yes, insha'Allah", value: "yes" },
            { label: "Yes, with a caveat I've explained above", value: "yes-caveat" },
            { label: "I'm unsure", value: "unsure" },
          ],
        },
        {
          id: "successorCommitment",
          type: "radio",
          label:
            "Are you willing to identify and train your successor in the final 2–3 months of your term?",
          required: true,
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
      ],
    },
    {
      id: "references",
      title: "References",
      arabicTitle: "المعرّفون",
      description:
        "Two references who can speak to your Deen and character. At least one must be someone senior in knowledge (teacher, scholar, or senior student of knowledge). References must be the same gender as you.",
      fields: [
        {
          id: "ref1Name",
          type: "text",
          label: "Reference 1 — name",
          required: true,
        },
        {
          id: "ref1Relation",
          type: "text",
          label: "Reference 1 — relationship to you",
          placeholder: "e.g., 'My Qur'an teacher for 3 years'",
          required: true,
        },
        {
          id: "ref1Contact",
          type: "text",
          label: "Reference 1 — phone or email",
          required: true,
        },
        {
          id: "ref2Name",
          type: "text",
          label: "Reference 2 — name",
          required: true,
        },
        {
          id: "ref2Relation",
          type: "text",
          label: "Reference 2 — relationship to you",
          required: true,
        },
        {
          id: "ref2Contact",
          type: "text",
          label: "Reference 2 — phone or email",
          required: true,
        },
      ],
    },
    {
      id: "declarations",
      title: "Declarations & Consent",
      arabicTitle: "الإقرارات",
      description: "Read each declaration carefully before ticking.",
      fields: [
        {
          id: "declareTruthful",
          type: "checkbox",
          label:
            "I affirm that everything in this application is truthful, to the best of my knowledge.",
          required: true,
          minSelected: 1,
          options: [{ label: "I affirm", value: "yes" }],
        },
        {
          id: "declareShariahFirst",
          type: "checkbox",
          label:
            "I commit to uphold the Shariah-first structure of Ahl Al-Islah, including the zero cross-gender interaction policy at the team level.",
          required: true,
          minSelected: 1,
          options: [{ label: "I commit", value: "yes" }],
        },
        {
          id: "declareConfidentiality",
          type: "checkbox",
          label:
            "I understand that internal department matters are confidential and I will not disclose them outside the team.",
          required: true,
          minSelected: 1,
          options: [{ label: "I understand", value: "yes" }],
        },
        {
          id: "additionalNotes",
          type: "textarea",
          label: "Anything else you'd like the Advisor to know? (optional)",
          required: false,
          maxLength: 2000,
        },
      ],
    },
  ],
};

export const QUESTION_SETS: Record<string, QuestionSet> = {
  "head-application": HEAD_APPLICATION,
};

export function getQuestionSet(id: string): QuestionSet | undefined {
  return QUESTION_SETS[id];
}
