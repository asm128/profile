"use strict";

const articleJSON = `{
  "title": "Pablo Ariel Zorrilla Cepeda",
  "subtitle": "Curriculum vitae",
  "navigation": {
    "Pablo Zorrilla — Home": "./index.html",
    "Studies": "./index.html#studies"
  },
  "sections": [
    {
      "title": "Contact information",
      "blocks": [
        {
          "type": "links",
          "items": {
            "pabloaz@gmail.com": "mailto:pabloaz@gmail.com"
          }
        }
      ]
    },
    {
      "title": "Summary",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Experienced software engineer with over two decades of hands-on development across embedded, desktop, and real-time systems. Proven track record in graphics, games, logistics, and full-stack development. Strong problem-solver with deep knowledge of C++, Python, OpenGL, DirectX, and embedded platforms. Fluent in English."
        }
      ]
    },
    {
      "title": "Experience",
      "blocks": [
        {
          "type": "positions",
          "items": [
            {
              "title": "Space AI, Inc (Freelance IoT, Jul 2023 – Dec 2025)",
              "role": "IoT Solutions Architect",
              "details": [
                {
                  "parts": [
                    {
                      "text": "Designed and implemented the core communications architecture of the Open Space Network, a distributed cloud system based on IoT devices. "
                    },
                    {
                      "text": "https://www.openspacenetwork.org",
                      "url": "https://www.openspacenetwork.org"
                    }
                  ]
                },
                "Designed and implemented C++ firmware for the NodeIO device featuring satellite communications using the Iridium and SWARM satellite networks, CCSDS-compliant network protocols, and a device configuration frontend implemented with HTML, WebGL and JavaScript.",
                "Designed and implemented architecture and communcations for telemetry and remote control.",
                "Implemented drivers for Software Defined Radio chips (lms7002m and lms6002d from Lime Microsystems).",
                {
                  "parts": [
                    {
                      "text": "Designed and implemented remote firmware update backend, remote configuration system and telemetry web services in Python with FastAPI. "
                    },
                    {
                      "text": "https://www.spaceai.com/nio",
                      "url": "https://www.spaceai.com/nio"
                    }
                  ]
                }
              ]
            },
            {
              "title": "Voxabular (2022 - 2023)",
              "role": "Lead Developer",
              "details": [
                "Created a 3D web-based educational game using TypeScript, Three.js, and Python.",
                "Handled gameplay logic, 3D graphics pipeline, and language analysis via a leading NLP framework running under Miniconda3.",
                "Implemented systems to detect and correct language errors and generate English responses based on gameplay context."
              ]
            },
            {
              "title": "Softland (2017 – 2019)",
              "role": "Software Architect",
              "details": [
                "Participated in the architectural design of an ERP platform, focusing on scalability, modularity, and maintainability.",
                "Worked across teams to integrate legacy systems with modern stacks and standards."
              ]
            },
            {
              "title": "Drixit (2020 – 2021)",
              "role": "Firmware Developer",
              "details": [
                "Developed C++ firmware for STM32 and ESP32 microcontrollers used to detect situations and provide alerts for preventing work accidents.",
                "Developed image recognition software with Python and OpenCV used to report about gearing and clothing required by the workers to comply with safety norms."
              ]
            },
            {
              "title": "Globant (2015 – 2016)",
              "role": "Software Engineer (assigned to DreamWorks Animation)",
              "details": [
                "Contributed to Premo, the primary animation tool of the company, developed in C++ and providing an in-app Python console which enables artists to automate animation and rigging processes.",
                "The tasks involved included from bug fixing to implementing new features or exposing them to the python layers."
              ]
            },
            {
              "title": "LeanderGames (2013 – 2014)",
              "role": "Game Developer",
              "details": [
                "Implemented online casino gameplay and other backend system logic, including integration of virtual wallets and systems of partner companies such as Amaya and PokerStars.",
                "Ensured regulatory compliance and cross-platform deployment stability."
              ]
            },
            {
              "title": "Gameloft Argentina (2011 – 2012)",
              "role": "Lead Engineer",
              "details": [
                {
                  "parts": [
                    {
                      "text": "Lead the port of "
                    },
                    {
                      "text": "Near Orbit Vanguard Alliance 3",
                      "url": "https://www.youtube.com/watch?v=UR4T5S1keYA"
                    },
                    {
                      "text": " from the iOS/OpenGL implementation, for the launch of the upcoming Windows Phone 8 with DirectX 11.1 support. Used C++ for the game implementation and Python/PIL for the asset processing pipelines that generated files suitable for the reduced storage space provided by the phones."
                    }
                  ]
                },
                "Ported Six Guns updates from iOS to Android platforms."
              ]
            },
            {
              "title": "Softogo (2003 – 2005)",
              "role": "Staff Developer",
              "details": [
                "Developed a full-stack logistics framework for Nestlé de France.",
                "Built offline-first PocketPC apps with local database sync via WiFi and server integration."
              ]
            },
            {
              "title": "Freelance & Independent Projects (2006 – Present)",
              "role": "Embedded & Full-Stack Developer",
              "details": [
                "Developed multiple embedded systems using ESP32, LoRa, and sensor networks.",
                "Designed and built modular hardware interfaces, including 3D-printed casing systems for development boards.",
                "Created real-time backend infrastructures using FastAPI, MQTT, and low-level communication protocols.",
                "Designed and developed intrusion detection Python software that can be run using generic webcams using OpenCV for both recording camera input and storing into convenient formats, as well as for detecting people and send processed images and videos to the user through a Telegram bot.",
                {
                  "parts": [
                    {
                      "text": "Youtube Channel with development snapshot videos",
                      "url": "https://www.youtube.com/@solarsiegeonline"
                    }
                  ]
                },
                {
                  "parts": [
                    {
                      "text": "Old Youtube Channel with development snapshot videos",
                      "url": "https://www.youtube.com/user/goldsciences/videos"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "title": "Early Technical Background",
      "blocks": [
        {
          "type": "positions",
          "items": [
            {
              "title": "Self-taught Programmer (1992 – 2002)",
              "details": [
                "Started programming in BASIC at age 11.",
                {
                  "parts": [
                    {
                      "text": "Configured DOS boot sequences via "
                    },
                    {
                      "code": "config.sys"
                    },
                    {
                      "text": " and "
                    },
                    {
                      "code": "autoexec.bat"
                    },
                    {
                      "text": " to load custom memory modes, CD-ROM drivers, and VESA graphics settings for different games."
                    }
                  ]
                },
                "Used memory editors to locate and alter runtime game variables (e.g., lives, score), demonstrating early reverse-engineering instincts."
              ]
            }
          ]
        }
      ]
    }
  ]
}`;
