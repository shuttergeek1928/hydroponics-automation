export interface Point {
  x: number;
  y: number;
}

export type WireColor = 'red' | 'black' | 'blue' | 'green' | 'yellow' | 'orange' | 'white';

export interface TerminalPin {
  id: string; // Unique terminal ID (e.g. 'esp32_c1_gpio-26')
  componentId: string;
  name: string; // Label e.g. 'G26', 'VCC', 'GND', 'A0', 'Hole 14C'
  type: 'vcc' | 'gnd' | 'gpio' | 'signal' | 'breadboard-hole';
  relPos: Point; // Position relative to component top-left corner
  absPos?: Point; // Absolute canvas position
}

export interface StudioComponent {
  id: string;
  type: 'esp32' | 'esp8266' | 'breadboard' | 'power_supply' | 'ph_sensor' | 'tds_sensor' | 'water_level' | 'do_sensor' | 'relay' | 'led' | 'dht22';
  name: string;
  pos: Point;
  rotation: number; // in degrees
  width: number;
  height: number;
  terminals: TerminalPin[];
}

export interface CircuitWire {
  id: string;
  fromTerminalId: string;
  toTerminalId: string;
  color: WireColor;
  waypoints: Point[]; // Custom bend points
}

export interface NetlistNode {
  terminalId: string;
  componentId: string;
  connectedTerminalIds: string[];
  voltageState?: '5V' | '3.3V' | 'GND' | 'SIGNAL_ACTIVE' | 'SIGNAL_OFF';
}
