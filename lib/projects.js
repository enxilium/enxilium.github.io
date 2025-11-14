export const PROJECT_LINKS = {
  // Populate each entry with the canonical link for the project.
  "doorbash": "https://github.com/notMarkMP1/htn-2025",
  "anti-tetris": null,
  "posture-checker": null,
};

export const PROJECTS = [
  {
    slug: "doorbash",
    title: "DoorBash",
    timeframe: "Hack the North 2024 · Warp Finalist",
    summary:
      "A voice-enabled terminal assistant that routes diners to restaurants via Vapi AI and real-time telephony.",
    feature: {
      distance: 650,
      alignment: "right",
      height: 3.7,
      body:
        "Voice-driven ordering agent that reached Warp finalist status and routed diners to restaurants in real time.",
    },
  },
  {
    slug: "anti-tetris",
    title: "AntiTetris",
    timeframe: "NewHacks 2024 · 1st Place",
    summary:
      "A cybersecurity training game that flips Tetris on its head to teach packet inspection and threat response.",
    feature: {
      distance: 760,
      alignment: "left",
      height: 3.5,
      body:
        "Cybersecurity puzzler that won NewHacks by gamifying incident response with live WebSocket-powered play.",
    },
  },
  {
    slug: "posture-checker",
    title: "Posture Checker Robot",
    timeframe: "UTRAHacks 2024 · 2nd Place",
    summary:
      "A computer-vision posture coach that deploys seamlessly through Terraform-managed AWS infrastructure.",
    feature: {
      distance: 880,
      alignment: "right",
      height: 3.6,
      body:
        "Computer-vision posture coach deployed with Terraform and Docker that captured 2nd place at UTRAHacks.",
    },
  },
];
