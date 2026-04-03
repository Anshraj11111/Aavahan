'use strict';

const EVENT_DAYS = Object.freeze({
  DAY1: 'Day 1',
  DAY2: 'Day 2',
  BOTH: 'Day 1 / Day 2',
});

const EVENT_CATEGORIES = Object.freeze({
  CULTURAL: 'cultural',
  TECHNICAL: 'technical',
  GAMES: 'games',
  ROBOTICS: 'robotics',
  CODING: 'coding',
  DESIGN: 'design',
  PRESENTATION: 'presentation',
  EXHIBITION: 'exhibition',
  QUIZ: 'quiz',
  GAMING: 'gaming',
  OTHER: 'other',
});

const COORDINATOR_DAYS = Object.freeze({
  DAY1: 'Day 1',
  DAY2: 'Day 2',
  DAY3: 'Day 3',
  ALL: 'All',
});

// Cache TTLs in seconds
const CACHE_TTL = Object.freeze({
  FEATURED_EVENTS: 300,    // 5 min
  EVENT_LIST: 300,         // 5 min
  EVENT_DETAIL: 300,       // 5 min
  ANNOUNCEMENTS: 120,      // 2 min
  PAYMENT_CONFIG: 600,     // 10 min
  PUBLIC_STATS: 300,       // 5 min
});

// Cache key prefixes
const CACHE_KEYS = Object.freeze({
  FEATURED_EVENTS: 'events:featured',
  EVENT_LIST: 'events:list',
  EVENT_SLUG: 'events:slug:',
  ANNOUNCEMENTS: 'announcements:active',
  PAYMENT_CONFIG: 'payment:config:active',
  PUBLIC_STATS: 'public:stats',
});

module.exports = { EVENT_DAYS, EVENT_CATEGORIES, COORDINATOR_DAYS, CACHE_TTL, CACHE_KEYS };
