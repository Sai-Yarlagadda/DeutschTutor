export type Scenario = {
  id: string;
  name: string;
  nameDE: string;
  description: string;
  icon: string;
  audioFile: string;
  vocabulary: string[];
  personaIds: string[];
  systemPromptAddition: string;
};

const scenarios: Scenario[] = [
  {
    id: "railway-station",
    name: "Railway Station",
    nameDE: "Bahnhof",
    description:
      "Navigate a busy German train station: buy tickets, check platforms, and ask about delays.",
    icon: "🚂",
    audioFile: "railway.mp3",
    vocabulary: [
      "der Bahnhof",
      "der Zug",
      "das Gleis",
      "die Abfahrt",
      "die Ankunft",
      "der Fahrschein",
      "der Verspätung",
      "das Gepäck",
      "der Bahnsteig",
      "einfache Fahrt",
    ],
    personaIds: ["railway-employee"],
    systemPromptAddition:
      "You are at a busy German railway station (Bahnhof). The user is a traveller who needs help navigating the station, purchasing tickets, or finding the right platform.",
  },
  {
    id: "cafe",
    name: "Café",
    nameDE: "Café",
    description:
      "Order coffee and cake, chat with locals, and practise everyday small talk in a cosy German café.",
    icon: "☕",
    audioFile: "cafe.mp3",
    vocabulary: [
      "der Kaffee",
      "der Kuchen",
      "die Speisekarte",
      "die Bestellung",
      "die Rechnung",
      "das Trinkgeld",
      "die Tasse",
      "das Stück",
      "bestellen",
      "zahlen",
    ],
    personaIds: ["berlin-student", "bavarian-grandma"],
    systemPromptAddition:
      "You are in a relaxed German café. The atmosphere is warm and informal, and the user is either ordering food and drinks or having a casual conversation with someone sitting nearby.",
  },
  {
    id: "hotel",
    name: "Hotel",
    nameDE: "Hotel",
    description:
      "Check in, request amenities, and handle common hotel situations in German.",
    icon: "🏨",
    audioFile: "hotel.mp3",
    vocabulary: [
      "die Rezeption",
      "das Zimmer",
      "der Schlüssel",
      "die Reservierung",
      "das Frühstück",
      "der Aufzug",
      "das Handtuch",
      "die Etage",
      "auschecken",
      "einchecken",
    ],
    personaIds: ["austrian-receptionist"],
    systemPromptAddition:
      "You are in the lobby of a mid-range hotel in an Austrian or German city. The user is a guest who is checking in, asking about hotel services, or resolving a room-related issue.",
  },
  {
    id: "university",
    name: "University",
    nameDE: "Universität",
    description:
      "Discuss lectures, campus life, and student routines with a fellow student at a German university.",
    icon: "🎓",
    audioFile: "classroom.mp3",
    vocabulary: [
      "die Vorlesung",
      "das Seminar",
      "die Prüfung",
      "der Stundenplan",
      "die Bibliothek",
      "der Hörsaal",
      "die Hausarbeit",
      "das Studienfach",
      "belegen",
      "der Kommilitone",
    ],
    personaIds: ["berlin-student"],
    systemPromptAddition:
      "You are on a German university campus — perhaps between lectures or in the library. The user is a new or exchange student who wants to find out about courses, campus facilities, or student life.",
  },
  {
    id: "german-friend",
    name: "German Friend",
    nameDE: "Deutscher Freund",
    description:
      "Have an informal catch-up conversation with a German friend at home or in the neighbourhood.",
    icon: "👥",
    audioFile: "apartment.mp3",
    vocabulary: [
      "das Wochenende",
      "der Freund",
      "die Freizeit",
      "das Hobby",
      "der Abend",
      "zusammen",
      "übrigens",
      "erzählen",
      "der Nachbar",
      "gemütlich",
    ],
    personaIds: ["bavarian-grandma", "berlin-student"],
    systemPromptAddition:
      "You are spending time with a German friend in a casual home or neighbourhood setting. Keep the conversation natural, friendly, and informal, as if catching up with someone you know well.",
  },
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export function getAllScenarios(): Scenario[] {
  return scenarios;
}
