import { AutomationSchedule } from '../types';

export const mockSchedules: AutomationSchedule[] = [
  // NFT schedules
  {
    id: 'sch-nft-light',
    name: 'Vegetative Light Cycle',
    type: 'lighting',
    timeStart: '06:00',
    timeEnd: '22:00',
    active: true,
    targetDevice: 'dev-nft-101',
    description: '16-hour vegetative growth light cycle optimized for leafy greens.'
  },
  {
    id: 'sch-nft-pump',
    name: 'Continuous Recirculation',
    type: 'watering',
    timeStart: '00:00',
    duration: 1440,
    active: true,
    targetDevice: 'dev-nft-101',
    description: 'NFT recirculating pump runs continuously to avoid root dryness.'
  },

  // DWC schedules
  {
    id: 'sch-dwc-light',
    name: 'Basil Growth Lighting',
    type: 'lighting',
    timeStart: '06:00',
    timeEnd: '22:00',
    active: true,
    targetDevice: 'dev-dwc-102',
    description: 'Standard 16-hour lighting cycle for maximum oil production in basil.'
  },
  {
    id: 'sch-dwc-dosing',
    name: 'Weekly Nutrient Supplement',
    type: 'nutrient',
    timeStart: '08:00',
    duration: 2,
    active: true,
    targetDevice: 'dev-dwc-102',
    description: 'Triggers nutrient dosing pumps for A+B concentrate replenishment.'
  },

  // Drip schedules
  {
    id: 'sch-drip-pump',
    name: 'Tomato Micro-Drip Schedule',
    type: 'watering',
    timeStart: '06:00',
    duration: 10,
    active: true,
    targetDevice: 'dev-drip-103',
    description: 'Drips nutrient solutions into rockwool/coco coir beds. Cycles every 3 hours.'
  },
  {
    id: 'sch-drip-light',
    name: 'Tomato Fruiting Light Cycle',
    type: 'lighting',
    timeStart: '05:00',
    timeEnd: '23:00', // 18h lighting
    active: true,
    targetDevice: 'dev-drip-103',
    description: '18-hour intense photoperiod for tomato flowering and fruit sizing.'
  },

  // Aero schedules (maintenance/inactive)
  {
    id: 'sch-aero-pump',
    name: 'Aeroponic Root Misting',
    type: 'watering',
    timeStart: '00:00',
    duration: 1, // mist 1 minute
    active: false, // Suspended due to maintenance
    targetDevice: 'dev-aero-104',
    description: 'High-pressure misting cycles: 1 minute misting, 5 minutes idle.'
  },
];
