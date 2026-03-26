export interface Task {
  id: string;
  text: string;
  completed: boolean;
  type: "school" | "home" | "hobby";
  date: string;
  time?: string;
}

export interface CapyState {
  oranges: number;
  level: number;
  equippedItems: string[];
  ownedItems: string[];
  stickers: string[];
  streak: number;
  lastActiveDate: string;
}

export const CAPY_ITEMS = [
  { id: "hat", name: "Laço Rosa", emoji: "🎀", cost: 2, position: "top" },
  { id: "glasses", name: "Óculos Cool", emoji: "😎", cost: 5, position: "eyes" },
  { id: "crown", name: "Coroa Real", emoji: "👑", cost: 10, position: "top" },
  { id: "flower", name: "Florzinha", emoji: "🌸", cost: 1, position: "side" },
  { id: "star", name: "Estrela", emoji: "⭐", cost: 3, position: "side" },
];

export const ALL_STICKERS = [
  { id: 'star', emoji: '⭐', name: 'Estrela Brilhante' },
  { id: 'heart', emoji: '❤️', name: 'Super Coração' },
  { id: 'rainbow', emoji: '🌈', name: 'Arco-Íris Mágico' },
  { id: 'butterfly', emoji: '🦋', name: 'Borboleta Azul' },
  { id: 'moon', emoji: '🌙', name: 'Lua de Cristal' },
  { id: 'sun', emoji: '☀️', name: 'Sol da Alegria' },
  { id: 'crown', emoji: '👑', name: 'Coroa Real' },
  { id: 'diamond', emoji: '💎', name: 'Diamante Raro' },
  { id: 'lollipop', emoji: '🍭', name: 'Pirulito Doce' },
  { id: 'cupcake', emoji: '🧁', name: 'Cupcake de Fada' },
  { id: 'cat', emoji: '🐱', name: 'Gatinho Fofo' },
  { id: 'dog', emoji: '🐶', name: 'Cachorrinho Amigo' },
  { id: 'flower', emoji: '🌸', name: 'Flor de Cerejeira' },
  { id: 'cloud', emoji: '☁️', name: 'Nuvem de Algodão' },
  { id: 'music', emoji: '🎵', name: 'Nota Musical' },
  { id: 'balloon', emoji: '🎈', name: 'Balão de Festa' },
];
