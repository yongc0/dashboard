import { subMinutes } from 'date-fns'
import type { ControllerEvent, ControllerTelemetry } from '../types'

export const c1Telemetry: ControllerTelemetry = {
  controllerId: 'C1',
  name: 'Gate & Arena Local Controller',
  location: 'Penstock structure · south-west corner of arena collector loop',
  plcClass: 'Industrial PLC · Siemens LOGO! / Allen-Bradley Micro800 class',
  deployment: 'proposed',
  mode: 'AUTO',
  command: 'CLOSE',
  confirmedPosition: 'CLOSED',
  transition: 'CONFIRMED',
  gateSideLevelM: 1.38,
  gateSideDhdtMhr: 0.11,
  downstreamLevelM: 1.72,
  backflowInterlock: true,
  gateMotorCurrentA: 0,
  motorJam: false,
  manualLockout: false,
  emergencyHold: false,
  mainsAvailable: true,
  upsState: 'PENDING',
  plcHealthy: true,
  telemetryHealthy: true,
  modbusHealthy: true,
  lastContact: subMinutes(new Date(), 1),
  programRevision: 'PLC-R7-DEMO',
  localLogRetention: 'PENDING — align with SLB covenant evidence requirement',
}

export const controllerEvents: ControllerEvent[] = [
  {
    id: 'C1-E004',
    controllerId: 'C1',
    timestamp: subMinutes(new Date(), 2),
    type: 'INTERLOCK_ACTIVE',
    message: 'Downstream level exceeds gate-side level; backflow interlock active.',
    source: 'PLC_LOCAL',
    acknowledged: true,
  },
  {
    id: 'C1-E003',
    controllerId: 'C1',
    timestamp: subMinutes(new Date(), 4),
    type: 'POSITION_CONFIRMED',
    message: 'Penstock CLOSED confirmed by position feedback.',
    source: 'PLC_LOCAL',
    acknowledged: true,
  },
  {
    id: 'C1-E002',
    controllerId: 'C1',
    timestamp: subMinutes(new Date(), 5),
    type: 'COMMAND_ACCEPTED',
    message: 'Local close command accepted after interlock evaluation.',
    source: 'PLC_LOCAL',
    acknowledged: true,
  },
  {
    id: 'C1-E001',
    controllerId: 'C1',
    timestamp: subMinutes(new Date(), 18),
    type: 'HEARTBEAT',
    message: 'PLC, Modbus RTU and LoRaWAN telemetry healthy.',
    source: 'SYSTEM',
    acknowledged: true,
  },
]

export const controllerBOM = [
  { item: 'Industrial PLC + IP65 panel', status: 'CONFIRMED', note: 'Bankable O&M platform' },
  { item: 'Dedicated gate-side level sensor', status: 'CONFIRMED', note: 'Local level and dh/dt input' },
  { item: 'Dedicated downstream level sensor', status: 'CONFIRMED', note: 'Backflow interlock input' },
  { item: 'Gate position feedback', status: 'CONFIRMED', note: 'Encoder or open/closed/mid limit switches' },
  { item: 'Gate motor CT clamp', status: 'CONFIRMED', note: 'Jam/obstruction detection' },
  { item: 'Fail-closed actuator', status: 'PENDING', note: 'Model and cost not finalised' },
  { item: 'Arena pump CT / starter / VFD', status: 'PENDING', note: 'Decision D2 and pump count required' },
  { item: 'Manual lockout selector', status: 'CONFIRMED', note: 'Physical exception path' },
  { item: 'Emergency hold, sirens, strobes, signage', status: 'PENDING', note: 'Access and acoustic surveys required' },
  { item: 'RS-485 Modbus + LoRaWAN uplink', status: 'CONFIRMED', note: 'Supervisory telemetry; not the safety loop' },
  { item: 'PLC UPS', status: 'PENDING', note: 'Runtime sizing not yet costed' },
  { item: 'Local audit ring buffer', status: 'PENDING', note: 'Retention window to align with SLB evidence' },
]

export const gatewayStatus = [
  { id: 'GW1', site: 'Retention pond candidate site', backhaul: '4G/5G', backup: '≥72 h', status: 'SITE PENDING' },
  { id: 'GW2', site: 'Arena / opposite-catchment candidate', backhaul: 'Ethernet/fibre', backup: '≥72 h', status: 'SITE PENDING' },
]
