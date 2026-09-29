# Final system inventory

## `nio_firmware`: device application

The device application is organized around explicit settings and runtime state. `getSettings()` holds intended configuration while `getState()` begins as a copy and records what is actually active. Failed initialization can therefore disable a component in runtime state without silently rewriting the desired configuration.

The main loop is a short dispatcher. Depending on settings and compile-time capabilities, it advances Wi-Fi, sleep, battery I/O, IoT delivery, datalogging, LEDs, IMU, GPS, Enphase, LoRa, Iridium receive processing and SDR tasks. Most operations are timer-driven `tick*()` functions rather than one blocking application routine.

### Hardware and sensing

- GPS acquisition, standby/cold-start control and coordinate persistence in NVS.
- IMU initialization and normal/sleep power modes.
- ADS channels for vibration, rectifier, 3 V and 100 V measurements.
- Battery voltage ADC and LM75/I2C configuration.
- Main-board, battery-board and communications I/O expanders.
- Configurable reset, power, status and interrupt pins.
- Optional cold-chain temperature support.
- Enphase gateway acquisition, including larger response handling in the later implementation.

### Communications

- Wi-Fi station and access-point operation, DHCP/static IP, DNS and optional hotspot/repeater behavior.
- HTTP/HTTPS IoT delivery.
- LoRa and LoRaWAN through RN2903A configuration commands.
- Iridium satellite delivery through serial or I2C.
- Preliminary/optional Swarm satellite delivery.
- Modbus initialization, register access and retry policy.
- Configurable UART mapping and baud rates for monitor, GPS, LoRa, Iridium, Modbus and Swarm.

### Data and packets

- Periodic sensor records stored as binary datalog entries.
- Size and age limits for log files.
- Recovery of pending records and retransmission after connectivity returns.
- JSON rendering of binary log entries for the web UI.
- Configurable packet sections for GPS, IMU and ADS data.
- Optional CCSDS formatting and legacy packet support.
- Local telemetry, slave telemetry and relay-oriented device state.

### Power lifecycle

- Normal and sleep profiles.
- Timers for sleep eligibility, forced sleep, successful wake and failed-send retry wake.
- Peripheral shutdown and battery-rail control before deep sleep.
- NVS state used to decide the next wake interval.
- Prevention of sleep while messages remain unsent.
- Restart into the sleep profile before entering the final deep-sleep path.

### Local administration

The device runs an asynchronous web server with optional authentication. It serves generated forms and JSON endpoints for board, serial, XCA, Wi-Fi, monitoring, security, datalogging, ADS, IoT, Iridium, Modbus and LoRa settings when those features are compiled.

It also exposes Wi-Fi scan/status, ping/MAC identity, device time/uptime, datalog history and filesystem-backed UI assets. Saving a form updates the typed settings structure, persists `/settings.json`, and marks a restart requirement for groups whose hardware must be reinitialized.

### OTA and recovery

The updater writes to the next OTA partition, tracks progress, validates the image flow, and supports rollback. During initialization, the firmware detects a failed update, records the failed filename in `rollback_from`, selects the previous partition and avoids treating the failed image as a normal upgrade candidate.

## `saipp`: portable C++ support

`saipp` contains the code that no longer belongs specifically to the NIO application:

- Platform types and aliases shared with the underlying `llc` library.
- MAC-address and platform helpers.
- Logging and compact error-propagation policies.
- Filesystem information, directory listing, bounded reads, writes and deletion for Arduino and desktop platforms.
- Timers, frame counters, Unix time and Arduino-compatible `millis()`/`micros()` behavior.
- A compact string type and trimming helpers.
- SPI access and configuration for non-Arduino test programs.

Its history includes Linux and desktop build fixes required by LMS7002M/SDR tests. This confirms it became a cross-environment support library rather than merely a folder of firmware helpers.

## `saithon`: shared Python build/backend support

`saithon` centralizes the small operations used by both the firmware build and backend:

- Directory selection for settings, firmware, SDR output and filesystem UI assets.
- General and MAC-specific source/target paths.
- Timestamped filenames whose lexical order represents release time.
- File filtering and validation.
- Git branch and commit discovery for build identity.
- Time formatting and earlier HTTP-server helpers.

This extraction prevents the build script and monitor from independently inventing path and naming rules.

## `saimon`: remote settings and firmware service

The final service is a compact FastAPI application. A device POSTs a named JSON document under its MAC-address path. The service:

1. Stores the latest document in a per-device directory.
2. Skips identical reports.
3. Saves a timestamped historical difference when values change.
4. Locates a MAC-specific desired settings file, falling back to global defaults.
5. Returns only settings whose desired values differ from the device report.
6. Corrects device/server time metadata when necessary.
7. On an active-state report, finds the newest applicable firmware binary.
8. Excludes the binary named by `rollback_from`.
9. Returns the binary as an octet stream or an empty JSON response when no update applies.

The backend is intentionally small because the firmware report contains enough identity and state to make the update decision.

## `nio_packet_endpoint`: telemetry ingress and protocol decoder

The endpoint receives an outer JSON request containing transmission time, gateway or Iridium coordinates and a hexadecimal `data` field. It then decodes the firmware's compact binary representation:

```text
F1 packet function
    + 6-byte MAC address
    + uint32 timestamp
    + uint8 battery
    + int8 temperature
    + zero or more tagged sensor sections
```

The section dispatch table recognizes:

- `B`: GPS latitude, longitude, altitude and speed.
- `C`: six three-dimensional IMU vectors: acceleration, accelerometer, angular velocity, gravity, magnetometer and orientation.
- `D`: eight capacity constants/measurements.
- `E`: rectification, vibration, 3 V and 100 V analog measurements.

This matches the packed C++ record types in `sai_datalog_record.h` and demonstrates that the format is usable outside the firmware. The decoder returns the header, a list of typed sections and any unconsumed bytes; the HTTP handler rejects a packet when bytes remain.

The current implementation is best described as a protocol proof and diagnostic endpoint. It prints the decoded values and contains a placeholder for the eventual database/backend operation. It does not yet authenticate requests, limit request size, catch malformed JSON/hex/short-packet exceptions, validate every section before unpacking, or preserve unknown sections safely. Those are ingress-hardening tasks; the useful artifact already present is an executable specification of the wire format in a second language.

## Build and deployment assets

The build script creates `nio_build_version.h` with the timestamp, Git branch, Git commit, generated filename and source settings profile. Before building SPIFFS, it copies the shared UI and the selected profile into the filesystem image as `settings.json` and a backup. After a program build or upload, it copies the firmware to the shared update location under its timestamped name.

The final workspace includes upload scripts and bootloader, partition, firmware and SPIFFS images, making field installation possible without reconstructing the development environment.
