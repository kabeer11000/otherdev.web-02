export interface Greeting {
  hourStart: number;
  hourEnd: number;
  options: string[];
}

export const GREETINGS: Greeting[] = [
  {
    hourStart: 0,
    hourEnd: 5,
    options: [
      "Hello, night owl",
      "Burning the midnight oil?",
      "Still up, I see",
      "Late night inspiration strike?",
      "Welcome back, creative soul",
    ],
  },
  {
    hourStart: 5,
    hourEnd: 9,
    options: [
      "Good morning",
      "Early riser mode on",
      "Fresh start ahead",
      "Ready to create?",
    ],
  },
  {
    hourStart: 9,
    hourEnd: 12,
    options: [
      "Good morning",
      "Morning, let's make something great",
      "What's on your mind today?",
      "Feeling creative?",
    ],
  },
  {
    hourStart: 12,
    hourEnd: 17,
    options: [
      "Good afternoon",
      "Afternoon vibes",
      "Still grinding?",
      "How's the day treating you?",
    ],
  },
  {
    hourStart: 17,
    hourEnd: 21,
    options: [
      "Good evening",
      "Evening, creator",
      "Golden hour thinking time",
      "Winding down or gearing up?",
    ],
  },
  {
    hourStart: 21,
    hourEnd: 24,
    options: [
      "Good night",
      "Late night magic hour",
      "Night mode activated",
      "Quiet hours for the best ideas",
    ],
  },
];

export function getGreeting(): string {
  const hour = new Date().getHours();
  const bucket =
    GREETINGS.find(({ hourStart, hourEnd }) => hour >= hourStart && hour < hourEnd) ??
    GREETINGS[0];
  return bucket.options[Math.floor(Math.random() * bucket.options.length)];
}
