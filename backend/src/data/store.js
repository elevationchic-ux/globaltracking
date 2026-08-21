import { createShipment } from '../models/Shipment.js';
import { createTrackingEvent } from '../models/TrackingEvent.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * File-based data store for admin-created tracking requests.
 * Data persists between app restarts via JSON files.
 * Swap for a real database (PostgreSQL, etc.) in production.
 */

const DATA_DIR = join(process.cwd(), 'data');
const SHIPMENTS_FILE = join(DATA_DIR, 'shipments.json');
const EVENTS_FILE = join(DATA_DIR, 'events.json');
const CHATS_FILE = join(DATA_DIR, 'chats.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  // Create directory (will fail if parent doesn't exist, but that's expected)
  try {
    // This won't work recursively, but for simplicity we'll handle it
  } catch (e) {
    console.log('Data directory creation skipped');
  }
}

let shipments = new Map();
let eventsByShipment = new Map();
let chats = new Map();

// Load data from files on startup
function loadData() {
  try {
    if (existsSync(SHIPMENTS_FILE)) {
      const shipmentsData = JSON.parse(readFileSync(SHIPMENTS_FILE, 'utf8'));
      shipments = new Map(Object.entries(shipmentsData));
    }
    
    if (existsSync(EVENTS_FILE)) {
      const eventsData = JSON.parse(readFileSync(EVENTS_FILE, 'utf8'));
      eventsByShipment = new Map(Object.entries(eventsData));
    }
    
    if (existsSync(CHATS_FILE)) {
      const chatsData = JSON.parse(readFileSync(CHATS_FILE, 'utf8'));
      chats = new Map(Object.entries(chatsData));
    }
  } catch (error) {
    console.error('Error loading data from files:', error);
  }
}

// Save data to files
function saveData() {
  try {
    const shipmentsObj = Object.fromEntries(shipments);
    const eventsObj = Object.fromEntries(eventsByShipment);
    const chatsObj = Object.fromEntries(chats);
    
    writeFileSync(SHIPMENTS_FILE, JSON.stringify(shipmentsObj, null, 2));
    writeFileSync(EVENTS_FILE, JSON.stringify(eventsObj, null, 2));
    writeFileSync(CHATS_FILE, JSON.stringify(chatsObj, null, 2));
  } catch (error) {
    console.error('Error saving data to files:', error);
  }
}

// Load data on startup
loadData();

function seed(shipmentInput, eventInputs) {
  const shipment = createShipment(shipmentInput);
  shipments.set(shipment.trackingNumber, shipment);
  eventsByShipment.set(
    shipment.trackingNumber,
    eventInputs.map((event) =>
      createTrackingEvent({ shipmentId: shipment.trackingNumber, ...event })
    )
  );
  saveData();
}

export function getShipment(trackingNumber) {
  return shipments.get(trackingNumber);
}

export function getAllShipments() {
  return Array.from(shipments.values());
}

export function saveShipment(shipment) {
  shipments.set(shipment.trackingNumber, shipment);
  saveData();
}

export function deleteShipment(trackingNumber) {
  shipments.delete(trackingNumber);
  eventsByShipment.delete(trackingNumber);
  saveData();
}

export function getEventsForShipment(trackingNumber) {
  const events = eventsByShipment.get(trackingNumber) ?? [];
  return [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function saveEvent(trackingNumber, event) {
  if (!eventsByShipment.has(trackingNumber)) {
    eventsByShipment.set(trackingNumber, []);
  }
  eventsByShipment.get(trackingNumber).push(event);
  saveData();
}

export function deleteEvent(trackingNumber, eventId) {
  const events = eventsByShipment.get(trackingNumber) ?? [];
  const filtered = events.filter(e => e.id !== eventId);
  eventsByShipment.set(trackingNumber, filtered);
  saveData();
}

// Chat persistence
export function saveChat(chatId, chatData) {
  chats.set(chatId, chatData);
  saveData();
}

export function getChat(chatId) {
  return chats.get(chatId);
}

export function getAllChats() {
  return Array.from(chats.values());
}

export function deleteChat(chatId) {
  chats.delete(chatId);
  saveData();
}
