import { HydroSystem } from '../types';

export const mockSystems: HydroSystem[] = [
  {
    id: 'sys-nft-1',
    name: 'Zone Alpha - NFT Lettuce',
    type: 'NFT',
    description: 'Nutrient Film Technique system optimized for leafy greens. Continuously recirculates a thin stream of nutrient-rich water over plant roots.',
    status: 'ACTIVE',
    cropType: 'Butterhead Lettuce',
    plantedAt: '2026-06-10T08:00:00Z',
    capacity: 120, // Liters
    deviceId: 'dev-nft-101',
  },
  {
    id: 'sys-dwc-2',
    name: 'Zone Beta - DWC Basil',
    type: 'DWC',
    description: 'Deep Water Culture system. Plant roots are suspended in highly aerated nutrient solution. High dissolved oxygen is critical.',
    status: 'ACTIVE',
    cropType: 'Sweet Genovese Basil',
    plantedAt: '2026-06-22T09:30:00Z',
    capacity: 80, // Liters
    deviceId: 'dev-dwc-102',
  },
  {
    id: 'sys-drip-3',
    name: 'Zone Gamma - Drip Tomato',
    type: 'DRIP',
    description: 'Micro-drip irrigation system with coco coir substrate. Delivers precise nutrient dosing directly to the root zone at timed intervals.',
    status: 'ALERT', // Active alert for testing
    cropType: 'Cherry Tomatoes',
    plantedAt: '2026-05-15T07:00:00Z',
    capacity: 200, // Liters
    deviceId: 'dev-drip-103',
  },
  {
    id: 'sys-aero-4',
    name: 'Zone Delta - Aeroponic Strawberry',
    type: 'AEROPONICS',
    description: 'High-pressure aeroponics system. Roots are suspended in air and misted with nutrient solution every few minutes for maximum aeration.',
    status: 'INACTIVE', // Offline / Maintenance testing
    cropType: 'Albion Strawberries',
    plantedAt: '2026-07-01T10:00:00Z',
    capacity: 150, // Liters
    deviceId: 'dev-aero-104',
  },
];
