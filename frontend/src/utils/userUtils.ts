// Lists for generating random nicknames
const adjectives = [
  'Happy', 'Sunny', 'Brave', 'Clever', 'Swift', 'Bright', 'Kind', 'Wise', 'Cool', 'Smart',
  'Bold', 'Quick', 'Calm', 'Wild', 'Free', 'Pure', 'True', 'Fair', 'Warm', 'Fresh',
  'Lucky', 'Magic', 'Noble', 'Royal', 'Silent', 'Strong', 'Gentle', 'Mystic', 'Golden', 'Silver'
];

const animals = [
  'Lion', 'Eagle', 'Tiger', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Owl', 'Deer', 'Rabbit',
  'Panda', 'Dolphin', 'Whale', 'Shark', 'Cat', 'Dog', 'Bird', 'Fish', 'Bee', 'Butterfly',
  'Dragon', 'Phoenix', 'Unicorn', 'Falcon', 'Raven', 'Swan', 'Turtle', 'Penguin', 'Koala', 'Seal'
];

/**
 * Simple hash function for browser compatibility
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Hash a Telegram user ID for privacy
 */
export function hashUserId(telegramId: number): string {
  return simpleHash(telegramId.toString()).substring(0, 16);
}

/**
 * Generate a random nickname
 */
export function generateRandomNickname(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${adjective}${animal}${number}`;
}

/**
 * Generate a consistent random nickname based on hashed user ID
 * This ensures the same user always gets the same nickname
 */
export function generateConsistentNickname(hashedUserId: string): string {
  // Use the hash as seed for consistent randomness
  const seed = parseInt(hashedUserId.substring(0, 8), 16);
  
  // Simple seeded random function
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  const adjIndex = Math.floor(seededRandom(seed) * adjectives.length);
  const animalIndex = Math.floor(seededRandom(seed + 1) * animals.length);
  const number = Math.floor(seededRandom(seed + 2) * 100).toString().padStart(2, '0');
  
  return `${adjectives[adjIndex]}${animals[animalIndex]}${number}`;
}