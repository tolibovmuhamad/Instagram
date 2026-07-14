// Данные для заметок: фоны (цвета/градиенты) и демо-каталог музыки.
// Музыкального API у бэкенда нет и стриминг «всей музыки из интернета» здесь
// недоступен — это витринный список с поиском, повторяющий UX Instagram.

export interface NoteBackground {
  id: string;
  /** значение для CSS background */
  style: string;
  /** тон текста поверх фона */
  text: "light" | "dark";
}

export const NOTE_BACKGROUNDS: NoteBackground[] = [
  { id: "default", style: "#f5f5f5", text: "dark" },
  { id: "graphite", style: "#262626", text: "light" },
  { id: "blue", style: "#0095f6", text: "light" },
  { id: "indigo", style: "#5b51d8", text: "light" },
  { id: "purple", style: "#8134af", text: "light" },
  { id: "pink", style: "#e1306c", text: "light" },
  { id: "red", style: "#ed4956", text: "light" },
  { id: "orange", style: "#f77737", text: "light" },
  { id: "amber", style: "#fbad50", text: "dark" },
  { id: "green", style: "#22c55e", text: "light" },
  { id: "teal", style: "#14b8a6", text: "light" },
  { id: "sunset", style: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", text: "light" },
  { id: "ocean", style: "linear-gradient(135deg,#2193b0,#6dd5ed)", text: "light" },
  { id: "grape", style: "linear-gradient(135deg,#7b4397,#dc2430)", text: "light" },
  { id: "peach", style: "linear-gradient(135deg,#ffecd2,#fcb69f)", text: "dark" },
  { id: "night", style: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)", text: "light" },
];

export function getNoteBackground(id: string): NoteBackground {
  return NOTE_BACKGROUNDS.find((background) => background.id === id) ?? NOTE_BACKGROUNDS[0];
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  /** CSS background для обложки */
  cover: string;
}

const COVER_GRADIENTS = [
  "linear-gradient(135deg,#f09433,#bc1888)",
  "linear-gradient(135deg,#2193b0,#6dd5ed)",
  "linear-gradient(135deg,#7b4397,#dc2430)",
  "linear-gradient(135deg,#11998e,#38ef7d)",
  "linear-gradient(135deg,#ee0979,#ff6a00)",
  "linear-gradient(135deg,#360033,#0b8793)",
  "linear-gradient(135deg,#fc466b,#3f5efb)",
  "linear-gradient(135deg,#c94b4b,#4b134f)",
];

const RAW_TRACKS: Omit<MusicTrack, "cover">[] = [
  { id: "1", title: "Blinding Lights", artist: "The Weeknd" },
  { id: "2", title: "As It Was", artist: "Harry Styles" },
  { id: "3", title: "Die For You", artist: "The Weeknd" },
  { id: "4", title: "Flowers", artist: "Miley Cyrus" },
  { id: "5", title: "Anti-Hero", artist: "Taylor Swift" },
  { id: "6", title: "Calm Down", artist: "Rema & Selena Gomez" },
  { id: "7", title: "Kill Bill", artist: "SZA" },
  { id: "8", title: "Unholy", artist: "Sam Smith & Kim Petras" },
  { id: "9", title: "Creepin'", artist: "Metro Boomin, The Weeknd" },
  { id: "10", title: "Shivers", artist: "Ed Sheeran" },
  { id: "11", title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
  { id: "12", title: "Ghost", artist: "Justin Bieber" },
  { id: "13", title: "Late Night Talking", artist: "Harry Styles" },
  { id: "14", title: "About Damn Time", artist: "Lizzo" },
  { id: "15", title: "Enemy", artist: "Imagine Dragons & JID" },
  { id: "16", title: "Bad Habit", artist: "Steve Lacy" },
  { id: "17", title: "Golden Hour", artist: "JVKE" },
  { id: "18", title: "Sweater Weather", artist: "The Neighbourhood" },
  { id: "19", title: "Heat Waves", artist: "Glass Animals" },
  { id: "20", title: "Snooze", artist: "SZA" },
];

export const MUSIC_TRACKS: MusicTrack[] = RAW_TRACKS.map((track, index) => ({
  ...track,
  cover: COVER_GRADIENTS[index % COVER_GRADIENTS.length],
}));
