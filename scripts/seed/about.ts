import type { AboutPage } from "@/db/schema";

import { content, image } from "./lib";

export const aboutSeed: Omit<AboutPage, "id" | "updatedAt"> = {
  headline:
    "Software and game developer building simulations, synthesizers, and web apps.",
  bio: content("about.md"),
  portrait: image("/images/about/portrait.webp", "Portrait of Tony Vega."),
  skills: [
    {
      label: "Languages",
      items: [
        "C++",
        "C#",
        "C",
        "Python",
        "TypeScript",
        "JavaScript",
        "Java",
        "Kotlin",
        "PHP",
        "GLSL",
      ],
    },
    {
      label: "Web",
      items: [
        "Next.js",
        "React",
        "Flask",
        "Django",
        "Tailwind CSS",
        "HTML",
        "CSS",
        "Bootstrap",
      ],
    },
    {
      label: "Graphics and audio",
      items: ["Three.js", "WebGL", "JUCE", "DSP", "Web Audio API"],
    },
    {
      label: "Game development",
      items: ["Unity", "Unreal Engine", "Godot", "Pygame", "Twine"],
    },
    {
      label: "Data and cloud",
      items: [
        "PostgreSQL",
        "MySQL",
        "Neo4j",
        "Docker",
        "AWS Lambda",
        "S3",
        "DynamoDB",
        "Vercel",
      ],
    },
    {
      label: "Practices",
      items: ["Git", "Agile", "Scrum"],
    },
  ],
  experience: [
    {
      kind: "work",
      role: "Administrative Assistant",
      organization:
        "University of Arizona, College of Applied Science & Technology",
      period: "Jul 2024 – Jul 2025",
      description:
        "Answered phone calls and directed callers to the right extensions, helped walk-in visitors find the information they needed, and handled mail and packages.",
    },
    {
      kind: "work",
      role: "Administrative Student Worker",
      organization:
        "University of Arizona, College of Applied Science & Technology",
      period: "Apr 2023 – Jul 2024",
      description:
        "Answered calls, helped walk-in visitors, maintained SharePoint pages, and developed Power Apps applications.",
    },
    {
      kind: "work",
      role: "Research Assistant, VR Lab",
      organization:
        "University of Arizona, College of Applied Science & Technology",
      period: "Dec 2021 – Aug 2022",
      description:
        "Supported VR research, assisted study participants, collected observations, and maintained VR equipment.",
    },
    {
      kind: "education",
      role: "Bachelor of Applied Science, Computer Science",
      organization:
        "University of Arizona, College of Applied Science & Technology",
      period: "Graduated 2024",
      description:
        "Focused on software development, game design, and AI. Involved in VR research and campus tech initiatives.",
    },
    {
      kind: "education",
      role: "Associate of Applied Science, Computer Programming",
      organization: "Cochise College",
      period: "Graduated 2022",
      description:
        "Foundation coursework in computer science, mathematics, and critical thinking.",
    },
  ],
};
