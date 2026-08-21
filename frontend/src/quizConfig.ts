export const branches = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics & Communication Engineering (ECE)",
  "Electrical & Electronics Engineering (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biotechnology",
  "Other"
];

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "work_style",
    text: "How do you prefer to work?",
    options: [
      "I love deep, uninterrupted focus on complex problems.",
      "I prefer collaborating and communicating with a team.",
      "I like a mix of focused work and team interaction.",
      "I want to lead and coordinate others."
    ]
  },
  {
    id: "hands_on",
    text: "Do you prefer hands-on building or theoretical design?",
    options: [
      "I want to write code/build things constantly (Hands-on).",
      "I prefer designing architecture and solving abstract problems (Theoretical).",
      "I like doing a bit of both.",
      "I prefer talking to users and understanding their needs."
    ]
  },
  {
    id: "risk_tolerance",
    text: "What is your risk tolerance for your career path?",
    options: [
      "Low: I want a stable, well-paying corporate job.",
      "Medium: I'm open to fast-paced growth in established startups.",
      "High: I want to build my own company or join an early-stage startup."
    ]
  },
  {
    id: "ambiguity",
    text: "How comfortable are you with ambiguity?",
    options: [
      "I need clear, step-by-step instructions.",
      "I can figure things out if given a general direction.",
      "I thrive in chaos and love defining the path myself."
    ]
  },
  {
    id: "subjects",
    text: "What type of subjects did you enjoy the most in college?",
    options: [
      "Logic, Mathematics, and Algorithms",
      "Physics, Mechanics, and Hardware",
      "Design, Psychology, and Human-Computer Interaction",
      "Business, Management, and Economics"
    ]
  },
  {
    id: "future_goal",
    text: "Where do you see yourself in 5 years?",
    options: [
      "A senior individual contributor (e.g., Staff Engineer).",
      "Managing a team of engineers or designers.",
      "Running my own business.",
      "Working as a specialized consultant or freelancer."
    ]
  }
];
