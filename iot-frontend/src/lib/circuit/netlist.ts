import { StudioComponent, CircuitWire, NetlistNode } from './types';

export function buildNetlistGraph(
  components: StudioComponent[],
  wires: CircuitWire[]
): Map<string, NetlistNode> {
  const nodes = new Map<string, NetlistNode>();

  // Initialize nodes for every terminal in every component
  components.forEach((comp) => {
    comp.terminals.forEach((term) => {
      nodes.set(term.id, {
        terminalId: term.id,
        componentId: comp.id,
        connectedTerminalIds: [],
      });
    });
  });

  // Populate graph edges based on wires
  wires.forEach((wire) => {
    const nodeA = nodes.get(wire.fromTerminalId);
    const nodeB = nodes.get(wire.toTerminalId);

    if (nodeA && nodeB) {
      if (!nodeA.connectedTerminalIds.includes(wire.toTerminalId)) {
        nodeA.connectedTerminalIds.push(wire.toTerminalId);
      }
      if (!nodeB.connectedTerminalIds.includes(wire.fromTerminalId)) {
        nodeB.connectedTerminalIds.push(wire.fromTerminalId);
      }
    }
  });

  // Also connect breadboard internal buses (e.g. Columns 1-63 rows A-E, F-J, VCC/GND rails)
  components.forEach((comp) => {
    if (comp.type === 'breadboard') {
      // Connect vertical 5-hole buses (A-E and F-J)
      for (let col = 1; col <= 63; col++) {
        const topRowHoles = comp.terminals.filter((t) => t.name.startsWith(`H_${col}_`) && ['A', 'B', 'C', 'D', 'E'].some(r => t.name.endsWith(r)));
        const botRowHoles = comp.terminals.filter((t) => t.name.startsWith(`H_${col}_`) && ['F', 'G', 'H', 'I', 'J'].some(r => t.name.endsWith(r)));

        connectTerminalGroup(nodes, topRowHoles.map(t => t.id));
        connectTerminalGroup(nodes, botRowHoles.map(t => t.id));
      }

      // Connect Top & Bottom Power Rails
      const vccTop = comp.terminals.filter(t => t.name.startsWith('RAIL_VCC_TOP')).map(t => t.id);
      const gndTop = comp.terminals.filter(t => t.name.startsWith('RAIL_GND_TOP')).map(t => t.id);
      const vccBot = comp.terminals.filter(t => t.name.startsWith('RAIL_VCC_BOT')).map(t => t.id);
      const gndBot = comp.terminals.filter(t => t.name.startsWith('RAIL_GND_BOT')).map(t => t.id);

      connectTerminalGroup(nodes, vccTop);
      connectTerminalGroup(nodes, gndTop);
      connectTerminalGroup(nodes, vccBot);
      connectTerminalGroup(nodes, gndBot);
    }
  });

  return nodes;
}

function connectTerminalGroup(nodes: Map<string, NetlistNode>, ids: string[]) {
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const nodeA = nodes.get(ids[i]);
      const nodeB = nodes.get(ids[j]);
      if (nodeA && nodeB) {
        if (!nodeA.connectedTerminalIds.includes(ids[j])) nodeA.connectedTerminalIds.push(ids[j]);
        if (!nodeB.connectedTerminalIds.includes(ids[i])) nodeB.connectedTerminalIds.push(ids[i]);
      }
    }
  }
}
