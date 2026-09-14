import type { NewProject } from "@/db/schema";

import { image } from "./lib";

export type ProjectSeed = Omit<NewProject, "body"> & {
  /** Markdown file in scripts/seed/content/projects. */
  bodyFile: string;
  /** Tag names; tags are created as needed. */
  tags: string[];
};

const vq = (file: string) => `/images/projects/vision-quest/${file}`;

export const projectSeeds: ProjectSeed[] = [
  /* ---------------------------------------------------------------------- */
  /* Featured and published                                                 */
  /* ---------------------------------------------------------------------- */
  {
    slug: "3d-solar-system",
    title: "3D Solar System",
    tagline:
      "A real N-body simulation of the solar system, with every surface drawn by shaders.",
    summary:
      "An interactive solar system in the browser. Twenty bodies pull on each other in an N-body simulation seeded from JPL orbital data, procedural GLSL draws every surface with no image textures, and 60,000 asteroids orbit with Kepler's equation solved on the GPU.",
    bodyFile: "projects/3d-solar-system.md",
    coverImage: image(
      "/images/projects/3d-solar-system/cover.webp",
      "The Sun and the planets' orbits drawn in perspective above the title Solar System.",
    ),
    techStack: ["Three.js", "GLSL", "JavaScript", "WebGL"],
    tags: ["Graphics", "Simulation", "Web"],
    repoUrl: "https://github.com/vegaa055/3d-solar-system",
    liveUrl: "https://3d-solar-system-indol.vercel.app/",
    featured: true,
    sortOrder: 10,
    status: "published",
    publishedAt: new Date("2026-09-03T12:00:00Z"),
  },
  {
    slug: "vision-quest",
    title: "Vision Quest",
    tagline:
      "A six-engine polyphonic synthesizer in the style of Arturia Pigments, built in C++ with JUCE.",
    summary:
      "A VST3 and standalone synthesizer with two swappable sound engines per voice (analog, wavetable, granular, sample, harmonic, and modal), dual filters, a 16-slot modulation matrix, a polyrhythmic step sequencer, and three effects buses.",
    bodyFile: "projects/vision-quest.md",
    coverImage: image(
      vq("matrix.webp"),
      "Vision Quest's editor on the Matrix tab, with a sample engine, a granular engine, two filters, and three modulation routings.",
    ),
    gallery: [
      image(
        vq("modulators.webp"),
        "Vision Quest's editor on the Modulators tab.",
        "Modulators",
      ),
      image(
        vq("functions.webp"),
        "Vision Quest's editor on the Functions tab, showing three function generator shapes.",
        "Function generators",
      ),
      image(
        vq("sequencer.webp"),
        "Vision Quest's editor on the Sequencer tab.",
        "Step sequencer",
      ),
      image(
        vq("effects.webp"),
        "Vision Quest's editor on the Effects tab.",
        "Effects buses",
      ),
      image(
        vq("keyboard.webp"),
        "Vision Quest's editor on the Keyboard tab.",
        "Typing keyboard",
      ),
    ],
    techStack: ["C++", "JUCE 9", "VST3", "CMake"],
    tags: ["Audio"],
    featured: true,
    sortOrder: 20,
    status: "published",
    publishedAt: new Date("2026-08-06T12:00:00Z"),
  },
  {
    slug: "myth-tracker",
    title: "Myth Tracker",
    tagline:
      "An atlas of humanity's oldest stories, with a similarity engine that separates real transmission from coincidence.",
    summary:
      "Maps six of the world's great myth families as geolocated regional tellings, then scores every pair with a motif-based similarity engine tuned against pairs where scholars already agree on the answer. Built with Next.js, Leaflet, and Neo4j.",
    bodyFile: "projects/myth-tracker.md",
    coverImage: image(
      "/images/projects/myth-tracker/cover.webp",
      "The title Myth Tracker beneath a small constellation and a glowing four-pointed star.",
    ),
    techStack: ["Next.js", "React", "TypeScript", "Neo4j", "Leaflet"],
    tags: ["Web", "Data"],
    repoUrl: "https://github.com/vegaa055/myth-tracker",
    featured: true,
    sortOrder: 30,
    status: "published",
    publishedAt: new Date("2026-08-27T12:00:00Z"),
  },
  {
    slug: "astral-vega",
    title: "Astral Vega",
    tagline:
      "A Serum-inspired wavetable synthesizer with band-limited wavetables, drag-and-drop modulation, and a synthwave interface.",
    summary:
      "A VST3 and standalone wavetable synth built milestone by milestone in C++ and JUCE 8: alias-free mipmapped wavetables, Serum-format table import, a modulation matrix with drag-and-drop routing, an effects chain, presets, and a custom neon UI with a live oscilloscope.",
    bodyFile: "projects/astral-vega.md",
    techStack: ["C++", "JUCE 8", "VST3", "CMake"],
    tags: ["Audio"],
    repoUrl: "https://github.com/vegaa055/astral-vega-synth-vst",
    featured: true,
    sortOrder: 40,
    status: "published",
    publishedAt: new Date("2026-08-04T12:00:00Z"),
  },

  /* ---------------------------------------------------------------------- */
  /* Drafts from the earlier portfolios, to review and publish later        */
  /* ---------------------------------------------------------------------- */
  {
    slug: "solar-forecast-dashboard",
    title: "Solar Forecast Dashboard",
    tagline:
      "Short-horizon solar irradiance forecasting for Arizona sites, end to end.",
    summary:
      "A Flask and MySQL service that ingests Open-Meteo weather data on a schedule, retrains an XGBoost model daily against historical ground truth, and serves forecasts through a REST API and a Chart.js dashboard.",
    bodyFile: "projects/solar-forecast-dashboard.md",
    techStack: ["Python", "Flask", "MySQL", "XGBoost", "Docker"],
    tags: ["Machine Learning", "Data", "Web"],
    sortOrder: 110,
    status: "draft",
  },
  {
    slug: "custom-cms",
    title: "Custom CMS",
    tagline: "A full content platform built from zero in PHP and MySQL.",
    summary:
      "Articles, threaded forums, nested comments, user profiles, voting, tags, and image uploads, with no framework and no ORM. Built to understand what frameworks actually do for you, by doing it all by hand.",
    bodyFile: "projects/custom-cms.md",
    techStack: ["PHP", "MySQL", "TinyMCE"],
    tags: ["Web"],
    sortOrder: 120,
    status: "draft",
  },
  {
    slug: "solaris-space-weather",
    title: "SOLARIS",
    tagline:
      "A mission-control dashboard for real-time space weather from NOAA's Space Weather Prediction Center.",
    summary:
      "A React and Vite dashboard that pulls from 11 NOAA/SWPC endpoints (solar wind, Kp index, X-ray flux, particle flux, aurora forecasts) and presents them in a retro mission-control style.",
    bodyFile: "projects/solaris-space-weather.md",
    techStack: ["React", "Vite", "Chart.js"],
    tags: ["Web", "Data"],
    sortOrder: 130,
    status: "draft",
  },
  {
    slug: "fleetbook",
    title: "FleetBook",
    tagline:
      "A fleet management system built three times: tkinter, then Django, then serverless AWS.",
    summary:
      "The same fleet management problem solved with three stacks: a Python and tkinter desktop app, a Django web app, and a serverless AWS app on Lambda, API Gateway, DynamoDB, and S3.",
    bodyFile: "projects/fleetbook.md",
    techStack: ["Python", "tkinter", "Django", "AWS Lambda", "DynamoDB"],
    tags: ["Web", "Cloud"],
    sortOrder: 140,
    status: "draft",
  },
  {
    slug: "wyze-beatz",
    title: "Wyze Beatz",
    tagline:
      "A music portfolio site that treats audio as a first-class design element.",
    summary:
      "A custom audio player built on WaveSurfer.js with canvas visualizers, hosting hip-hop instrumentals, synthwave, and experimental tracks under the Wyze Beatz name.",
    bodyFile: "projects/wyze-beatz.md",
    techStack: ["JavaScript", "Canvas", "Web Audio API", "WaveSurfer.js"],
    tags: ["Web", "Audio"],
    liveUrl: "https://wyzebeatz.com",
    sortOrder: 150,
    status: "draft",
  },
  {
    slug: "ai-song-pipeline",
    title: "AI Song Generation Pipeline",
    tagline:
      "An n8n workflow that turns a form submission into a finished song.",
    summary:
      "A 17-node n8n workflow: a form trigger, Claude generating structured lyrics, Suno generating the audio, and S3 storing the result, designed to be operable by someone who doesn't write code.",
    bodyFile: "projects/ai-song-pipeline.md",
    techStack: ["n8n", "Claude API", "Suno", "AWS S3"],
    tags: ["Automation", "Audio"],
    sortOrder: 160,
    status: "draft",
  },
  {
    slug: "threat-reporting-portal",
    title: "Anonymous Threat Reporting Portal",
    tagline:
      "A serverless AWS portal for submitting and triaging anonymous reports.",
    summary:
      "A public report submission form backed by AWS Lambda, API Gateway, and S3, built at the University of Arizona's Cyber Convergence Center as a training asset.",
    bodyFile: "projects/threat-reporting-portal.md",
    techStack: ["AWS Lambda", "API Gateway", "S3", "CloudFront", "Python"],
    tags: ["Cloud", "Security"],
    sortOrder: 170,
    status: "draft",
  },
  {
    slug: "cryptid-hunter-rogue",
    title: "Cryptid Hunter: Rogue",
    tagline:
      "A 2D roguelike dungeon crawler with procedural dungeons, pathfinding enemies, and 2D lighting.",
    summary:
      "A 2D roguelike built in Unity and C#, with procedurally generated dungeons, enemies that use A* pathfinding, shader effects, and 2D lighting and shadows.",
    bodyFile: "projects/cryptid-hunter-rogue.md",
    coverImage: image(
      "/images/projects/cryptid-hunter-rogue/forest-level.webp",
      "Cryptid Hunter: Rogue gameplay in a forest level.",
    ),
    gallery: [
      image(
        "/images/projects/cryptid-hunter-rogue/scene-01.webp",
        "A scene from Cryptid Hunter: Rogue.",
      ),
    ],
    techStack: ["Unity", "C#"],
    tags: ["Games"],
    sortOrder: 180,
    status: "draft",
  },
  {
    slug: "space-force",
    title: "Space Force",
    tagline:
      "A retro-inspired space shooter written in Python with Pygame, no engine.",
    summary:
      "A 2D space shooter where waves of enemies grow until you're destroyed, with power-ups and high scores. Built in Python with Pygame during an independent study.",
    bodyFile: "projects/space-force.md",
    coverImage: image(
      "/images/projects/space-force/cover.webp",
      "Space Force cover art.",
    ),
    techStack: ["Python", "Pygame"],
    tags: ["Games"],
    repoUrl: "https://github.com/vegaa055/SpaceForce",
    liveUrl: "https://vegaa1983.itch.io/space-force",
    sortOrder: 190,
    status: "draft",
  },
  {
    slug: "5-rules-to-survive-tower-3",
    title: "5 Rules to Survive Tower 3",
    tagline:
      "A branching horror story game in Twine, inspired by rules-based creepypasta.",
    summary:
      "A narrative game with multiple endings, built in Twine as a final project for a narrative game design class. Inspired by creepypasta stories where a new employee receives an ominous list of rules.",
    bodyFile: "projects/5-rules-to-survive-tower-3.md",
    coverImage: image(
      "/images/projects/5-rules-to-survive-tower-3/cover.webp",
      "Screenshot of 5 Rules to Survive Tower 3.",
    ),
    gallery: [
      image(
        "/images/projects/5-rules-to-survive-tower-3/story-graph.webp",
        "The Twine story graph for 5 Rules to Survive Tower 3.",
        "Twine story graph",
      ),
      image(
        "/images/projects/5-rules-to-survive-tower-3/storyboard.webp",
        "Storyboard for 5 Rules to Survive Tower 3.",
        "Storyboard",
      ),
    ],
    techStack: ["Twine"],
    tags: ["Games"],
    sortOrder: 200,
    status: "draft",
  },
];
