# Evolution of the SpaceAI firmware system

## 1. Initial firmware: November 2022 to mid-2023

The repository began as a conventional embedded application. Features and device-specific behavior accumulated in the main firmware: sensors, networking, storage, LoRa, satellite communications and board-specific logic. At this stage, settings existed, but much behavior still depended on application code and fixed assumptions.

By July and August 2023, the work had shifted from merely adding integrations to stabilizing them. Commit messages record safer file reading, fixes for invalid memory access, initialization of previously uninitialized state, HTTP helpers, larger diagnostic buffers, isolation of IMU and BLE code, and early Swarm and Iridium support. Configuration started absorbing timeouts, operating modes and communication choices that had previously been scattered through the program.

## 2. Settings become the device control plane: September to November 2023

September 2023 is the clearest architectural turning point. Settings were moved into dedicated `sai_nio_settings` files and expanded to cover LoRa, sleep and wake times, I2C device addresses, peripheral disabling, SD-card use, HTTP timeouts and device initialization.

The project then gained a working settings form and, by November, a JSON protocol for reading and modifying device properties. JavaScript generated the administration UI from the JSON API. Settings were reorganized into functional forms, POST requests updated the typed C++ structures, and the firmware saved the result back to its filesystem.

This changed the cost of future features. Adding a new configurable sensor or communication option no longer necessarily required a new hand-written page and a separate parsing path. The same setting definition could participate in serialization, persistence, UI generation and remote reporting.

The same period added operational safeguards: bounded string composition, JSON overflow reporting, typed IP serialization, endpoint error handling, configurable serial and reset pins, Wi-Fi modes that could change without rebooting, and more detailed diagnostics for Wi-Fi and Iridium failures.

## 3. Power, persistence and communications mature: late 2023 to April 2024

The firmware developed a real operating lifecycle rather than a perpetual Arduino loop. It gained:

- Separate normal and sleep settings profiles.
- Configurable delays for ordinary sleep, forced sleep, successful wake intervals and retry wake intervals.
- GPS and other peripheral sleep control.
- NVS persistence for GPS coordinates, send state and variables that must survive reset or deep sleep.
- Power control through I/O expanders for the main board, battery board and communications shield.
- Prevention of sleep before pending messages were transmitted.
- Selection of Wi-Fi, Iridium and Swarm as alternative delivery channels.

Telemetry also became structured. Datalog entries, LoRa messages and API packets converged on shared layouts. The firmware could select packet sections, emit JSON, use a legacy format or CCSDS, retain unsent records and replay them later.

The hardware surface expanded to include Enphase acquisition, Modbus master/slave work, configurable ADS sensor channels, Iridium over serial or I2C, and board-specific pin/address assignments. The important design property is that most of these could be enabled, disabled or relocated through settings.

## 4. Common code is extracted: March to May 2024

In March 2024, core and shared files were moved into a library. `saipp` had already been started on 1 March 2024. The extraction eventually placed filesystem operations, platform types, logging/error policies, timers, strings and SPI support outside the application.

The `FirmwareWorks` workspace was created on 15 April 2024. It gathered the firmware and its dependencies as coordinated repositories/submodules. This was a productization step: the application could now consume shared components, tests could use the same low-level facilities, and desktop/Linux programs could reuse code without carrying the whole Arduino application.

The old and new repository timelines overlap for about a month, which is consistent with a gradual migration rather than a clean rewrite.

## 5. Fleet monitoring and remote updates: May to July 2024

The device began posting its settings to a monitor service in May. The protocol expanded to report normal settings, sleep settings and active runtime state. The backend stored device-specific copies, retained timestamped differences, and returned only values that differed from the device's report.

June and July added the firmware distribution path:

- Build identity was embedded in the binary and exposed through settings.
- Built firmware received a sortable timestamped filename.
- The build selected a settings profile and incorporated it into the SPIFFS image.
- A backend directory could hold general updates or MAC-specific updates.
- Devices could receive settings and firmware through the same reporting cycle.
- OTA partition support was added.
- A failed boot could trigger rollback.
- The failed filename was remembered so the backend would not immediately reinstall the same image.

The Python code was separated into `saithon` for common path, timestamp, Git and HTTP functions, and `saimon` for the device-facing service.

On 26 June 2024, `nio_packet_endpoint` was added as a companion telemetry ingress. It documents the inverse of the firmware's compact packet writer: an HTTP wrapper supplies transmission metadata and a hexadecimal payload, and the decoder reconstructs the packet function, MAC address, timestamp, battery, temperature and optional sensor sections. This completed an early end-to-end demonstration from packed device telemetry to typed backend data.

## 6. Grouped settings and scheduled SDR work: August to October 2024

The settings format was upgraded from a mostly flat object into groups such as `board`, `serial`, `wifi`, `xca`, `ads`, `monitor`, `iot`, `datalog`, `sdr`, `modbus` and `enphase`. The loader retains compatibility with ungrouped keys: it attempts the group first and falls back to the containing node.

The system then added JSON array loading and typed SDR schedule items. A schedule describes identifiers, task type, output/status, user, geographic area, frequency and time bounds. The firmware can retrieve task lists, reject malformed tasks, support large queues, determine which task applies to its stored GPS location and current time, then report processing results.

Build environments were split to control memory use and optional dependencies. Desktop and Linux support in `saipp` was repaired to support SDR/LMS7002M test programs, demonstrating that the common library had become useful beyond the ESP32 firmware.

## 7. Delivery and maintenance: October to November 2024

The final stage focused on dependable assembly and delivery: dependency maps, submodule cleanup, upload tools, firmware and SPIFFS binaries, mini firmware, settings persistence through the local web UI, and packaged utilities such as `esptool` and `mkspiffs`.

The result is an integrated lifecycle:

```text
select hardware/profile
    -> build firmware and filesystem
    -> stamp source/build identity
    -> publish timestamped binary
    -> device reports settings and state
    -> backend returns setting differences or newer firmware
    -> device installs and reboots
    -> device confirms operation or rolls back
```

The repository history therefore describes three distinct evolutions at once: application features became modules; constants became remotely manageable settings; and a single firmware build became a repeatable deployment and fleet-management system.
