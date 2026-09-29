# Settings and remote management

## Scale and organization

Up to 176 serialized names appear in the final settings schema code. That count includes build metadata, SDR task fields and several disabled/commented fields, so it is a measure of schema surface rather than the exact number present in every build.

The active structure is divided into hardware and software groups:

| Group | What it controls |
| --- | --- |
| `board` | CPU rate, power/sleep policy, device enable flags, reset pins, I2C addresses, identity, GPS position and rollback state |
| `serial` | UART selection, pins and baud rates for the attached communication devices |
| `wifi` | STA/AP enablement, credentials, static/DHCP addresses, DNS, hotspot, reconnect/log timers, NTP and time zone |
| `xca` | Logical mapping and polarity of battery/power-board I/O-expander pins |
| `ads` | Channel enablement and pin selection for four analog sensor classes |
| `lora` | RN2903A radio commands, LoRaWAN mode and status pins |
| `iridium` | Serial/I2C selection and Iridium device address |
| `monitor` | Remote monitor host, port, protocol and update interval |
| `iot` | Device identity, endpoint, HTTP timeout, send timing, CCSDS and transmission behavior |
| `datalog` | Included sensor sections, log location, cadence and size/time retention limits |
| `sdr` | Task-list and processing endpoints, polling delay and typed schedule entries |
| `modbus` | Server, stop delay, request/modbus retry delays and retry counts |
| `enphase` | Gateway address/API, token, enablement and sampling interval |
| `security` | Local administration authentication and credentials |
| `info` | Build time, source branch/commit, binary filename and source settings profile |

`SettingsHardware` and `SettingsSoftware` inherit the relevant group implementations. Feature flags remove unavailable groups from reduced firmware builds. This gives the mini firmware a smaller surface without requiring a separate settings architecture.

## Serialization and compatibility

Every group implements `Save()` and `Load()` through the same typed overloads. Integers, floating-point values, strings, IP addresses and geographic bounds have explicit conversion paths. The current serializer emits nested groups; the loader first looks for the nested group and falls back to the parent object. That fallback preserves compatibility with older flat settings files during the migration.

The system keeps intended configuration separate from runtime state:

```text
getSettings() = desired persistent configuration
getState()    = active state and initialization outcomes
```

At startup, runtime state is copied from settings. If a device fails to initialize, the state can record it as unavailable without corrupting the configured intention. This distinction is especially useful for intermittent hardware and remotely managed installations.

## Build profiles

The final folder contains 14 settings JSON files for device/person/site variants. `platformio.ini` defines ten active build environments and retains several older optional environments as commented configurations. Examples include generic ESP32, ESP32-S3, cold-chain, bracelet, drone and mini variants.

The build script reads `settings_filename` from the selected environment, copies that file into the SPIFFS image, and embeds its name in the build metadata. Consequently, a binary can report both the exact Git revision and the settings profile from which it was produced.

This is what turns runtime GPIO and device configuration into a manufacturing/deployment capability: one codebase can target different boards and installations while still producing traceable artifacts.

## Local settings interface

The device provides three routes for each enabled group:

```text
GET  /form/<group>  -> generated editable HTML
GET  /json/<group>  -> current group as JSON
POST /save/<group>  -> type-aware update and persistence
```

The JavaScript UI obtains the JSON, determines suitable controls and handles special values such as IP-address components and passwords. The C++ endpoint reconstructs typed values, loads them into the settings object and saves the complete file. Some groups mark the device for restart because their hardware cannot safely be reconfigured in place.

## Remote synchronization

At its configured interval, the device writes an `active_settings.json` document containing grouped settings and build identity. It then POSTs several documents to `saimon`, including normal SPIFFS settings, sleep settings, active settings and active state.

The server uses the MAC address as the primary device namespace. Desired settings can exist at either:

```text
nio/settings/<MAC>/<document>.json
nio/settings/<document>.json
```

The MAC-specific version wins; the global version is the fallback. The server flattens the groups for comparison and replies only with values that are absent or different. The device saves returned changes as update files and promotes them into active settings.

This minimizes traffic and flash writes, while allowing fleet defaults and one-device exceptions to coexist.

## History, time and firmware updates

When a report changes, `saimon` stores the current version and a timestamped record of the differences. It does not create a new file for an identical report. Active settings can also cause the server to return its current Unix time, allowing clock correction when device metadata shows that the local clock predates the build.

Firmware filenames encode UTC build time, so ordinary lexical sorting selects the newest image. A device reports its current build filename and profile; `saimon` returns a newer applicable binary. Mini firmware receives special handling. If the device rolls back, it reports `rollback_from`, and the server removes that filename from consideration so the same failed image is not immediately installed again.

## Resulting economic effect

The settings architecture removes several recurring costs:

- Board changes no longer automatically require source edits.
- A new installation can often be represented by a profile instead of a branch.
- Remote diagnosis includes the active state, desired settings, build timestamp, Git revision and profile source.
- Fleet-wide defaults and per-device overrides use the same mechanism.
- Failed releases can recover without a technician reflashing the unit.
- The local UI and remote service use the same serialization rules as the firmware.
- Optional feature groups allow one architecture to serve small and fully featured builds.

This is the point at which the project stopped being merely configurable firmware and became an operational device platform.

## Relationship to the packet endpoint

The configurable datalog section flags directly affect the binary protocol consumed by `nio_packet_endpoint`. Enabling GPS, IMU or ADS sections changes which tagged records the firmware appends, while the endpoint dispatches each tag to the corresponding typed decoder. This shows that settings control both sensor work on the device and the shape and transmission cost of its telemetry.

## Publication note

Some archived settings profiles contain authentication material. Values were intentionally omitted from this analysis. Before publishing or sharing the source archive, remove those values from current files and history and rotate any credential that may still be valid.
