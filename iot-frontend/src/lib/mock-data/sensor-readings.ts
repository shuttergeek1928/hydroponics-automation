import { SensorReading } from '../types';

// Simple seed-based pseudo-random generator for deterministic noise
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateReadingAtTime(deviceId: string, timestamp: Date): SensorReading {
  const ms = timestamp.getTime();
  const seed = ms + deviceId.charCodeAt(0) + deviceId.charCodeAt(deviceId.length - 1);
  const noise = (seededRandom(seed) - 0.5) * 2; // -1.0 to 1.0

  // Extract time of day for cycles
  const hours = timestamp.getUTCHours() + timestamp.getUTCMinutes() / 60 + timestamp.getUTCSeconds() / 3600;
  
  // Diurnal cycle (temp peaks in mid-afternoon, around 15:00 UTC)
  const diurnalCycle = Math.sin(((hours - 9) / 24) * 2 * Math.PI); // -1.0 to 1.0

  // Define states based on device/system rules
  let pumpState: 'on' | 'off' = 'off';
  let ledState: 'on' | 'off' = 'off';

  // LED state: diurnal cycle (ON between 06:00 and 22:00 UTC)
  if (deviceId !== 'dev-aero-104') {
    ledState = (hours >= 6 && hours < 22) ? 'on' : 'off';
  }

  // Pump state:
  if (deviceId === 'dev-nft-101') {
    pumpState = 'on'; // NFT pump runs continuously
  } else if (deviceId === 'dev-dwc-102') {
    pumpState = 'on'; // DWC air pump runs continuously
  } else if (deviceId === 'dev-drip-103') {
    // Drip runs for 10 minutes every 3 hours (e.g. at 0, 3, 6, 9, etc. hours)
    const baseHour = Math.floor(hours);
    const intervalHour = baseHour % 3;
    const minutes = timestamp.getUTCMinutes();
    pumpState = (intervalHour === 0 && minutes < 10) ? 'on' : 'off';
  } else if (deviceId === 'dev-aero-104') {
    // Aero normally runs 10s every 3m, but in MAINTENANCE it is OFF
    pumpState = 'off';
  }

  // Ambient conditions (greenhouse level, slightly different for each zone)
  const zoneOffsets: Record<string, { temp: number; hum: number }> = {
    'dev-nft-101': { temp: 22.0, hum: 60.0 }, // Zone Alpha
    'dev-dwc-102': { temp: 21.5, hum: 62.0 }, // Zone Beta
    'dev-drip-103': { temp: 23.5, hum: 58.0 }, // Zone Gamma
    'dev-aero-104': { temp: 24.0, hum: 55.0 }, // Zone Delta
  };

  const offset = zoneOffsets[deviceId] || { temp: 22.0, hum: 60.0 };
  const ambientTemp = offset.temp + diurnalCycle * 3.5 + noise * 0.2;
  const humidity = offset.hum - diurnalCycle * 10 + noise * 1.0;

  // Device-specific water quality readings
  let ph = 6.0;
  let tds = 1000;
  let waterTemp = 20.0;
  let waterLevel = 90;
  let dissolvedOxygen = 7.0;
  let moisture: number | undefined;

  switch (deviceId) {
    case 'dev-nft-101': // NFT - Lettuce
      ph = 5.8 + Math.sin(ms / (6 * 3600 * 1000)) * 0.15 + noise * 0.03;
      const nftDosingCycle = (ms % (12 * 3600 * 1000)) / (12 * 3600 * 1000);
      tds = 850 - nftDosingCycle * 40 + noise * 5;
      waterTemp = 19.5 + diurnalCycle * 1.2 + noise * 0.05;
      waterLevel = 94 - ((ms / (24 * 3600 * 1000)) % 1) * 3 + noise * 0.1;
      dissolvedOxygen = 7.6 - (waterTemp - 19.5) * 0.15 + noise * 0.05;
      break;

    case 'dev-dwc-102': // DWC - Basil
      ph = 6.2 + Math.cos(ms / (8 * 3600 * 1000)) * 0.1 + noise * 0.03;
      const dwcDosingCycle = (ms % (24 * 3600 * 1000)) / (24 * 3600 * 1000);
      tds = 1050 - dwcDosingCycle * 60 + noise * 5;
      waterTemp = 20.0 + diurnalCycle * 0.5 + noise * 0.03;
      waterLevel = 88 - ((ms / (48 * 3600 * 1000)) % 1) * 5 + noise * 0.1;
      dissolvedOxygen = 8.4 - (waterTemp - 20.0) * 0.1 + noise * 0.04;
      break;

    case 'dev-drip-103': // Drip - Tomato
      const eightHoursAgo = new Date().getTime() - 8 * 3600 * 1000;
      if (ms > eightHoursAgo) {
        const progress = (ms - eightHoursAgo) / (8 * 3600 * 1000);
        ph = 5.7 + progress * 1.1 + noise * 0.05; // drifts up to 6.8
      } else {
        ph = 5.7 + Math.sin(ms / (4 * 3600 * 1000)) * 0.1 + noise * 0.03;
      }
      
      tds = 1250 - ((ms % (8 * 3600 * 1000)) / (8 * 3600 * 1000)) * 80 + noise * 10;
      waterTemp = 21.0 + diurnalCycle * 1.5 + noise * 0.05;
      
      const twelveHoursAgo = new Date().getTime() - 12 * 3600 * 1000;
      if (ms > twelveHoursAgo) {
        const leakProgress = (ms - twelveHoursAgo) / (12 * 3600 * 1000);
        waterLevel = 75 - leakProgress * 40 + noise * 0.2; // 75% down to 35%
      } else {
        waterLevel = 75 - ((ms / (12 * 3600 * 1000)) % 1) * 2 + noise * 0.1;
      }
      
      dissolvedOxygen = 6.8 - (waterTemp - 21.0) * 0.1 + noise * 0.05;

      const minutesSincePumpCycle = (timestamp.getUTCMinutes() % 180) + timestamp.getUTCSeconds() / 60;
      if (minutesSincePumpCycle < 10) {
        moisture = 45 + (minutesSincePumpCycle / 10) * 33 + noise * 0.5;
      } else {
        moisture = 78 - ((minutesSincePumpCycle - 10) / 170) * 33 + noise * 0.5;
      }
      break;

    case 'dev-aero-104': // Aeroponic - Strawberry
      ph = 6.0 + Math.sin(ms / (12 * 3600 * 1000)) * 0.3 + noise * 0.05;
      tds = 980 + noise * 15;
      waterTemp = 23.0 + diurnalCycle * 2.5 + noise * 0.1;
      waterLevel = 50 + noise * 0.05;
      dissolvedOxygen = 5.2 + Math.sin(ms / (24 * 3600 * 1000)) * 0.3 + noise * 0.05;
      break;
  }

  return {
    id: `read-${deviceId}-${ms}`,
    deviceId,
    timestamp: timestamp.toISOString(),
    ph,
    tds,
    temperature: waterTemp, // maps to expected page key 'temperature'
    waterLevel,
    dissolvedOxygen,
    ambientTemp,
    humidity,
    moisture,
    pumpState,
    ledState,
  };
}

export function generateSensorHistory(deviceId: string, hours: number = 24): SensorReading[] {
  const points: SensorReading[] = [];
  const now = new Date();
  const intervalSeconds = 30;
  const totalPoints = (hours * 3600) / intervalSeconds;

  for (let i = totalPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalSeconds * 1000);
    points.push(generateReadingAtTime(deviceId, timestamp));
  }

  return points;
}
