# NIO packet endpoint

## Purpose

`nio_packet_endpoint` is the receiving-side companion to the firmware packet and datalog code. It accepts telemetry wrapped in JSON, decodes the hexadecimal binary payload, and exposes the decoded values as typed Python dictionaries.

The project was added to `FirmwareWorks` on 26 June 2024. It contains 155 physical lines in two Python files.

## Input contract

The HTTP handler expects a POST body with:

- `data`: the hexadecimal encoded NIO packet.
- `transmit_time`: transmission metadata supplied by the outer service.
- `iridium_latitude` and `iridium_longitude`, or the generic `latitude` and `longitude` alternatives.

The gateway location is distinct from the optional GPS section inside the packet. That distinction allows the backend to retain both where the transport provider believed the transmission originated and what the NIO itself measured.

## Binary protocol

The decoder reads the payload sequentially, consuming each field and returning the remaining bytes:

| Portion | Encoding | Meaning |
| --- | --- | --- |
| Function | 2 hexadecimal characters | Currently handles `F1` sensor packets |
| MAC | 12 hexadecimal characters | Six-byte device identity |
| Record header | `<IBb` | Little-endian timestamp, battery and signed temperature |
| Section tag | ASCII byte | Selects the structure that follows |
| GPS (`B`) | `<4f` | Latitude, longitude, altitude and speed |
| IMU (`C`) | six × `<3f` | Six three-axis vectors |
| Capacity (`D`) | `<8f` | GS, GP, GC, GW, TS, TP, TC and TW |
| ADS (`E`) | `<4f` | Rectification, vibration, 3 V and 100 V values |

This corresponds to the packed firmware record header and `RECORD_TYPE` values `gps`, `imu`, `capacity` and `ads`. The Python implementation therefore acts as a cross-language compatibility test and a readable protocol description.

## What it already enables

- Device identity can be recovered without depending on the outer HTTP route.
- Battery, temperature and record time are common to every decoded packet.
- Optional sensor blocks can be composed without a fixed monolithic packet size.
- The receiver can distinguish device GPS from transport-provider coordinates.
- Extra unparsed bytes are surfaced and cause the HTTP request to be rejected.
- New section readers can be registered through the callback table.

## Current limits

The handler currently prints decoded data and returns success; the database or downstream API operation remains a placeholder. It also assumes trusted input. Production use would require authentication, a body-size limit, structured exception responses, hexadecimal and minimum-length validation, a policy for unknown section codes, and explicit versioning or length information for future protocol changes.

There is also no persistence, replay protection, duplicate detection or schema validation in this project. Those limitations do not weaken its value as the protocol decoder; they define the remaining work needed to turn the diagnostic endpoint into a public ingestion service.

## Architectural position

```text
NIO sensors
    -> packed record sections
    -> optional Wi-Fi / Iridium transport
    -> outer JSON delivery metadata
    -> nio_packet_endpoint
    -> typed header and sensor dictionaries
    -> future storage, analysis or forwarding
```

Together with `saimon`, this gives the system two distinct backend paths: `saimon` manages configuration and software lifecycle, while `nio_packet_endpoint` receives operational telemetry.
