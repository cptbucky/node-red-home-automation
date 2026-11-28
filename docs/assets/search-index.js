// Written by scripts/build-docs.mjs.
window.DOCS_SEARCH = [
 {
  "title": "Introduction",
  "description": "State-aware controllers for Node-RED. Clear wiring, observed results, and manual control that stays yours.",
  "url": "index.html",
  "text": "State-aware controllers for Node-RED. Clear wiring, observed results, and manual control that stays yours."
 },
 {
  "title": "Introduction",
  "section": "Automation that checks the result.",
  "description": "Build lighting, cover and home-theatre flows that know the difference between a command being sent and a devic",
  "url": "index.html#overview",
  "text": "Build lighting, cover and home-theatre flows that know the difference between a command being sent and a device doing what you asked. Each controller tracks the wanted and observed state, preserves a person’s manual changes, and retries only a bounded number of times. Your request Motion, switch or activity → Controller One command owner → Device MQTT or local API Device observations return to the controller. Only fresh evidence confirms the requested result."
 },
 {
  "title": "Introduction",
  "section": "Get the package",
  "description": "In Node-RED, choose Manage palette → Install and search for @avantics/node-red-home-automation , then find the",
  "url": "index.html#install",
  "text": "In Node-RED, choose Manage palette → Install and search for @avantics/node-red-home-automation , then find the nodes in the home automation palette category. Install has the requirements, npm and release-file installs, the example flows and the recommended context store."
 },
 {
  "title": "Introduction",
  "section": "Choose what you want to control",
  "description": "01 / LIGHTING Start with one room Combine motion and wall switches without taking control away from the person",
  "url": "index.html#choose",
  "text": "01 / LIGHTING Start with one room Combine motion and wall switches without taking control away from the person. Follow the room lighting guide → 02 / COVERS Wire a blind or curtain Connect a cover, set a position or preset, and confirm the motor has stopped. Follow the cover guide → 03 / HOME THEATRE Coordinate an activity Bring display, receiver, source and lighting together from one request. Read the theatre documentation → 04 / REFERENCE Look up a node Find its messages, output ports and exact configuration defaults. Explore the cover controller →"
 },
 {
  "title": "Introduction",
  "section": "A few ideas carry through every flow",
  "description": "One command owner Policies ask for an outcome. A controller owns the device commands, so two parts of your flo",
  "url": "index.html#core-ideas",
  "text": "One command owner Policies ask for an outcome. A controller owns the device commands, so two parts of your flow do not fight over the same target. Requests describe the result Send “open”, a position, or a lighting intent. The device path translates the controller’s commands into its protocol. Evidence before completion Sending a command is not success. The controller waits for fresh observations; retries and failure paths have limits. Recovery stays bounded Retries, timers, traces and failure paths remain finite, and a restart re-reads the devices rather than replaying commands. Manual control stays yours A person’s change becomes ownership evidence, not something to correct immediately. The cover guide shows how automatic requests respect it. Home Assistant is the panel, not the device path. It can display state and send requests over MQTT. Controllers command and observe the devices directly, not through Home Assistant."
 },
 {
  "title": "Introduction",
  "section": "Use Home Assistant as the panel",
  "description": "Home Assistant is optional. Nodes you opt in publish their state over MQTT and announce their entities through",
  "url": "index.html#home-assistant",
  "text": "Home Assistant is optional. Nodes you opt in publish their state over MQTT and announce their entities through MQTT discovery, and Home Assistant’s controls come back to the nodes as MQTT requests, carried out like any other request. The nodes still command and observe the devices directly, never through Home Assistant. Choose a Broker on each publishing node: it publishes itself, and announces itself again each time the broker connects. The Home Assistant guide covers topics, entity names, availability and removing entities."
 },
 {
  "title": "Introduction",
  "section": "Follow the project",
  "description": "See what is complete, next and planned on the public roadmap . Run the contract examples to explore the messag",
  "url": "index.html#project",
  "text": "See what is complete, next and planned on the public roadmap . Run the contract examples to explore the messages without a device. Sources: README and package metadata."
 },
 {
  "title": "Install",
  "description": "Add the package to Node-RED from the palette manager, npm or a release tarball, then set up a file context store so the nodes keep their state across deploys and restarts.",
  "url": "install.html",
  "text": "Add the package to Node-RED from the palette manager, npm or a release tarball, then set up a file context store so the nodes keep their state across deploys and restarts."
 },
 {
  "title": "Install",
  "section": "Before you start",
  "description": "The package declares what it needs in its package.json . Check both before you add it. Requirements Needs Vers",
  "url": "install.html#before",
  "text": "The package declares what it needs in its package.json . Check both before you add it. Requirements Needs Version Declared in Node-RED 5.0.0 or newer node-red.version : >=5.0.0 Node.js 24 or newer engines.node : >=24 Node-RED 5 runs on older Node.js than this package. Node-RED 5 itself accepts Node.js 22.9, but this package needs Node.js 24 or newer. Check the Node.js version that runs your Node-RED before you add the package. For the nodes that talk to devices or publish state, you also need an MQTT broker and an MQTT broker config node in Node-RED. Home Assistant is optional: it is a panel that shows state and sends requests, never the path to a device."
 },
 {
  "title": "Install",
  "section": "Add it from the palette manager",
  "description": "Open the palette manager. In the Node-RED editor, choose Manage palette → Install . Search for the package. Se",
  "url": "install.html#palette",
  "text": "Open the palette manager. In the Node-RED editor, choose Manage palette → Install . Search for the package. Search for @avantics/node-red-home-automation and install it. Find the nodes. They appear in the home automation category of the palette."
 },
 {
  "title": "Install",
  "section": "Add it with npm",
  "description": "Run this from your Node-RED user directory (usually ~/.node-red ), then restart Node-RED: Terminal · Node-RED ",
  "url": "install.html#npm",
  "text": "Run this from your Node-RED user directory (usually ~/.node-red ), then restart Node-RED: Terminal · Node-RED user directory npm install @avantics/node-red-home-automation To pin a version, name it, then restart Node-RED. Each version is listed on the GitHub releases page . Terminal · pin a version npm install @avantics/node-red-home-automation@<version> Check before updating. This package is under active development. Pin the version you use, read the release notes and check your flows after an update. A major version can require changes to saved flows: the 6.0.0 notes list what to migrate."
 },
 {
  "title": "Install",
  "section": "Add it from a release tarball",
  "description": "Each GitHub Release also attaches the package tarball and its SHA-256 checksum. Download both into one folder ",
  "url": "install.html#tarball",
  "text": "Each GitHub Release also attaches the package tarball and its SHA-256 checksum. Download both into one folder and check the tarball there: it prints the tarball’s name and OK . On macOS, use shasum -a 256 -c . Checksum files from releases up to 6.1.0 name it as release/…tgz : put the tarball in a release folder beside the checksum file to check those. Terminal · the folder with both downloads sha256sum -c avantics-node-red-home-automation-<version>.tgz.sha256 Then add it in either way: In the editor, choose Manage palette → Install → Upload module and pick the tarball. From your Node-RED user directory, install the tarball with npm and restart Node-RED. Terminal · Node-RED user directory npm install /path/to/avantics-node-red-home-automation-<version>.tgz"
 },
 {
  "title": "Install",
  "section": "Import an example flow",
  "description": "Add the nodes from the home automation palette category, then configure the area, device hosts, MQTT topics, s",
  "url": "install.html#examples",
  "text": "Add the nodes from the home automation palette category, then configure the area, device hosts, MQTT topics, source mappings and timing limits for your home. To start from a wired flow instead, choose Import → Examples in the editor and pick one of these from the package: Example flows in the package Example What it shows Needs Room lighting Motion and illuminance feed occupancy fusion and the motion policy, a wall switch feeds the switch policy, and a circadian lighting policy styles the room; all send intents to the room lighting controller. A Zigbee2MQTT light on your broker. Injects stand in for the sensors and wall switch. House schedule A house schedule shared by two rooms through their circadian lighting policies, with the optional house schedule MQTT node changing its times. Two Zigbee2MQTT lights on your broker, one per room. Shelly switch A wall switch on a Shelly Gen2 relay in detached mode driving a room’s lights through the switch policy, with no function nodes. A Shelly Gen2 or later relay behind a wall switch, on your broker. Cover control A position cover owned by the cover controller, connected to a Zigbee2MQTT cover through the zigbee2mqtt cover adapter. Its one function node pauses motion lighting while the cover moves. A Zigbee2MQTT cover on your broker. Cover pair Two covers moved as one by a cover group, which reports ready only when both confirm. No devices: injects stand in for the curtains’ reports, and Debug nodes show the commands. Shelly cover A Shelly Gen2 device in cover mode, owned by the cover controller, with no function nodes. A Shelly Gen2 or later device in cover mode, on your broker. Scene One scene holding a room’s lights and pausing motion lighting until it ends by request, by its timer, or by a trainer’s power falling. No devices: Debug nodes stand in for your room lighting controller and motion lighting policy. Home theatre equipment The AVR, display, source capability and backlighting controllers, each taking an intent and reporting target state. For the display controller, your TV, screen and projector power meter on the network (its device hosts). The other controllers’ commands go to Debug nodes. Home theatre activity The theatre state contract and activity controller planning each target and collecting every controller’s state, with activity lighting. The display controller’s devices, as in Home theatre equipment, and a Zigbee2MQTT light, both on your broker or network. Requests come from your broker. The examples show the real setup, with synthetic names: most need the devices the Needs column names, and where one runs without them, it says what stands in. Every node in them that talks MQTT uses one broker config node, “your MQTT broker”: set its host to your broker’s before you deploy. They have no MQTT in, MQTT out or Status nodes. The files are also in examples/ on GitHub."
 },
 {
  "title": "Install",
  "section": "Set up a file context store",
  "description": "The nodes keep what they are doing in Node-RED’s node context. By default Node-RED keeps context in memory and",
  "url": "install.html#context-store",
  "text": "The nodes keep what they are doing in Node-RED’s node context. By default Node-RED keeps context in memory and deletes a node’s context whenever the node stops: on a full deploy, on a “Modified flows” deploy of its flow (which restarts every node in that flow, changed or not), on a “Modified nodes” deploy of the node itself, and on every restart. Configure the file context store so it survives. In settings.js in your Node-RED user directory, set: settings.js contextStorage: { default: { module: \"localfilesystem\" } }, Then restart Node-RED. The file store writes changes to disk every 30 seconds by default, so a change made just before Node-RED stops can still be lost. Without a context store, after a node is redeployed or Node-RED restarts: A room forgets which lights are held or manual. Every light an activity held, or a person set by hand, is back under the room’s control, so the next style restyles them. Changes made at runtime go back to the node’s settings. For example motion lighting’s enable, vacancy delay and lux cutoff, a circadian policy’s circadian lighting, sleep, and wake and bed times, and the house schedule’s times, set from Home Assistant or a message. The theatre starts its counts again. Its counters and operational SLO samples restart, and the activity controller no longer knows the current activity. It works the activity out again from what the devices show, when they show exactly one; otherwise it is unknown, and the devices are left alone, until the next request. Work in progress is not recovered. A motion off-timer that was running, or a theatre device change still being confirmed, is gone. The node starts afresh and goes by what it next observes. Old retained topics are not cleared. A node can’t remember what it published, so after you change an area, base topic, discovery prefix or targets, the old retained topics and Home Assistant entities stay until you remove them yourself."
 },
 {
  "title": "Install",
  "section": "Pick a broker",
  "description": "Every node that talks MQTT has a Broker setting: Node-RED’s own MQTT broker config node, the one MQTT in and o",
  "url": "install.html#mqtt",
  "text": "Every node that talks MQTT has a Broker setting: Node-RED’s own MQTT broker config node, the one MQTT in and out nodes use. Choose a Broker on each node that talks MQTT. The device adapters subscribe to their devices’ topics and publish to them; the publishing nodes publish their state and Home Assistant discovery, and read their set topics. Each does so by itself, so no MQTT in, MQTT out or Status nodes are needed around it. Each time the broker connects, reconnects included, a node runs its startup: it announces itself again, and an adapter reads its device, so nothing sent while the broker was down is missed. A node’s edit dialog offers the first broker in your flows. A node saved before 6.2 keeps working through the MQTT in and out nodes wired to it, and a Status node watching MQTT out, until you choose a Broker; then delete them. A node set not to publish needs no broker. Set the broker node’s availability messages. Each publishing node sends a retained online each time it connects and offline when it stops. On a full deploy, a restart or a shutdown, Node-RED closes the broker connection at the same moment, so the offline can’t get through. Set the MQTT broker node’s Birth message to online , and its Close message and Will message to offline , all retained, on the same availability topic; with several publishing nodes, the broker can cover one of them. Removing a node’s entities. Deleting a publishing node clears its Home Assistant entities and retained state only when you deploy with “Modified nodes” or “Modified flows”. After a full deploy, delete the device in Home Assistant instead: Settings → Devices & services → Devices, open the device, then Delete."
 },
 {
  "title": "Install",
  "section": "Configuration and security",
  "description": "The repository contains no home-network addresses, home coordinates or credentials. Device hosts are settings ",
  "url": "install.html#security",
  "text": "The repository contains no home-network addresses, home coordinates or credentials. Device hosts are settings you provide where a node needs them. The display mode controller stores its TV pre-shared key as a Node-RED credential. Keep credentials in Node-RED’s encrypted credential store rather than in flow fields or repository files. Report a suspected vulnerability privately, using the process in SECURITY.md , not through a public issue."
 },
 {
  "title": "Install",
  "section": "Next",
  "description": "Start with one room. The covers and home theatre guides build on the same pattern: one controller owns each de",
  "url": "install.html#next",
  "text": "Start with one room. The covers and home theatre guides build on the same pattern: one controller owns each device’s commands. Light your first room Combine motion, a wall switch and a circadian policy in one room lighting controller. Follow the room lighting guide → Wire a cover Connect a blind, shutter or curtain and confirm what the motor actually did. Follow the covers guide → For the receiver, display and sources, see Home theatre ."
 },
 {
  "title": "Light your first room",
  "description": "Wire one room’s lights to the room lighting controller, let motion and wall switches ask it for light, and add a circadian lighting policy for brightness and colour temperature over the day that leave a person’s own change alone.",
  "url": "guide-room-lighting.html",
  "text": "Wire one room’s lights to the room lighting controller, let motion and wall switches ask it for light, and add a circadian lighting policy for brightness and colour temperature over the day that leave a person’s own change alone."
 },
 {
  "title": "Light your first room",
  "section": "Before you wire it",
  "description": "One room lighting controller owns one room’s lights. In the palette it is home-room-lighting-controller ; on t",
  "url": "guide-room-lighting.html#before",
  "text": "One room lighting controller owns one room’s lights. In the palette it is home-room-lighting-controller ; on the canvas it shows as “lighting controller”, or “<area> lighting controller” once you give it an area. It is the only node that sends commands to those lights. The policies in front of it (motion, wall switches, activities) send it requests, called intents , and never command a light themselves. Lights you reach over MQTT. A Zigbee2MQTT light or group, reached through a zigbee2mqtt light node per light, which speaks Zigbee2MQTT’s messages on zigbee2mqtt/<device> and zigbee2mqtt/<device>/set , where <device> is the light’s name in Zigbee2MQTT. The controller itself speaks only neutral commands and readings, so another kind of light can be wired on the neutral light contract . An MQTT broker node in Node-RED that reaches the same broker as your lights. Node-RED 5.0.0 or newer and Node.js 24 or newer. A file context store (recommended). Without one, a restart or a redeploy makes the room forget which lights a person set, and a motion node counts the room as vacant from then. To add the file context store, set this in settings.js in your Node-RED user directory, then restart Node-RED: settings.js · keep node context on disk contextStorage: { default: { module: \"localfilesystem\" } }, The file store writes changes to disk every 30 seconds by default, so a change made just before Node-RED stops can still be lost. The README’s recommended setup lists what each node forgets without it. Home Assistant is optional. The room works with no Home Assistant at all. If you use it, it is a view and a control panel: its switches send MQTT messages the controller acts on, and the controller still commands the lights directly. See Home Assistant ."
 },
 {
  "title": "Light your first room",
  "section": "Wire the room",
  "description": "Start from the example: in the Node-RED editor, Import → Examples , then Room lighting . It wires the policies",
  "url": "guide-room-lighting.html#wiring",
  "text": "Start from the example: in the Node-RED editor, Import → Examples , then Room lighting . It wires the policies into the controller, with inject nodes standing in for your sensors. Replace those with your own inputs, and set the host of its broker config node, “your MQTT broker”. Motion and illuminance occupancy → motion policy + Wall switch switch policy → Room lighting controller Intents in · light commands out Controller output 2 → each light’s zigbee2mqtt light node zigbee2mqtt light ⇄ broker Each light’s topics; its readings back to the controller Intents: both policies → controller. Light commands: controller output 2 → each light’s node, which publishes them. Readings: each light’s node → controller. The table below names every connection. Room connections From Connect to Why occupancy fusion output 1 motion policy input Occupancy becomes a lighting intent. Illuminance goes to the motion policy too. motion policy output 1 Controller input Motion ON and OFF intents for the policy’s targets. switch policy output Controller input Wall-switch presses, marked as a person’s. circadian lighting policy output 1 Controller input The style for lights nobody has set otherwise. Without it the room just switches lights on and off. Controller output 2 Every light’s zigbee2mqtt light node Light commands, msg.light ; each node acts only on its own Target. Each zigbee2mqtt light, output 2 Controller input The light’s readings, and other people’s commands on it. Controller output 3 Activity lighting, if any Each light’s reading with whether a person set it. The motion and switch inputs have their own guides: Motion and occupancy and Wall switches . In the example both policies light the target main ; their target names must match the controller’s. Name the room’s lights. Set Targets JSON on the controller, an id per light (the name the policies use); ids must be unique. Add a zigbee2mqtt light per light. Set its Target to the light’s id and its Friendly name to the light’s (or group’s) name in Zigbee2MQTT; tick Zigbee2MQTT group for a group, and set retain: true under that group in Zigbee2MQTT’s configuration.yaml , so the room has its state after a restart (a group can’t be asked for it). See Zigbee2MQTT light . Wire them both ways. The controller’s second output into every light’s node; each node’s second output back into the controller. Pick each light’s Broker. The light’s node subscribes to the light’s state, its /set topic (other people’s commands) and its availability, and publishes the room’s commands, itself. It reads the light each time the broker connects, so the room has a fresh reading after a restart. A light node saved before 6.2 keeps its MQTT in and out nodes until you choose one. To show the room in Home Assistant, give the controller an Area, set Publish , and choose its Broker; the same for the circadian policy. See Home Assistant . Targets JSON · two lights, one only switching [{\"id\": \"main\"}, {\"id\": \"lamp\", \"onOffOnly\": true}] Without a Broker, don’t rewrite the lights’ commands on the way. Each light’s node watches its /set topic to tell the room’s commands from other people’s, so a function that changes them looks like someone else’s change. A bare ON or OFF that arrives within 5 seconds of one of its own commands with that power, before that command has come back, is taken as its own, and the room restyles a light after someone else’s bare ON at most once every 5 seconds. Other rewrites can still be misread. Lights that aren’t Zigbee2MQTT’s. Any flow that answers the room’s msg.light commands with msg.light readings works in place of a zigbee2mqtt light node: see the neutral light contract ."
 },
 {
  "title": "Light your first room",
  "section": "What the policies send",
  "description": "The policies send msg.lighting intents. You can send the same from an Inject or Function node to try the room ",
  "url": "guide-room-lighting.html#intents",
  "text": "The policies send msg.lighting intents. You can send the same from an Inject or Function node to try the room before any sensor is wired. Inject → controller · switch the room’s light on msg.lighting = {kind: \"intent\", targets: [\"main\"], state: \"ON\", source: \"motion\"}; return msg; state is \"ON\" , \"OFF\" or \"TOGGLE\" ; without targets , the intent applies to every light. When the light is in-control and the room has a style (from a circadian lighting policy), an ON intent without values gets that style, with the Turn-on transition seconds . Otherwise it sends a bare ON. To ask for a particular level, add values in the package’s own units: Function → controller · a set level msg.lighting = { kind: \"intent\", targets: [\"main\"], state: \"ON\", values: {brightnessPct: 40, colorTempKelvin: 3000} }; return msg; brightnessPct is 0–100 and colorTempKelvin is in kelvin; each light’s adapter converts them for the light (a zigbee2mqtt light, to its 1–254 brightness and mireds). brightnessPct: 0 is the dimmest the light goes, not off: send state: \"OFF\" to switch it off. An intent’s values alone don’t make the light manual ; add manual: true for a person’s change, described next. Values alone don’t count as a person’s change. Your flow decides who a request is from; the controller doesn’t guess. When a request comes from a person, for example a dashboard slider, set person: true (or manual: true ) on the intent. The controller then records that a person set the light, and motion’s vacancy OFF leaves it on when the person set it after the room went vacant (see Leave a person’s change alone ). Function → controller · a dashboard slider, from a person msg.lighting = { kind: \"intent\", targets: [\"main\"], state: \"ON\", values: {brightnessPct: msg.payload}, person: true }; return msg;"
 },
 {
  "title": "Light your first room",
  "section": "Circadian brightness and colour",
  "description": "Circadian styling is its own node, the circadian lighting policy ( home-circadian-lighting-policy ). Wire its ",
  "url": "guide-room-lighting.html#circadian",
  "text": "Circadian styling is its own node, the circadian lighting policy ( home-circadian-lighting-policy ). Wire its first output into the room controller, as the example does; one policy can style several rooms, or each area can have its own. Its levels follow its Wake time and Bed time (24-hour HH:MM , default 07:00 and 23:00): they rise to the daytime level over the hour after waking; they stay at the daytime brightness and colour through the day; they wind down to the sleep settings over the three hours before bed, and stay there until you wake. A bed time after midnight, or a wake time later than the bed time, works. Times are the Node-RED host’s local time; Docker containers default to UTC, so set the container’s TZ if the host should follow a local timezone. The policy sends the room a style once the flows start, every Restyle interval , and at once when circadian lighting, sleep or the times change. The room restyles lights that are on and under its control, over the Restyle transition , and skips a light that already reports that style. A style is never a request to change a light: it doesn’t switch lights on or off, and it never reaches a light a person set or an activity holds. If the policy stops, rooms stop styling within three intervals. Inject → circadian lighting policy · switch circadian lighting or sleep msg.lighting = {kind: \"circadian\", enabled: false}; // or: msg.lighting = {kind: \"sleep\", enabled: true}; return msg; enabled is true or false ; anything else is refused with a warning. Sleep mode holds the lights at the sleep settings, whatever the time. To share one wake and bed time across rooms, choose a house schedule as the policy’s Schedule ; see House schedule . A light that only switches on and off can be marked \"onOffOnly\": true in Targets JSON: it is never sent brightness, colour or a transition, and styles skip it. From 5.x: migrate every room. Every room controller saved before 6.0 still has its circadian settings, which moved to the policy, and shows as an invalid configuration until migrated. Add a circadian lighting policy wired into the room, set its fields to the room’s old settings (the room’s edit dialog lists them, field by field), then open the room, click Done and deploy both together. A room that should stay unstyled needs only the last step. See the README’s 6.0.0 notes."
 },
 {
  "title": "Light your first room",
  "section": "Leave a person’s change alone",
  "description": "Each light has one control state, and a style only touches lights that are in-control : Control states State M",
  "url": "guide-room-lighting.html#manual",
  "text": "Each light has one control state, and a style only touches lights that are in-control : Control states State Means Back to in-control when in-control The room styles the light with the style it is sent. The default. — manual A person changed the light: an intent with manual: true , or someone else’s command on it with values, as its node reports it. An intent’s values alone don’t make a light manual. It is switched off, or circadian lighting is switched on. overridden Another owner, such as an activity or a scene, holds the light. Its last owner releases it (it goes back to what it was before the first), or a person switches it off. A held light ignores motion ON and OFF and owner-less values; it changes only for an intent with an owner , a person ( manual: true , person: true , an external command, or a change seen at the light), or a release. The switch policy marks its presses with person: true , so a wall switch always reaches the light. A dashboard acting for a person should set one of these too. The controller also keeps a light a person set after the room went vacant: motion’s OFF doesn’t switch it straight off. Here “a person” means an intent with manual: true or person: true (the switch policy sends person: true with every press), or someone else’s command on the light, as its adapter reports it. An intent that only carries values neither makes the light manual nor protects it from motion’s OFF; a flow acting for a person should set manual: true or person: true . Function → controller · hold lights for an activity, then release them msg.lighting = { kind: \"intent\", targets: [\"main\"], state: \"ON\", source: \"activity\", owner: \"film\", values: {brightnessPct: 25, colorTempKelvin: 2500}, preserveManual: true }; // later: // msg.lighting = {kind: \"release\", targets: [\"main\"], owner: \"film\"}; return msg; With preserveManual: true , lights a person set are skipped. An owner holds a light on or off: an owner’s OFF keeps it off, so motion can’t switch it back on. Owners stack: a newer owner goes on top, and releasing it hands the light back to the one beneath. When the last owner lets go, the light goes back to what it was: the room’s again, on or off, in the room’s style as it is now; off if it was off; or, if a person had set it, their values, still manual. A release without targets releases all of that owner’s lights. See owners stack . The activity lighting controller does this for you in a home theatre ."
 },
 {
  "title": "Light your first room",
  "section": "Settings that matter first",
  "description": "First settings Setting Default Set it to Targets JSON [] Your lights’ ids (and onOffOnly for a light that only",
  "url": "guide-room-lighting.html#settings",
  "text": "First settings Setting Default Set it to Targets JSON [] Your lights’ ids (and onOffOnly for a light that only switches); their topics are their adapters’. Turn-on transition seconds (room) 1 How fast a light fades in when switched on. Wake time / Bed time (policy) 07:00 / 23:00 When the lights should start brightening and finish winding down. Or choose a Schedule . Daytime brightness % / Daytime kelvin (policy) 100 / 6500 The daytime level. Sleep brightness % / Sleep kelvin (policy) 1 / 2200 The night and sleep level. Restyle transition / Restyle interval (policy) 60 / 60 seconds How gently and how often the room follows the circadian curve. The interval is at least 10 seconds. Start in sleep mode (policy) Off Whether the policy starts in sleep mode. Area, Publish, Broker Empty, Don’t publish, none Leave off for a first room. The area is needed only when publishing; see Home Assistant ."
 },
 {
  "title": "Light your first room",
  "section": "Check the result",
  "description": "The controller’s status shows whether it has a style and the counts, for example styled · 1 on · 0 manual . Th",
  "url": "guide-room-lighting.html#check",
  "text": "The controller’s status shows whether it has a style and the counts, for example styled · 1 on · 0 manual . The dot is yellow whenever a light is manual; otherwise it is green while it has a style and grey without one. The circadian lighting policy’s own status shows the style it sends, such as day · 80% 4100K , sleep or off . Read the status What you see What it means styled The room has a style in force from a circadian lighting policy. unstyled No style: no policy is wired in, circadian lighting is off, or the last style ran out. invalid configuration A room saved before 6.0 not yet migrated; see above. … 1 manual (yellow dot) A person set a light; styles leave it alone. … 1 overridden An owner such as an activity holds a light. Wire a Debug node to a light’s node’s first output, as the example does. Each message has the light’s /set topic and a payload such as {state: \"ON\", brightness, color_temp, transition} . The controller’s second output shows the same commands as msg.light , naming the target and the source that asked for it. After a restart without a context store, the room leaves every light as it is: a style restyles a light only once an intent or release names it, someone switches it on with a bare ON, or circadian lighting is switched on. To bring a light that is on back into step, switch circadian lighting on, or let motion or a wall switch name it. Sources: README Room lighting, Room light control and Recommended setup; room lighting controller editor settings and help; examples/Room lighting.json; observation tagging and status text from the room lighting controller source."
 },
 {
  "title": "Light a room from motion",
  "description": "Turn motion and presence sensors into room occupancy, and occupancy into lights that come on when the room is in use and dark enough, then go off once it has been empty for a while.",
  "url": "guide-motion-occupancy.html",
  "text": "Turn motion and presence sensors into room occupancy, and occupancy into lights that come on when the room is in use and dark enough, then go off once it has been empty for a while."
 },
 {
  "title": "Light a room from motion",
  "section": "Before you wire it",
  "description": "Two nodes sit between your sensors and the room lighting controller. The occupancy fusion node ( home-occupanc",
  "url": "guide-motion-occupancy.html#before",
  "text": "Two nodes sit between your sensors and the room lighting controller. The occupancy fusion node ( home-occupancy-fusion in the palette, shown on the canvas as “occupancy”) combines motion and optional presence into one occupied or vacant event. The motion lighting policy ( home-motion-lighting-policy , shown as “motion policy”) turns occupancy and light level into lighting intents for the room lighting controller. Motion establishes occupancy. Presence, such as an mmWave sensor, can hold occupancy that motion established, but never establishes it by itself. Both nodes read the sensors’ own MQTT messages, for example from Zigbee2MQTT; Home Assistant is not in the path. Each message names its kind in msg.source . The payload can be a plain value or an object: Sensor messages Sensor Send to msg.source msg.payload Motion (PIR) occupancy fusion \"motion\" true / false ; \"on\" , \"occupied\" , \"active\" , \"detected\" or their opposites \"off\" , \"clear\" , \"inactive\" , \"not_detected\" ; or an object with a motion , occupancy or active field. Presence (optional) occupancy fusion \"presence\" The same values, or an object with a presence , occupancy or active field. Ignored unless Presence sensor is set to hold. Light level (optional) motion lighting policy \"illuminance\" A number in lux, or an object with an illuminance or illuminanceLux field. A value the node can’t read as on or off is ignored. Without any illuminance reading, the policy treats the room as dark enough. Wall switches go to the switch lighting policy, not here: see Wall switches ."
 },
 {
  "title": "Light a room from motion",
  "section": "Wire sensors to the room controller",
  "description": "Occupancy flows one way: sensors into occupancy fusion, its events into the motion policy, and the policy’s in",
  "url": "guide-motion-occupancy.html#wiring",
  "text": "Occupancy flows one way: sensors into occupancy fusion, its events into the motion policy, and the policy’s intents into the room lighting controller, which owns the light commands. Occupancy fusion Motion + presence → occupied → Motion lighting policy Occupancy + lux → ON / OFF intents → Room lighting controller Owns the light commands MQTT in (motion, presence) → occupancy fusion · MQTT in (illuminance) → motion policy Broker Optional publishing, through each node’s Broker setting Sensors feed occupancy fusion; occupancy and light level feed the motion policy; its intents feed the room controller. The table below names every port. Connections From Connect to Why Motion and presence sensors (MQTT in, with msg.source set) occupancy fusion input The raw readings to combine. occupancy fusion output 1 motion policy input Occupancy events: msg.source = \"occupancy\" with msg.payload.occupied . Illuminance sensor (MQTT in, msg.source = \"illuminance\" ) motion policy input Lights come on only when it is dark enough. motion policy output 1 room lighting controller input Lighting intents in msg.lighting . occupancy fusion and motion policy Broker settings Node-RED’s MQTT broker node (optional) Their MQTT publications, only when publishing is on. No wire (without a Broker, as before 6.2: each node’s output 2 to MQTT out). Occupancy fusion sends occupied: true on every motion edge from off (or not yet seen) to on, even when the room is already occupied, as happens when presence held it between motion reports; each one makes the policy cancel its countdown and, if enabled and dark enough, send ON again. Only a repeated motion-on while motion is still on is dropped. Motion going off sends occupied: false unless presence is holding the room, and the first motion reading the node has seen (nothing saved yet) sends it if it is off, even when the room is already vacant. Choose the presence mode. On occupancy fusion, Presence sensor defaults to “None (PIR only)”. Choose “Hold occupancy (PIR + mmWave)” if you wire a presence sensor in. Name the lights. ON targets and OFF targets on the motion policy are JSON arrays of target ids from the room controller’s Targets JSON . Both default to [\"main\"] , the target id in the example flow. Set the vacancy time and lux cutoff. See Vacancy delay and other settings below."
 },
 {
  "title": "Light a room from motion",
  "section": "Vacancy delay and other settings",
  "description": "When occupancy turns on, the policy cancels any pending switch-off and, if motion lighting is enabled and the ",
  "url": "guide-motion-occupancy.html#settings",
  "text": "When occupancy turns on, the policy cancels any pending switch-off and, if motion lighting is enabled and the light level is at or below the cutoff, sends ON to the ON targets. When occupancy turns off, it starts a countdown of Vacancy seconds ; when that runs out it sends OFF to the OFF targets. Motion policy settings Setting Default What it does ON targets [\"main\"] Lights switched on when the room becomes occupied. OFF targets [\"main\"] Lights switched off when the vacancy time runs out. Vacancy seconds 120 How long the room stays vacant before the OFF intent. Lux cutoff 10 The brightest light level, in lux, at which occupancy still switches lights on. Maximum pause (s) 600 How long a pause lasts unless sent again. Other flows can change the vacancy time and cutoff without opening the editor: Function → motion policy · change the vacancy time msg.source = \"delay\"; msg.payload = 300; // seconds, the same unit as Vacancy seconds return msg; Function → motion policy · change the lux cutoff msg.source = \"illuminance-cut-off\"; msg.payload = 20; return msg; A delay or illuminance-cut-off message overrides the setting until a deploy changes Vacancy seconds or Lux cutoff in the editor; the new setting then applies. Keeping the override across a restart or redeploy needs a file context store ."
 },
 {
  "title": "Light a room from motion",
  "section": "Switch it off, or pause it",
  "description": "The motion policy has two ways to stop acting on occupancy. They look alike but belong to different people. En",
  "url": "guide-motion-occupancy.html#enable-pause",
  "text": "The motion policy has two ways to stop acting on occupancy. They look alike but belong to different people. Enable versus pause msg.source Payload Who it is for \"area-enabled\" true or false The user’s own switch for this node’s motion lighting. It stays as set, and is what the Home Assistant motion lighting switch shows and sets. \"global-enabled\" true or false The user’s switch for every motion policy at once. It is not published. \"pause\" true pauses, false releases; msg.owner is required Other flows, such as a moving cover. Each owner holds its own pause, and motion lighting resumes once every owner has released it or its pause has run out ( Maximum pause , sent again to renew). Motion lighting acts only while both enables are on and no owner holds a pause. Switching it off or pausing it cancels a pending vacancy countdown. If the room goes vacant meanwhile, the countdown starts when motion resumes, so lights left on during a pause, an activity or a scene still go off in an empty room. Cover controller output 3 → Function → motion policy · pause while moving msg.source = \"pause\"; msg.owner = \"study blind\"; // a name of its own for each pauser return msg; // keep the boolean payload Never pause with the enable. A pause never changes the enables, which are the user’s own. A flow that sends area-enabled false to pause motion overwrites what the user chose, and can leave motion lighting off for good if the true never comes. See Wire a cover ."
 },
 {
  "title": "Light a room from motion",
  "section": "When a person changes a light",
  "description": "The OFF intent carries vacantSince , the time the room went vacant. The room lighting controller keeps on any ",
  "url": "guide-motion-occupancy.html#manual",
  "text": "The OFF intent carries vacantSince , the time the room went vacant. The room lighting controller keeps on any light a person set after that time: they are using it, so motion doesn’t switch it straight off. A light a person set before the room went vacant is still switched off when the vacancy time runs out. A light another owner holds, such as an activity or a scene, is left alone by motion ON and OFF; its other targets are still handled. Switching a light from a wall switch goes through the switch policy, which marks the press as a person’s. Your flow decides who a request is from; the room controller doesn’t guess, and values alone don’t count as a person’s change. When a request comes from a person, for example a dashboard slider, set person: true (or manual: true ) on the intent you send the room controller. A light set that way after the room went vacant stays on when motion’s OFF arrives. Function → room controller · a dashboard slider, from a person msg.lighting = { kind: \"intent\", targets: [\"main\"], state: \"ON\", values: {brightnessPct: msg.payload}, person: true }; return msg; The room controller’s control states are described in Room light control in the README. Without a context store, a restart forgets who is in the room. A motion policy that starts with nothing saved (its first deploy, or a redeploy or restart without a context store) counts the room as vacant from then. Unless occupancy is reported within Vacancy seconds , it sends its OFF intent, so someone sitting still in a lit room has the lights switched off unless motion is seen. The room controller has also forgotten which lights a person set. A file context store keeps both; a running countdown then carries on."
 },
 {
  "title": "Light a room from motion",
  "section": "Show it in Home Assistant (optional)",
  "description": "Both nodes can publish their state over MQTT, through their Broker (or, without one, on their second output). ",
  "url": "guide-motion-occupancy.html#publishing",
  "text": "Both nodes can publish their state over MQTT, through their Broker (or, without one, on their second output). Publishing is off until you switch it on, and then the node needs an Area ; topics use it in lowercase, with spaces and other characters as _ . Choose its Broker and it publishes itself (without one, wire output 2 to an MQTT out node). What each node publishes Node Topics With Home Assistant discovery occupancy fusion Retained ON / OFF on home/<area>/occupancy/state ; online / offline on home/<area>/occupancy/availability An occupancy binary sensor motion policy Retained ON / OFF on home/<area>/motion/enabled/state ; the vacancy delay in seconds on home/<area>/motion/delay/state ; online / offline on home/<area>/motion/availability A motion lighting switch and a vacancy delay number While it publishes ( Publish set to MQTT state or more), the motion policy also acts on ON / OFF sent to home/<area>/motion/enabled/set and a delay of 0 to 86400 seconds sent to home/<area>/motion/delay/set , rounded to whole seconds, as the area-enabled (with true or false ) and delay inputs do. Retained messages on these topics are ignored. With a Broker it reads them itself. Without one, to let the Home Assistant switch and number control it, wire an MQTT in node subscribed to home/<area>/motion/+/set into the motion policy. The switch shows this node’s enable only, so motion lighting can still be off everywhere through global-enabled while it shows on. Discovery comes with the MQTT state ( Publish set to MQTT state and Home Assistant discovery ), and the Discovery prefix defaults to homeassistant . Each node announces itself once the flows have started, and again when it receives msg.source = \"startup\" . More in Home Assistant ."
 },
 {
  "title": "Light a room from motion",
  "section": "Check the result",
  "description": "Import the Room lighting example to try this without sensors: its “motion detected” Inject sends {\"motion\":tru",
  "url": "guide-motion-occupancy.html#check",
  "text": "Import the Room lighting example to try this without sensors: its “motion detected” Inject sends {\"motion\":true} with msg.source = \"motion\" , and “illuminance 5 lx” sends 5 with msg.source = \"illuminance\" . Then read the node status under each node: Read the node status What you see What it means Occupancy: occupied · pir on (green) Motion has established occupancy. With presence on hold, presence on or off is added once a presence reading arrives. Occupancy: vacant · pir off (grey) Every source is inactive; if motion lighting is enabled, the motion policy starts its vacancy countdown. Motion policy: enabled · 5 lux · 120s (green) Motion lighting is on, with the last light level and the vacancy time in use. lux ? means no illuminance has arrived yet. Motion policy: paused or disabled (grey) An owner holds a pause, or an enable is off. Occupancy sends no ON. Connect a Debug node to the motion policy’s output 1 to see each intent: msg.lighting with kind: \"intent\" , the targets and state: \"ON\" or \"OFF\" . An OFF intent from the countdown also carries vacantSince . If occupancy turns on but no ON appears, check the light level against Lux cutoff . Sources: README Room lighting, Room light control and 4.0.0 notes; occupancy fusion and motion lighting policy editor help and defaults; Room lighting example flow."
 },
 {
  "title": "Wire wall switches",
  "description": "Turn wall switch flips and button presses into lighting requests through the switch lighting policy node. A single press toggles the room’s lights; a double press sets them to full brightness and marks them as set by a person.",
  "url": "guide-wall-switches.html",
  "text": "Turn wall switch flips and button presses into lighting requests through the switch lighting policy node. A single press toggles the room’s lights; a double press sets them to full brightness and marks them as set by a person."
 },
 {
  "title": "Wire wall switches",
  "section": "Before you wire it",
  "description": "This guide adds a wall switch or button to a room that already has a room lighting controller ( home-room-ligh",
  "url": "guide-wall-switches.html#before",
  "text": "This guide adds a wall switch or button to a room that already has a room lighting controller ( home-room-lighting-controller ). The switch goes to its own node, the switch lighting policy ( home-switch-lighting-policy , shown on the canvas as switch policy ). It turns what the switch reports into msg.lighting intents for the room controller. It knows nothing about occupancy or motion. Every message names its kind in msg.source . The policy accepts three kinds: Switch messages the policy accepts msg.source msg.payload Use it for \"switch\" {state: true} or {state: false} A wall switch that reports its position (raw edges). The state must be a boolean; anything else is ignored. \"switch-action\" \"single\" or \"double\" , or an object with that action A button that already reports which press it saw (pre-classified actions). Case does not matter. \"switch-availability\" true , \"online\" , \"available\" or \"on\" ; false , \"offline\" , \"unavailable\" or \"off\" Whether the switch device is reachable. A raw switch report can carry the time it was observed in msg.observedAt or payload.observedAt . Without one, the policy uses the time the message arrived; a retained report without one has no time, so the status shows stale with age ? . The policy commands nothing itself. The room controller sends the light commands, straight to the lights over MQTT. Home Assistant is not in this path."
 },
 {
  "title": "Wire wall switches",
  "section": "Wire the switch to the room",
  "description": "One switch policy feeds one room controller. Convert your switch’s reports into one of the messages above on t",
  "url": "guide-wall-switches.html#wiring",
  "text": "One switch policy feeds one room controller. Convert your switch’s reports into one of the messages above on the way in. Switch reports An adapter, or your own MQTT in → switch policy Presses → lighting intents → Room lighting controller Owns the light commands Each light’s adapter → broker Each light’s own messages Connections From Connect to Why Switch reports, converted switch policy input msg.source = \"switch\" with a boolean state , or \"switch-action\" with the press. Switch availability, converted switch policy input msg.source = \"switch-availability\" , so the policy knows when the switch is offline. switch policy output Room lighting controller input The policy’s only output carries the msg.lighting intents. Room lighting controller output 2 Each light’s adapter (a zigbee2mqtt light) The light commands. Each adapter publishes them through its Broker, and tells the room’s commands from other people’s by watching the light’s /set topic. See Wire the room . A raw switch needs its report turned into a boolean. In a Function node between MQTT in and the policy: Function → switch policy · raw switch report msg.source = \"switch\"; msg.payload = {state: msg.payload.state === \"<your device’s on value>\"}; return msg; A button whose message already has an action of single or double needs only the source set: Function → switch policy · pre-classified button msg.source = \"switch-action\"; return msg; Match the targets. Set the policy’s Targets to the ids of the room controller targets the switch controls. The default is [\"main\"] . Keep the window short. Leave Raw-edge window ms at 500 unless two quick flips are not being seen as a double press. Try it without a switch. The Room lighting example has a “wall switch edge” Inject node that sends msg.source = \"switch\" with {\"state\":true} into a switch policy wired to a room controller."
 },
 {
  "title": "Wire wall switches",
  "section": "Wire a Shelly relay behind a wall switch",
  "description": "A common way to keep smart bulbs on a wall switch: put a Shelly Gen2-or-later relay behind the switch, keep th",
  "url": "guide-wall-switches.html#shelly-relay",
  "text": "A common way to keep smart bulbs on a wall switch: put a Shelly Gen2-or-later relay behind the switch, keep the relay on so the bulb always has power, and detach the switch from the relay. Each press then goes out over MQTT, for Node-RED to act on, instead of cutting the bulb’s power. Mains wiring is dangerous. Leave it to a qualified electrician. Wiring a relay into a light circuit means working on mains voltage, and local regulations say who may do it and how. Switch off the circuit breaker and check there is no voltage at the wires before touching them. Shelly’s own diagram and instructions for your exact model are the authority; the drawing below only shows the idea. The wall switch doesn’t cut power. The relay stays on, so the bulb holder stays powered whatever the switch’s position. To cut power to the light, for example to change a bulb, switch the relay off from the Shelly’s own app or web page, or from Home Assistant if it shows the relay. For any work on the fitting or the wiring, switch off the circuit breaker. Keep within the relay’s rating. Shelly gives the 1PM Gen3 a maximum switching current of 16 A at 240 V~, and asks for a circuit breaker of at most 16 A rated current. Check the rating for your model and the load on the circuit. The switch works only while Node-RED and MQTT do. If Node-RED, the MQTT broker or the relay’s network connection is down, pressing the wall switch does nothing: the bulb stays as it was, and keeps its power. The fallback script below makes the switch work as an ordinary switch then. Don’t use the wall switch to change a bulb. With the fallback script, a wall switch that cut the power while Node-RED was away has the relay switched back on as soon as Node-RED returns, so the bulb holder can come back on in your hands. Switch the relay off from its app or web page, where it stays off, or switch off the circuit breaker. A relay behind a wall switch, keeping a smart bulb powered The line conductor goes to the relay’s L terminal and, through the wall switch, to its SW input. The neutral goes to the relay’s N terminal and to the bulb. The relay’s O output feeds the bulb. L (line) N (neutral) Wall switch Shelly 1PM Gen3 relay stays on L N SW O Smart bulb Our simplified drawing, based on Shelly’s wiring instructions for the Shelly 1PM Gen3 : the load to O and neutral, line to an L terminal, neutral to an N terminal, and the switch between SW and a spare L terminal. Relays with potential-free contacts, such as the Shelly Plus 1 and Shelly 1 Gen3 , have a separate I terminal that feeds O; follow their own diagrams. Detach the switch from the relay. In the device’s web interface or app, set the output type to Detached Switch (in the API, the switch’s in_mode is detached ). The input then no longer changes the relay, so a press can’t cut the bulb’s power. Say what kind of switch it is. Set the input mode to Switch for a toggle switch that stays where you put it, or Button for a momentary push button (the input’s type is switch or button ). A toggle switch reports its on/off position; a button reports pushes, such as single_push , double_push and long_push . Keep the relay on. Switch the output on, and set Action on power on to Turn ON ( initial_state on ), so the bulb has power again after a power cut rather than waiting for someone to switch the relay back on. Turn on MQTT. Under Settings → Connectivity → MQTT , enable MQTT and set your broker as the server; the device restarts to apply it. Leave RPC status notifications over MQTT on (the default): input changes and button pushes arrive on <prefix>/events/rpc , and the device reports true or false on <prefix>/online . The topic prefix is the device ID unless you set your own; note it. Bring the presses into Node-RED. Add a shelly switch node. Set its Broker , its MQTT topic prefix to the device’s prefix, its Switch ID to 0 (or the switch your wall switch is wired to), and leave Mode on reading the device’s own setup. It subscribes to <prefix>/# and publishes to the device itself. Wire its second output into this guide’s switch policy. (A node saved before 6.2 keeps its MQTT in node on <prefix>/# and its first output to MQTT out until you choose a Broker.) Each time the broker connects, and whenever the device comes online, the node asks the device how it is set up, and its status shows what it found, such as detached with a switch or a button. It then sends the policy a toggle switch’s flips as edges, with the device’s status first as the baseline so the first flip after a deploy counts as a press, a button’s single, double and long pushes as actions, and the device going offline or online as availability. The switch policy acts on single and double pushes; a long push reaches it but does nothing yet. The node never commands a detached relay. If the relay reports off, for example after a fallback press below, its status says the bulbs have lost power. If the device’s setup can’t be read, the status says so and nothing is passed on until you set Mode to detached. See Wire a shelly switch for its settings. Sources: Shelly’s knowledge base for the 1PM Gen3 (wiring, rating and safety), the 1 Gen3 web interface guide (setting names), and the Gen2 API for Switch , Input , MQTT , notifications and RPC channels ."
 },
 {
  "title": "Wire wall switches",
  "section": "When the relay is the light",
  "description": "With ordinary bulbs, the relay itself switches the light. Set the device up as above, but leave out keeping th",
  "url": "guide-wall-switches.html#shelly-relay-light",
  "text": "With ordinary bulbs, the relay itself switches the light. Set the device up as above, but leave out keeping the relay on: the room switches it. The shelly switch node is then both the wall switch’s adapter and the light’s. Add the light to the room. In the room controller’s Targets JSON, give the relay an id and mark it on/off only: [{\"id\": \"main\", \"onOffOnly\": true}] . Give the shelly switch node that Target. Set its Target to main . Wire the room controller’s second output (its light commands) into the node, and the node’s third output back into the room. The second output still carries the presses to the switch policy, whose intents go to the room. Press the switch. The press reaches the room as a person’s intent; the room sends the light on or off; the node switches the relay and reports what it did. Motion, scenes and activities switch the same relay through the room. A change made elsewhere, such as the Shelly app, reaches the room as a person’s. The Shelly switch example (Import → Examples) wires exactly this, through one broker config node whose host you set."
 },
 {
  "title": "Wire wall switches",
  "section": "Keep the wall switch working without Node-RED",
  "description": "A small script on the relay covers the times Node-RED can’t answer. While the relay’s MQTT connection is down,",
  "url": "guide-wall-switches.html#shelly-fallback",
  "text": "A small script on the relay covers the times Node-RED can’t answer. While the relay’s MQTT connection is down, or Node-RED has announced itself offline, a press at the wall toggles the relay, cutting or restoring the bulb’s power like an ordinary switch. When the connection is back and Node-RED announces itself online, the script switches the relay back on if a fallback press switched it off, so the bulb has power again for Node-RED to control. A relay a person switched off, from the app or the web page, stays off. The rest of the time the script never touches the relay. First, tell Node-RED to announce itself. Open the MQTT broker node your flows use and, on its messages settings, set a Birth message with payload online , and a Close message and Will message with payload offline , all on the same topic (for example node-red/status ) and all retained. The broker sends the will message for Node-RED when its connection drops, and the retained message tells the script where things stand whenever it subscribes. Without these messages the script can tell only when the relay loses MQTT, not when Node-RED stops. Add the script to the relay. In the relay’s web interface, open Scripts , choose Create script , give it a name, and paste in wall-switch-fallback.js . MQTT must be on, as set up above. Set it up. At the top of the script, set nodeRedTopic to the broker node’s topic and nodeRedOnline to its birth payload, and inputId and switchId if your wall switch isn’t on input 0 and switch 0. Start it, and start it with the relay. Choose Save , then Start , and in the scripts list turn on Run on startup . The console below the editor says which topic the script is waiting for, warns if nothing has arrived on it after a minute, and shows when the fallback starts and ends. What it can’t see The script knows only whether the relay reaches the broker and what Node-RED last announced. If Node-RED is up but the flow that handles the switch isn’t working, presses still go to Node-RED and do nothing. Until anything arrives on the topic, after the script starts or if the broker has lost its retained messages, it falls back only while the relay’s MQTT connection is down. A full deploy in Node-RED sends the close message and then the birth message, so presses toggle the relay for those few seconds. In the fallback, a toggle switch’s position no longer says whether the light is on: each flip toggles it. For any work on the fitting or the wiring, switch off the circuit breaker. Script: shelly/wall-switch-fallback.js , tested in the package’s suite against a simulated device. Sources: Shelly’s scripting overview , tutorial (adding a script), language reference , the Shelly , MQTT and Timer script APIs, and the Switch component ( Switch.Toggle ’s was_on )."
 },
 {
  "title": "Wire wall switches",
  "section": "What each press requests",
  "description": "With raw edges, the policy times changes of the switch’s state. A change starts the raw-edge window. A second ",
  "url": "guide-wall-switches.html#presses",
  "text": "With raw edges, the policy times changes of the switch’s state. A change starts the raw-edge window. A second change inside it is a double press; when the window ends with no second change, it is a single press. A report that repeats the current state is not a press. Presses and requests Press Raw switch Pre-classified action Intent sent Single One change, no second within the window \"single\" state: \"TOGGLE\" Double Two changes within the window \"double\" state: \"ON\" , manual: true , values: {brightnessPct: 100} Anything else, such as a hold — Other actions Nothing; traced as unsupported-action Every intent names the policy’s targets and carries source: \"wall\" and person: true . A double action on the default target sends: switch policy → room lighting controller · double press msg.lighting = { kind: \"intent\", targets: [\"main\"], state: \"ON\", source: \"wall\", person: true, manual: true, values: {brightnessPct: 100} }; The room controller resolves TOGGLE per light: off if it last set or saw the light on, otherwise on. A light switched on by a single press gets the room’s style (from a circadian lighting policy) when the room has one and the light is under its control. A pre-classified action cancels a raw press still waiting for its window to end."
 },
 {
  "title": "Wire wall switches",
  "section": "Presses, motion and manual lights",
  "description": "Because every press carries person: true , the room controller treats it as a person’s choice: Motion keeps it",
  "url": "guide-wall-switches.html#ownership",
  "text": "Because every press carries person: true , the room controller treats it as a person’s choice: Motion keeps its hands off. The motion policy’s vacancy OFF carries vacantSince . The room controller ignores it for a light a person set after the room went vacant (traced as person-set-after-vacancy ). Presses reach held lights. A light held by an owner, such as an activity, ignores owner-less intents like motion, but a press still reaches it. A double press makes the light manual. It sends manual: true , so the room’s style then leaves it alone. Switching circadian lighting on returns manual lights to the room’s control. Switching off hands the light back. A light switched off by a person or its owner returns to in-control . Switches don’t go to the motion policy. Switch messages sent to the motion lighting policy are ignored. Wire switches only to the switch policy."
 },
 {
  "title": "Wire wall switches",
  "section": "Retained reports and restarts",
  "description": "The policy keeps the switch’s last known state (its baseline) in the node’s context, so a flip after a restart",
  "url": "guide-wall-switches.html#restart",
  "text": "The policy keeps the switch’s last known state (its baseline) in the node’s context, so a flip after a restart is still measured against it. Retained reports are not presses. A raw report with msg.retain = true only re-baselines the state. A retained switch-action is ignored. Mark a first read and polled snapshots. Set msg.baseline = true on a report you asked the device for, so it updates the baseline without counting as a press. With no baseline, the first report is a press. On a policy that does not yet know the switch’s state, the first report that is neither retained nor marked baseline counts as a change and sends a single-press TOGGLE . Mark a first read with msg.baseline = true . Offline means start again. After the switch reports unavailable, its first report when it returns re-baselines instead of counting as a press. Node context is kept in memory unless you set up a context store, so a restart or redeploy clears the baseline, and the room controller forgets which lights a person set. See Recommended setup: a file context store ."
 },
 {
  "title": "Wire wall switches",
  "section": "A wall switch through the shelly switch node",
  "description": "A wall switch wired to a Gen2-or-later relay in detached mode keeps the relay on to power smart bulbs and repo",
  "url": "guide-wall-switches.html#shelly-switch",
  "text": "A wall switch wired to a Gen2-or-later relay in detached mode keeps the relay on to power smart bulbs and reports each press over MQTT. The shelly switch node turns those reports into this policy’s inputs, with no function nodes: a toggle switch’s flips as edges (the device’s status first, as the baseline), a push button’s presses as actions, and the device going offline or online as availability. It reads the device’s mode and input type itself. To set up the relay and wire the node, see Wire a Shelly relay behind a wall switch and Wire a shelly switch ."
 },
 {
  "title": "Wire wall switches",
  "section": "Settings",
  "description": "switch policy settings Setting Default What it does Name empty Names the node on the canvas; when empty, the l",
  "url": "guide-wall-switches.html#settings",
  "text": "switch policy settings Setting Default What it does Name empty Names the node on the canvas; when empty, the label comes from the Area. Area empty Names the node on the canvas (“<Area> switch policy”). Targets [\"main\"] The room controller targets a press controls. A non-empty JSON array of strings. Raw-edge window ms 500 How long after a change a second change counts as a double press. Zero or more. Input freshness seconds 3600 How long since the last report before the switch shows as stale. Must be more than zero."
 },
 {
  "title": "Wire wall switches",
  "section": "Stop or open a cover from a button",
  "description": "The switch policy only makes lighting intents. To make a button stop a moving cover, or open it otherwise, sen",
  "url": "guide-wall-switches.html#covers",
  "text": "The switch policy only makes lighting intents. To make a button stop a moving cover, or open it otherwise, send its request to the cover controller with msg.stopIfMoving = true . See Leave a person’s move alone in the covers guide."
 },
 {
  "title": "Wire wall switches",
  "section": "Check the result",
  "description": "The policy’s status shows how much it trusts what it knows about the switch. Read the status What you see What",
  "url": "guide-wall-switches.html#check",
  "text": "The policy’s status shows how much it trusts what it knows about the switch. Read the status What you see What it means switch fresh · <age> The switch reported within the freshness time. switch stale · <age> The last report is older than the freshness time, has no usable timestamp (shown as age ? ), or came before the flows started and nothing has confirmed it since. awaiting switch baseline The policy does not yet know the switch’s state. switch unavailable The switch was reported unavailable. Connect a Debug node to the policy’s output and press the switch: a single press shows a TOGGLE intent; a double press shows the full-brightness ON intent. Then check the room controller’s commands reach the light. Sources: README “Room lighting” and “Room light control”; the switch lighting policy, motion lighting policy, room lighting controller and cover controller help; contract-examples/switch-gestures.mjs ; examples/Room lighting.json ."
 },
 {
  "title": "Share a house schedule",
  "description": "Give many rooms one wake time and one bed time. Each circadian lighting policy follows the house schedule without wires, and an optional MQTT node lets Home Assistant change the times.",
  "url": "guide-house-schedule.html",
  "text": "Give many rooms one wake time and one bed time. Each circadian lighting policy follows the house schedule without wires, and an optional MQTT node lets Home Assistant change the times."
 },
 {
  "title": "Share a house schedule",
  "section": "Before you wire it",
  "description": "A circadian lighting policy styles the rooms it is wired to by a wake time and a bed time (default 07:00 and 2",
  "url": "guide-house-schedule.html#before",
  "text": "A circadian lighting policy styles the rooms it is wired to by a wake time and a bed time (default 07:00 and 23:00 ). Levels rise to the daytime level over the hour after waking, stay at the daytime brightness and colour through the day, wind down to the sleep settings over the three hours before bed, and stay at the sleep settings until you wake. Without a schedule, every policy keeps its own two times. The house schedule ( home-house-schedule ) holds one wake and bed time for every circadian lighting policy that uses it. It is a configuration node , like an MQTT broker: it has no wires and does not sit on the canvas. You choose it in each policy’s Schedule setting, and it appears with the editor’s other configuration nodes. The house schedule owns when (wake and bed); each policy owns the levels over the day and its own sleep mode. You need at least one circadian lighting policy already wired into a room lighting controller. Times are 24-hour HH:MM in the Node-RED host’s local time. Docker containers default to UTC: set the container’s TZ if the host should follow a local timezone. The house schedule MQTT node is optional. Policies follow the schedule without it; add it when you want the times on MQTT or in Home Assistant. House schedule settings Setting Default What it does Name house Labels the schedule and names its topics, home/<name>/schedule/... . Needs a letter or digit. In topics the name is lower-cased and other characters become _ : Main House publishes on home/main_house/schedule/... . Wake time 07:00 When the rooms start to brighten. Bed time 23:00 When the rooms reach the sleep settings. It must differ from the wake time. A bed time after midnight, or a wake time later than the bed time, works."
 },
 {
  "title": "Share a house schedule",
  "section": "Share one schedule between rooms",
  "description": "Circadian lighting policies reference the schedule; only the optional MQTT node has wires. Each policy hears o",
  "url": "guide-house-schedule.html#wiring",
  "text": "Circadian lighting policies reference the schedule; only the optional MQTT node has wires. Each policy hears of every change as it happens and restyles its rooms. house schedule MQTT Publishes the times · takes changes ⇢ house schedule Configuration node · no wires ⇢ Circadian lighting policies Schedule: house house schedule MQTT ⇄ broker Its Broker setting · set topics in, retained times out The dashed arrows are settings that reference the house schedule, not wires. The house schedule MQTT node reaches the broker through its Broker setting: no wires at all. What connects to what From Connect to Why Circadian lighting policy Schedule setting house schedule The policy takes its wake and bed times from it. No wire. house schedule MQTT Schedule setting house schedule Required. The node publishes and changes this schedule. No wire. house schedule MQTT Broker setting Node-RED’s MQTT broker node It publishes the times, availability and Home Assistant discovery, and reads home/<name>/schedule/wake-time/set and bed-time/set , itself. No wire. (Without one, as before 6.2: an MQTT in node on those topics into it, and its output to MQTT out.) Add the schedule from a policy. Open a circadian lighting policy ( home-circadian-lighting-policy ) and set Schedule . Use the editor’s add button to create a house schedule, or pick one that already exists; the editor offers an existing schedule first for a new policy. Set the times once. Edit the house schedule’s Wake time and Bed time . Every policy that uses it follows these times, not its own Wake time and Bed time . Point the other policies at it. Choose the same schedule as Schedule in each policy that should share the times. Add the MQTT node if you want it. Drag a house schedule MQTT node ( home-house-schedule-mqtt in the palette) onto the canvas, choose the schedule as its Schedule , and wire it to the broker as in the table. Use one per schedule: two would share the same topics and entities, and deleting one clears them for both until the other next starts. The importable example House schedule.json shows two areas, each with its own circadian lighting policy and room, sharing one schedule named house , with an Inject node that changes the wake time through the MQTT node."
 },
 {
  "title": "Share a house schedule",
  "section": "Change the times",
  "description": "Send changes to the house schedule MQTT node. It changes the shared schedule, and every policy following it re",
  "url": "guide-house-schedule.html#changes",
  "text": "Send changes to the house schedule MQTT node. It changes the shared schedule, and every policy following it restyles its rooms. Give new times as HH:MM , either one alone: Function → house schedule MQTT · wake earlier msg.lighting = {kind: \"schedule\", wakeTime: \"06:30\"}; return msg; Function → house schedule MQTT · set both times msg.lighting = {kind: \"schedule\", wakeTime: \"06:30\", bedTime: \"22:30\"}; return msg; Times that are not valid HH:MM , or a wake time equal to the bed time, are ignored. From MQTT, a time on a set topic does the same. A message is read as HH:MM or HH:MM:SS ; retained messages and anything but a time are ignored. House schedule topics (default name house ) Topic Direction Payload home/house/schedule/wake-time/set In A new wake time home/house/schedule/bed-time/set In A new bed time home/house/schedule/wake-time/state Out, retained The wake time in use, HH:MM:SS home/house/schedule/bed-time/state Out, retained The bed time in use, HH:MM:SS home/house/schedule/availability Out, retained online after the flows start; offline as the node stops (see below) With Publish set to MQTT state and Home Assistant discovery (the editor’s default for a new node; an imported flow without the setting gets MQTT state ), Home Assistant gets a Wake time and a Bed time entity under the Discovery prefix ( homeassistant ), named after the schedule so a replacement MQTT node keeps them. Changing one in Home Assistant sends it to the set topic, and the node acts on it: with a Broker it reads that itself, and without one through an MQTT in node on its set topics. See Home Assistant for the rest of the setup. The node’s own offline , and the clearing of its retained topics and entities when you delete it, reach the broker only on a “Modified nodes” or “Modified flows” deploy. On a full deploy, a restart or a crash, Node-RED closes the broker connection at the same moment, so set the MQTT broker node’s Birth message to online and its Close message and Will message to offline , all retained, on the availability topic. See Upgrading from 2.x in the README. With a Broker, the node announces the times again each time the broker connects, reconnects included. Without one, wire a Status node whose scope is your MQTT out node into it to do the same. You can also send it msg.source = \"startup\" yourself. A changed time lasts until the setting changes. A time set by a message or from Home Assistant stays until a deploy gives the house schedule a different Wake time or Bed time ; that setting then applies. Without a file context store , a restart or redeploy also returns the schedule to its settings."
 },
 {
  "title": "Share a house schedule",
  "section": "Give a room its own times",
  "description": "A room that needs different times (a child’s room, say) gets its own circadian lighting policy, which sets Sch",
  "url": "guide-house-schedule.html#own-times",
  "text": "A room that needs different times (a child’s room, say) gets its own circadian lighting policy, which sets Schedule to none and keeps its own Wake time and Bed time . Following a schedule or not Policy’s Schedule Its times Its own wake and bed time topics and entities A house schedule The schedule’s, at every change Its wake-time/set and bed-time/set topics are ignored; its Home Assistant wake and bed time entities are cleared. None Its own settings While it publishes ( Publish set to MQTT state or more), published and changed under home/<area>/wake-time and bed-time , as the README’s Room light control describes. Sleep stays per policy. A policy’s sleep mode still overrides the schedule, so one area can go to its sleep settings while the others follow the house times. Deleting a house schedule in the editor sets its policies to none, and they return to their own times rather than keeping the schedule’s last ones."
 },
 {
  "title": "Share a house schedule",
  "section": "Check the result",
  "description": "Read the outcome What you see What it means house schedule MQTT status wake 07:00 · bed 23:00 The times the sc",
  "url": "guide-house-schedule.html#check",
  "text": "Read the outcome What you see What it means house schedule MQTT status wake 07:00 · bed 23:00 The times the schedule is using now. It updates at every change. Policy status day · 80% 4100K or sleep The policy is styling its rooms by the times in use. Policy status … schedule missing: own times The policy names a schedule that is not running, as when it was deleted from the flows file. It keeps its own times until you choose a schedule or none. Retained home/<name>/schedule/wake-time/state and bed-time/state The MQTT node published the times; watch them with an MQTT client. A change restyles only the lights a room has been told about since it started. A light that nothing has named since a start with nothing saved can keep its start-time style; switch circadian lighting on, or let motion or a wall switch name it. Sources: README Room lighting, Room light control, Upgrading from 2.x and Recommended setup: a file context store; house schedule, house schedule MQTT and circadian lighting policy editor help and source; House schedule example flow."
 },
 {
  "title": "Scenes",
  "description": "Turn on “Exercise mode” or “Bath”: the room’s lights and sockets change and motion lighting pauses. When the scene ends, by request, a safety timer or something you choose, everything goes back.",
  "url": "guide-scenes.html",
  "text": "Turn on “Exercise mode” or “Bath”: the room’s lights and sockets change and motion lighting pauses. When the scene ends, by request, a safety timer or something you choose, everything goes back."
 },
 {
  "title": "Scenes",
  "section": "Before you wire it",
  "description": "A scene ( home-scene ) takes some of a room’s lights for a while. It holds each on or off with the values you ",
  "url": "guide-scenes.html#before",
  "text": "A scene ( home-scene ) takes some of a room’s lights for a while. It holds each on or off with the values you give it, and pauses motion lighting, so motion doesn’t switch the bath lights off or the exercise light back on. When it ends, each room gives its lights back what they were before the scene. You need a room lighting controller for the room, with each light and socket in its Targets JSON. A socket is a target marked \"onOffOnly\": true , through its own adapter. To pause motion lighting, a motion lighting policy wired into that room. To start and stop it from Home Assistant, an MQTT broker node, as for the other publishing nodes (see Home Assistant )."
 },
 {
  "title": "Scenes",
  "section": "Wire a scene",
  "description": "Import Scene from the examples (Import → Examples → @avantics/node-red-home-automation), or add a scene node f",
  "url": "guide-scenes.html#wiring",
  "text": "Import Scene from the examples (Import → Examples → @avantics/node-red-home-automation), or add a scene node from the palette. Scene connections From To Carries Scene output 1 Each room lighting controller whose lights it sets Owner intents as it starts, releases as it ends. Scene output 2 Each motion lighting policy to pause An owner pause, renewed every minute, lifted as it ends. Scene Broker setting Node-RED’s MQTT broker node When it publishes: its Home Assistant switch out, and Home Assistant’s ON and OFF in, announced again on each connect. No wire. Give each room it uses an Area. A scene names each light by its room’s Area and its id there, and a room acts only on a scene’s lights for its own Area, so two rooms may each have a main . Name it. The name is how its rooms, its motion policies and Home Assistant know it, so each scene needs its own: Exercise mode , Bath . Two scenes with one name would share an owner, and one ending would release the other’s lights; the editor marks a name another scene has. List its lights. One entry per light or socket, by its room’s Area and its id in that room’s Targets JSON: Exercise mode · main light off, TV socket on [{\"area\": \"gym\", \"target\": \"main\", \"state\": \"OFF\"}, {\"area\": \"gym\", \"target\": \"tv\", \"state\": \"ON\"}] Bath · two lights dimmed warm [{\"area\": \"bathroom\", \"target\": \"ceiling\", \"state\": \"ON\", \"brightnessPct\": 30, \"colorTempKelvin\": 2700}, {\"area\": \"bathroom\", \"target\": \"mirror\", \"state\": \"ON\", \"brightnessPct\": 50}] Brightness is 0-100 % and colour temperature in kelvin; a light given neither just switches on. A scene with no lights only pauses motion. Set its safety timer. It ends itself after 4 hours by default, so a scene left on doesn’t hold the room overnight. 0 turns the timer off. Start and end it. Send msg.scene = {kind: \"start\"} and msg.scene = {kind: \"end\"} from your flow, or use its Home Assistant switch (below)."
 },
 {
  "title": "Scenes",
  "section": "End it when something happens",
  "description": "A scene can end on a condition, such as the trainer’s power falling, the bath lights being switched off or a d",
  "url": "guide-scenes.html#end-trigger",
  "text": "A scene can end on a condition, such as the trainer’s power falling, the bath lights being switched off or a door opening. The condition lives in your flow: when it is met, send the scene an end, with what ended it. Change node · after a switch node passing power below 20 W msg.scene = {kind: \"end\", by: \"trainer off\"}; The scene shows off · ended by trainer off . An end while it is off does nothing, so a condition that stays true can keep sending it. The example flow builds this from a switch node and a change node."
 },
 {
  "title": "Scenes",
  "section": "What happens when it ends",
  "description": "Each room gives each light back what it was when the scene took it: A light the room was running is the room’s",
  "url": "guide-scenes.html#hand-back",
  "text": "Each room gives each light back what it was when the scene took it: A light the room was running is the room’s again, on or off as it was, in the room’s style as it is now: a bath from 20:00 to 21:30 gets the 21:30 style, not 20:00’s. A light that was off goes off. A light a person had set gets their brightness and colour back, and stays theirs. A light a person changed during the scene is theirs: the scene’s end leaves it alone. Motion lighting resumes when its pause lifts. If the room went vacant during the scene, its vacancy delay starts then, and it switches the lights off as it normally would. Keep each motion policy’s Maximum pause above a minute (10 minutes by default), as the scene renews its pause every minute."
 },
 {
  "title": "Scenes",
  "section": "Two scenes at once",
  "description": "Scenes stack. If Bath starts while Exercise mode holds the same light, Bath takes it; when Bath ends, the ligh",
  "url": "guide-scenes.html#stacking",
  "text": "Scenes stack. If Bath starts while Exercise mode holds the same light, Bath takes it; when Bath ends, the light goes back to what Exercise mode asked for, not to the room. If Exercise mode ends first, the light stays with Bath, and goes back to the room when Bath ends. Lights only one scene holds follow that scene. Each scene pauses motion under its own name, so motion resumes only when both have ended."
 },
 {
  "title": "Scenes",
  "section": "Start and stop it from Home Assistant",
  "description": "Switch publishing on. Give the scene an area, set Publish to MQTT state and Home Assistant discovery , and cho",
  "url": "guide-scenes.html#home-assistant",
  "text": "Switch publishing on. Give the scene an area, set Publish to MQTT state and Home Assistant discovery , and choose its Broker . The scene then publishes its switch and reads its set topic, home/<area>/scene/<name>/set , itself, where <name> is its name in lower case with other characters as _ ( exercise_mode ). Home Assistant then shows a switch for the scene: on while it is on, off once it ends by any route. Switching it off ends the scene “by home-assistant”."
 },
 {
  "title": "Scenes",
  "section": "Restarts and deploys",
  "description": "A scene keeps its state in its node context, which lasts across restarts and full deploys only with a context ",
  "url": "guide-scenes.html#restarts",
  "text": "A scene keeps its state in its node context, which lasts across restarts and full deploys only with a context store (see Install ). With one, a scene that was on is still on, with its timer; if the timer ran out meanwhile, the scene ends as the flows start. Without one, the scene and its rooms both start with nothing saved: the scene is off, and the rooms no longer know it held their lights, so the lights stay as they are until something changes them. Deleting a scene while it is on lets its lights and motion go, when you deploy with “Modified nodes” or “Modified flows”."
 },
 {
  "title": "Wire a cover",
  "description": "Connect a blind, shutter or curtain through the shelly cover adapter node. Then add presets, manual control and a group without losing sight of what the motor actually did.",
  "url": "guide-covers.html",
  "text": "Connect a blind, shutter or curtain through the shelly cover adapter node. Then add presets, manual control and a group without losing sight of what the motor actually did."
 },
 {
  "title": "Wire a cover",
  "section": "Before you wire it",
  "description": "This guide connects a calibrated relay-module cover through the shelly cover node ( home-shelly-cover ), an ad",
  "url": "guide-covers.html#before",
  "text": "This guide connects a calibrated relay-module cover through the shelly cover node ( home-shelly-cover ), an adapter that speaks the device’s own MQTT API. You need the device’s MQTT topic prefix and a broker connection in Node-RED. Use a compatible generation-2-or-later relay device in cover mode , calibrated on the device first. Enable MQTT and MQTT Control on the device. Keep RPC status notifications enabled so changes are reported. Generic status updates can provide additional full reports. The controller’s positions are 0 = closed and 100 = open . For a motor with no reliable position, use open, close and stop only instead; this position-adapter guide is not that device path."
 },
 {
  "title": "Wire a cover",
  "section": "Wire the command and observation loop",
  "description": "The adapter translates messages. The controller decides whether a move is complete. Keep both directions conne",
  "url": "guide-covers.html#wiring",
  "text": "The adapter translates messages. The controller decides whether a move is complete. Keep both directions connected. broker <prefix>/# ⇄ shelly cover Device reports ↔ neutral messages ⇄ Cover controller Requests and confirmation Reports: the adapter reads them from the broker → controller. Commands: controller output 1 → adapter, which publishes them. The table below names every wire. Two wires From Connect to Why Controller output 1 shelly cover input Pass neutral device commands unchanged. shelly cover output 2 Controller input Feed back observations, availability and command results. Set the adapter’s topic prefix and Broker. Use the prefix configured on your device. Set Cover ID to 0 , or 1 for a device’s second cover. With a Broker , the adapter subscribes to <prefix>/# and publishes the commands itself. An adapter saved before 6.2 keeps its MQTT in node on <prefix>/# and its first output to MQTT out until you choose one. Choose a position cover. On the controller, leave Cover as “Takes a position (0 to 100)”. Set Invert positions only if the device reports 0 as open. Nothing to send at startup. The adapter reads the cover each time the broker connects, and the controller re-reads a move that was in progress, so neither trusts old state. A controller that publishes runs its startup on each connect too. Watch state and results. Connect controller output 2 to a Debug node. Output 3 reports whether it is moving; output 4 is for optional MQTT publications, not device commands. A position echo is not a stopped motor. A move confirms from a stopped report at the target, or a position that stays the same for the settle time. Set Settle time to at least the interval between motor travel reports."
 },
 {
  "title": "Wire a cover",
  "section": "Request a position or preset",
  "description": "Use an Inject node or another policy to send a number, \"open\" , \"close\" , \"stop\" , or a named preset to the co",
  "url": "guide-covers.html#presets",
  "text": "Use an Inject node or another policy to send a number, \"open\" , \"close\" , \"stop\" , or a named preset to the controller. Inject → cover controller · request a position msg.payload = 60; return msg; The default Presets setting is {\"partial\":60} . To use it: Inject → cover controller · use a named preset msg.payload = \"partial\"; return msg; A still cover already at its target is confirmed without sending another move."
 },
 {
  "title": "Wire a cover",
  "section": "Leave a person’s move alone",
  "description": "Mark requests from schedules or automatic policies with respectManual . They wait while the cover is held by a",
  "url": "guide-covers.html#manual",
  "text": "Mark requests from schedules or automatic policies with respectManual . They wait while the cover is held by a person’s move. Automatic request msg.payload = \"partial\"; msg.respectManual = true; return msg; A new request without that flag takes control back. For a wall button that should stop a moving cover, set stopIfMoving : Button request · stop if moving, otherwise open msg.payload = \"open\"; msg.stopIfMoving = true; return msg; Pause motion lighting, not the user’s enable switch. Controller output 3 can feed the motion policy’s pause input: set msg.source = \"pause\" and a distinct msg.owner . Keep the boolean payload. Never use the area-enabled input for this."
 },
 {
  "title": "Wire a cover",
  "section": "Move several covers as one",
  "description": "Add a cover group . Its default members are [\"left\",\"right\"] . Output 1 is the group result; each following ou",
  "url": "guide-covers.html#groups",
  "text": "Add a cover group . Its default members are [\"left\",\"right\"] . Output 1 is the group result; each following output is a request for the labelled member. Connect the group’s left and right outputs to their respective cover controllers. Connect each controller’s output 2 back to the group input. Send the request to the group. It assigns each member its own request identity. The group reports ready only when every member confirms. If some fail, it reports partial or none-confirmed with individual member details. A silent member becomes no-answer at the answer deadline (default 120 seconds ). Each member keeps its own device connection. A group has no Home Assistant entity; Home Assistant can group the individual cover entities itself. The Cover pair example flow ( Import → Examples ) wires a group to the left and right curtains of a pair, with inject nodes standing in for their reports."
 },
 {
  "title": "Wire a cover",
  "section": "Check the result",
  "description": "Read the outcome What you see What it means Moving, then ready Fresh reports confirm the cover has stopped at ",
  "url": "guide-covers.html#check",
  "text": "Read the outcome What you see What it means Moving, then ready Fresh reports confirm the cover has stopped at its target. not-calibrated / position-unknown The device cannot provide a usable position. Calibrate it or restore its position knowledge; do not invent a reading. unavailable The device is offline. No device command is sent; it is read again when it returns. For output messages, optional Home Assistant discovery and timing defaults, open the cover controller reference . Sources: README Covers; cover controller, cover group and shelly cover editor help."
 },
 {
  "title": "Run a home theatre",
  "description": "Wire the theatre state contract, the theatre activity controller and the five equipment controllers, then request, check and recover activities.",
  "url": "home-theatre.html",
  "text": "One request, such as “tv” or “off”, drives the display, receiver, media source, room lights and TV backlight together. Each device keeps one owner, and the activity is ready only when every required device has been seen doing what was asked."
 },
 {
  "title": "Run a home theatre",
  "section": "Before you wire it",
  "description": "A home theatre is built from seven nodes. Two coordinate the activity, and five each own one kind of device: T",
  "url": "home-theatre.html#before",
  "text": "A home theatre is built from seven nodes. Two coordinate the activity, and five each own one kind of device: The theatre nodes Palette name Type Owns theatre state contract home-theatre-state-contract Turns MQTT activity requests into activity intents, and publishes the activity controller’s state as retained MQTT topics, with optional Home Assistant discovery. theatre activity home-theatre-activity-controller The latest request’s activity: plans each target, collects its evidence and decides when the activity is ready, waiting or failed. display mode home-display-mode-controller The TV, the projector and the projector screen, for the off , tv and projector modes. AVR controller home-avr-controller The receiver’s power, main zone, source and bounded volume. source capability controller home-source-capability-controller Whether a media source is available, active, running an application or playing. TV backlighting home-backlighting-controller The TV backlight’s power. activity lighting home-activity-lighting-controller The activity’s style for room lights that are already on, through a room lighting controller . A broker connection in Node-RED, for the request topic and the retained state. A transport for each device the package doesn’t reach itself: a TCP connection for the receiver, and your own adapters for the media source and the projector’s infrared power toggle. For a WLED TV backlight, the wled node is the transport; for another backlight, your own. The display controller reaches the TV and the screen directly over their LAN APIs. A room lighting controller for the lights the activity styles. See Light a room . Home Assistant is optional. It can show the activity and request one, through the MQTT topics; it is never the path to a device."
 },
 {
  "title": "Run a home theatre",
  "section": "How the pieces divide the work",
  "description": "The activity controller sends each target what it should end up as, never how to get there. Each equipment con",
  "url": "home-theatre.html#targets",
  "text": "The activity controller sends each target what it should end up as, never how to get there. Each equipment controller keeps its own sequencing, transport, retries and confirmation, and reports back what it observed. Stale work is inert Every request gets a generation number. Timers, results and observations carry it, and one from an older request cannot change or complete a newer one. Readiness is observed A required target counts only with a fresh report from its device. A command that was sent, or acknowledged, is not a confirmation. Manual control is kept A change made by hand becomes a manual override. No controller fights it; the next request takes over again. Volume has one owner The receiver controller bounds, sends and confirms volume requests, then lets go, so a later change by hand becomes the new baseline."
 },
 {
  "title": "Run a home theatre",
  "section": "Wire the whole set",
  "description": "Requests flow down from the state contract to the equipment controllers. Evidence flows back up from each cont",
  "url": "home-theatre.html#wiring",
  "text": "Requests flow down from the state contract to the equipment controllers. Evidence flows back up from each controller’s output 2 to the activity controller, whose state goes back to the contract for publishing. Its Broker home/<area>/theatre/request → theatre state contract Request → intent ⇄ theatre activity Plans and aggregates → switch + change Route by target Equipment controllers display · avr · source · lighting · backlighting → Your transports Output 1 → Devices Observed state back in Each equipment controller’s output 2 goes straight back to the activity controller. The contract reads requests and publishes its state through its Broker. Connections for the whole theatre From Connect to Why State contract Broker setting Node-RED’s MQTT broker node No wire: it reads activity requests on home/<area>/theatre/request (retained ones are ignored) and publishes its retained state, availability and, if chosen, Home Assistant discovery. Without one (saved before 6.2), an MQTT in node on the request topic into its input, and its output 2 to MQTT out. State contract output 1 Activity controller input Activity intents, each with a new generation. Activity controller output 1 Switch node on msg.theatreCommand.target One command per target. See route commands by target . Activity controller output 2 State contract input Activity events and the complete state snapshot to publish. Each change node Its equipment controller’s input The command, moved onto the property that controller reads. Each equipment controller’s output 1 Its device transport Commands for the device. Activity lighting’s output 1 goes to the room lighting controller. Room lighting controller output 2 Each light’s adapter (a zigbee2mqtt light ) The light commands; each adapter publishes them through its Broker, and its second output goes back into the room. Room lighting controller output 3 Activity lighting input Each light’s reading with whether a person set it, so activity lighting can confirm its lights. Each equipment controller’s output 2 Activity controller input Target state as msg.theatre . The controller’s own events on the same wire are ignored by the activity controller. Your device readings Their equipment controller’s input Observations. A controller confirms only from these. Display controller output 3 Your projector meter Power queries, when the controller has no meter host. See projector power . AVR controller Broker setting Node-RED’s MQTT broker node Optional receiver state and Home Assistant discovery, when it publishes. No wire (without one, its output 3 to MQTT out). After a deploy, send the display and AVR controllers {kind: \"startup\"} on their own property ( msg.display , msg.avr ), so they read their devices again rather than trusting saved state. The state contract announces itself once the flows start, and again at msg.theatreStateContract = {kind: \"startup\"} . Set the state contract’s Area . With Base topic empty it is required, because it makes the default base topic home/<area>/theatre ; a contract saved before node IDs with discovery on needs it too. Otherwise it is optional. The contract in the imported Home theatre activity.json example has no area, so it shows invalid configuration until you set one; put the same area in the request tv activity inject’s topic."
 },
 {
  "title": "Run a home theatre",
  "section": "Route commands by target",
  "description": "The activity controller sends msg.theatreCommand = {target, kind, requestId, generation, …} , with kind intent",
  "url": "home-theatre.html#routing",
  "text": "The activity controller sends msg.theatreCommand = {target, kind, requestId, generation, …} , with kind intent for a new request or refresh to re-confirm, and the activity’s wanted values for that target. Your flow delivers each one to the matching controller: one switch node on msg.theatreCommand.target with five outputs, and a change node per target that moves msg.theatreCommand to the controller’s property. Where each target command goes target Move to Controller Wanted values display msg.display display mode mode : off , tv or projector avr msg.avr AVR controller power ( on or standby ) and an optional source source msg.sourceCapability source capability controller action ( activate or deactivate ), sourceId and readiness lighting msg.activityLighting activity lighting profile : a profile name on the activity lighting node backlighting msg.backlighting TV backlighting power : on or off In the switch node, set the property to msg.theatreCommand.target and add one == rule per target. In each change node, use Move from msg.theatreCommand to the property in the table."
 },
 {
  "title": "Run a home theatre",
  "section": "Describe the activities",
  "description": "Two settings name the activities, and they must agree. The state contract’s Activities JSON lists the names it",
  "url": "home-theatre.html#activities",
  "text": "Two settings name the activities, and they must agree. The state contract’s Activities JSON lists the names it accepts, such as [\"off\",\"tv\"] . The activity controller’s Profiles JSON gives each of them every target’s wanted values. Profile names start with a lower-case letter, followed by lower-case letters, digits, _ or - . theatre activity · Profiles JSON { \"off\": { \"display\": {\"mode\": \"off\"}, \"avr\": {\"power\": \"standby\"}, \"source\": {\"action\": \"deactivate\", \"readiness\": \"optional\"}, \"lighting\": {\"profile\": \"off\"}, \"backlighting\": {\"power\": \"off\"} }, \"tv\": { \"display\": {\"mode\": \"tv\"}, \"avr\": {\"power\": \"on\", \"source\": \"shield\"}, \"source\": {\"action\": \"activate\", \"sourceId\": \"streamer\", \"readiness\": \"required\"}, \"lighting\": {\"profile\": \"tv\"}, \"backlighting\": {\"power\": \"on\"} } } Every profile names all five targets. A profile that leaves one out is an invalid configuration. The source’s readiness decides whether it is waited for. required holds the activity at waiting_for_source until the source is confirmed; optional lets the activity be ready without it. An activate needs a sourceId ; a deactivate without one acts on the previous activity’s source. Names on the other nodes must exist. The AVR’s source is a key in the AVR controller’s Sources (by default {\"shield\":\"SAT/CBL\",\"playstation\":\"GAME\"} ), the sourceId a key in the source controller’s Source capabilities , and the lighting profile a key in the activity lighting node’s Profiles JSON . The activity lighting node’s profiles give targets and values in the package’s own units, for example {\"off\": {\"targets\": [], \"values\": {}}, \"tv\": {\"targets\": [\"main\"], \"values\": {\"brightnessPct\": 25, \"colorTempKelvin\": 2500}}} . It styles only lights that are already on and not manually owned. When it lets go of a light (the activity ends, or a new profile no longer names it), the room lighting controller gives the light back what it was before the activity took it, so it stays on, in the room’s style as it is now. A light a person changed during the activity, which a newer request then took back, gets that person’s values back instead and stays theirs. See owners stack ."
 },
 {
  "title": "Run a home theatre",
  "section": "Request an activity",
  "description": "Publish a non-retained request on home/<area>/theatre/request , with a new request ID and one of the configure",
  "url": "home-theatre.html#request",
  "text": "Publish a non-retained request on home/<area>/theatre/request , with a new request ID and one of the configured activities. The request ID starts with a letter or digit and continues with letters, digits, . , _ , : or - , up to 128 characters. Inject → theatre state contract · request the tv activity msg.topic = \"home/<area>/theatre/request\"; msg.payload = {requestId: \"example-request-1\", activity: \"tv\"}; return msg; A new request ID is a new request. The contract gives it the next generation, and the newest request wins: the activity in hand is reported superseded . The latest request again is a duplicate. Sent again with the same request ID, it is passed on unchanged and starts nothing new. Only the latest request is compared: an older request ID sent again is a new request. Reusing the latest request ID for a different activity is an error. An invalid request is an error on the message. An unknown activity or a malformed request ID is reported against the message, where a Catch node can see it. With Publish set to MQTT state and Home Assistant discovery , the contract adds a Requested activity selector that publishes the same request with a request ID of its own. The topics and payloads are listed in the Theatre MQTT contract ."
 },
 {
  "title": "Run a home theatre",
  "section": "How an activity completes",
  "description": "The activity controller moves through these phases, shown in its node status as <activity>: <phase> : preparin",
  "url": "home-theatre.html#complete",
  "text": "The activity controller moves through these phases, shown in its node status as <activity>: <phase> : preparing The request is accepted, earlier target evidence is cleared, and one intent goes to every target. transitioning A required target is changing its device. confirming A required target has not yet reported fresh evidence, or is confirming what it observed. waiting_for_source Every required device is ready, but a source with readiness: \"required\" is not yet confirmed. This is expected waiting, not a failure. ready The display, receiver and backlight each reported ready within Freshness ms (default 30000 ), and so did the source if it is required. Room lighting is optional: a light that is not confirmed (or, with no reading at all by activity lighting’s confirmation timeout, unobserved ), or a source with readiness: \"optional\" that is not, leaves the activity ready with availability degraded and the target listed as degraded, rather than holding it back. Once ready, the activity controller sends each settled target a refresh at half the freshness window, and each controller answers it from fresh readings. A target that stops answering is asked up to three times, then shown as degraded with reason no-response ; it does not undo a ready activity, and it is asked again once per freshness window. Each equipment controller’s output 2 · target state msg.theatre = {kind: \"target_state\", target: \"avr\", requestId, generation, status: \"ready\", observedAt: \"2026-01-01T20:00:01.000Z\"};"
 },
 {
  "title": "Run a home theatre",
  "section": "How an activity fails",
  "description": "A required target (display, receiver or backlight) that reports failed or unavailable fails the whole activity",
  "url": "home-theatre.html#fail",
  "text": "A required target (display, receiver or backlight) that reports failed or unavailable fails the whole activity: the phase becomes failed , the current activity unknown , and the status shows <activity>: <reason> . The failure names the target, the operation and the reason the target gave, or unavailable or target-failed when it gave none. Common failure and rejection reasons Reason From What it means no-reading display mode A device didn’t report within Query timeout milliseconds , after Maximum idempotent attempts . The failure names the device. screen-not-calibrated display mode A Screen viewing position is set, but the screen has no position. See the screen viewing position . no-response theatre activity A target never answered the activity controller’s refreshes before the activity first completed. stale-generation , request-conflict , generation-conflict theatre activity A request was rejected : it was older than the one in hand, or reused its request ID or generation for something else. A failed activity stays failed until the next request. Fix the cause, then request the activity again with a new request ID."
 },
 {
  "title": "Run a home theatre",
  "section": "Manual overrides and recovery",
  "description": "When someone changes the display, receiver, source, backlight or a room light the activity holds by hand after",
  "url": "home-theatre.html#manual",
  "text": "When someone changes the display, receiver, source, backlight or a room light the activity holds by hand after an activity is ready, that controller reports a manual override instead of sending a correcting command. The activity controller’s phase becomes manual_override , with availability degraded . A newer request takes over again. Restart with saved state. Node-RED keeps a node’s state across a restart only with a context store configured; see the README’s file context store setup. A controller then re-reads its devices rather than replaying old commands. Restart with nothing saved. The activity controller has no activity: its phase is idle and its current activity unknown , and nothing is commanded until the next request, so a redeploy never switches a running activity off. A msg.theatre = {kind: \"startup\"} puts it in recovering and sends every target a refresh with no request. The display, AVR, source and backlighting controllers answer it with what their devices show, and when that matches exactly one activity, the theatre adopts it (event recovery_adopted ), ready, with nothing commanded. A device that can’t be asked, such as a backlight that only reports when it changes, needn’t answer: once the refreshes run out (about one and a half freshness windows), the theatre adopts from the ones that did, as long as the display and the receiver are among them, and shows the silent one as unobserved until it reports. When the answers match none, or more than one, or the display or the receiver doesn’t answer, it returns to idle and unknown (event recovery_unknown ): send a request to take over again. A target that restarted alone. It takes the activity’s wanted values from the next refresh and only reads its device: ready if the device already matches, or a manual override with reason adopted-mismatch if it doesn’t, sending nothing until the next request."
 },
 {
  "title": "Run a home theatre",
  "section": "Ask the receiver for a volume",
  "description": "Send volume requests to the AVR controller rather than receiver commands. Volume is in dB: valueDb is the leve",
  "url": "home-theatre.html#volume",
  "text": "Send volume requests to the AVR controller rather than receiver commands. Volume is in dB: valueDb is the level for absolute , or the change for relative . Inject → AVR controller · one step louder msg.avr = {kind: \"volume\", requestId: \"volume-control-1\", mode: \"relative\", valueDb: 1}; return msg; dB and the receiver’s 0-98. The controller converts for the receiver: on its 0-98 scale, 80 is 0 dB, so the range is -80 to +18 dB in half steps. A reading of MV30 is -50 dB. Bounds. Every request is held within Minimum volume (dB) and Maximum volume (dB) (defaults -80 and -20 ). Rapid requests add up. A relative request starts from the fresh observed volume, or from the target still pending. Two quick +1 dB steps from -50 dB send -49 dB, then -48 dB. Confirmed, then released. A fresh receiver reading confirms the request ( volume_ready ), and the controller lets go: a later change at the receiver is reported as volume_external and becomes the new baseline, not corrected. 0-98 values are gone. A request with value in the receiver’s 0-98 and no valueDb is answered volume_rejected with reason removed-volume-value , with a warning in the log. A node saved with only the old 0-98 minVolume and maxVolume is an invalid configuration until its dB bounds are set. Activities own power and source, not volume. A volume request waits while an activity is switching the receiver’s power or source, and is rejected with receiver-not-ready while the receiver is off. One still pending at a restart is reported volume_failed with reason restart . With Publish set to MQTT state and Home Assistant discovery , Home Assistant gets a volume number in dB. Its sets arrive on home/<area>/receiver/volume/set : with a Broker , the AVR controller reads them itself; without one, wire an MQTT in node on that topic into it. Sets within 0.3 seconds of each other are settled to the last, which becomes an ordinary absolute request."
 },
 {
  "title": "Run a home theatre",
  "section": "Report projector power from a meter",
  "description": "The display controller needs a fresh projector power reading at every request and while it confirms a change. ",
  "url": "home-theatre.html#projector-power",
  "text": "The display controller needs a fresh projector power reading at every request and while it confirms a change. With Projector power meter host set, it reads a Shelly Gen2 switch with power metering on the projector’s supply itself. Left empty, your flow reports the power from any meter or adapter: Your meter → display mode controller msg.display = {kind: \"observed\", device: \"projector\", watts: 140}; // or, from an adapter that knows the lamp state: msg.display = {kind: \"observed\", device: \"projector\", power: \"on\"}; Watts are read against two thresholds. Projector on watts (default 20 ) and Projector standby watts (default 10 ). Between them, the lamp keeps its last settled state while it warms or cools. Power is lower case. \"on\" , \"standby\" or \"transitioning\" . A smart plug’s own ON and OFF are the socket, not the lamp: send its watts instead. observedAt and source are optional. Output 3 asks for a reading. When the controller needs one, it sends msg.payload = \"query\" on output 3. Wire it to whatever makes your meter report, such as a Zigbee2MQTT plug’s zigbee2mqtt/<device>/get topic. Leave it unwired only if the meter reports on its own at least once every Query timeout milliseconds (default 5000 ), even while the power holds steady. No reading fails the request. A device that hasn’t reported is asked again, up to Maximum idempotent attempts (default 2 ) in all, then the request fails with reason no-reading . Keep Transport timeout milliseconds below the query timeout × the attempts. The projector itself is switched by its power toggle on output 1 ( msg.payload = \"power\" with msg.display_command ): wire it to your infrared transport."
 },
 {
  "title": "Run a home theatre",
  "section": "Set the screen viewing position",
  "description": "For projector mode, the display controller opens the screen, a Shelly Gen2 cover at Screen controller host , a",
  "url": "home-theatre.html#screen",
  "text": "For projector mode, the display controller opens the screen, a Shelly Gen2 cover at Screen controller host , after the projector has warmed up. Switching between TV and projector is make before break, so a playing source keeps a picture. Empty (the default for a new node). The screen’s own open command, confirmed when the screen reports itself fully open. This also suits a screen that isn’t calibrated for positions. A position above 0, up to 100. The percentage of its travel to open to, confirmed within Screen position tolerance (default 2 ). A screen that doesn’t know its position is closed first; if it still has none, the request fails with screen-not-calibrated . Calibrate the screen, or clear the setting. Other modes close it. With the screen’s own close, which runs to the end and restores a position the screen has lost. A node saved with a position keeps it."
 },
 {
  "title": "Run a home theatre",
  "section": "Check the result",
  "description": "Wire Debug nodes to the state contract’s output 2 and to each equipment controller’s output 2, then watch the ",
  "url": "home-theatre.html#check",
  "text": "Wire Debug nodes to the state contract’s output 2 and to each equipment controller’s output 2, then watch the node statuses. Read the outcome What you see What it means Activity status tv: ready Every required target confirmed the activity from fresh readings. Activity status tv: confirming that doesn’t move on A required target isn’t reporting. Check that its output 2 is wired back to the activity controller and that its device readings reach it. Activity status tv: waiting_for_source The source hasn’t confirmed the readiness its capabilities ask for. Check the source adapter’s observations. Activity status tv: <reason> in red The activity failed. See how an activity fails . Activity status none: idle No request since start, or the activity couldn’t be recovered. Send a request. State contract status tv · 1 The last request’s activity and generation. waiting for state means nothing has arrived yet. A controller shows invalid configuration A required setting is missing: the contract’s area, or the display controller’s hosts and TV pre-shared key. The activity waits for that target. Importable examples are in the package’s examples folder ( Import → Examples in the editor): Home theatre activity.json wires the whole set with the switch and change nodes and Debug nodes in place of transports, and Home theatre equipment.json drives each equipment controller on its own from injects. The retained topics are in the Theatre MQTT contract ; see also the README’s Theatre activities and Receiver volume ownership . Sources: README Home theatre equipment, Theatre activities, Theatre MQTT contract, Receiver volume ownership and 6.0.0; editor help of the seven theatre nodes; lib/theatre-activity-controller.ts, lib/theatre-profiles.ts, lib/theatre-refresh.ts, lib/theatre-requests.ts; the Home theatre activity and Home theatre equipment example flows; contract examples theatre-activity, volume-ownership and source-readiness."
 },
 {
  "title": "Use Home Assistant as the panel",
  "description": "Show the nodes’ state in Home Assistant and let its controls send requests back over MQTT. The nodes still command and observe the devices themselves; Home Assistant only sees and asks.",
  "url": "guide-home-assistant.html",
  "text": "Show the nodes’ state in Home Assistant and let its controls send requests back over MQTT. The nodes still command and observe the devices themselves; Home Assistant only sees and asks."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "Before you wire it",
  "description": "Home Assistant is optional. A node that publishes sends its state over MQTT and, with discovery on, announces ",
  "url": "guide-home-assistant.html#before",
  "text": "Home Assistant is optional. A node that publishes sends its state over MQTT and, with discovery on, announces its entities to Home Assistant. A control used in Home Assistant comes back to the node as an MQTT request on a /set topic, and the node carries it out like any other request. The devices are still commanded and observed directly, by the nodes, never through Home Assistant. Publishing is opt-in, per node. Each publishing node has one Publish setting: Don’t publish , MQTT state (plain MQTT: its state and availability as retained topics, which any system can read) or MQTT state and Home Assistant discovery (that, and entities announced to Home Assistant, which read those same topics). A new node starts with Don’t publish. It replaced two settings, Publish state over MQTT and Home Assistant discovery, which a node saved before keeps and reads the same way: room lighting controllers and theatre state contracts saved before them keep publishing. Choose a Broker. With a Broker (Node-RED’s MQTT broker node), a publishing node publishes and reads its set topics itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does: a room asks its lights for readings, a cover controller reads its cover), and announces again each time Home Assistant comes back ( online on <prefix>/status ), so they come back by themselves. The MQTT out on its publication output, the MQTT in on its set topics and the Status node can then be deleted; still wired, they change nothing. Opening and saving a node offers the first broker in your flows: open each publishing node once to choose it. Without a Broker it publishes through its output, as below. The device adapters have a Broker too, for their devices’ own topics. The theatre state contract always publishes its retained state, so its Publish is MQTT state (a new node) or MQTT state and Home Assistant discovery . The house schedule MQTT node exists to publish, so its Publish is MQTT state or MQTT state and Home Assistant discovery , the latter when you add it from the palette. Give it an area. A node that publishes usually needs an Area , because its topics and IDs are named after it; without one the editor marks it invalid. The theatre state contract is the exception: with discovery off and a Base topic set, its area is optional. A room lighting controller with no area still controls its lights, but only with Publish set to Don’t publish ; otherwise, or on a room saved before these settings existed (which counts as on), it fails as an invalid configuration. Topics and IDs use the area in lowercase, with each run of spaces or other characters (anything but letters, digits, _ and - ) as _ . An area called “Upstairs Landing” publishes under home/upstairs_landing/… ; “living-room” is unchanged. Names shown in Home Assistant keep the area as you typed it. Keep state across restarts. A node remembers what it published in its node context. With a file context store that record survives deploys and restarts, so old topics can be cleared reliably."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "Pick a broker",
  "description": "Choose each publishing node’s Broker : it publishes its state, availability and discovery, and reads the /set ",
  "url": "guide-home-assistant.html#wiring",
  "text": "Choose each publishing node’s Broker : it publishes its state, availability and discovery, and reads the /set topics Home Assistant’s controls publish to, itself, with no wires. A node without one (saved before 6.2) publishes on an output instead: wire that to an MQTT out node, and an MQTT in node on its /set topics back into its input. Publishing node Carries out requests, publishes state ⇄ Its Broker State, availability, discovery out · /set requests in The node still commands its devices directly, never through Home Assistant MQTT broker Home Assistant reads discovery and state · its controls publish to /set With a Broker, no wires: the node publishes and reads its set topics itself. The table below names each node’s topics, and its output for a node without one. Ports per publishing node Node Without a Broker: publications output → MQTT out Set topics it reads room lighting controller ( home-room-lighting-controller ) Output 1, shared with its light commands. Wire it to MQTT out unchanged. None: it has no controls in Home Assistant. circadian lighting policy ( home-circadian-lighting-policy ) Output 2. Output 1 is its style, for the rooms. home/<area>/+/set covers circadian, sleep, wake time and bed time. theatre state contract ( home-theatre-state-contract ) Output 2, retained MQTT state and discovery. Output 1 carries activity requests to the activity controller. <base>/request , by default home/<area>/theatre/request . occupancy fusion ( home-occupancy-fusion ) Output 2. Output 1 still feeds the motion policy. None: the occupancy sensor is read-only. motion policy ( home-motion-lighting-policy ) Output 2. Output 1 carries lighting intents. home/<area>/motion/+/set AVR controller ( home-avr-controller ) Output 3, apart from receiver commands (1) and state and results (2). home/<area>/receiver/volume/set cover controller ( home-cover-controller ) Output 4. home/<area>/cover/<name>/set and, for a position cover, …/position/set house schedule MQTT ( home-house-schedule-mqtt ) Output 1, its only output. home/<name>/schedule/wake-time/set and …/bed-time/set The room lighting controller’s first output carries only its publications; its light commands leave through each light’s adapter. Flows that filter the first output by topic must pass the /control topics through. A light’s control sensor shows its availability as an attribute once its adapter reports it. For the cover controller, <name> is its Name in topics , which has no default: give each cover in a room its own. For the house schedule MQTT node, <name> is the house schedule’s Name , house by default. Use one house schedule MQTT node per schedule: two would share the same topics and entities."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "Which nodes offer which entities",
  "description": "With discovery on, each node announces its own entities, grouped under one Home Assistant device per node. Ent",
  "url": "guide-home-assistant.html#entities",
  "text": "With discovery on, each node announces its own entities, grouped under one Home Assistant device per node. Entities per node Node Entities in Home Assistant State topics room lighting controller A diagnostic sensor per light showing its control state, with the owner as an attribute. home/<area>/lighting/<target>/control circadian lighting policy A circadian switch, a sleep switch, and with its own times, wake and bed time entities (in the device’s configuration). Before 6.0 these were the room controller’s. home/<area>/circadian/state , …/sleep/state , …/wake-time/state , …/bed-time/state theatre state contract A Requested activity selector; Current activity and Phase sensors (the transition is the Phase sensor’s attributes); diagnostic Readiness, Failure, Transition latency, Operational SLO and Operational SLO breach entities; a health sensor per target. Under <base> : desired , current , phase , transition , failure , readiness , metrics , slo , health/<target> occupancy fusion An occupancy binary sensor. home/<area>/occupancy/state , retained ON or OFF motion policy A motion lighting switch and a vacancy delay number (in the device’s configuration). home/<area>/motion/enabled/state , …/delay/state in seconds AVR controller Power and source sensors, and a volume number in dB between Minimum volume and Maximum volume . home/<area>/receiver/power/state , …/source/state , …/volume/state cover controller A cover entity, named after its Name in topics , with open, close and stop; a position cover also gets set position and its reported position. home/<area>/cover/<name>/state and, for a position cover, …/position house schedule MQTT Wake and bed time entities, named after the schedule. home/<name>/schedule/wake-time/state , …/bed-time/state cover group ( home-cover-group ) None. Home Assistant can group the cover entities itself. None A circadian lighting policy that follows a house schedule (its Schedule setting) has no wake and bed time entities of its own; they are cleared, and the house schedule MQTT node offers the shared times instead. The motion lighting switch shows this node’s enable only: the shared global-enabled is not published, so motion can still be off everywhere while the switch shows on."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "What Home Assistant sends",
  "description": "Home Assistant’s controls publish to the node’s /set topics. The node treats each one as a request: bounded, s",
  "url": "guide-home-assistant.html#requests",
  "text": "Home Assistant’s controls publish to the node’s /set topics. The node treats each one as a request: bounded, sent to the device by the node and confirmed from what the device reports. Nothing reaches the device from Home Assistant directly. You can test a set topic without Home Assistant. This Inject node, wired into a circadian lighting policy whose area is “Study”, does what the circadian switch does: Inject → circadian lighting policy · switch circadian lighting on msg.topic = \"home/study/circadian/set\"; msg.payload = \"ON\"; return msg; Circadian lighting policy: ON or OFF on circadian and sleep; a time ( HH:MM or HH:MM:SS ) on wake time and bed time. A time set this way lasts until you deploy the node with a different Wake time or Bed time . Set topics are read only while it publishes and the area is set; retained messages are ignored. Theatre state contract: the activity selector sends a request with its own request ID to <base>/request , like any other activity request. Retained requests are inert. Motion policy: ON / OFF on …/enabled/set and a delay of 0 to 86400 seconds on …/delay/set , as its area-enabled ( true or false from a flow) and delay inputs do. AVR controller: a volume in dB on …/volume/set . Sets within 0.3 seconds of each other are settled to the last, which becomes an ordinary absolute volume request. It waits for a power or source change in progress and is rejected with receiver-not-ready while the receiver is off. Cover controller: OPEN , CLOSE or STOP on …/set , and, for a position cover, a position on …/position/set , carried out and confirmed like any other request. House schedule MQTT: a time on the wake or bed time set topic changes the schedule for every circadian lighting policy that follows it. Retained messages and anything but a time are ignored."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "Discovery prefix and entity names",
  "description": "Each node with discovery has a Discovery prefix setting, homeassistant by default, as in Home Assistant. Chang",
  "url": "guide-home-assistant.html#discovery",
  "text": "Each node with discovery has a Discovery prefix setting, homeassistant by default, as in Home Assistant. Change it only if you changed the prefix in Home Assistant’s MQTT settings. Every discovery entry names this package and its version as its origin. How IDs are named Node Device, unique IDs and discovery topics Room lighting controller or theatre state contract added from the palette Named after its Node-RED node ID ( nrha_<node id>… ), so renaming its area or display name updates the same entities. Room lighting controller or theatre state contract saved before node IDs Named after the area, exactly as before, so nothing changes for it in Home Assistant. Occupancy fusion, motion policy, circadian lighting policy, AVR controller, cover controller Named after the node ID; they have no older entities. The circadian lighting policy clears the circadian, sleep, wake and bed entities a room published before 6.0 under the same area before it announces its own, so Home Assistant can give its entities the old entity IDs. House schedule MQTT Named after the house schedule, not this node, so a replacement node keeps the same entities. Either way, the entity ID Home Assistant first gives an entity comes from the area, with - as _ . Importing or pasting a node keeps its saved settings, including its ID scheme and publishing, so an older node restored from a backup keeps its area-named entities. Only a node added from the palette starts as new. A theatre state contract added since node IDs suggests its Area to Home Assistant for its device, and Home Assistant creates an area of that name if none exists. With no area, its entity IDs come from its Display name and no area is suggested. One saved before node IDs needs an area for discovery."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "Availability and the startup message",
  "description": "Each publishing node sends a retained online once the flows have started (and again at its startup message) an",
  "url": "guide-home-assistant.html#availability",
  "text": "Each publishing node sends a retained online once the flows have started (and again at its startup message) and offline when it stops. Its Home Assistant entities follow it. With discovery on, it announces those entities at the same moments, just before online . Availability topic and startup message per node Node Availability topic Startup message room lighting controller home/<area>/lighting/availability msg.lighting = {kind: \"startup\"} circadian lighting policy home/<area>/circadian/availability msg.lighting = {kind: \"startup\"} theatre state contract <base>/availability msg.theatreStateContract = {kind: \"startup\"} occupancy fusion home/<area>/occupancy/availability msg.source = \"startup\" motion policy home/<area>/motion/availability msg.source = \"startup\" AVR controller home/<area>/receiver/availability msg.avr = {kind: \"startup\"} cover controller home/<area>/cover/<name>/availability msg.cover = {kind: \"startup\"} house schedule MQTT home/<name>/schedule/availability msg.source = \"startup\" scene home/<area>/scene/<name>/availability msg.scene = {kind: \"startup\"} Choose a Broker, so each node announces once the broker has connected. Node-RED’s MQTT broker node connects after the flows have started, and drops anything it is given before then without a warning. With a Broker, a node runs its startup each time the broker connects, reconnects included, so its announcement gets through. A node without one announces as the flows start, which is lost on a first start, a full deploy or a restart: wire a Status node whose scope is your MQTT out node into it, and it takes MQTT out’s “connected” as its startup message. The startup messages below still work when you send them yourself. Set the broker node’s birth, close and will messages. The node’s own online and offline get through only when you deploy the node on its own (“Modified nodes” or “Modified flows”) while the MQTT connection stays up. On a full deploy, a restart or a shutdown, Node-RED closes the broker connection at the same moment and reconnects afterwards. So set the MQTT broker node’s Birth message to online , and its Close message and Will message (which covers crashes) to offline , all retained, on the same topic. With several publishing nodes, the broker can cover one of them. The startup message does more than announce. The AVR controller discards stale observations and queries the receiver; the cover controller reads the cover again rather than trusting old state. Availability is not readiness. The theatre’s readiness ( unknown , available , degraded or unavailable ) is on <base>/readiness , shown as the “Readiness” sensor. <base>/availability carries only online or offline ."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "Remove entities",
  "description": "Switch discovery off to remove a node’s entities from Home Assistant at its next start. Delete the node and de",
  "url": "guide-home-assistant.html#removing",
  "text": "Switch discovery off to remove a node’s entities from Home Assistant at its next start. Delete the node and deploy with “Modified nodes” or “Modified flows”: it clears its Home Assistant entities and retained state. A full deploy (the deploy button’s default) closes the broker connection at the same moment, so the clearing never reaches the broker. Disabling a node or its flow keeps its entities, so they come back unchanged when you enable it again. To remove a node’s entities after a full deploy, or the entities of a flow you copied to another Node-RED (the copy’s nodes have new IDs, so new entities), delete the device in Home Assistant: Settings → Devices & services → Devices , open the device, then Delete . Home Assistant then clears its retained discovery entry itself. Once the flows have started, and again at its startup message, a node clears any retained topic it published before and no longer does, for example after an area, base topic, discovery prefix or target change. It remembers what it published in its node context, which lasts across deploys and restarts only with a context store. Without that record, an occupancy, motion, receiver or house schedule MQTT node that publishes state still clears its own Home Assistant entities it no longer publishes, such as after you switch discovery off; it never clears topics another node could publish. Moving an area between older room nodes. A node that never gets a startup message keeps clearing its old topics at every start. To move an area from one older room node to another, send the old node a startup message, or delete it."
 },
 {
  "title": "Use Home Assistant as the panel",
  "section": "Check the result",
  "description": "Read the outcome What you see What it means No entities appear Check that Publish is MQTT state and Home Assis",
  "url": "guide-home-assistant.html#check",
  "text": "Read the outcome What you see What it means No entities appear Check that Publish is MQTT state and Home Assistant discovery and the discovery prefix matches Home Assistant’s. With a Broker, the node announces on every connect. Without one, check the publications output reaches MQTT out, and send the startup message again: one sent before the broker connected was dropped. Entities show unavailable after a full deploy or restart The node’s own online could not get through. Set the broker node’s birth, close and will messages on its availability topic. A control in Home Assistant does nothing Choose the node’s Broker , so it reads its set topics itself, or wire an MQTT in node on them into its input. The circadian lighting policy reads them only while it publishes and the area is set; before 6.0 the room lighting controller read them, so move that MQTT in node to the policy. Entities remain after deleting a node It was removed with a full deploy. Delete the device in Home Assistant. A circadian lighting policy has no wake and bed time entities It follows a house schedule. Use the house schedule MQTT node’s entities. To watch what a node publishes, subscribe an MQTT client to its topics, or an MQTT in node wired to a Debug node. Sources: README 4.0.0 and Upgrading from 2.x notes, Covers , Room light control , Receiver volume ownership and Theatre MQTT contract ; the editor help of each publishing node; the example flows’ startup Inject nodes; lib/theatre-ha-discovery.ts and lib/ha-discovery.ts ."
 },
 {
  "title": "Connect a device",
  "description": "A device adapter sits between one device and its controller. It turns the device’s own MQTT messages into the controller’s neutral readings, and the controller’s neutral commands into messages the device understands.",
  "url": "guide-device-adapters.html",
  "text": "A device adapter sits between one device and its controller. It turns the device’s own MQTT messages into the controller’s neutral readings, and the controller’s neutral commands into messages the device understands."
 },
 {
  "title": "Connect a device",
  "section": "Before you wire it",
  "description": "The cover controller ( home-cover-controller ) is device-neutral. It sends commands as msg.cover_command = {op",
  "url": "guide-device-adapters.html#before",
  "text": "The cover controller ( home-cover-controller ) is device-neutral. It sends commands as msg.cover_command = {operation, position, requestId, generation, attempt} , where operation is set_position , stop or observe (read the cover now). An Open, close and stop only cover sends open , close , stop or observe . It expects readings back as msg.cover = {kind: \"observed\", …} and {kind: \"availability\", online} . An adapter does the translation for one kind of device, so the controller never needs to know which device it drives. With its Broker set, an adapter subscribes to its device’s topics and publishes to them itself. Pick the adapter for your device: the shelly cover node ( home-shelly-cover ) or the zigbee2mqtt cover node ( home-z2m-cover ). Have Node-RED’s MQTT broker node set up for your broker, to choose as each adapter’s Broker. Both adapters speak the device’s own MQTT messages, with no function nodes. Neither commands the device through Home Assistant. Both adapters report 0 = closed and 100 = open . If your device runs the other way, set Invert positions on the controller."
 },
 {
  "title": "Connect a device",
  "section": "Give each adapter a broker",
  "description": "Each adapter has a Broker setting: Node-RED’s MQTT broker node. With one, it subscribes to its device’s topics",
  "url": "guide-device-adapters.html#broker",
  "text": "Each adapter has a Broker setting: Node-RED’s MQTT broker node. With one, it subscribes to its device’s topics (exactly <base>/<friendly name> , its /availability and, for a light, its /set for a Zigbee2MQTT device, as a friendly name can contain / ; <prefix>/# for a Shelly) and publishes on them itself, with no MQTT in or MQTT out nodes; still wired, they change nothing. It reads its device on each connect too (a Zigbee2MQTT group excepted, as it can’t be asked), so a room or cover controller has a fresh reading after a restart without a Status node. Opening and saving a new adapter offers the first broker in your flows. An adapter saved before 6.2 keeps using its MQTT in and out nodes until you choose one: an MQTT in node on its device’s topics (output: auto-detect) into its input, and its first output to an MQTT out node on the same broker with the topic left empty. This guide’s topic tables say which topics."
 },
 {
  "title": "Connect a device",
  "section": "Wire either adapter the same way",
  "description": "Both adapters have one input and two outputs. Output 2 goes to the cover controller; output 1 is for an MQTT o",
  "url": "guide-device-adapters.html#shape",
  "text": "Both adapters have one input and two outputs. Output 2 goes to the cover controller; output 1 is for an MQTT out node, and sends nothing with a Broker. Its Broker The device’s topics ⇄ Adapter Device messages ↔ neutral messages ⇄ Cover controller Requests and confirmation Reports: the adapter reads them from the broker → controller. Commands: controller output 1 → adapter, which publishes them. Two wires for either adapter From Connect to Why Controller output 1 Adapter input Neutral device commands. Adapter output 2 Controller input Readings and availability for the controller. Anything else that reaches an adapter’s input is ignored."
 },
 {
  "title": "Connect a device",
  "section": "Wire a shelly cover",
  "description": "The shelly cover node connects a Gen2-or-later relay device in cover mode, over the device’s own MQTT API. The",
  "url": "guide-device-adapters.html#shelly-cover",
  "text": "The shelly cover node connects a Gen2-or-later relay device in cover mode, over the device’s own MQTT API. The covers guide walks through its full wiring; this is the summary. shelly cover settings Setting Default What to set MQTT topic prefix None: required The device’s topic prefix: its device ID unless a custom prefix is set on the device. It cannot contain + or # . Cover ID 0 0 , or 1 for a device’s second cover. Prepare the device. Calibrate the cover on the device. Turn MQTT on with Enable MQTT Control (the default); without it the device ignores the commands. Keep RPC status notifications on (also the default) so each change is reported. Choose its Broker. It subscribes to <prefix>/# and reads <prefix>/status/cover:<id> , change notifications on <prefix>/events/rpc , and availability on <prefix>/online . Keep the controller as a position cover. Leave Cover as “Takes a position (0 to 100)”. The adapter translates set_position , stop and observe ; it does not translate the open and close commands of an Open, close and stop only cover. No position, no guess. A cover that is not calibrated, or does not know its position, has no position to report. The controller’s command in hand fails with reason not-calibrated or position-unknown , and no position is sent to an uncalibrated cover."
 },
 {
  "title": "Connect a device",
  "section": "Wire a zigbee2mqtt cover",
  "description": "The zigbee2mqtt cover node connects a Zigbee2MQTT cover (a blind, shutter or curtain motor) over Zigbee2MQTT’s",
  "url": "guide-device-adapters.html#zigbee2mqtt",
  "text": "The zigbee2mqtt cover node connects a Zigbee2MQTT cover (a blind, shutter or curtain motor) over Zigbee2MQTT’s MQTT messages. zigbee2mqtt cover settings Setting Default What to set Base topic zigbee2mqtt Zigbee2MQTT’s base topic, unless you changed it in Zigbee2MQTT’s settings. Friendly name None: required The device’s friendly name in Zigbee2MQTT (or its IEEE address if it has none). Neither setting can contain + or # . With no Name , the node is labelled with the friendly name. zigbee2mqtt cover topics Topic Direction Carries <base>/<friendly name> Broker → adapter The device’s whole state as JSON. <base>/<friendly name>/availability Broker → adapter Online or offline. <base>/<friendly name>/set Adapter → broker Position and open, close or stop commands. <base>/<friendly name>/get Adapter → broker A request for a fresh reading, each time the broker connects and when the controller asks. Choose its Broker. It subscribes to <base>/<friendly name> and its /availability itself. Turn on availability in Zigbee2MQTT. Availability needs Zigbee2MQTT’s availability setting. Without it, the cover is taken as available. The adapter accepts {\"state\": \"online\"} or {\"state\": \"offline\"} , or plain online or offline , and turns it into {kind: \"availability\", online} . Choose the controller’s cover type. See which cover type fits below. The adapter reads each state report like this: Position comes from position , 0 closed and 100 open as Zigbee2MQTT reports by default. If yours runs the other way, set Invert positions on the controller, or the device’s invert_cover option. Motion comes from motor_state ( opening , closing , stopped ; pause reads as stopped), from moving ( UP , DOWN , STOP ), or from running when it is false (stopped). A cover that reports no motion is confirmed by the controller’s Settle time . End state , for a cover with no position, comes from Zigbee2MQTT’s OPEN or CLOSE , but only once its motion says it has stopped: before that, the state can show where it is going rather than where it is. Time : observedAt is when the report arrived, never a time the device gives. Battery and charging status are passed on as reported facts; the controller never acts on them."
 },
 {
  "title": "Connect a device",
  "section": "Choose the controller’s cover type",
  "description": "The controller’s Cover setting must match what the device reports. Which cover type fits The device Set Cover ",
  "url": "guide-device-adapters.html#cover-type",
  "text": "The controller’s Cover setting must match what the device reports. Which cover type fits The device Set Cover to How a move is confirmed Reports a position (any shelly cover; a zigbee2mqtt cover that reports position ) Takes a position (0 to 100) A stopped report at the target, or the same position for the settle time. Reports no position (a zigbee2mqtt cover with only OPEN / CLOSE ) Open, close and stop only A reported end state, or a move that ran for its Full travel time . With no motion reports either, it cannot be confirmed, and the controller says so. If a position cover receives a reading with no position, the controller’s error says: “observed cover reading has no position: for a cover that reports none, set the cover node’s Cover to \"Open, close and stop only\"”."
 },
 {
  "title": "Connect a device",
  "section": "What each adapter sends",
  "description": "You send requests such as \"open\" , 60 or \"stop\" to the controller, as in the covers guide . The controller tur",
  "url": "guide-device-adapters.html#commands",
  "text": "You send requests such as \"open\" , 60 or \"stop\" to the controller, as in the covers guide . The controller turns them into neutral commands, and the adapter sends these: Neutral command to device message Controller command shelly cover, on <prefix>/command/cover:<id> zigbee2mqtt cover set_position pos,<0-100> {\"position\": <0-100>} on …/set open Not translated {\"state\": \"OPEN\"} on …/set close Not translated {\"state\": \"CLOSE\"} on …/set stop stop {\"state\": \"STOP\"} on …/set observe status_update : the device reports a fresh status {\"position\": \"\"} on …/get , or {\"state\": \"\"} for a cover with no position Some Zigbee2MQTT devices cannot be read through …/get ; they still report their position whenever it changes. With a Broker, the adapter reads the cover each time the broker connects, so the controller has a fresh reading after a restart. To make the controller read it again yourself, send it its startup message: Inject → cover controller · read the cover again msg.cover = {kind: \"startup\"}; return msg;"
 },
 {
  "title": "Connect a device",
  "section": "Wire a shelly switch",
  "description": "The shelly switch node connects one switch channel of a Gen2-or-later relay, over the device’s own MQTT API, u",
  "url": "guide-device-adapters.html#shelly-switch",
  "text": "The shelly switch node connects one switch channel of a Gen2-or-later relay, over the device’s own MQTT API, used the way the device is set up. It reads the device’s configuration for its channel each time the broker connects and whenever the device comes online, and shows what it found in its status. shelly switch settings Setting Default What to set MQTT topic prefix None: required The device’s topic prefix: its device ID unless a custom prefix is set on the device. It cannot contain + or # . Switch ID 0 0 , or the number of another switch on a device with more than one. Use one node per switch. Mode As the device is set up Leave it to read the device’s own configuration, or set detached or relay to override it. Set it when the configuration can’t be read. Target Empty When the relay is a room light: its id in the room’s Targets JSON, marked \"onOffOnly\": true . Empty when the relay only powers smart bulbs. Choose its Broker. It subscribes to <prefix>/# and publishes to the device itself. The configuration request’s reply is addressed under the same prefix, so nothing more is needed. Detached: the switch drives the room. Without a Target, the relay stays on to power smart bulbs. Wire the adapter’s second output to a switch lighting policy : a toggle switch’s flips become edges, with the device’s status as the baseline, and a push button’s single, double or long presses become actions (the switch policy acts on single and double; long is passed on for later use). The relay is never commanded, and a relay that reports off is flagged in the status: the bulbs have lost power. Any other mode: the relay is the light. The adapter reports the relay’s on/off state on its second output, with whether a person changed it at the switch, and takes on and off. With a Target: the relay is a room light, in either mode. Wire the room controller’s second output (its light commands) into the adapter, and the adapter’s third output back into the room. The room’s ON and OFF for the Target switch the relay, and its state comes back as the room’s readings, with a change nobody here asked for (a person at a switch the relay follows, the Shelly app) as a person’s. Detached, the presses still go to the switch policy on the second output. See As a room light . No configuration, no guess. If the device doesn’t answer within 10 seconds, the status says configuration unreadable: set Mode , and nothing is passed on until the Mode setting says how."
 },
 {
  "title": "Connect a device",
  "section": "Wire a wled backlight",
  "description": "The wled node connects a WLED light strip behind a TV to a backlighting controller , over WLED’s own MQTT: the",
  "url": "guide-device-adapters.html#wled",
  "text": "The wled node connects a WLED light strip behind a TV to a backlighting controller , over WLED’s own MQTT: the controller’s on and off become WLED’s ON and OFF , and the brightness WLED reports after every change becomes its readings (0 is off). Turn on MQTT in WLED. Under Config → Sync Interfaces → MQTT, set your broker and note the Device Topic (WLED’s default is wled/ and its MAC address). Add a wled node. Choose its Broker and set Device topic to WLED’s. It subscribes to <device topic>/g and /status itself. Wire it to the controller both ways. The backlighting controller’s first output into the wled node; the wled node’s output back into the controller. WLED doesn’t say who changed it, so switching it from its own app reads as a manual change, as it should. On the firmware we tested it keeps none of its state retained and can’t be asked for it over MQTT (WLED’s documentation doesn’t say either way): it publishes only when it changes. So after a Node-RED restart the backlight has no reading until it next changes. Full reference: WLED ."
 },
 {
  "title": "Connect a device",
  "section": "Wire a zigbee2mqtt light",
  "description": "The zigbee2mqtt light node connects one Zigbee2MQTT light, or a Zigbee2MQTT group, to a room lighting controll",
  "url": "guide-device-adapters.html#zigbee2mqtt-light",
  "text": "The zigbee2mqtt light node connects one Zigbee2MQTT light, or a Zigbee2MQTT group, to a room lighting controller : the room’s neutral commands become Zigbee2MQTT’s /set messages, exactly as the room sent them before 6.0, and the light’s reports become readings. Use one per light in the room’s Targets JSON. zigbee2mqtt light settings Setting Default What to set Target None: required The light’s id in the room’s Targets JSON. Base topic zigbee2mqtt Zigbee2MQTT’s base topic. Friendly name None: required The light’s or group’s name in Zigbee2MQTT. Zigbee2MQTT group Off On for a group. Choose its Broker. It subscribes to the light’s state, its /set topic (to see other people’s commands) and its availability, publishes the room’s commands, and reads the light each time the broker connects. Wire it to the room both ways. The room’s second output (light commands) into the adapter; the adapter’s second output (readings) back into the room. One wire from the room can feed every light’s adapter. A group takes the same commands; Zigbee2MQTT works out its state from what it sent and its members’ reports. A group has no availability and can’t be asked to report. Each light’s availability is shown on its control state and in the room’s status, and changes nothing. A 5.x room’s dialog can create these nodes for its old targets: see the room controller . Full reference: Zigbee2MQTT light ."
 },
 {
  "title": "Connect a device",
  "section": "Choose an adapter",
  "description": "shelly cover A Gen2-or-later relay device in cover mode, calibrated on the device. Position covers only. It su",
  "url": "guide-device-adapters.html#choose",
  "text": "shelly cover A Gen2-or-later relay device in cover mode, calibrated on the device. Position covers only. It subscribes to <prefix>/# . zigbee2mqtt cover A Zigbee cover paired with Zigbee2MQTT. Position covers, or open, close and stop only. It subscribes to the device topic and its availability. zigbee2mqtt light A Zigbee light or group paired with Zigbee2MQTT, for a room lighting controller. It subscribes to the light’s state, /set and availability. shelly switch A Gen2-or-later relay behind a wall switch: in detached mode, the switch’s presses for the switch policy; otherwise, the relay as the light. It subscribes to <prefix>/# . wled A WLED strip as a TV backlight, for a backlighting controller: on and off. It subscribes to its device topic’s /g and /status . For any other device, the controller’s neutral commands and readings are the contract to map to; for a light, the room’s neutral light contract ."
 },
 {
  "title": "Connect a device",
  "section": "Check the result",
  "description": "Wire controller output 2 to a Debug node, then watch the adapter’s node status as well. Read the outcome What ",
  "url": "guide-device-adapters.html#check",
  "text": "Wire controller output 2 to a Debug node, then watch the adapter’s node status as well. Read the outcome What you see What it means Adapter status “waiting for the device” No device message has arrived yet. Check its Broker, and the prefix or friendly name. shelly cover status The cover’s last state and position. zigbee2mqtt cover status as a position (such as 60% ), an end state, or a motion with a position Reports are arriving and being read. zigbee2mqtt cover status “online” / “offline” The last message was an availability report. Controller result not-calibrated / position-unknown A shelly cover cannot provide a usable position. Calibrate it on the device. Controller result unavailable The device is offline. No command is sent; it is read again when it returns. Controller error “observed cover reading has no position” A zigbee2mqtt cover reports no position: set the controller’s Cover to Open, close and stop only . No command reaches the device Check the adapter’s Broker (without one, that the MQTT out node has no topic set and uses the same broker). For a shelly cover, check Enable MQTT Control ; for a zigbee2mqtt cover, check the base topic and friendly name. Importable examples are in the package’s examples folder ( Import → Examples in the editor): Shelly cover.json wires a shelly cover, and Cover control.json wires a zigbee2mqtt cover. Each uses one broker config node, “your MQTT broker”, whose host you set. See also the README Covers section and the cover controller reference . Sources: README Covers; shelly cover, zigbee2mqtt cover and cover controller editor help; the Shelly cover and Cover control example flows."
 },
 {
  "title": "Room lighting controller",
  "description": "Message shapes, output and settings for the node that owns one room's lights. It turns intents into light commands, tracks who controls each light, and applies the style it is sent.",
  "url": "node-room-controller.html",
  "text": "Message shapes, output and settings for the node that owns one room's lights. It turns intents into light commands, tracks who controls each light, and applies the style it is sent."
 },
 {
  "title": "Room lighting controller",
  "section": "One room. One owner of its light commands.",
  "description": "The room lighting controller turns intents from policies (motion, wall switches, activities) into light comman",
  "url": "node-room-controller.html#summary",
  "text": "The room lighting controller turns intents from policies (motion, wall switches, activities) into light commands, keeps track of who controls each light, and styles the lights it controls with the style it is sent. In the palette it is room lighting controller ( home-room-lighting-controller ); on the canvas it shows its name, or “<area> lighting controller”. A room without a circadian lighting policy styles nothing: its lights just go on and off. Looking for wiring? Follow Room lighting for a working room, and Motion and occupancy for the motion path into it."
 },
 {
  "title": "Room lighting controller",
  "section": "Inputs",
  "description": "Policies send msg.lighting . Each light’s reports, and other people’s commands on it, arrive from its adapter ",
  "url": "node-room-controller.html#inputs",
  "text": "Policies send msg.lighting . Each light’s reports, and other people’s commands on it, arrive from its adapter (such as a zigbee2mqtt light ) as msg.light readings: see the neutral light contract . A raw MQTT message is ignored. Input messages Message Fields Meaning lighting.kind = \"intent\" state , targets , values , owner , preserveManual , manual , person state ON, OFF or TOGGLE for targets (default: all), with optional values : brightnessPct 0-100, colorTempKelvin , and other fields such as effect passed on as they are. With preserveManual: true , manual lights are skipped. lighting.owner string On an intent, holds its targets on or off for this owner: they are overridden until it releases them. A newer owner goes on top. See owners stack . lighting.area string On an intent or release, the room it is for: acted on only when it matches this room’s Area (compared as in topics), so a scene wired to several rooms reaches only its own lights. Without it, as before: any room it reaches. lighting.kind = \"release\" targets , owner Lets go of overridden targets (default: all) for owner , or for every owner without one. A light goes to the owner beneath, or with none left back to what it was before the first. lighting.kind = \"style\" values , transitionSeconds , until How lights should look, usually from a circadian lighting policy. values is {brightnessPct, colorTempKelvin} or null . msg.light readings kind , target , and the reading’s fields From each light’s adapter: its reports, other people’s commands on it, its availability, and its answers to restyles. See the neutral light contract . lighting.kind = \"startup\" None Asks each light for a reading ( observe on output 2) and, with publishing on, announces the room’s state and discovery again. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.lighting = {kind: \"startup\"} ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. Intent with an owner · msg.lighting { kind: \"intent\", targets: [\"wall\", \"lamp\"], state: \"ON\", source: \"activity\", owner: \"theatre\", values: {brightnessPct: 25, colorTempKelvin: 2500}, preserveManual: true } brightnessPct: 0 is the dimmest the light goes, not off: send state: \"OFF\" to switch it off. A value that isn’t a number, or a colour temperature of 0 or less, is left out with a warning. Zigbee2MQTT’s own brightness and color_temp were removed in 6.0: they are left out with a warning once per deploy. Circadian, sleep and schedule messages go to the circadian lighting policy since 6.0; the room ignores them, with a warning."
 },
 {
  "title": "Room lighting controller",
  "section": "Outputs",
  "description": "Output messages Port Message Connect to 1 · Publications With publishing on, the retained control state (with ",
  "url": "node-room-controller.html#outputs",
  "text": "Output messages Port Message Connect to 1 · Publications With publishing on, the retained control state (with available once a light’s adapter has reported it), availability and discovery topics below. MQTT out. Flows that filter this output by topic must pass the /control topics through. 2 · Light commands msg.light = {kind: \"command\", target, state, brightnessPct?, colorTempKelvin?, transitionSeconds?, extra?, restyle?, source, id} , and {kind: \"observe\", target} at its startup message. Every light’s adapter; each acts only on its own target. 3 · Light readings Each light’s observed reading, passed on with control and manual . Activity lighting, if any. Don’t rewrite the lights’ commands. Each light’s adapter watches the light’s command path to tell the room’s commands from other people’s, so a function that rewrites them on the way makes them look like someone else’s. A bare ON or OFF that arrives within 5 seconds of one of the room’s commands with that power, before that command has come back, is taken as that command (the room traces mutated-own-command ), and the room restyles a light after someone else’s bare ON at most once every 5 seconds."
 },
 {
  "title": "Room lighting controller",
  "section": "The neutral light contract",
  "description": "The room speaks to each light through an adapter on msg.light : commands out (port 2), readings in. The zigbee",
  "url": "node-room-controller.html#light-contract",
  "text": "The room speaks to each light through an adapter on msg.light : commands out (port 2), readings in. The zigbee2mqtt light node is one adapter; any flow that answers the same messages works in its place, for a light that isn’t Zigbee2MQTT’s. Values are brightness in percent and colour temperature in kelvin, and every message names the light’s target id. Readings an adapter sends the room Reading Fields When observed on , brightnessPct? , colorTempKelvin? , fields (what it reports at all: brightness , colorTemp ), showsLast (it shows exactly the last command sent to it), observedAt Whenever the light reports. external state (ON, OFF, TOGGLE or empty), setsValues , observedAt Someone else’s command on the light. With setsValues , the room takes it as a person’s change. echo-changed id (or null ), state One of the room’s commands seen again, changed on the way: never someone else’s. skipped / sent id (and for skipped , observedAt of its last report) The answer to every restyle command: skip it only when the light already shows it. availability online Whether the light is reachable: shown, never acted on. An adapter judges equality in its device’s own units; the room never compares values. One that can’t ask its light for a reading ignores observe . The README’s Neutral light contract has every message in full."
 },
 {
  "title": "Room lighting controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default M",
  "url": "node-room-controller.html#settings",
  "text": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label; a new palette node starts unnamed. Area area · string Empty Needed only when publishing state or discovery, and then with a letter or digit. Topics and IDs use it in lowercase, with anything but letters, digits, _ and - as _ . Publish homeAssistant · enum Don’t publish, for a new node Don’t publish ( off ); MQTT state ( state ): each light’s control state and the room’s availability as retained MQTT topics, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and a control sensor for each light announced to Home Assistant, which reads that state. It replaced two settings, Publish state over MQTT ( publishState ) and Home Assistant discovery ( discovery ): a room saved before reads off/off as Don’t publish, on/off as MQTT state and on/on as MQTT state and Home Assistant discovery, and one that never set them keeps publishing both, as before. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which the room publishes itself (see MQTT and Home Assistant ). Needed for a room that publishes, unless it is Don’t publish; the editor shows a new room as needing one until it is chosen. Opening and saving the room offers the first broker in your flows. A room saved before 6.2 that publishes keeps publishing through output 1, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, the room publishes through output 1. Display name displayName · string Empty The name Home Assistant shows for the room’s device (“<display name> Lighting Controller”) and its control sensors. Empty uses the area. Discovery prefix discoveryPrefix · string homeassistant The topic prefix Home Assistant listens on for discovery. Targets JSON targets · JSON [] A JSON list of lights, each {\"id\"} : the name its adapter’s Target and the policies use. Add \"onOffOnly\": true for a light that only switches on and off: it is never sent brightness, colour or a transition. Turn-on transition seconds initialTransitionSeconds · number 1 The transition for a light switched on, styled or with an intent’s values. New nodes use node-based Home Assistant identifiers ( idScheme = \"node\" ), so renaming the area keeps the entities; a node saved before that setting keeps its area-named entities. That internal marker is set when a node is added from the palette; it is not an editor setting."
 },
 {
  "title": "Room lighting controller",
  "section": "Settings from before 6.0",
  "description": "A 5.x room’s Targets JSON named each light’s Zigbee2MQTT topics ( stateTopic , commandTopic ), which move to a",
  "url": "node-room-controller.html#before-6",
  "text": "A 5.x room’s Targets JSON named each light’s Zigbee2MQTT topics ( stateTopic , commandTopic ), which move to a zigbee2mqtt light per light; its dialog lists them and can create the light nodes, and saving keeps only each light’s id. Circadian lighting moved to the circadian lighting policy in 6.0. The room keeps its old circadian settings only to carry them to that migration, with no form rows: maxBrightnessPct , maxColorTempKelvin , sleepBrightnessPct , sleepColorTempKelvin , refreshTransitionSeconds , refreshSeconds , initialSleep , wakeTime , bedTime and houseSchedule . A room that still has any of them, or a target with topics, is an invalid configuration, and its lights don’t respond, until it is migrated. Its edit dialog lists the old values; add a circadian lighting policy wired to the room with those values, then save the room’s dialog, which clears them. A room that should stay unstyled needs only the save. See the 6.0.0 upgrade notes ."
 },
 {
  "title": "Room lighting controller",
  "section": "Control state",
  "description": "Each target has one control state. in-control : the room styles the light with the style it is sent. This is t",
  "url": "node-room-controller.html#control-state",
  "text": "Each target has one control state. in-control : the room styles the light with the style it is sent. This is the default. overridden : another owner, such as an activity or a scene, holds the light on or off. Styles and owner-less intents leave it alone until it is released. manual : a person set the light: an intent with manual: true (a wall switch’s double press), or someone else’s command on it with values, as its adapter reports it. An intent’s values alone don’t make a light manual. Switching circadian lighting on returns manual lights to in-control. An overridden light changes only for an intent with an owner (its own, or a newer owner who takes it over), a person ( manual: true , person: true , someone else’s command on the light as its adapter reports it, or a change seen at the light), or a release. Any other intent, including motion ON or OFF, leaves it alone and is traced as ignored held-by . A person switching a held light off returns it to in-control; a person switching on a light an owner holds off makes it manual. Either way it leaves every owner, and their later releases leave it alone. Owners stack The first owner to take a light records what it was: its control state, whether it was on, and the brightness and colour temperature it last reported. A newer owner goes on top and sets the light; the owner beneath keeps its own request, and sending again updates it without changing the light. The owners, and what each light was, are kept with the room’s state, so they survive a redeploy with a context store. Releasing the owner on top hands the light to the owner beneath, with what that owner last asked for. Releasing an owner beneath a newer one just drops it; the light is left as it is. When the last owner lets go (or on a release without owner ), the light goes back to what was recorded. A light the room was running is the room’s again, on or off as it was: on, it takes the room’s style as it is now. A light that was off goes off. A light a person had set gets the values it last reported, and stays manual. A motion OFF intent carries vacantSince , so a light a person set after the room went vacant stays on. Control states are kept in the node’s context. When the node starts with nothing saved (its first deploy, or a redeploy or restart without a context store), it leaves every light as it is until an intent names it, someone switches it on with a bare ON, or circadian lighting is switched on. See the recommended context store ."
 },
 {
  "title": "Room lighting controller",
  "section": "Style",
  "description": "The room keeps the latest style it was sent and uses it when a light it controls comes on with no values given",
  "url": "node-room-controller.html#style",
  "text": "The room keeps the latest style it was sent and uses it when a light it controls comes on with no values given (a motion ON, a wall-switch press), on each new style for lights that are on, after someone else’s bare ON, and when the last owner releases a light the room was running. A style never switches a light on or off and never reaches a light that an owner holds or a person set. With no style, or once a style has run out ( until ), the lights just go on and off. Style · msg.lighting { kind: \"style\", values: {brightnessPct, colorTempKelvin} | null, transitionSeconds, until }"
 },
 {
  "title": "Room lighting controller",
  "section": "Optional MQTT and Home Assistant",
  "description": "New nodes start with Don’t publish . Otherwise, topics are named after the Area : Guest Room publishes under h",
  "url": "node-room-controller.html#publishing",
  "text": "New nodes start with Don’t publish . Otherwise, topics are named after the Area : Guest Room publishes under home/guest_room/… . With a Broker , the room publishes itself, through Node-RED’s MQTT broker node: no MQTT out on output 1 and no Status node are needed, and both can be deleted. Each time the broker connects, reconnects included, and each time Home Assistant comes back ( online on <prefix>/status , its birth message), the room clears what it no longer publishes and announces everything again: its entities, its availability and every light’s control state. So entities come back by themselves after a broker or Home Assistant restart. Output 1 sends nothing, so an MQTT out still wired to it goes quiet, and a Status node still wired in is ignored, with a trace. As it stops, it sends offline ; deleted, it clears what it published. Without a Broker , everything below goes out on output 1, as before. Published topics Topic Retained Payload home/<area>/lighting/<target>/control Yes {\"state\": \"in-control\" | \"overridden\" | \"manual\", \"owner\": string | null, \"available\"?: boolean} , at startup and whenever a target’s control state or availability changes. available appears once the light’s adapter has reported it. home/<area>/lighting/availability Yes online once the flows start, offline as it stops. The availability messages get through only when this node is stopped on its own, so set the MQTT broker node’s Birth, Close and Will messages to the same. With discovery on, Home Assistant gets a diagnostic sensor per light showing its control state, with the owner as an attribute. The entities are announced once the flows start, before online , and again at the startup message; switching discovery off removes them at the next startup message. At every start the room also clears the circadian, sleep, wake and bed entities it published before 6.0. Home Assistant shows state here; the room never commands lights through it. See Home Assistant ."
 },
 {
  "title": "Room lighting controller",
  "section": "Status",
  "description": "The node status reads styled or unstyled , then how many lights are on, how many are manual, how many are over",
  "url": "node-room-controller.html#status",
  "text": "The node status reads styled or unstyled , then how many lights are on, how many are manual, how many are overridden when any are, and how many lights are offline when any are (as their adapters report), for example styled · 2 on · 0 manual · 1 offline . The dot is yellow while any light is manual, green while styled, and grey otherwise."
 },
 {
  "title": "Circadian lighting policy",
  "description": "Message shapes, outputs and settings for the node that works out how lights should look over the day and sends it to room lighting controllers as a style.",
  "url": "node-circadian-policy.html",
  "text": "Message shapes, outputs and settings for the node that works out how lights should look over the day and sends it to room lighting controllers as a style."
 },
 {
  "title": "Circadian lighting policy",
  "section": "A style for the day, not a light command.",
  "description": "The circadian lighting policy works out a brightness and colour temperature for lights that nobody has set oth",
  "url": "node-circadian-policy.html#summary",
  "text": "The circadian lighting policy works out a brightness and colour temperature for lights that nobody has set otherwise, and sends it to room lighting controllers as a style . In the palette it is circadian lighting policy ( home-circadian-lighting-policy ); on the canvas it shows its name, or “<area> circadian lighting”. The lights rise to the daytime level over the hour after waking, stay there through the day, and wind down to the sleep levels over the three hours before bed. Sleep mode holds the sleep levels whatever the time. Times are the Node-RED host’s local time. One policy can style several rooms, or each area can have its own. Looking for wiring? Follow Room lighting to wire it into a room, and House schedule to share wake and bed times between rooms."
 },
 {
  "title": "Circadian lighting policy",
  "section": "Inputs",
  "description": "Changes arrive as msg.lighting , or as MQTT set topics while it publishes (with a Broker , read from the broke",
  "url": "node-circadian-policy.html#inputs",
  "text": "Changes arrive as msg.lighting , or as MQTT set topics while it publishes (with a Broker , read from the broker itself). Input messages Message Fields Meaning lighting.kind = \"circadian\" or \"sleep\" enabled true or false switches circadian lighting or sleep. Any other value, such as \"on\" , is refused: nothing changes, and the node logs a warning once per deploy and shows it on its status. lighting.kind = \"schedule\" wakeTime , bedTime \"HH:MM\" , either alone. With its own times, a time set this way lasts until a deploy gives the node a different setting for it. While following a house schedule, it is replaced at the house’s next change and at every flow start. lighting.kind = \"startup\" None Sends the style, and with publishing on, its availability, state and discovery. Send it a few seconds after the flows start, as the examples do. topic = home/<area>/circadian/set , home/<area>/sleep/set ON or OFF As the circadian and sleep messages above. Read only while it publishes. Retained messages and other payloads are ignored. topic = home/<area>/wake-time/set or bed-time/set A time A time from Home Assistant, with its own times only. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.lighting = {kind: \"startup\"} ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. Switching circadian lighting on takes back the lights a person set, even when it is already on, so a flow can send it to bring lights back into step."
 },
 {
  "title": "Circadian lighting policy",
  "section": "Outputs",
  "description": "The port order is fixed. Two output ports Port Message Connect to 1 · Style msg.lighting = {kind: \"style\", sou",
  "url": "node-circadian-policy.html#outputs",
  "text": "The port order is fixed. Two output ports Port Message Connect to 1 · Style msg.lighting = {kind: \"style\", source: \"circadian\", values: {brightnessPct, colorTempKelvin} | null, transitionSeconds, until, takeBack?} One or more room lighting controllers . 2 · Publications Availability, circadian and sleep state, its own wake and bed times, and discovery. An MQTT out node with no topic set. It sends a style once the flows start, every Restyle interval , at its startup message, and at once when circadian lighting is switched, or while it is on, when sleep or the times change. Each style lasts three intervals: if the policy stops (deleted, disabled, or its flow stopped), rooms stop styling soon after. Deleted with a modified deploy, it tells rooms at once. While circadian lighting is off it sends a style with no values, and rooms style nothing; sleep and time changes then send no style of their own. A style is not a request to change a light. It never switches a light on or off, and never reaches a light that an owner (such as an activity) holds or a person set."
 },
 {
  "title": "Circadian lighting policy",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Transition and interval values are in seconds . Editor settings",
  "url": "node-circadian-policy.html#settings",
  "text": "Defaults below are from the editor definition. Transition and interval values are in seconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Schedule houseSchedule · config node None A house schedule, so several rooms share one wake and bed time; none uses its own Wake time and Bed time . Following a house, it has no time entities of its own: the house schedule MQTT node offers them. Wake time wakeTime · HH:MM 07:00 Its own wake time, without a schedule. Bed time bedTime · HH:MM 23:00 Its own bed time, without a schedule. Daytime brightness % maxBrightnessPct · number 100 Brightness at full day. Daytime kelvin maxColorTempKelvin · number 6500 Colour temperature at full day. Sleep brightness % sleepBrightnessPct · number 1 Brightness in sleep. Sleep kelvin sleepColorTempKelvin · number 2200 Colour temperature in sleep. Restyle transition (s) refreshTransitionSeconds · number 60 How long a room takes to move a light that is on to a new style. A light turning on uses the room’s own transition. Restyle interval (s) refreshSeconds · number 60 How often it sends its style, at least 10 seconds. Start in sleep mode initialSleep · boolean false Starts with sleep on. Area area · string Empty Needed when publishing, and then with a letter or digit; topics are made from it. Publish homeAssistant · enum Don’t publish Don’t publish ( off ); MQTT state ( state ): its circadian and sleep switches’ state, its wake and bed times and its availability, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and its switches and time entities announced to Home Assistant, which read that state. It replaced Publish state over MQTT ( publishState ) and Home Assistant discovery ( discovery ): a node saved before reads off/off as Don’t publish, on/off as MQTT state and on/on as MQTT state and Home Assistant discovery. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which it publishes and reads its set topics itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 2 and an MQTT in on its set topics are then no longer needed. Needed unless Publish is Don’t publish; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 2, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 2. Discovery prefix discoveryPrefix · string homeassistant The topic prefix Home Assistant listens on for discovery. New nodes name their Home Assistant entities after the node ( idScheme = \"node\" ). That internal marker is not an editor setting."
 },
 {
  "title": "Circadian lighting policy",
  "section": "Optional MQTT and Home Assistant",
  "description": "Publishing is off unless switched on. The topics keep the names the room controller used before 6.0, so a flow",
  "url": "node-circadian-policy.html#publishing",
  "text": "Publishing is off unless switched on. The topics keep the names the room controller used before 6.0, so a flow already writing home/<area>/circadian/set keeps working when this node has that area. Subscribe an MQTT in node to home/<area>/+/set and wire it into the policy to cover all four set topics. Published topics and incoming requests Topic Direction Payload home/<area>/circadian/availability Output 2 Availability. home/<area>/circadian/state , …/set Output 2 / MQTT in ON or OFF . home/<area>/sleep/state , …/set Output 2 / MQTT in ON or OFF . home/<area>/wake-time/state , …/set Output 2 / MQTT in HH:MM:SS , with its own times only. home/<area>/bed-time/state , …/set Output 2 / MQTT in HH:MM:SS , with its own times only. With both settings on, Home Assistant shows Circadian lighting and Sleep switches and, with its own times, Wake time and Bed time, on the policy’s own device. Before announcing, it clears the circadian entities older room controllers in its area published, migrated or not, in the same batch, so Home Assistant can give the new ones the same entity IDs. See Home Assistant ."
 },
 {
  "title": "Circadian lighting policy",
  "section": "Status",
  "description": "While styling, a green dot shows day or sleep with the current brightness and kelvin, for example day · 100% 6",
  "url": "node-circadian-policy.html#status",
  "text": "While styling, a green dot shows day or sleep with the current brightness and kelvin, for example day · 100% 6500K . With circadian lighting off, a grey dot shows off . When its chosen house schedule is missing, the status adds schedule missing: own times . A refused enable value shows a yellow ring, refused <source> <value>: send true or false , and nothing changes."
 },
 {
  "title": "Motion lighting policy",
  "description": "Message shapes, outputs and settings for the node that turns occupancy and light level into lighting intents for a room.",
  "url": "node-motion-policy.html",
  "text": "Message shapes, outputs and settings for the node that turns occupancy and light level into lighting intents for a room."
 },
 {
  "title": "Motion lighting policy",
  "section": "Lights on when occupied and dark. Off once vacant.",
  "description": "The motion lighting policy turns normalised occupancy, illuminance and enable-state events into msg.lighting i",
  "url": "node-motion-policy.html#summary",
  "text": "The motion lighting policy turns normalised occupancy, illuminance and enable-state events into msg.lighting intents: ON when the room is occupied and the light level is at or below the lux cutoff (or no level has been reported yet), and OFF once it has been vacant for the vacancy time. In the palette it is motion lighting policy ( home-motion-lighting-policy ); on the canvas it shows its name, or “<area> motion policy”. Wall switches go to the switch lighting policy, not here; switch messages sent to this node are ignored. Looking for wiring? Follow Motion and occupancy for the sensor path, and Room lighting for the room it feeds."
 },
 {
  "title": "Motion lighting policy",
  "section": "Inputs",
  "description": "Each message names its kind in msg.source . Input messages msg.source Value Meaning occupancy msg.payload.occu",
  "url": "node-motion-policy.html#inputs",
  "text": "Each message names its kind in msg.source . Input messages msg.source Value Meaning occupancy msg.payload.occupied From the occupancy fusion node. illuminance lux The light level. Lights switch on at or below the cutoff, and also before any level has been reported. light msg.payload.state , an object or JSON string A light’s report. A state of OFF cancels a pending vacancy timer; anything else is ignored. area-enabled true / false Enables this node’s motion lighting. Any other value, such as \"ON\" (accepted before 6.0), is refused: nothing changes, and the node logs a warning once per deploy and shows it on its status. global-enabled true / false Enables motion lighting for every motion node. Refused values as for area-enabled . delay seconds A new vacancy time, in the same unit as Vacancy seconds . illuminance-cut-off lux A new lux cutoff. pause true / false , with msg.owner true pauses motion lighting and false releases it, for the owner in msg.owner (for example a cover’s name), which is required. A pause lasts at most the Maximum pause unless sent again. startup None Announces its publications again. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.source = \"startup\" ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. Motion lighting acts only while no owner holds a pause, and a pause cancels a pending vacancy timer, as switching it off does. A vacancy while paused or switched off isn’t forgotten: when motion resumes (every pause released or run out, and both enables on) in a room still vacant, the vacancy timer starts then, and the off intent’s vacantSince is when the room went vacant. A pause never changes the enables, which are the user’s own: wire a cover’s moving output here to pause motion while it moves. A delay or illuminance-cut-off message overrides the setting, and lasts across restarts until a deploy gives the node a different Vacancy seconds or Lux cutoff , which then applies. Lasting across a redeploy or restart needs a context store ."
 },
 {
  "title": "Motion lighting policy",
  "section": "Outputs",
  "description": "The port order is fixed. Two output ports Port Message Connect to 1 · Lighting intents msg.lighting = {kind: \"",
  "url": "node-motion-policy.html#outputs",
  "text": "The port order is fixed. Two output ports Port Message Connect to 1 · Lighting intents msg.lighting = {kind: \"intent\", targets, state, source} : ON for ON targets , OFF for OFF targets . The OFF intent carries vacantSince . The room lighting controller . 2 · MQTT publications State, availability and discovery, when publishing is on. An MQTT out node. Because the OFF intent carries vacantSince , the room lighting controller keeps any light a person set after the room went vacant."
 },
 {
  "title": "Motion lighting policy",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default M",
  "url": "node-motion-policy.html#settings",
  "text": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label; a new palette node starts unnamed. Area area · string Empty Needed when publishing, and then with a letter or digit; topics and IDs are made from it. ON targets onTargets · JSON [\"main\"] A JSON array of the room’s target names to switch on. OFF targets offTargets · JSON [\"main\"] A JSON array of the room’s target names to switch off once vacant. Vacancy seconds defaultDelaySeconds · number 120 How long the room must be vacant before the OFF intent. Lux cutoff defaultIlluminanceCutoff · number 10 Occupancy switches the lights on when the light level is at or below this, or before any level is reported. Maximum pause (s) maxPauseSeconds · number 600 How long a pause lasts unless renewed, at least 1, so a lost release can’t stop motion lighting for good. Publish homeAssistant · enum Don’t publish Don’t publish ( off ); MQTT state ( state ): its enable, delay and availability, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and a motion lighting switch and a vacancy delay number announced to Home Assistant, which read that state. It replaced Publish state over MQTT ( publishState ) and Home Assistant discovery ( discovery ): a node saved before reads off/off as Don’t publish, on/off as MQTT state and on/on as MQTT state and Home Assistant discovery. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which it publishes and reads its set topics itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 2 and an MQTT in on its set topics are then no longer needed. Needed unless Publish is Don’t publish; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 2, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 2. Discovery prefix discoveryPrefix · string homeassistant The topic prefix Home Assistant listens on for discovery. New nodes name their Home Assistant entities after the node ( idScheme = \"node\" ); motion has no older entities, so not set also means node. That internal marker is set when a node is added from the palette; it is not an editor setting."
 },
 {
  "title": "Motion lighting policy",
  "section": "Optional MQTT and Home Assistant",
  "description": "Off unless switched on, and then named after the Area . Publications go on output 2. Wire an MQTT in node on h",
  "url": "node-motion-policy.html#publishing",
  "text": "Off unless switched on, and then named after the Area . Publications go on output 2. Wire an MQTT in node on home/<area>/motion/+/set into this node. Published state and incoming requests Topic Direction Payload home/<area>/motion/enabled/state Output 2 · retained ON or OFF : this node’s enable. home/<area>/motion/delay/state Output 2 · retained The vacancy delay in seconds. home/<area>/motion/availability Output 2 online or offline . home/<area>/motion/enabled/set MQTT in → policy ON or OFF , as area-enabled . Retained messages are ignored. home/<area>/motion/delay/set MQTT in → policy A delay of 0 to 86400 seconds, as delay . The shared global-enabled is not published, and the switch shows this node’s enable only, so motion can still be off everywhere while it shows on. The node announces itself once the flows have started, and again on msg.source = \"startup\" . See Home Assistant ."
 },
 {
  "title": "Motion lighting policy",
  "section": "Status",
  "description": "The status reads enabled while motion lighting can act; otherwise paused while any owner holds a pause, even i",
  "url": "node-motion-policy.html#status",
  "text": "The status reads enabled while motion lighting can act; otherwise paused while any owner holds a pause, even if it is also switched off, and disabled when it is only switched off. Then come the last light level ( lux ? before one is reported) and the vacancy delay, for example enabled · 4 lux · 120s . The dot is green while enabled and grey otherwise. A refused enable value shows a yellow ring, refused <source> <value>: send true or false ."
 },
 {
  "title": "Motion lighting policy",
  "section": "After a restart",
  "description": "When the node starts with nothing saved (its first deploy, or a redeploy or restart without a context store), ",
  "url": "node-motion-policy.html#restart",
  "text": "When the node starts with nothing saved (its first deploy, or a redeploy or restart without a context store), it doesn’t know whether the room is occupied, so it counts the room as vacant from then: unless occupancy is reported within Vacancy seconds , it sends its OFF intent. Someone sitting still in a lit room has the lights switched off after the delay unless motion is seen. With a context store, a running off-timer carries on instead."
 },
 {
  "title": "Occupancy fusion",
  "description": "Message shapes, output ports and settings for the node that turns PIR motion, and optionally presence, into one occupancy signal. Motion establishes occupancy; presence can only hold it.",
  "url": "node-occupancy-fusion.html",
  "text": "Message shapes, output ports and settings for the node that turns PIR motion, and optionally presence, into one occupancy signal. Motion establishes occupancy; presence can only hold it."
 },
 {
  "title": "Occupancy fusion",
  "section": "Motion establishes. Presence holds.",
  "description": "Combines normalised motion and optional presence events into one occupancy event, msg.source = \"occupancy\" , f",
  "url": "node-occupancy-fusion.html#summary",
  "text": "Combines normalised motion and optional presence events into one occupancy event, msg.source = \"occupancy\" , for the motion lighting policy. In the palette it is home-occupancy-fusion ; on the canvas it shows its name, or “<area> occupancy”, or “occupancy”. A PIR sensor establishes occupancy. A presence sensor (such as mmWave) can keep an established occupancy going while motion is clear, but it cannot establish occupancy by itself. Looking for wiring? Follow Light a room from motion for the sensor connections and the motion lighting policy after it."
 },
 {
  "title": "Occupancy fusion",
  "section": "Inputs",
  "description": "Each message names its sensor in msg.source . Other sources are ignored. Input messages msg.source msg.payload",
  "url": "node-occupancy-fusion.html#inputs",
  "text": "Each message names its sensor in msg.source . Other sources are ignored. Input messages msg.source msg.payload Effect \"motion\" A boolean, a string, or an object with motion , occupancy or active Motion on makes the area occupied. Motion off makes it vacant unless a held presence keeps it. \"presence\" A boolean, a string, or an object with presence , occupancy or active Only with Presence sensor set to hold. Presence on holds occupancy that motion established; presence off with motion off makes the area vacant. \"startup\" Any Announce the MQTT publications again, as after the broker reconnects. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.source = \"startup\" ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. Strings read as on: on , true , occupied , active , detected . Strings read as off: off , false , clear , inactive , not_detected . Case does not matter; anything else is ignored. Motion from a sensor · msg { source: \"motion\", payload: {motion: true} }"
 },
 {
  "title": "Occupancy fusion",
  "section": "Outputs",
  "description": "The port order is fixed. Two output ports Port Message Connect to 1 · Occupancy events msg.source = \"occupancy",
  "url": "node-occupancy-fusion.html#outputs",
  "text": "The port order is fixed. Two output ports Port Message Connect to 1 · Occupancy events msg.source = \"occupancy\" , msg.payload = {kind: \"occupancy\", occupied, trigger, reason, sources} . Sent on motion and presence edges, as below. The motion lighting policy’s input. 2 · MQTT publications Retained state, availability and discovery messages, when publishing is on. An MQTT out node. occupied: true on every motion edge from off (or unknown) to on, even when a held presence already kept the area occupied. occupied: false when motion goes off with no presence holding, or presence goes off with motion off, if that sensor was on or not yet known, or the area was occupied. So the first off report from a sensor not yet known (such as after its context is lost) is sent even when the area is already vacant. Presence on never sends an event: it only holds occupancy that motion established. trigger is \"motion\" when motion made the area occupied, otherwise null . reason is motion-active or all-sources-inactive . sources gives the last known motion and presence , each true , false or null when unknown or not used."
 },
 {
  "title": "Occupancy fusion",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default M",
  "url": "node-occupancy-fusion.html#settings",
  "text": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label; a new palette node starts unnamed. Area area · string Empty Required when publishing, and then with a letter or digit. Topics use it in lowercase, with spaces and other characters as _ . Presence sensor presenceMode · enum none none : PIR only, presence messages are ignored. hold : PIR plus a presence sensor that holds occupancy. Publish homeAssistant · enum Don’t publish Don’t publish ( off ); MQTT state ( state ): its occupancy and availability, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and an occupancy binary sensor announced to Home Assistant, which read that state. It replaced Publish state over MQTT ( publishState ) and Home Assistant discovery ( discovery ): a node saved before reads off/off as Don’t publish, on/off as MQTT state and on/on as MQTT state and Home Assistant discovery. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which it publishes itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 2 are then no longer needed. Needed unless Publish is Don’t publish; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 2, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 2. Discovery prefix discoveryPrefix · string homeassistant Home Assistant discovery topic prefix. Must not be empty or contain + or # . New nodes use node-based Home Assistant identifiers ( idScheme = \"node\" ). That internal marker is set when a node is added from the palette; it is not an editor setting. Occupancy has no older entities, so an unset idScheme also means node-based."
 },
 {
  "title": "Occupancy fusion",
  "section": "Optional MQTT and Home Assistant",
  "description": "Publishing and discovery are off by default. When publishing is on, set Area . The messages go on output 2. Pu",
  "url": "node-occupancy-fusion.html#publishing",
  "text": "Publishing and discovery are off by default. When publishing is on, set Area . The messages go on output 2. Published topics Topic Direction Payload home/<area>/occupancy/state Output 2 · retained ON or OFF , with every occupancy event on output 1. home/<area>/occupancy/availability Output 2 · retained online or offline . With discovery on, Home Assistant gets an occupancy binary sensor reading that state. The node announces itself once the flows have started, and again when it receives msg.source = \"startup\" . It is a view only: occupancy never goes to devices through Home Assistant. See Use Home Assistant as the panel ."
 },
 {
  "title": "Occupancy fusion",
  "section": "Status",
  "description": "The node status shows occupied (green) or vacant (grey), followed by pir on or pir off once motion is known, a",
  "url": "node-occupancy-fusion.html#status",
  "text": "The node status shows occupied (green) or vacant (grey), followed by pir on or pir off once motion is known, and presence on or presence off once presence is known and in use."
 },
 {
  "title": "Switch lighting policy",
  "description": "Message shapes, output and settings for the node that turns wall switch edges or button actions into lighting intents. It tracks whether the switch input is fresh, stale or unavailable.",
  "url": "node-switch-policy.html",
  "text": "Message shapes, output and settings for the node that turns wall switch edges or button actions into lighting intents. It tracks whether the switch input is fresh, stale or unavailable."
 },
 {
  "title": "Switch lighting policy",
  "section": "A press becomes an intent.",
  "description": "Turns raw switch edges, or single and double actions already classified by the device, into msg.lighting inten",
  "url": "node-switch-policy.html#summary",
  "text": "Turns raw switch edges, or single and double actions already classified by the device, into msg.lighting intents for the room lighting controller. It keeps no occupancy or motion state. In the palette it is home-switch-lighting-policy ; on the canvas it shows its name, or “<area> switch policy”, or “switch policy”. A single press toggles the targets. A double press switches them on at full brightness as a person’s manual setting. Looking for wiring? Follow Wire wall switches for the switch connections and the room controller after it."
 },
 {
  "title": "Switch lighting policy",
  "section": "Inputs",
  "description": "Each message names its kind in msg.source . Other sources are ignored. Input messages msg.source Other propert",
  "url": "node-switch-policy.html#inputs",
  "text": "Each message names its kind in msg.source . Other sources are ignored. Input messages msg.source Other properties Effect \"switch\" msg.payload = {state: true | false} ; optional msg.retain , msg.baseline , msg.observedAt or msg.payload.observedAt A raw wall switch state. A change is an edge; a second edge within Raw-edge window ms is a double press, otherwise the first edge becomes a single press when the window ends. \"switch-action\" msg.payload = \"single\" or \"double\" , or {action: …} A press the device already classified. Other actions (such as long ) and retained messages are ignored. \"switch-availability\" msg.payload = online , available , on or true ; offline , unavailable , off or false Offline forgets the baseline; the first observation after it re-baselines without a press. A retained observation, or one marked msg.baseline = true (for a polled snapshot), only sets the baseline and never becomes a press. A repeated, unchanged state refreshes freshness without a press. With no baseline yet, the first non-retained report counts as a change and becomes a press: it sends a TOGGLE . Mark the first read of a switch with msg.baseline = true to avoid that. After an offline availability message, the first report re-baselines without a press. The baseline is kept in the node’s context, so it survives a restart only with a context store configured (see the README’s Recommended setup ). A kept baseline counts as unconfirmed until this runtime receives an observation."
 },
 {
  "title": "Switch lighting policy",
  "section": "Outputs",
  "description": "One output: lighting intents, for the room lighting controller’s input. Single press · msg.lighting { kind: \"i",
  "url": "node-switch-policy.html#outputs",
  "text": "One output: lighting intents, for the room lighting controller’s input. Single press · msg.lighting { kind: \"intent\", targets: [\"main\"], state: \"TOGGLE\", source: \"wall\", person: true } A double press sends state: \"ON\" with manual: true and values: {brightnessPct: 100} . Every intent carries person: true ."
 },
 {
  "title": "Switch lighting policy",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Note the units: the window is in milliseconds , freshness in se",
  "url": "node-switch-policy.html#settings",
  "text": "Defaults below are from the editor definition. Note the units: the window is in milliseconds , freshness in seconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Area area · string Empty Optional; labels the node and its traces. Targets targets · JSON array [\"main\"] The room controller targets the intents name. A non-empty JSON array of strings. Raw-edge window ms switchWindowMs · number 500 How long after one edge a second edge counts as a double press. Zero or more. Input freshness seconds switchFreshnessSeconds · number 3600 How long after the last observation the switch input counts as fresh. Greater than zero."
 },
 {
  "title": "Switch lighting policy",
  "section": "Status",
  "description": "Node status Status Meaning switch fresh · <age> (green) Observed in this runtime within the freshness time. sw",
  "url": "node-switch-policy.html#status",
  "text": "Node status Status Meaning switch fresh · <age> (green) Observed in this runtime within the freshness time. switch stale · <age> (yellow) The baseline is known but older than the freshness time, unconfirmed since start, or without a timestamp. switch unavailable (red) The last availability message said offline. awaiting switch baseline (yellow) No switch state is known yet. The age shows in seconds, minutes or hours, and is refreshed on a timer as the input ages."
 },
 {
  "title": "House schedule node",
  "description": "Settings for the configuration node that holds one wake and bed time for many rooms. It has no wires: circadian lighting policies choose it as their Schedule.",
  "url": "node-house-schedule.html",
  "text": "Settings for the configuration node that holds one wake and bed time for many rooms. It has no wires: circadian lighting policies choose it as their Schedule."
 },
 {
  "title": "House schedule node",
  "section": "One wake time. One bed time. Many rooms.",
  "description": "A configuration node, like an MQTT broker: it never appears on the canvas and has no inputs or outputs. Choose",
  "url": "node-house-schedule.html#summary",
  "text": "A configuration node, like an MQTT broker: it never appears on the canvas and has no inputs or outputs. Choose it in a circadian lighting policy’s Schedule setting and that policy follows its wake and bed times, hearing of every change as it happens, without wires. In the configuration nodes list it shows its name, or “house schedule”. Those policies then have no wake and bed time entities of their own in Home Assistant. A policy that keeps its own times (for a child’s room, say) chooses none. Deleting the house schedule in the editor returns its policies to their own times. Looking for wiring? Follow Share a house schedule to set one up with several rooms."
 },
 {
  "title": "House schedule node",
  "section": "Where it is chosen",
  "description": "Circadian lighting policy : its Schedule setting. The policy follows this schedule’s times. House schedule MQT",
  "url": "node-house-schedule.html#used-by",
  "text": "Circadian lighting policy : its Schedule setting. The policy follows this schedule’s times. House schedule MQTT : its Schedule setting. It publishes this schedule’s times and changes them from messages or Home Assistant."
 },
 {
  "title": "House schedule node",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Times are HH:MM in the Node-RED host’s local time. Editor setti",
  "url": "node-house-schedule.html#settings",
  "text": "Defaults below are from the editor definition. Times are HH:MM in the Node-RED host’s local time. Editor settings and exact defaults Setting / property Default Meaning Name name · string house Labels the schedule and names its topics, home/<name>/schedule/... . Needs a letter or digit. Wake time wakeTime · string 07:00 The wake time, from 00:00 to 23:59 . Bed time bedTime · string 23:00 The bed time, from 00:00 to 23:59 ; must differ from the wake time."
 },
 {
  "title": "House schedule node",
  "section": "Changing the times",
  "description": "Times change at runtime from a message or from Home Assistant, through a house schedule MQTT node. A time chan",
  "url": "node-house-schedule.html#changing",
  "text": "Times change at runtime from a message or from Home Assistant, through a house schedule MQTT node. A time changed that way lasts until a deploy gives this schedule a different Wake time or Bed time , which then applies. The times in use are kept in the node’s context, so they survive a restart only with a context store configured (see the README’s Recommended setup )."
 },
 {
  "title": "House schedule MQTT",
  "description": "Message shapes, output and settings for the node that publishes a house schedule’s times over MQTT and takes changes back. Optional: rooms follow the schedule without it.",
  "url": "node-house-schedule-mqtt.html",
  "text": "Message shapes, output and settings for the node that publishes a house schedule’s times over MQTT and takes changes back. Optional: rooms follow the schedule without it."
 },
 {
  "title": "House schedule MQTT",
  "section": "The schedule’s MQTT side.",
  "description": "Publishes a house schedule ’s wake and bed times as retained MQTT state and, with discovery, as Home Assistant",
  "url": "node-house-schedule-mqtt.html#summary",
  "text": "Publishes a house schedule ’s wake and bed times as retained MQTT state and, with discovery, as Home Assistant time entities, and changes the schedule from their set topics or from a message. In the palette it is home-house-schedule-mqtt ; on the canvas it shows its name, or “house schedule MQTT”. Use one per schedule: two would share the same topics and entities, and deleting one clears them for both until the other next starts. Looking for wiring? Follow Share a house schedule for the full flow, and Use Home Assistant as the panel for the entities."
 },
 {
  "title": "House schedule MQTT",
  "section": "Inputs",
  "description": "Wire an MQTT in node subscribed to the set topics into the input. Input messages Message Shape Effect Time fro",
  "url": "node-house-schedule-mqtt.html#inputs",
  "text": "Wire an MQTT in node subscribed to the set topics into the input. Input messages Message Shape Effect Time from Home Assistant msg.topic = home/<name>/schedule/wake-time/set or …/bed-time/set , msg.payload a time Sets that time. Retained messages and anything but a time are ignored. New times msg.lighting = {kind: \"schedule\", wakeTime, bedTime} , each HH:MM , either one alone Sets the schedule’s times. Startup msg.source = \"startup\" (or msg.lighting.kind = \"startup\" ) Announce again, as after the broker reconnects. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.source = \"startup\" ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. A time changed this way lasts until a deploy gives the house schedule a different Wake time or Bed time . Every policy following the schedule hears of the change without wires."
 },
 {
  "title": "House schedule MQTT",
  "section": "Outputs",
  "description": "One output port Port Message Connect to 1 · MQTT publications Retained times, availability and discovery messa",
  "url": "node-house-schedule-mqtt.html#outputs",
  "text": "One output port Port Message Connect to 1 · MQTT publications Retained times, availability and discovery messages. Sent at start, at every change to the schedule, and when it stops. An MQTT out node."
 },
 {
  "title": "House schedule MQTT",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default M",
  "url": "node-house-schedule-mqtt.html#settings",
  "text": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label; a new palette node starts unnamed. Schedule schedule · home-house-schedule None Required. The house schedule to publish; its name names the topics. Without one, or with a deleted one, the node shows invalid configuration and does nothing. Publish homeAssistant · enum MQTT state and Home Assistant discovery, for a new node MQTT state ( state ): the schedule’s wake and bed times and its availability, with its set topics, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and wake and bed time entities announced to Home Assistant, which read that state. It always publishes its state, so there is no Don’t publish. It replaced Home Assistant discovery ( discovery ): a node saved before reads off as MQTT state and on as MQTT state and Home Assistant discovery; a flow saved without either gets MQTT state. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which it publishes and reads its set topics itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 1 and an MQTT in on its set topics are then no longer needed. It always publishes, so it needs one; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 1, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 1. Discovery prefix discoveryPrefix · string homeassistant Home Assistant discovery topic prefix. Must not be empty or contain + or # . New nodes use node-based Home Assistant identifiers ( idScheme = \"node\" ). That internal marker is set when a node is added from the palette; it is not an editor setting. This node has no older entities, so an unset idScheme also means node-based. Entities are named after the schedule, not this node, so a replacement node keeps them."
 },
 {
  "title": "House schedule MQTT",
  "section": "MQTT and Home Assistant",
  "description": "Publishing is what this node is for, so its state is always published. The base topic is home/<name>/schedule ",
  "url": "node-house-schedule-mqtt.html#publishing",
  "text": "Publishing is what this node is for, so its state is always published. The base topic is home/<name>/schedule , from the house schedule’s Name . Published state and incoming requests Topic suffix Direction Payload /wake-time/state Output 1 · retained The wake time as HH:MM:SS . /bed-time/state Output 1 · retained The bed time as HH:MM:SS . /availability Output 1 · retained online or offline . /wake-time/set MQTT in → node A new wake time. Not retained. /bed-time/set MQTT in → node A new bed time. Not retained. With discovery on, Home Assistant gets two time entities, Wake time and Bed time, reading the state topics and commanding the set topics. They change the schedule, never a device."
 },
 {
  "title": "House schedule MQTT",
  "section": "Status",
  "description": "The node status shows the times in use, wake HH:MM · bed HH:MM (green), and updates at every change.",
  "url": "node-house-schedule-mqtt.html#status",
  "text": "The node status shows the times in use, wake HH:MM · bed HH:MM (green), and updates at every change."
 },
 {
  "title": "Scene",
  "description": "Message shapes, output ports and settings for a scene: lights held on or off and motion paused while it is on, all handed back when it ends.",
  "url": "node-scene.html",
  "text": "Message shapes, output ports and settings for a scene: lights held on or off and motion paused while it is on, all handed back when it ends."
 },
 {
  "title": "Scene",
  "section": "Take the room for a while, then hand it back",
  "description": "The scene node (type home-scene ; canvas label: its name, or “scene”) is one scene, such as Bath or Exercise m",
  "url": "node-scene.html#summary",
  "text": "The scene node (type home-scene ; canvas label: its name, or “scene”) is one scene, such as Bath or Exercise mode . While it is on, it holds some of a room’s lights on or off with the values it gives them, and pauses motion lighting. When it ends, by request, by its safety timer or by a message your flow sends when its own condition is met, it lets them go, and each room gives its lights back what they were. It reaches lights only through room lighting controllers , so it works with any light adapter and never commands a device through Home Assistant. Looking for a walkthrough? Follow Scenes ."
 },
 {
  "title": "Scene",
  "section": "Inputs",
  "description": "Input messages Message Shape Effect Start msg.scene = {kind: \"start\"} Turns it on. On again: a fresh safety ti",
  "url": "node-scene.html#inputs",
  "text": "Input messages Message Shape Effect Start msg.scene = {kind: \"start\"} Turns it on. On again: a fresh safety timer and a renewed pause; its lights are left as they are, so a person’s change during the scene stands. End msg.scene = {kind: \"end\", by?} Ends it. by , optional, is shown as what ended it, such as \"trainer off\" ; without it, request . Ignored, with a trace, when it is off. End trigger The end above, sent by your flow The condition is your flow’s: a switch node on a power reading, a light switched off, a door opened. See End it when something happens . Home Assistant ON or OFF on home/<area>/scene/<name>/set A start, or an end by home-assistant . Read only while it publishes; retained messages are ignored. Startup msg.scene = {kind: \"startup\"} Announces its switch again, and renews its pause while on. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.scene = {kind: \"startup\"} ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. Anything else is ignored, with a trace."
 },
 {
  "title": "Scene",
  "section": "Outputs",
  "description": "Three output ports Port Message Connect to 1 · To rooms As it starts, one owner intent per light: {lighting: {",
  "url": "node-scene.html#outputs",
  "text": "Three output ports Port Message Connect to 1 · To rooms As it starts, one owner intent per light: {lighting: {kind: \"intent\", area, targets: [id], state, values?, owner: \"scene:<name>\", source: \"scene\"}} . As it ends, one release per room: {lighting: {kind: \"release\", area, owner, targets, source: \"scene\"}} . Each room lighting controller whose lights it sets. 2 · To motion {source: \"pause\", payload: true, owner} as it starts and every minute while on; payload: false as it ends. Each motion lighting policy to pause while it is on. 3 · MQTT publications Its switch’s state ( ON or OFF ), availability and discovery, retained. An MQTT out node, when it publishes."
 },
 {
  "title": "Scene",
  "section": "Settings",
  "description": "Editor settings and exact defaults Setting / property Default Meaning Name / name None: required Names the sce",
  "url": "node-scene.html#settings",
  "text": "Editor settings and exact defaults Setting / property Default Meaning Name / name None: required Names the scene to its rooms and motion policies (owner scene:<name> ), in its topics and in Home Assistant. Each scene needs its own: the editor marks a name another scene has, compared as in topics ( Bath and bath are the same). Lights / lights [] A JSON array, one entry per light: area (its room controller’s Area), target (the light’s id in that room’s Targets JSON), state ON or OFF , and for an ON light brightnessPct (0-100) and colorTempKelvin (above 0), both optional. A socket is a room target marked on/off only: give it just its state. Empty: the scene only pauses motion. Safety timer / safetyHours 4 Hours until it ends itself, so a forgotten scene doesn’t hold the room. 0 turns it off. Area / area Empty Required only while it publishes: it names its topics, home/<area>/scene/<name>/… . Publish / homeAssistant Don’t publish Don’t publish ( off ); MQTT state ( state ): its state, availability and set topic, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and a switch entity for the scene announced to Home Assistant, which read that state. It replaced Publish state over MQTT ( publishState ) and Home Assistant discovery ( discovery ): a node saved before reads off/off as Don’t publish, on/off as MQTT state and on/on as MQTT state and Home Assistant discovery. Broker / broker None Node-RED’s MQTT broker node, through which it publishes and reads its set topic itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 3 and an MQTT in on its set topic are then no longer needed. Needed unless Publish is Don’t publish; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 3, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 3. Discovery prefix / discoveryPrefix homeassistant Home Assistant’s discovery prefix. Scenes use node-based Home Assistant identifiers ( idScheme = \"node\" ), so renaming its area keeps its entity. That is not an editor setting. Lights · a main light off, a TV socket on, a lamp dimmed warm [{\"area\": \"gym\", \"target\": \"main\", \"state\": \"OFF\"}, {\"area\": \"gym\", \"target\": \"tv\", \"state\": \"ON\"}, {\"area\": \"gym\", \"target\": \"lamp\", \"state\": \"ON\", \"brightnessPct\": 30, \"colorTempKelvin\": 2700}]"
 },
 {
  "title": "Scene",
  "section": "What it holds, and what it hands back",
  "description": "Which rooms: each light names its room by the room controller’s Area , and its intents and releases carry it; ",
  "url": "node-scene.html#rules",
  "text": "Which rooms: each light names its room by the room controller’s Area , and its intents and releases carry it; a room acts only on those for its own Area, so two rooms may each have a main . Set the Area on each room a scene uses. Through the room: each light is held under the scene’s owner, so motion, wall switches without a person’s mark, and the circadian style leave it alone while the scene is on, on or off. See owners stack . Handed back: when it ends, each room gives a light back what it was before the scene: on or off as it was, in the room’s style as it is now, or a person’s own values if they had set it. Scenes stack: a newer scene holding a light another holds takes it, and hands it back to the older one when it ends. Ending the older one first leaves the light with the newer. A person’s change stands: a person changing a light the scene holds makes it theirs; the scene’s end leaves it alone. Motion: paused under the scene’s owner, renewed every minute, so it lapses within the motion policy’s maximum pause (10 minutes by default) if the scene node goes away. Keep that Maximum pause above a minute, or motion runs between renewals. Ending the scene lifts its pause; another owner’s pause stands. If the room went vacant during the scene, motion’s vacancy delay starts when the pause lifts. Restarts: its state is kept in its node context. With a context store, a scene on when the flows stopped is still on when they start, with its timer; if its time ran out meanwhile, it ends as they start. Its lights aren’t asked again: the rooms still hold them. Deleted while on: it lets its lights and motion go, when you deploy with “Modified nodes” or “Modified flows”, while the rooms and motion policies are still running. On a full deploy the rooms are stopping too, so its release is lost and its lights stay held: end the scene before you delete it, or change those lights by hand, which makes them a person’s. Its motion pause runs out by itself."
 },
 {
  "title": "Scene",
  "section": "Home Assistant",
  "description": "With an area and Publish set to MQTT state and Home Assistant discovery , Home Assistant gets a switch named a",
  "url": "node-scene.html#publishing",
  "text": "With an area and Publish set to MQTT state and Home Assistant discovery , Home Assistant gets a switch named after the scene. It shows whether the scene is on, and switching it sends ON or OFF to home/<area>/scene/<name>/set : with a Broker , the scene reads it itself; without one, wire an MQTT in node on that topic into the scene. Its availability is home/<area>/scene/<name>/availability ; set the MQTT broker node’s Birth, Close and Will messages as for the other publishing nodes (see Home Assistant ). <name> in topics is the scene’s name in lower case with other characters as _ : exercise_mode ."
 },
 {
  "title": "Scene",
  "section": "Status",
  "description": "on · 3h 59m left (green dot) while on, or on with the timer off. off · ended by timer (grey dot), or by reques",
  "url": "node-scene.html#status",
  "text": "on · 3h 59m left (green dot) while on, or on with the timer off. off · ended by timer (grey dot), or by request , home-assistant , deleted or what the end gave. off (grey ring) before it has run."
 },
 {
  "title": "Cover controller",
  "description": "Message shapes, output ports and settings for one blind, shutter or curtain. Position-aware confirmation without fighting manual moves.",
  "url": "node-cover-controller.html",
  "text": "Message shapes, output ports and settings for one blind, shutter or curtain. Position-aware confirmation without fighting manual moves."
 },
 {
  "title": "Cover controller",
  "section": "One motor. One command owner.",
  "description": "Controls a blind, shutter or curtain in position mode or open-close mode. It confirms moves from cover reports",
  "url": "node-cover-controller.html#summary",
  "text": "Controls a blind, shutter or curtain in position mode or open-close mode. It confirms moves from cover reports, retries within its limits, and leaves a person’s move where they put it. Looking for wiring? Follow Wire a cover for the MQTT adapter connections and a working message path."
 },
 {
  "title": "Cover controller",
  "section": "Inputs",
  "description": "Requests and device observations share the same input. A position cover uses 0 for closed and 100 for open. In",
  "url": "node-cover-controller.html#inputs",
  "text": "Requests and device observations share the same input. A position cover uses 0 for closed and 100 for open. Input properties Property Type Meaning msg.payload string / number \"open\" , \"close\" , \"stop\" , a position from 0 to 100, or a preset name. An already satisfied, still target needs no command. msg.stopIfMoving boolean With true , stop if moving (including an unconfirmed move); otherwise carry out the request. msg.respectManual boolean With true , wait while a person’s move holds the cover. A request without this takes control back. msg.cover object Observation, availability, startup, command result, or a full cover request. See message shapes below. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.cover = {kind: \"startup\"} ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. Device observation · msg.cover { kind: \"observed\", position: 60, motion: \"stopped\", observedAt: \"2026-01-01T12:00:00.000Z\" } Motion is opening , closing or stopped . Optional battery and charging fields are kept as reported facts, not acted on. Other msg.cover shapes kind Other fields Use availability online Offline requests are answered unavailable without a command. The cover is re-read when it returns. startup None Read the cover again after deploy. command_result generation, ok Result from the device path; not a substitute for observed completion. set_position requestId, generation, position Full position request with its identity."
 },
 {
  "title": "Cover controller",
  "section": "Outputs",
  "description": "The port order is fixed. Device commands and optional MQTT publications have different jobs. Four output ports",
  "url": "node-cover-controller.html#outputs",
  "text": "The port order is fixed. Device commands and optional MQTT publications have different jobs. Four output ports Port Message Connect to 1 · Device commands msg.cover_command = {operation, position, requestId, generation, attempt} Position mode: set_position, stop, observe. Device adapter. For example, the shelly cover node’s input. 2 · State and results msg.theatre = {kind: \"target_state\", target: \"cover\", status, details} Debug, a cover group, or another result consumer. Contains positions and failure or manual-override details. 3 · Moving msg.payload true / false; msg.topic = \"moving\" . Sent on changes. Policies that need to react to cover motion. 4 · MQTT publications Retained state and optional discovery, when publishing is on. MQTT out; not the device-command path. Completion needs a stopped target. A stopped motion report confirms the target, or it must remain at the same position for the settle time. A command echo alone does not prove that travel is finished."
 },
 {
  "title": "Cover controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Timing values are in milliseconds , not seconds. Mode-specific ",
  "url": "node-cover-controller.html#settings",
  "text": "Defaults below are from the editor definition. Timing values are in milliseconds , not seconds. Mode-specific settings are identified in their descriptions. Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label; a new palette node starts unnamed. Area area · string Empty Required when publishing state or discovery. Cover coverType · enum position A position cover, or open-close for open, close and stop only. Presets presets · JSON object {\"partial\":60} Position mode. Names begin with a lowercase letter; use letters, digits, _ or -. Do not name one open, close or stop. Positions: 0–100. Position tolerance positionTolerance · number 2 Position mode. Allowed difference from the target in position points. Invert positions invert · boolean false Position mode. Enable if the device reports 0 as open. Travel timeout travelTimeoutMs · milliseconds 90000 Position mode. Time limit for travel. Poll interval pollMs · milliseconds 5000 Position mode. Interval between reads. Settle time settleMs · milliseconds 5000 Position mode. Stable-position interval for confirmation; use at least the interval between motor travel reports. Full travel time travelMs · milliseconds 30000 Open-close mode. Full-duration travel used when judging a reported move by time. Travel margin marginMs · milliseconds 10000 Open-close mode. Travel-time margin. Maximum attempts maxAttempts · number 2 Bound on command attempts. Name in topics topicName · string Empty Required when publishing. Give each cover in an area its own name. Publish homeAssistant · enum Don’t publish Don’t publish ( off ); MQTT state ( state ): its state, position and availability, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and a cover entity announced to Home Assistant, which read that state. It replaced Publish state over MQTT ( publishState ) and Home Assistant discovery ( discovery ): a node saved before reads off/off as Don’t publish, on/off as MQTT state and on/on as MQTT state and Home Assistant discovery. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which it publishes and reads its set topics itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 4 and an MQTT in on its set topics are then no longer needed. Needed unless Publish is Don’t publish; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 4, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 4. Discovery prefix discoveryPrefix · string homeassistant Nonempty prefix without MQTT wildcards. New nodes use node-based Home Assistant identifiers ( idScheme = \"node\" ). That internal marker is set when a node is added from the palette; it is not an editor setting."
 },
 {
  "title": "Cover controller",
  "section": "Optional MQTT and Home Assistant",
  "description": "Publishing and discovery are off by default. When publishing is on, set both Area and Name in topics . The bas",
  "url": "node-cover-controller.html#publishing",
  "text": "Publishing and discovery are off by default. When publishing is on, set both Area and Name in topics . The base topic is home/<area>/cover/<name> . Published state and incoming requests Topic suffix Direction Payload /state Output 4 · retained open, closed, opening, closing or stopped, once reported. /position Output 4 · retained Reported position, for a position cover. /availability Output 4 · retained online or offline. /set MQTT in → controller OPEN, CLOSE or STOP. /position/set MQTT in → controller Requested position. Subscribe to home/<area>/cover/<name>/set and, for a position cover, …/position/set , and feed the MQTT in messages to the controller. Anything else on the cover’s own topics, and any other cover’s topics ( home/<area>/cover/<name>/… ), such as their state, position and availability coming back through a wildcard subscription, is ignored, with a trace, whether or not this cover publishes. A cover group’s requests, named by their member, and a flow’s own topics are requests as before. These are requests to the controller, never direct commands through Home Assistant. Do not retain command or request messages."
 },
 {
  "title": "Cover controller",
  "section": "Open, close and stop only",
  "description": "For a motor without a reliable position, set Cover to “Open, close and stop only”. Positions and presets are i",
  "url": "node-cover-controller.html#open-close",
  "text": "For a motor without a reliable position, set Cover to “Open, close and stop only”. Positions and presets are ignored. Commands on output 1 become open , close , stop or observe . Report msg.cover = {kind: \"observed\", motion, state, observedAt} . A reported end state ( open or closed ) confirms the move. Otherwise, a move in the requested direction that stops after the full travel time is explicitly judged by travel time . Stopping early or moving the other way is treated as a person’s move. If the motor reports nothing, the result stays unconfirmed and fails with no-reports after the retry limit. Source: cover-controller editor defaults and help; README Covers. The shelly cover wiring is in the cover guide ."
 },
 {
  "title": "Cover group",
  "description": "Message shapes, output ports and settings for moving several covers as one. Ready only when every member confirms; otherwise it says which did what.",
  "url": "node-cover-group.html",
  "text": "Message shapes, output ports and settings for moving several covers as one. Ready only when every member confirms; otherwise it says which did what."
 },
 {
  "title": "Cover group",
  "section": "Several covers. One honest answer.",
  "description": "Moves several covers as one, such as the left and right of a curtain: one request goes to every member, each u",
  "url": "node-cover-group.html#summary",
  "text": "Moves several covers as one, such as the left and right of a curtain: one request goes to every member, each under its own request ID, and the group reports how far it got. In the palette it is home-cover-group ; on the canvas it shows its name, or “<area> cover group”, or “cover group”. A cover group has no MQTT topics or Home Assistant entity of its own: Home Assistant can group the covers’ entities itself. Looking for wiring? Follow Wire a cover , and see the Cover pair example for a group of two."
 },
 {
  "title": "Cover group",
  "section": "Inputs",
  "description": "Requests and member answers share the same input. Input properties Property Type Meaning msg.payload string / ",
  "url": "node-cover-group.html#inputs",
  "text": "Requests and member answers share the same input. Input properties Property Type Meaning msg.payload string / number A cover request: \"open\" , \"close\" , \"stop\" , a position or a preset name. Each member gets the same request. msg.stopIfMoving boolean Passed on to each member, as for a cover controller . msg.respectManual boolean Passed on to each member, as for a cover controller. msg.theatre object A member’s result: wire each member cover controller’s second output back into the group. Other state from a cover controller, and its moving signal, are ignored."
 },
 {
  "title": "Cover group",
  "section": "Outputs",
  "description": "Output 1 is the group’s result, then one output per member in the order of Members , each labelled with its na",
  "url": "node-cover-group.html#outputs",
  "text": "Output 1 is the group’s result, then one output per member in the order of Members , each labelled with its name. Changing Members changes the number of outputs, and the editor moves each member’s wire with its name. Output ports Port Message Connect to 1 · Group result msg.theatre = {kind: \"target_state\", target: \"cover\", status, details} Debug, or another result consumer. 2 and on · One per member That member’s request, with its own coverRequestId and msg.topic naming the member. stopIfMoving , respectManual and msg.source are passed on. That member’s cover controller input. No switch node is needed. transitioning when a request goes out and at each member answer while any member has not settled. ready only when every member confirms. Once every member has settled with any not ready, failed with reason partial (some confirmed) or none-confirmed , and details.members saying what each did. A member silent at the Answer deadline counts as no-answer . A new request first answers the open one failed with reason superseded . A cover controller answers the request even when it doesn’t carry it out, with the reason."
 },
 {
  "title": "Cover group",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. The deadline is in seconds . Editor settings and exact defaults",
  "url": "node-cover-group.html#settings",
  "text": "Defaults below are from the editor definition. The deadline is in seconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Area area · string Empty Optional; labels the node and its traces. Members members · JSON array [\"left\",\"right\"] At least two unique names, each lowercase, starting with a letter, with letters, digits, _ or - . Each name gets its own output. Answer deadline (s) deadlineSeconds · number 120 How long members have to answer before a silent one counts as no-answer . At least 1. The hidden outputs key is internal: the editor keeps the output count (default 3) and a map of how each member’s port moved when Members changes, as the core switch node does. It is not an editor setting."
 },
 {
  "title": "Cover group",
  "section": "Status",
  "description": "The node status shows idle before the first request, then <ready>/<members> confirmed : green when every membe",
  "url": "node-cover-group.html#status",
  "text": "The node status shows idle before the first request, then <ready>/<members> confirmed : green when every member is ready, blue otherwise, including idle."
 },
 {
  "title": "Theatre activity controller",
  "description": "Message shapes, output ports and settings for the node that owns the whole theatre’s activity. One request drives every target, and the activity is ready only on fresh evidence from each one.",
  "url": "node-theatre-activity-controller.html",
  "text": "Message shapes, output ports and settings for the node that owns the whole theatre’s activity. One request drives every target, and the activity is ready only on fresh evidence from each one."
 },
 {
  "title": "Theatre activity controller",
  "section": "One activity. Five targets.",
  "description": "Owns the theatre’s latest-request-wins activity state, such as tv or off . It turns an activity intent into on",
  "url": "node-theatre-activity-controller.html#summary",
  "text": "Owns the theatre’s latest-request-wins activity state, such as tv or off . It turns an activity intent into one semantic command per target (display, AVR, source, lighting and backlighting) and aggregates the generation-scoped target_state evidence each target controller reports back. It never talks to a device: each target controller and its transport do that. In the palette it is theatre activity controller under home automation ; on the canvas it shows its name, or theatre activity when unnamed. Looking for wiring? Follow Home theatre for the state contract, the routing switch and the target controllers around this node."
 },
 {
  "title": "Theatre activity controller",
  "section": "Inputs",
  "description": "Every input is msg.theatre with a kind . A message without msg.theatre , such as a target controller’s own msg",
  "url": "node-theatre-activity-controller.html#inputs",
  "text": "Every input is msg.theatre with a kind . A message without msg.theatre , such as a target controller’s own msg.avr or msg.display events on the same wire, is ignored, so each target controller’s output 2 can be wired straight back here. msg.theatre kinds kind Other fields Use intent requestId, generation, activity , optional requestedAt Start an activity. activity must be a configured profile, generation a positive integer. Usually comes from the theatre state contract’s output 1. target_state target, generation, status, observedAt , optional classification, failure, details A target controller’s progress. Reports for another generation are ignored. startup , refresh None Ask every target to report again. With no activity in hand it probes the targets and starts recovery. recover reason ( startup or manual_override ), observations Physical evidence per target, {observedAt, values} , for adopting an activity without commands. tick optional generation Sent by the node itself on its timer; you don’t need to send it. Target status is one of discovering , transitioning , confirming , ready , waiting_for_source , failed or unavailable . A classification of manual_override or drift marks a change the theatre didn’t make. An intent is a duplicate only of the request in hand: the same requestId , generation and activity sends no commands. A different request whose generation is already taken gets the next free generation when its number is newer than any proposed before (as after a recovery); otherwise an older generation is rejected as stale-generation , and the current one as request-conflict or generation-conflict . Nothing remembers earlier requestId s, so an older one sent again with a new generation is a new request. Activity intent · msg.theatre { kind: \"intent\", requestId: \"example-request-1\", generation: 1, activity: \"tv\" }"
 },
 {
  "title": "Theatre activity controller",
  "section": "Outputs",
  "description": "The port order is fixed. Commands go out on output 1; everything the theatre knows goes out on output 2. Two o",
  "url": "node-theatre-activity-controller.html#outputs",
  "text": "The port order is fixed. Commands go out on output 1; everything the theatre knows goes out on output 2. Two output ports Port Message Connect to 1 · Semantic target commands msg.theatreCommand = {target, kind, requestId, generation, …} . kind is intent or refresh ; the rest is the profile’s values for that target. A switch on theatreCommand.target ( display , avr , source , lighting , backlighting ), then a change node per target that moves it to msg.display , msg.avr , msg.sourceCapability , msg.activityLighting or msg.backlighting . 2 · Activity state and events msg.theatre : first a complete {kind: \"state\", …} snapshot, then any events. The theatre state contract’s input, which publishes the snapshot as retained MQTT state. The snapshot carries area, requestId, generation, desiredActivity, requestedAt, currentActivity, phase, availability, transitionStartedAt, transitionCompletedAt, targets, failure, degraded and metrics . availability is unknown , available , degraded or unavailable . Events after the snapshot have kind ready , failed , waiting_for_source , manual_override , drift , superseded , rejected , recovery_required , recovery_adopted , recovery_unknown or recovery_ambiguous , each with area, requestId, generation, activity . A refresh carries the activity’s values. A refresh command holds the same wanted values as the intent, so a target controller that started with nothing saved can adopt them and read its device instead of staying idle."
 },
 {
  "title": "Theatre activity controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact d",
  "url": "node-theatre-activity-controller.html#settings",
  "text": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Area area · string Empty Optional; copied into the snapshot and events. Freshness ms freshnessMs · number 30000 How long a target report counts as fresh; at least 1000. The node ticks at half this, and refreshes a settled target at half this. Profiles JSON activityProfiles · JSON object {} Activity name to its values for every target. Required: an empty object is an invalid configuration."
 },
 {
  "title": "Theatre activity controller",
  "section": "Activity profiles",
  "description": "Each activity name is lowercase, starting with a letter ( a-z , digits, _ , - ). Each profile defines all five",
  "url": "node-theatre-activity-controller.html#profiles",
  "text": "Each activity name is lowercase, starting with a letter ( a-z , digits, _ , - ). Each profile defines all five targets. Display and AVR values are passed through to their controllers; source, lighting and backlighting are checked. Profiles JSON · from the example flow { \"off\": {\"display\": {\"mode\": \"off\"}, \"avr\": {\"power\": \"standby\"}, \"source\": {\"action\": \"deactivate\", \"readiness\": \"optional\"}, \"lighting\": {\"profile\": \"off\"}, \"backlighting\": {\"power\": \"off\"}}, \"tv\": {\"display\": {\"mode\": \"tv\"}, \"avr\": {\"power\": \"on\", \"source\": \"shield\"}, \"source\": {\"action\": \"activate\", \"sourceId\": \"streamer\", \"readiness\": \"required\"}, \"lighting\": {\"profile\": \"tv\"}, \"backlighting\": {\"power\": \"on\"}} } source.action is activate or deactivate ; activate needs a sourceId . A deactivate without one is sent the previous activity’s source. source.readiness is required (the activity waits for the source) or optional (a missing source only degrades it). lighting.profile names a profile in the activity lighting controller. backlighting.power is on or off ."
 },
 {
  "title": "Theatre activity controller",
  "section": "When an activity is ready",
  "description": "Display, AVR and backlighting are required: each needs a fresh ready report. A fresh failed or unavailable rep",
  "url": "node-theatre-activity-controller.html#readiness",
  "text": "Display, AVR and backlighting are required: each needs a fresh ready report. A fresh failed or unavailable report from one of them fails the activity. Lighting is always optional, and the source is optional or required per profile; an optional target that isn’t ready shows in degraded instead of blocking, as does lighting that is ready without lights that never reported (reason unobserved ). A required source that isn’t ready holds the phase at waiting_for_source . A fresh manual_override report from any target puts the theatre in manual_override without corrective commands; a newer request resumes automation. Once ready, a target that is only due for re-confirmation keeps the activity ready and shows as stale in degraded . An unanswered refresh is re-sent up to three attempts in all; after that the target is reported as not responding ( no-response ) and is still asked once per freshness window."
 },
 {
  "title": "Theatre activity controller",
  "section": "Startup and recovery",
  "description": "On startup with an activity in hand, it refreshes every target and confirms again. Without one (a redeploy or ",
  "url": "node-theatre-activity-controller.html#recovery",
  "text": "On startup with an activity in hand, it refreshes every target and confirms again. Without one (a redeploy or restart with no context store), it sends probe refreshes to every target, emits recovery_required and enters recovering . The display, AVR, source and backlighting controllers answer a probe, when they have no request of their own, by reading their devices and reporting what they show on their output 2, which already goes back to this node: msg.theatre = {kind: \"target_observation\", target, observedAt, values} , in the profiles’ terms (display {mode} , from the display controller’s own modes; AVR {power, source, mainZone} ; source {action: \"activate\", sourceId} for the one active source, {action: \"deactivate\"} when all are inactive, or {} ; backlighting {power} ). Once all four have answered, or the probes run out, it recovers from them, as from a msg.theatre = {kind: \"recover\", reason, observations} message, which still works. When the fresh display, AVR, source and backlighting evidence matches exactly one profile, that activity is adopted without commands ( recovery_adopted ). After a start with nothing saved, a target that can’t be asked, such as a backlight that only reports when it changes, needn’t answer: once the probes run out, the controller recovers from the targets that answered, provided the display and the AVR are among them (they tell activities apart, and both can always be read) and exactly one profile matches every target that answered. A target that didn’t answer is unobserved : the activity is ready with it listed in degraded (reason unobserved ) until it reports. With no evidence, or more than one match, the activity is unknown , the phase is idle and nothing is commanded until the next request ( recovery_unknown ), so a restart never switches a running activity off. After a cold start, the devices say what is running. Wired as in the example, the theatre shows the activity the devices are in within seconds of a restart with nothing saved, and commands nothing. Lighting isn’t read: an adopted activity leaves the room’s lights as they are. A file context store still keeps the activity, and its counters, across restarts."
 },
 {
  "title": "Theatre activity controller",
  "section": "Status",
  "description": "The node status reads <activity>: <phase> , or <activity>: <reason> when failed, with none when no activity is",
  "url": "node-theatre-activity-controller.html#status",
  "text": "The node status reads <activity>: <phase> , or <activity>: <reason> when failed, with none when no activity is in hand. Status appearance by phase Phase Appearance idle Grey dot transitioning Blue dot confirming Blue ring waiting_for_source , recovering , manual_override Yellow ring ready Green dot failed Red ring Any other, such as preparing Grey ring"
 },
 {
  "title": "Theatre state contract",
  "description": "Message shapes, output ports and settings for the bridge between MQTT activity requests and the theatre activity controller. It passes requests in and publishes the controller’s truth as retained state.",
  "url": "node-theatre-state-contract.html",
  "text": "Message shapes, output ports and settings for the bridge between MQTT activity requests and the theatre activity controller. It passes requests in and publishes the controller’s truth as retained state."
 },
 {
  "title": "Theatre state contract",
  "section": "Requests in. Retained truth out.",
  "description": "Turns non-retained MQTT activity requests into activity intents for the theatre activity controller , and publ",
  "url": "node-theatre-state-contract.html#summary",
  "text": "Turns non-retained MQTT activity requests into activity intents for the theatre activity controller , and publishes that controller’s state snapshots as retained MQTT topics, with an operational SLO and, optionally, Home Assistant discovery. Home Assistant is only a panel: its activity selector publishes a request, and the theatre does the rest. In the palette it is theatre state contract under home automation ; on the canvas it shows its name, or theatre state contract when unnamed. Looking for wiring or the full topic list? Follow Home theatre for the wiring, and the Theatre MQTT contract for every topic and payload."
 },
 {
  "title": "Theatre state contract",
  "section": "Inputs",
  "description": "Three kinds of message share the input. Anything else is ignored. Input messages Message Shape Use Activity re",
  "url": "node-theatre-state-contract.html#inputs",
  "text": "Three kinds of message share the input. Anything else is ignored. Input messages Message Shape Use Activity request msg.topic = \"<base>/request\" , msg.payload = {requestId, activity} , optional requestedAt From an MQTT in node. activity must be in Activities JSON . A retained request is inert. Only the latest request’s requestId is recognised: sent again, it is passed on unchanged, and reusing it for another activity is an error. An older requestId sent again is a new request with the next generation. Controller state msg.theatre = {kind: \"state\", …} The activity controller’s output 2. A snapshot older than the request in hand is ignored. Startup msg.theatreStateContract = {kind: \"startup\"} Publish (or, with discovery off, clear) the discovery entries and online again. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.theatreStateContract = {kind: \"startup\"} ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. A requestId starts with a letter or digit and holds up to 128 letters, digits, . , _ , : or - ."
 },
 {
  "title": "Theatre state contract",
  "section": "Outputs",
  "description": "The port order is fixed. Two output ports Port Message Connect to 1 · Activity requests msg.theatre = {kind: \"",
  "url": "node-theatre-state-contract.html#outputs",
  "text": "The port order is fixed. Two output ports Port Message Connect to 1 · Activity requests msg.theatre = {kind: \"intent\", requestId, generation, activity, requestedAt} ; each new request takes the next generation. The theatre activity controller’s input. 2 · Retained MQTT state and HA discovery {topic, payload, retain: true} , payload a string (JSON for objects). An MQTT out node."
 },
 {
  "title": "Theatre state contract",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. The latency budget is in milliseconds . Editor settings and exa",
  "url": "node-theatre-state-contract.html#settings",
  "text": "Defaults below are from the editor definition. The latency budget is in milliseconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label; a new palette node starts unnamed. Area area · string Empty Names the default base topic home/<area>/theatre ; needs a letter or digit. Required when Base topic is empty, or with discovery on for a contract saved before node-based IDs. With discovery on it is suggested to Home Assistant as the device’s area. Display name displayName · string Empty Names the Home Assistant device; empty means the area. Needed when discovery is on. Base topic baseTopic · string Empty Empty means home/<area>/theatre . No + or # . Publish homeAssistant · enum MQTT state, for a new node MQTT state ( state ): its activity, readiness, request and snapshot topics and its availability, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and the activity selector and status sensors announced to Home Assistant, which read that state. It always publishes its state, so there is no Don’t publish. It replaced Home Assistant discovery ( discovery ): a contract saved before reads off as MQTT state and on as MQTT state and Home Assistant discovery, and one that never set it (stored null ) keeps discovery on, as before. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which it publishes and reads its request topic itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 2 and an MQTT in on its request topic are then no longer needed. It always publishes, so it needs one; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 2, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 2. Discovery prefix discoveryPrefix · string homeassistant Home Assistant’s discovery prefix; no + or # . Activities JSON activities · JSON array [] Activities a request may name, unique lowercase identifiers, such as [\"off\",\"tv\"] . Required: an empty list is an invalid configuration. SLO window sloWindowSize · number 20 Outcomes kept for the operational SLO. Minimum samples sloMinimumSamples · number 5 Outcomes needed before normal evaluation. Latency budget (ms) sloLatencyBudgetMs · number 60000 Transition latency budget. Success objective (%) sloSuccessObjectivePct · number 95 Success rate objective. For a node added from the palette, Area is required only when Base topic is empty. A contract saved before node-based IDs also needs it while discovery is on. The contract in the imported Home theatre activity.json example has neither set, so it is invalid until you set an Area (or a Base topic). New nodes name their Home Assistant entities after the node ( idScheme = \"node\" ), so renaming the area keeps them. A contract saved before that setting has idScheme unset and keeps its area-named entities. That internal marker is set when a node is added from the palette; it is not an editor setting."
 },
 {
  "title": "Theatre state contract",
  "section": "MQTT and Home Assistant",
  "description": "Requests arrive on <base>/request and must not be retained. Each controller snapshot is published, retained, t",
  "url": "node-theatre-state-contract.html#publishing",
  "text": "Requests arrive on <base>/request and must not be retained. Each controller snapshot is published, retained, topic by topic as it changes, under <base>/ : desired , current , phase , transition , failure , readiness , metrics , slo , slo/breach and health/<target> . Each topic is published only when its payload changes, leaving aside the fields that only say when or how long ago something was seen ( observedAt , evaluatedAt , and in metrics each target’s observationAgeMs ): a steady activity whose targets keep re-confirming publishes nothing new, so Home Assistant records no change for every refresh. A target’s health therefore keeps the time it last changed, not the time it was last confirmed; a target that stops answering is still shown, as readiness going degraded with the target named stale or no-response in transition . Each startup, and with a Broker each connect, publishes every topic again with the next snapshot, in case the broker lost them. An accepted request immediately publishes desired , phase requested , an empty failure and readiness unknown . Once the flows start it publishes a retained online on <base>/availability , and offline as it stops. These get through only when this node is redeployed on its own, so also set the MQTT broker node’s Birth message to online and its Close and Will messages to offline , all retained, on the same topic (README Upgrading from 2.x ). Payloads and entity details are on the Theatre MQTT contract page. With discovery on, it announces a Requested activity select and sensors for current activity, phase, readiness, failure, transition latency, operational SLO, an SLO breach binary sensor and one health sensor per target, once the flows start and again at each startup message. Switched off, the next startup message clears them."
 },
 {
  "title": "Theatre state contract",
  "section": "Status",
  "description": "The node status reads <activity> · <generation> for the latest request, or waiting for state before one. It is",
  "url": "node-theatre-state-contract.html#status",
  "text": "The node status reads <activity> · <generation> for the latest request, or waiting for state before one. It is a blue dot after passing on a request, a green dot after publishing, and a grey ring otherwise."
 },
 {
  "title": "Display mode controller",
  "description": "Message shapes, output ports and settings for the TV, projector and projector screen. One request picks off, TV or projector, and the node confirms each device from fresh readings.",
  "url": "node-display-mode-controller.html",
  "text": "Message shapes, output ports and settings for the TV, projector and projector screen. One request picks off, TV or projector, and the node confirms each device from fresh readings."
 },
 {
  "title": "Display mode controller",
  "section": "TV, projector and screen as one display",
  "description": "Owns Sony Bravia TV power, projector lamp power and projector-screen position for the modes off , tv and proje",
  "url": "node-display-mode-controller.html#summary",
  "text": "Owns Sony Bravia TV power, projector lamp power and projector-screen position for the modes off , tv and projector . In the palette it is home-display-mode-controller ; on the canvas it shows its name, or “<area> display mode”. Switching between the TV and the projector is make before break: for the projector, the lamp starts and warms up, then the screen opens, and the TV goes to standby last; for the TV, it comes on before the projector shuts down and the screen closes. If the projector fails to start, the TV is left on. A projector warming up or cooling down finishes before a newer request changes it. Looking for wiring? Follow Home theatre for how a theatre activity routes its display commands to this node and reads its results back."
 },
 {
  "title": "Display mode controller",
  "section": "Inputs",
  "description": "Everything arrives as msg.display . A theatre activity controller sends msg.theatreCommand with target: \"displ",
  "url": "node-display-mode-controller.html#inputs",
  "text": "Everything arrives as msg.display . A theatre activity controller sends msg.theatreCommand with target: \"display\" ; your flow routes it here as msg.display , as the example activity flow does with a switch node and a change node. msg.display shapes kind Other fields Use intent requestId, generation, mode Asks for off , tv or projector . An older generation is rejected with stale-generation . startup None After a deploy: query every owned device and reconcile the saved intent. refresh requestId, generation, mode (optional) Re-confirm a settled display from fresh readings. With no request ( requestId null, generation 0: the activity controller’s probe after a start with nothing saved) and none of its own, it queries the TV, screen and projector, then answers on output 2 with msg.theatre = {kind: \"target_observation\", target, observedAt, values} , where values is {mode} : the one mode they show, by the same rules this node uses to confirm a mode, or null , and commands nothing. observed device: \"projector\", power or watts ; optional observedAt, source The projector’s power from your own meter or adapter, when no meter host is set. Display request · msg.display { kind: \"intent\", requestId: \"example-display-1\", generation: 1, mode: \"tv\" }"
 },
 {
  "title": "Display mode controller",
  "section": "Outputs",
  "description": "The TV, the screen and an optional power meter are reached directly over their own network APIs, so only the p",
  "url": "node-display-mode-controller.html#outputs",
  "text": "The TV, the screen and an optional power meter are reached directly over their own network APIs, so only the projector’s infrared toggle leaves the node as a command. Three output ports Port Message Connect to 1 · Projector IR fallback msg.payload = \"power\" with msg.display_command : the projector power toggle. Your infrared transport, commanded directly, never through Home Assistant. 2 · State and results Observed state plus ready, manual-override, failed, rejected and superseded results, and msg.theatre target state. Straight back to the theatre activity controller’s input. 3 · Projector power queries msg.payload = \"query\" when a fresh projector reading is needed and no meter host is set. Whatever makes your meter report, such as a Zigbee2MQTT plug’s zigbee2mqtt/<device>/get topic."
 },
 {
  "title": "Display mode controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact d",
  "url": "node-display-mode-controller.html#settings",
  "text": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Area area · string Empty The area the display belongs to; used in the canvas label. TV host tvHost · string Empty Required. A Sony Bravia with IP control. TV pre-shared key tvPsk · credential Empty The Bravia’s pre-shared key. Kept in Node-RED’s encrypted credential store; never sent in a message or status. Screen controller host screenHost · string Empty Required. A Shelly Gen2 cover (its Cover RPC). Projector power meter host (optional) projectorPowerMeterHost · string Empty A Shelly Gen2 switch with power metering on the projector’s supply (switch 1). Empty: your flow reports the projector’s power. Screen viewing position screenOpenPosition · number Empty Percentage of travel for projector mode, above 0 and up to 100. Empty: the screen’s own open command. Screen position tolerance screenTolerance · number 2 How close to the viewing position confirms the screen. Confirmation poll milliseconds pollMs · number 2000 How often devices are read while a change is confirmed. Query timeout milliseconds queryTimeoutMs · number 5000 How long a device has to report before it is asked again. TV confirmation timeout tvTimeoutMs · number 30000 How long the TV has to confirm its power. Screen movement timeout screenTimeoutMs · number 65000 How long the screen has to reach its position. Projector warm-up timeout projectorWarmupMs · number 60000 How long the lamp has to report on. Projector minimum warm-up projectorMinimumWarmupMs · number 15000 The least time the lamp is given to warm up. Projector shutdown confirm delay projectorShutdownConfirmMs · number 5000 Delay before the second power toggle that confirms a shutdown. Projector cool-down timeout projectorCooldownMs · number 120000 How long the lamp has to report standby. Maximum idempotent attempts maxAttempts · number 2 Attempts in all, for a command or a reading, before the request fails. Projector on watts projectorOnWatts · number 20 A reading at or above this is on. Projector standby watts projectorOffWatts · number 10 A reading at or below this is standby. Projector power is fallback projectorPowerFallback · boolean false Counts the infrared toggle’s use in activity metrics. Transport timeout milliseconds transportTimeoutMs · number 5000 Timeout of one request to a device’s API. Keep it below Query timeout × Maximum attempts. The editor also carries projectorMeterHost , the meter host’s name before 5.0. It was removed in 6.0 and is no longer read: a node naming only that key is an invalid configuration, in the editor and after a deploy, until Projector power meter host is set. Saving the node with the new host clears it."
 },
 {
  "title": "Display mode controller",
  "section": "Projector power",
  "description": "With a meter host, the node reads the Shelly switch itself. Without one, report the projector from any meter o",
  "url": "node-display-mode-controller.html#projector-power",
  "text": "With a meter host, the node reads the Shelly switch itself. Without one, report the projector from any meter or adapter: msg.display = {kind: \"observed\", device: \"projector\", power: \"on\"} with \"on\" , \"standby\" or \"transitioning\" in lower case, or a meter’s reading as watts: 140 , read against the on and standby watts. A smart plug’s own ON and OFF describe its socket, not the lamp, so send its power in watts instead. A lamp \"transitioning\" , or watts between the two thresholds, keeps its last settled state while it warms or cools. The node needs a fresh projector reading at every request and while it confirms a change, and asks for one on output 3. Leave output 3 unwired only if the meter reports on its own at least once every Query timeout milliseconds , whether or not the power changes. A device that hasn’t reported within the query timeout is asked again, up to Maximum idempotent attempts in all; then the request fails with reason no-reading , naming the device. This applies to every device. Query timeout × Maximum attempts Keep Transport timeout milliseconds below Query timeout milliseconds × Maximum idempotent attempts (5000 × 2 with the defaults), so a slow device’s answer arrives before it is given up on."
 },
 {
  "title": "Display mode controller",
  "section": "Screen viewing position",
  "description": "Set: projector mode opens the screen to that percentage of its travel and confirms it within Screen position t",
  "url": "node-display-mode-controller.html#screen",
  "text": "Set: projector mode opens the screen to that percentage of its travel and confirms it within Screen position tolerance . Empty (the default for a new node): the screen’s own open command, confirmed when the screen reports itself fully open. This also suits a screen not calibrated for positions. A node saved with a position keeps it. Other modes close the screen with its own close, which runs to the end and restores a position the screen has lost. A viewing position needs a screen that knows where it is: one that doesn’t is closed first, and if it still has no position, the request fails with reason screen-not-calibrated . Calibrate the screen, or clear the viewing position."
 },
 {
  "title": "Display mode controller",
  "section": "Manual changes",
  "description": "An unsolicited physical change after the display is ready latches manual ownership. The node observes and repo",
  "url": "node-display-mode-controller.html#manual",
  "text": "An unsolicited physical change after the display is ready latches manual ownership. The node observes and reports it without corrective commands; a newer activity intent resumes automation."
 },
 {
  "title": "Display mode controller",
  "section": "Status",
  "description": "The node status shows the controller’s phase and a short text: grey ring while discovering, grey dot when idle",
  "url": "node-display-mode-controller.html#status",
  "text": "The node status shows the controller’s phase and a short text: grey ring while discovering, grey dot when idle, blue dot while transitioning, green dot when ready, yellow ring for a manual override, red ring when failed (with the mode and failure reason). An invalid configuration, such as a missing host, is shown on the status too."
 },
 {
  "title": "Display mode controller",
  "section": "MQTT and Home Assistant",
  "description": "This node publishes nothing over MQTT itself. Display state reaches MQTT and Home Assistant through the theatr",
  "url": "node-display-mode-controller.html#publishing",
  "text": "This node publishes nothing over MQTT itself. Display state reaches MQTT and Home Assistant through the theatre activity: see Home theatre and Home Assistant ."
 },
 {
  "title": "AVR controller",
  "description": "Message shapes, output ports and settings for a Denon receiver. Power, main zone, source and bounded volume in dB, each confirmed from the receiver’s own reports.",
  "url": "node-avr-controller.html",
  "text": "Message shapes, output ports and settings for a Denon receiver. Power, main zone, source and bounded volume in dB, each confirmed from the receiver’s own reports."
 },
 {
  "title": "AVR controller",
  "section": "One receiver. One command owner.",
  "description": "Owns explicit power, main-zone, source and bounded volume commands for a Denon AVR. In the palette it is home-",
  "url": "node-avr-controller.html#summary",
  "text": "Owns explicit power, main-zone, source and bounded volume commands for a Denon AVR. In the palette it is home-avr-controller ; on the canvas it shows its name, or “<area> AVR controller”. Looking for wiring? Follow Home theatre for the TCP connection to the receiver and how a theatre activity drives it."
 },
 {
  "title": "AVR controller",
  "section": "Inputs",
  "description": "Requests and receiver reports arrive as msg.avr . A theatre activity controller sends msg.theatreCommand with ",
  "url": "node-avr-controller.html#inputs",
  "text": "Requests and receiver reports arrive as msg.avr . A theatre activity controller sends msg.theatreCommand with target: \"avr\" ; your flow routes it here as msg.avr . msg.avr shapes kind Other fields Use intent requestId, generation, power, source power: \"on\" with a source name from Sources ; omit source to keep the current input. power: \"standby\" stops the receiver. volume requestId, mode, valueDb mode: \"absolute\" sets the volume; \"relative\" changes it by a positive or negative amount. observed line One protocol line from the receiver, typically line: msg.payload from the TCP input. startup None After a deploy: discard stale observations and query the receiver. A volume request still pending fails with reason restart . refresh None Re-read the receiver without disturbing work in flight. With no request ( requestId null, generation 0: the activity controller’s probe after a start with nothing saved) and none of its own, it queries the receiver, then answers on output 2 with msg.theatre = {kind: \"target_observation\", target, observedAt, values} , where values is {power, source, mainZone} (its input only once it is on), and commands nothing. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.avr = {kind: \"startup\"} ), so the node announces itself again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored. Activity request · msg.avr { kind: \"intent\", requestId: \"example-avr-1\", generation: 1, power: \"on\", source: \"shield\" } With publishing on, an MQTT message on home/<area>/receiver/volume/set is also accepted on the input (see below)."
 },
 {
  "title": "AVR controller",
  "section": "Outputs",
  "description": "Three output ports Port Message Connect to 1 · Denon commands msg.payload (a protocol command as a buffer) wit",
  "url": "node-avr-controller.html#outputs",
  "text": "Three output ports Port Message Connect to 1 · Denon commands msg.payload (a protocol command as a buffer) with msg.avr_command . A TCP output node to the receiver. 2 · State and results State plus ready, failed, rejected, superseded and volume results; while it has a request, msg.theatre = {kind: \"target_state\", target: \"avr\", requestId, generation, status, observedAt, details} . Straight back to the theatre activity controller’s input, or a debug node. 3 · MQTT publications Retained state, availability and Home Assistant discovery, when switched on. An MQTT out node. A ready state is stamped with the oldest receiver reading the request relies on, and a refresh is answered once the receiver reports again."
 },
 {
  "title": "AVR controller",
  "section": "Volume in dB",
  "description": "Volume is in dB: requests ( valueDb ), bounds, results, published state and the Home Assistant number. The nod",
  "url": "node-avr-controller.html#volume",
  "text": "Volume is in dB: requests ( valueDb ), bounds, results, published state and the Home Assistant number. The node converts for the receiver, whose own 0-98 scale has 80 at 0 dB, so 0-98 maps to −80 to +18 dB, in half steps. A numeric string counts as a number. Requests are clamped to Minimum volume (dB) and Maximum volume (dB) . Bounds must be half-step values between −80 and 18 dB, with the minimum below the maximum. Relative requests resolve from a fresh observed volume, and rapid ones accumulate against the pending target. A request completes on fresh MV evidence from the receiver; ownership is then released, so a later physical or external change becomes the new baseline instead of being corrected. A request with value in the receiver’s own 0-98 was removed in 6.0: it is answered volume_rejected with reason removed-volume-value , and the node logs a warning once per deploy. A theatre activity owns power and source, not volume: a volume request waits while power or source is switching, and is rejected with receiver-not-ready while the receiver is off. Volume results on output 2 kind Fields Meaning volume_ready area, requestId, volume, bounded Confirmed by a fresh reading. volume_rejected area, requestId, reason Not sent, for example receiver-not-ready , removed-volume-value or an invalid request. volume_failed area, requestId, reason, operation, attempts attempts-exhausted , or restart (operation and attempts are null ). volume_manual_override area, requestId, reason, observed, target The receiver moved elsewhere while the request was in flight. volume_external area, previous, observed A change made outside any request. The contract example volume-ownership.mjs shows relative requests accumulating and ownership released after confirmation."
 },
 {
  "title": "AVR controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default M",
  "url": "node-avr-controller.html#settings",
  "text": "Defaults below are from the editor definition. Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label; a new palette node starts unnamed. Area area · string Empty Required, with a letter or digit, when publishing; topics and IDs are made from it. Sources sources · JSON {\"shield\":\"SAT/CBL\",\"playstation\":\"GAME\"} Source names mapped to the receiver’s input codes. Must be a JSON object. Retry milliseconds retryMs · number 2000 Wait before a command is retried; at least 250. Maximum attempts maxAttempts · number 3 Attempts in all before a request fails; at least 1. Minimum volume (dB) minVolumeDb · number -80 Lower volume bound, in half steps. Maximum volume (dB) maxVolumeDb · number -20 Upper volume bound, in half steps. Publish homeAssistant · enum Don’t publish Don’t publish ( off ); MQTT state ( state ): the receiver’s power, source, volume and availability, plain MQTT for any system to read; MQTT state and Home Assistant discovery ( discovery ): that, and power and source sensors and a volume number announced to Home Assistant, which read that state. It replaced Publish state over MQTT ( publishState ) and Home Assistant discovery ( discovery ): a node saved before reads off/off as Don’t publish, on/off as MQTT state and on/on as MQTT state and Home Assistant discovery. Broker broker · mqtt-broker None Node-RED’s MQTT broker node, through which it publishes and reads its set topic itself: it runs its startup each time the broker connects, reconnects included (its announcement, and whatever else its startup does, as a Status node’s “connected” did), announces everything again each time Home Assistant comes back, and output 3 and an MQTT in on its set topic are then no longer needed. Needed unless Publish is Don’t publish; opening and saving the node offers the first broker in your flows. A node saved before 6.2 that publishes keeps publishing through output 3, as before, and needs no broker until you choose one: the editor says so, and keeps that when you save it without a broker ( publishesThroughOutput , with no form row). Without a broker, it publishes on output 3. Discovery prefix discoveryPrefix · string homeassistant Home Assistant’s discovery topic prefix; no + or # . The editor also carries minVolume and maxVolume , the 0-98 bounds of a node saved before 5.0. They were removed in 6.0: a node with only those is an invalid configuration naming the dB setting to set, and saving it with dB bounds clears them. New nodes use node-based Home Assistant identifiers ( idScheme = \"node\" ), an internal marker set when the node is added from the palette, not an editor setting."
 },
 {
  "title": "AVR controller",
  "section": "Optional MQTT and Home Assistant",
  "description": "Off unless switched on, and then named after the Area . Everything goes on output 3. The node announces itself",
  "url": "node-avr-controller.html#publishing",
  "text": "Off unless switched on, and then named after the Area . Everything goes on output 3. The node announces itself once the flows have started, and again at kind: \"startup\" . Published state and incoming requests Topic Direction Payload home/<area>/receiver/power/state Output 3 · retained ON or OFF . …/source/state Output 3 · retained The source name. …/volume/state Output 3 · retained The last volume read from the receiver, in dB. …/availability Output 3 · retained online or offline . …/volume/set MQTT in → controller A volume in dB from the Home Assistant number. With discovery on, Home Assistant gets a power binary sensor, a source sensor and a volume number in dB between the two bounds, in 0.5 dB steps. Wire an MQTT in node on …/volume/set into this node. Sets arriving within 0.3 seconds of each other are settled to the last, which becomes an ordinary absolute volume request, bounded and confirmed like any other and never sent to the receiver directly. See Home Assistant ."
 },
 {
  "title": "AVR controller",
  "section": "Status",
  "description": "The node status shows the controller’s phase and a short text: grey ring while discovering, grey dot when idle",
  "url": "node-avr-controller.html#status",
  "text": "The node status shows the controller’s phase and a short text: grey ring while discovering, grey dot when idle, blue dot while transitioning, green dot when ready, yellow ring for a manual override, red ring when failed. An invalid configuration, such as 0-98 bounds without dB bounds, is shown on the status too."
 },
 {
  "title": "Source capability controller",
  "description": "Message shapes, output ports and settings for the node that decides when a playback source is really ready. An input selection alone never counts as success.",
  "url": "node-source-capability-controller.html",
  "text": "Message shapes, output ports and settings for the node that decides when a playback source is really ready. An input selection alone never counts as success."
 },
 {
  "title": "Source capability controller",
  "section": "Ready means evidence.",
  "description": "Coordinates configured playback sources, such as a streamer or a games console, from what each one can do: whe",
  "url": "node-source-capability-controller.html#summary",
  "text": "Coordinates configured playback sources, such as a streamer or a games console, from what each one can do: whether it can be switched on or off by command, only by a person, or not at all, and which evidence proves it ready. It holds no source names, entity IDs or transport logic; a separate adapter in your flow talks to the device. In the palette it is source capability controller under home automation ; on the canvas it shows its name, or source capability controller when unnamed. Looking for wiring? Follow Home theatre , where the theatre activity controller sends this node its source commands."
 },
 {
  "title": "Source capability controller",
  "section": "Inputs",
  "description": "Every input is msg.sourceCapability with a kind . A source ID is lowercase, starting with a letter, and must b",
  "url": "node-source-capability-controller.html#inputs",
  "text": "Every input is msg.sourceCapability with a kind . A source ID is lowercase, starting with a letter, and must be configured in Source capabilities . msg.sourceCapability kinds kind Other fields Use intent requestId, generation, sourceId, action Request activate or deactivate . sourceId may be null only for a deactivate, which is then reported unavailable ( unknown-active-source ). observed generation, sourceId, status, observedAt , optional application, playback The adapter’s reading. status : active , inactive , available , unavailable or unknown . playback : playing , paused , idle , buffering , stopped or unknown . command_result generation, sourceId, ok , optional reason The adapter’s result for a command. ok: true starts confirmation; it is not confirmation. refresh optional requestId, generation, sourceId, action From the theatre activity controller: re-read the source, or adopt the activity’s wanted values after a start with nothing saved. With no request ( requestId null, generation 0: the activity controller’s probe after a start with nothing saved) and none of its own, it observes every source that can be read (sending observe with requestId null and generation 0; an observation with any generation answers it), then answers on output 2 with msg.theatre = {kind: \"target_observation\", target, observedAt, values} , where values is {action: \"activate\", sourceId} for the one active source, {action: \"deactivate\"} when all are inactive, or {} , and commands nothing. startup None Re-observe the request in hand with a deadline; the activation itself is never replayed. tick generation Sent by the node itself on its timer. The theatre activity controller’s source command (moved from msg.theatreCommand ) already has this shape; its extra target and readiness fields are not used here. Adapter observation · msg.sourceCapability { kind: \"observed\", generation: 1, sourceId: \"streamer\", status: \"active\", observedAt: \"2026-01-01T12:00:00.200Z\", application: \"player.example\", playback: \"paused\" }"
 },
 {
  "title": "Source capability controller",
  "section": "Outputs",
  "description": "The port order is fixed. Two output ports Port Message Connect to 1 · Semantic source commands msg.sourceComma",
  "url": "node-source-capability-controller.html#outputs",
  "text": "The port order is fixed. Two output ports Port Message Connect to 1 · Semantic source commands msg.sourceCommand = {sourceId, operation, requestId, generation, attempt} ; operation is activate , deactivate or observe . Your source adapter, which carries out the operation and answers with command_result and observed messages. 2 · Theatre target state msg.theatre = {kind: \"target_state\", target: \"source\", requestId, generation, status, observedAt, details, sourceId, action} , with classification and failure when set. The theatre activity controller’s input. details holds observedStatus , readiness (each evidence layer: required, available, active, application, playback, satisfied ), recovery and metrics ( attempts, retries, fallbackUsed )."
 },
 {
  "title": "Source capability controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact d",
  "url": "node-source-capability-controller.html#settings",
  "text": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Area area · string Empty Optional label; empty means no area. Source capabilities sources · JSON object {} Source ID to its capabilities. Required: an empty object is an invalid configuration. Poll milliseconds pollMs · number 2000 How often to send observe while confirming; at least 250. Confirmation timeout confirmationTimeoutMs · number 15000 How long one attempt may take to confirm; at least 1000. Maximum attempts maxAttempts · number 2 Attempts before failing; at least 1."
 },
 {
  "title": "Source capability controller",
  "section": "Source capabilities",
  "description": "Each source has activation , deactivation and confirmation , and may set fallback: true , which is reported as",
  "url": "node-source-capability-controller.html#capabilities",
  "text": "Each source has activation , deactivation and confirmation , and may set fallback: true , which is reported as fallbackUsed once a command is sent to it. Source capabilities · from the example flow {\"streamer\": {\"activation\": \"command\", \"deactivation\": \"command\", \"confirmation\": \"active\"}} command : the node sends the operation on output 1. external : someone else switches it; the node only observes and waits ( waiting_for_source ). unavailable : it can’t be done; the request is reported unavailable ( unobservable-source or unsupported-deactivation ). Confirmation evidence confirmation Ready when the observation shows available status available or active active status active application status active and an application playing status active and playback playing unavailable Never; the source can’t be confirmed A deactivate is confirmed by status inactive . An unavailable observation reports the source unavailable ( adapter-unavailable )."
 },
 {
  "title": "Source capability controller",
  "section": "Retries, failure and manual changes",
  "description": "A failed command_result or a confirmation timeout retries the command until Maximum attempts , then fails with",
  "url": "node-source-capability-controller.html#behaviour",
  "text": "A failed command_result or a confirmation timeout retries the command until Maximum attempts , then fails with the adapter’s reason, command-failed or confirmation-timeout . A reading that stops matching after the source was ready is a person’s change: it is reported as manual_override and never corrected. A ready source is re-read on refresh without leaving ready."
 },
 {
  "title": "Source capability controller",
  "section": "Status",
  "description": "The node status reads <sourceId>: <phase> , with none when no source is in hand. Status appearance by phase Ph",
  "url": "node-source-capability-controller.html#status",
  "text": "The node status reads <sourceId>: <phase> , with none when no source is in hand. Status appearance by phase Phase Appearance idle Grey dot transitioning Blue dot confirming Blue ring waiting_for_source Yellow ring ready Green dot unavailable Yellow dot failed Red ring Any other, such as manual_override Grey ring"
 },
 {
  "title": "Backlighting controller",
  "description": "Message shapes, output ports and settings for TV backlight power. A command acknowledgement never counts as the backlight being on or off.",
  "url": "node-backlighting-controller.html",
  "text": "Message shapes, output ports and settings for TV backlight power. A command acknowledgement never counts as the backlight being on or off."
 },
 {
  "title": "Backlighting controller",
  "section": "On or off, confirmed by a reading.",
  "description": "Owns the power intent of a TV backlight (bias lighting behind the screen) with bounded command retries. It is ",
  "url": "node-backlighting-controller.html#summary",
  "text": "Owns the power intent of a TV backlight (bias lighting behind the screen) with bounded command retries. It is confirmed only when the device reports the wanted power. Your flow’s transport switches the device and reports its power back; for a WLED strip, the wled node is that transport. In the palette it is backlighting controller under home automation ; on the canvas it shows its name, or TV backlighting when unnamed. Looking for wiring? Follow Home theatre , where the theatre activity controller sends this node its backlighting commands. Backlighting is a required target: an activity isn’t ready until it confirms."
 },
 {
  "title": "Backlighting controller",
  "section": "Inputs",
  "description": "Every input is msg.backlighting with a kind . msg.backlighting kinds kind Other fields Use intent requestId, g",
  "url": "node-backlighting-controller.html#inputs",
  "text": "Every input is msg.backlighting with a kind . msg.backlighting kinds kind Other fields Use intent requestId, generation, power , optional requestedAt Request power on or off ; generation is a positive integer. observed generation, power, observedAt The device’s reported power. A reading older than the request is ignored. command_result generation, ok , optional reason The transport’s result. ok: true starts confirmation; it is not confirmation. refresh optional requestId, generation, power From the theatre activity controller: re-read a settled backlight, or adopt the activity’s wanted power after a start with nothing saved. With no request ( requestId null, generation 0: the activity controller’s probe after a start with nothing saved) and none of its own, it sends observe (with requestId null, generation 0 and no power; an observation with any generation answers it), then answers on output 2 with msg.theatre = {kind: \"target_observation\", target, observedAt, values} , where values is {power} , and commands nothing. startup None Re-read the device for the request in hand; never replays the command. tick generation Sent by the node itself on its timer. Intent · msg.backlighting { kind: \"intent\", requestId: \"example-backlighting-1\", generation: 1, power: \"on\" }"
 },
 {
  "title": "Backlighting controller",
  "section": "Outputs",
  "description": "The port order is fixed. Two output ports Port Message Connect to 1 · Backlighting commands msg.backlightingCo",
  "url": "node-backlighting-controller.html#outputs",
  "text": "The port order is fixed. Two output ports Port Message Connect to 1 · Backlighting commands msg.backlightingCommand = {operation, requestId, generation, power, attempt} ; operation is set_power or observe . Your backlight transport, which answers with command_result and observed messages. 2 · Theatre target state msg.theatre = {kind: \"target_state\", target: \"backlighting\", requestId, generation, status, observedAt, details} , with classification and failure when set. The theatre activity controller’s input. details holds the wanted power , the observedPower , recovery and metrics ( attempts, retries, fallbackUsed )."
 },
 {
  "title": "Backlighting controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact d",
  "url": "node-backlighting-controller.html#settings",
  "text": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Area area · string Empty Optional label; empty means no area. Poll ms pollMs · number 2000 How often to send observe while confirming. Confirm ms confirmationTimeoutMs · number 15000 How long one attempt may take to confirm. Attempts maxAttempts · number 2 Power commands before failing."
 },
 {
  "title": "Backlighting controller",
  "section": "Retries, failure and manual changes",
  "description": "An intent sends set_power , then polls with observe until the reported power matches. A failed command_result ",
  "url": "node-backlighting-controller.html#behaviour",
  "text": "An intent sends set_power , then polls with observe until the reported power matches. A failed command_result or a confirmation timeout resends set_power until Attempts , then fails with the transport’s reason, command-failed or confirmation-timeout . A different power reported after the backlight was ready is a person’s change: it is reported as manual_override and never corrected until the next request. A ready backlight is re-read on refresh without leaving ready."
 },
 {
  "title": "Backlighting controller",
  "section": "Status",
  "description": "The node status reads <power>: <phase> , with none when no request is in hand. Status appearance by phase Phas",
  "url": "node-backlighting-controller.html#status",
  "text": "The node status reads <power>: <phase> , with none when no request is in hand. Status appearance by phase Phase Appearance idle Grey dot transitioning Blue dot confirming Blue ring ready Green dot failed Red ring Any other, such as manual_override Grey ring"
 },
 {
  "title": "Activity lighting controller",
  "description": "Message shapes, output ports and settings for the node that styles room lights for a theatre activity. It only touches lights that are already on and not set by a person.",
  "url": "node-activity-lighting-controller.html",
  "text": "Message shapes, output ports and settings for the node that styles room lights for a theatre activity. It only touches lights that are already on and not set by a person."
 },
 {
  "title": "Activity lighting controller",
  "section": "Atmosphere without taking over.",
  "description": "Applies a configured style, such as dim and warm for a film, to room lights that are already on and not manual",
  "url": "node-activity-lighting-controller.html#summary",
  "text": "Applies a configured style, such as dim and warm for a film, to room lights that are already on and not manually owned, and holds them in the room lighting controller while the activity runs. It never switches a light on and never talks to a light itself: it sends standard msg.lighting intents to a room lighting controller . Room-light failure only degrades an activity; it never makes one succeed or fail. In the palette it is activity lighting controller under home automation ; on the canvas it shows its name, or activity lighting when unnamed. Looking for wiring? Follow Home theatre , where the theatre activity controller sends this node its lighting commands."
 },
 {
  "title": "Activity lighting controller",
  "section": "Inputs",
  "description": "Every input is msg.activityLighting with a kind . msg.activityLighting kinds kind Other fields Use intent requ",
  "url": "node-activity-lighting-controller.html#inputs",
  "text": "Every input is msg.activityLighting with a kind . msg.activityLighting kinds kind Other fields Use intent requestId, generation, profile , optional requestedAt Apply a configured profile; generation is a positive integer. observed generation, target, on, observedAt , optional manual, available, values One light’s state. Lights outside the profile and readings older than the request are ignored. available: false fails the profile ( lighting-unavailable ). command_result generation, ok , optional reason Result of an apply. ok: true is not confirmation. refresh optional requestId, generation, profile From the theatre activity controller: re-read the lights, or adopt the activity’s profile after a start with nothing saved. startup None Re-read the lights for the profile in hand, with a deadline. tick generation Sent by the node itself at the confirmation deadline. The theatre activity controller’s lighting command (moved from msg.theatreCommand ) carries profile from the activity’s lighting values, so it already has the intent shape. Its light readings come from the room lighting controller’s third output, which passes on each light’s reading (from the light’s adapter) with whether a person set it; wire that output here, as the Home theatre activity example does. A flow can also send observed events itself, one per light, with the generation of the request they answer, fields and showsLast ."
 },
 {
  "title": "Activity lighting controller",
  "section": "Outputs",
  "description": "The port order is fixed. Two output ports Port Message Connect to 1 · Room-lighting commands msg.activityLight",
  "url": "node-activity-lighting-controller.html#outputs",
  "text": "The port order is fixed. Two output ports Port Message Connect to 1 · Room-lighting commands msg.activityLightingCommand = {operation, requestId, generation, profile, attempt} , operation apply , observe or release . An apply or release also carries msg.lighting . The room lighting controller’s input. 2 · Theatre target state msg.theatre = {kind: \"target_state\", target: \"lighting\", requestId, generation, status, observedAt, details} , with classification and failure when set. The theatre activity controller’s input. details holds the profile , how many lights matched , how many were preserved (off, or a person’s before the request, so left alone), how many were expected , and metrics . Apply · msg.lighting on output 1 { kind: \"intent\", targets: [\"main\"], state: \"ON\", values: {brightnessPct: 25, colorTempKelvin: 2500}, source: \"activity\", owner: \"activity\", updateOnOnly: true, preserveManual: true }"
 },
 {
  "title": "Activity lighting controller",
  "section": "Settings",
  "description": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact d",
  "url": "node-activity-lighting-controller.html#settings",
  "text": "Defaults below are from the editor definition. Timing values are in milliseconds . Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Area area · string Empty Optional label; empty means no area. Profiles JSON profiles · JSON object {} Profile name to {targets, values} . Required: an empty object is an invalid configuration. Owner owner · string activity The owner its lights are held under in the room lighting controller. Give each activity lighting node that feeds the same room controller its own owner. Confirm ms confirmationTimeoutMs · number 15000 How long one apply may take to confirm; at least 1000. Attempts maxAttempts · number 2 Applies before failing; at least 1."
 },
 {
  "title": "Activity lighting controller",
  "section": "Profiles",
  "description": "Profile and light names are lowercase, starting with a letter. targets lists the room’s light names, without d",
  "url": "node-activity-lighting-controller.html#profiles",
  "text": "Profile and light names are lowercase, starting with a letter. targets lists the room’s light names, without duplicates; values is in the package’s own units. Profiles JSON · from the example flow { \"off\": {\"targets\": [], \"values\": {}}, \"tv\": {\"targets\": [\"main\"], \"values\": {\"brightnessPct\": 25, \"colorTempKelvin\": 2500}} } brightnessPct runs from 0 (the dimmest the light goes, not off) to 100. colorTempKelvin must be above 0. Zigbee2MQTT’s own brightness and color_temp were removed in 6.0: a profile using them is an invalid configuration. A profile with no targets, such as off , is ready at once."
 },
 {
  "title": "Activity lighting controller",
  "section": "How lights are judged and released",
  "description": "Each light is judged by what it reports, through its adapter. A light that is off, or a person’s before this r",
  "url": "node-activity-lighting-controller.html#behaviour",
  "text": "Each light is judged by what it reports, through its adapter. A light that is off, or a person’s before this request, is preserved, not styled. A light this request held that a person then changes (the room makes it manual) is a manual override: the node reports manual_override , as the display, receiver and backlight do, and as lighting is optional the theatre is degraded, not failed. The next request takes that light back. A light that has reported none of the profile’s fields since the node started, such as one that only switches on and off, is confirmed by being on; the node warns once per deploy that the values may not apply. Mark such a light onOffOnly on the room so the room won’t send them. Once a light has reported one of the fields, it is held to the profile’s values. A failed command_result or a confirmation timeout re-applies until Attempts , then fails with the reason, command-failed or confirmation-timeout . A light with no reading at all by the confirmation timeout, such as a Zigbee2MQTT group whose state Zigbee2MQTT doesn’t retain after a restart, is unobserved : it isn’t re-applied and fails nothing. The profile is ready without it, the node’s status counts it ( tv: ready · 1 unobserved ), and its report to the theatre carries details.unobserved , so the theatre shows lighting as degraded with reason unobserved while the activity stays ready. The light’s first reading clears it and is judged like any other. The timeout runs after a restart and after a refresh too, so the profile never waits on such a light indefinitely. When a new profile no longer includes a light, including a switch to an off profile with no targets, it sends msg.lighting = {kind: \"release\", owner, targets, source: \"activity\"} for those lights, and the room controller gives each back what it was before the activity took it: one the room was running is restyled, one a person had set gets their values back (see owners stack ). When the lights it last held are unknown (state saved by an older version, whose profile is no longer configured), the release has no targets : {kind: \"release\", owner, source: \"activity\"} releases every light held under its owner."
 },
 {
  "title": "Activity lighting controller",
  "section": "Status",
  "description": "The node status reads <profile>: <phase> , with none when no profile is in hand. Status appearance by phase Ph",
  "url": "node-activity-lighting-controller.html#status",
  "text": "The node status reads <profile>: <phase> , with none when no profile is in hand. Status appearance by phase Phase Appearance idle Grey dot transitioning Blue dot confirming Blue ring ready Green dot failed Yellow ring: an optional target, so the activity is only degraded Any other, such as manual_override Grey ring"
 },
 {
  "title": "Shelly cover",
  "description": "Message shapes, output ports and settings for the adapter between a cover controller and a Shelly Gen2-or-later device in cover mode, over the device’s own MQTT API.",
  "url": "node-shelly-cover.html",
  "text": "Message shapes, output ports and settings for the adapter between a cover controller and a Shelly Gen2-or-later device in cover mode, over the device’s own MQTT API."
 },
 {
  "title": "Shelly cover",
  "section": "Neutral commands in, Shelly MQTT out",
  "description": "The shelly cover node (type home-shelly-cover ; canvas label: its name, or “shelly cover”) translates a cover ",
  "url": "node-shelly-cover.html#summary",
  "text": "The shelly cover node (type home-shelly-cover ; canvas label: its name, or “shelly cover”) translates a cover controller’s neutral commands into the device’s MQTT control commands, and the device’s status reports into neutral cover readings. It has no broker connection of its own: device messages arrive from an MQTT in node, and its publications leave through an MQTT out node. No function nodes, no Home Assistant and no HTTP. Looking for wiring? Follow Wire a shelly cover , then Wire a cover for the controller side."
 },
 {
  "title": "Shelly cover",
  "section": "Inputs",
  "description": "One input takes both the controller’s commands and the device’s MQTT messages. Anything else is ignored. Input",
  "url": "node-shelly-cover.html#inputs",
  "text": "One input takes both the controller’s commands and the device’s MQTT messages. Anything else is ignored. Input messages From Message Effect Cover controller, output 1 msg.cover_command = {operation, position, generation, …} set_position , stop and observe are translated (see device topics ). Other operations, including open and close , are not translated. MQTT in on <prefix>/# <prefix>/status/cover:<id> The cover’s full status: a new reading. MQTT in <prefix>/events/rpc NotifyStatus changes for this cover are laid over the last full status; NotifyFullStatus replaces it. Only a change of position, state or calibration makes a new reading. MQTT in <prefix>/online true or false : availability."
 },
 {
  "title": "Shelly cover",
  "section": "Outputs",
  "description": "Two output ports Port Message Connect to 1 · To the device msg.topic and text msg.payload An MQTT out node on ",
  "url": "node-shelly-cover.html#outputs",
  "text": "Two output ports Port Message Connect to 1 · To the device msg.topic and text msg.payload An MQTT out node on the same broker, with no topic set. 2 · To the cover controller msg.cover = {kind: \"observed\", position, motion, observedAt} , {kind: \"availability\", online} or {kind: \"command_result\", generation, ok: false, reason} The cover controller’s input. Position runs 0 (closed) to 100 (open), as the controller’s does; set invert on the controller if yours runs the other way. Motion is opening , closing or stopped (the device’s open , closed and stopped all read as stopped). observedAt is when the message arrived, never the device’s own clock."
 },
 {
  "title": "Shelly cover",
  "section": "Settings",
  "description": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. ",
  "url": "node-shelly-cover.html#settings",
  "text": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Broker broker · mqtt-broker None Node-RED’s MQTT broker node. With one, the node subscribes to its device’s topics ( <prefix>/# ) and publishes on them itself: output 1 sends nothing, and the MQTT in and MQTT out nodes around it are no longer needed (still wired, a device message on its input is ignored, with a trace, so nothing is doubled). Its own commands come back through its subscription, as through an MQTT in node before, so it still tells them from someone else’s. It reads its cover on each connect, as a Status node’s startup did through the cover controller. Needed for a new node; opening and saving the node offers the first broker in your flows. A node saved before 6.2 keeps using its MQTT in and out nodes, and needs no broker until you choose one ( publishesThroughOutput , with no form row, true for it and cleared when a broker is chosen). MQTT topic prefix topicPrefix · string Empty Required. The device’s topic prefix: its device ID unless a custom prefix is set on the device. It cannot contain + or # . Cover ID channel · number 0 0 , or 1 for a device’s second cover. On the device, MQTT must be on with Enable MQTT Control (the default), or it ignores the commands. RPC status notifications (also the default) report each change. Calibrate the cover on the device first."
 },
 {
  "title": "Shelly cover",
  "section": "Device topics and payloads",
  "description": "Topics sent and read Topic Direction Payload <prefix>/command/cover:<id> Output 1 pos,<0-100> for set_position",
  "url": "node-shelly-cover.html#device-topics",
  "text": "Topics sent and read Topic Direction Payload <prefix>/command/cover:<id> Output 1 pos,<0-100> for set_position (rounded and clamped), stop for stop , status_update for observe . <prefix>/status/cover:<id> Read The cover’s full status JSON, including current_pos , state and pos_control . <prefix>/events/rpc Read NotifyStatus / NotifyFullStatus frames holding cover:<id> . <prefix>/online Read true or false . When only changes have arrived and none carries the position, the node sends status_update to get the full status first."
 },
 {
  "title": "Shelly cover",
  "section": "Availability",
  "description": "<prefix>/online becomes msg.cover = {kind: \"availability\", online} on output 2. When the device comes back onl",
  "url": "node-shelly-cover.html#availability",
  "text": "<prefix>/online becomes msg.cover = {kind: \"availability\", online} on output 2. When the device comes back online, the node also sends status_update , since the cover may have moved while it was away."
 },
 {
  "title": "Shelly cover",
  "section": "Uncalibrated or unknown position",
  "description": "The node never makes up a position. A cover that is not calibrated ( pos_control false, or no current_pos in a",
  "url": "node-shelly-cover.html#calibration",
  "text": "The node never makes up a position. A cover that is not calibrated ( pos_control false, or no current_pos in a full status) or whose position is unknown ( current_pos null) fails the command in hand with {kind: \"command_result\", ok: false, reason} , reason not-calibrated or position-unknown . A set_position is not sent to an uncalibrated cover, which would refuse it. Reports while the device says calibrating are ignored."
 },
 {
  "title": "Shelly cover",
  "section": "Status",
  "description": "waiting for the device (grey ring) until the first status arrives. <state> · <position>% (green), for example ",
  "url": "node-shelly-cover.html#status",
  "text": "waiting for the device (grey ring) until the first status arrives. <state> · <position>% (green), for example stopped · 60% ; ? stands for an unknown position. not calibrated (yellow)."
 },
 {
  "title": "Zigbee2MQTT cover",
  "description": "Message shapes, output ports and settings for the adapter between a cover controller and a Zigbee2MQTT blind, shutter or curtain motor.",
  "url": "node-z2m-cover.html",
  "text": "Message shapes, output ports and settings for the adapter between a cover controller and a Zigbee2MQTT blind, shutter or curtain motor."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "Neutral commands in, Zigbee2MQTT out",
  "description": "The zigbee2mqtt cover node (type home-z2m-cover ; canvas label: its name, its friendly name, or “zigbee2mqtt c",
  "url": "node-z2m-cover.html#summary",
  "text": "The zigbee2mqtt cover node (type home-z2m-cover ; canvas label: its name, its friendly name, or “zigbee2mqtt cover”) translates a cover controller’s neutral commands into Zigbee2MQTT’s set and get messages, and the device’s state reports into neutral cover readings. It has no broker connection of its own: device messages arrive from MQTT in nodes, and its publications leave through an MQTT out node. Never Home Assistant. Looking for wiring? Follow Wire a zigbee2mqtt cover , then Wire a cover for the controller side."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "Inputs",
  "description": "Input messages From Message Effect Cover controller, output 1 msg.cover_command = {operation, position, …} set",
  "url": "node-z2m-cover.html#inputs",
  "text": "Input messages From Message Effect Cover controller, output 1 msg.cover_command = {operation, position, …} set_position , open , close , stop and observe are translated. Other operations are ignored. MQTT in on zigbee2mqtt/<device> The device’s state JSON A reading when it carries a position, a motion or an end state; otherwise ignored. MQTT in on zigbee2mqtt/<device>/availability {\"state\": \"online\"} / \"offline\" , or plain online / offline Availability. Topics are shown with the default base topic; <device> is the friendly name. Messages on other topics are ignored."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "Outputs",
  "description": "Two output ports Port Message Connect to 1 · To the device msg.topic and JSON text msg.payload An MQTT out nod",
  "url": "node-z2m-cover.html#outputs",
  "text": "Two output ports Port Message Connect to 1 · To the device msg.topic and JSON text msg.payload An MQTT out node on the same broker, with no topic set. 2 · To the cover controller msg.cover = {kind: \"observed\", position, state, motion, observedAt, battery, charging} or {kind: \"availability\", online} The cover controller’s input. Fields other than kind and observedAt appear only when reported. observedAt is when the report arrived, never a time the device gives. battery and charging (from charging_status , as text) are passed on."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "Settings",
  "description": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. ",
  "url": "node-z2m-cover.html#settings",
  "text": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Broker broker · mqtt-broker None Node-RED’s MQTT broker node. With one, the node subscribes to its device’s topics ( <base>/<friendly name> and its /availability (exactly these: a friendly name can contain / )) and publishes on them itself: output 1 sends nothing, and the MQTT in and MQTT out nodes around it are no longer needed (still wired, a device message on its input is ignored, with a trace, so nothing is doubled). Its own commands come back through its subscription, as through an MQTT in node before, so it still tells them from someone else’s. It reads its cover on each connect, as a Status node’s startup did through the cover controller. Needed for a new node; opening and saving the node offers the first broker in your flows. A node saved before 6.2 keeps using its MQTT in and out nodes, and needs no broker until you choose one ( publishesThroughOutput , with no form row, true for it and cleared when a broker is chosen). Base topic baseTopic · string zigbee2mqtt Zigbee2MQTT’s base topic, unless changed in its settings. It cannot contain + or # . Friendly name friendlyName · string Empty Required. The device’s friendly name in Zigbee2MQTT. It cannot contain + or # ."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "Device topics and payloads",
  "description": "Messages sent Controller command Topic Payload set_position zigbee2mqtt/<device>/set {\"position\": <0-100>} , r",
  "url": "node-z2m-cover.html#device-topics",
  "text": "Messages sent Controller command Topic Payload set_position zigbee2mqtt/<device>/set {\"position\": <0-100>} , rounded and clamped open zigbee2mqtt/<device>/set {\"state\": \"OPEN\"} close zigbee2mqtt/<device>/set {\"state\": \"CLOSE\"} stop zigbee2mqtt/<device>/set {\"state\": \"STOP\"} observe zigbee2mqtt/<device>/get {\"position\": \"\"} , or {\"state\": \"\"} once the device has reported a state without a position Some devices can’t be read through …/get ; they still report their position whenever it changes."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "How a report is read",
  "description": "Position is position from 0 (closed) to 100 (open), as Zigbee2MQTT reports by default. Set invert on the contr",
  "url": "node-z2m-cover.html#readings",
  "text": "Position is position from 0 (closed) to 100 (open), as Zigbee2MQTT reports by default. Set invert on the controller, or the device’s invert_cover option, if yours runs the other way. Motion comes from motor_state ( opening , closing , stopped ; pause reads as stopped), else moving ( UP , DOWN , STOP ), else running: false as stopped. A cover that reports none is confirmed by the controller’s settle time. End state : with a position, open only at 100 and closed only at 0. Without a position, the device’s OPEN or CLOSE , but only once its motion says it has stopped. Set the controller’s Cover to Open, close and stop only for such a cover; one that reports no motion either cannot be confirmed, and the controller says so."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "Availability",
  "description": "zigbee2mqtt/<device>/availability becomes msg.cover = {kind: \"availability\", online} on output 2. It needs Zig",
  "url": "node-z2m-cover.html#availability",
  "text": "zigbee2mqtt/<device>/availability becomes msg.cover = {kind: \"availability\", online} on output 2. It needs Zigbee2MQTT’s availability setting on; without it the cover is taken as available."
 },
 {
  "title": "Zigbee2MQTT cover",
  "section": "Status",
  "description": "waiting for the device (grey ring) until the first reading. online (green) or offline (grey ring) after an ava",
  "url": "node-z2m-cover.html#status",
  "text": "waiting for the device (grey ring) until the first reading. online (green) or offline (grey ring) after an availability message. After a report: the position, such as 60% , or the end state, or position unknown ; while moving it is prefixed with the motion, such as closing · 60% ."
 },
 {
  "title": "Zigbee2MQTT light",
  "description": "Message shapes, output ports and settings for the adapter between a room lighting controller and a Zigbee2MQTT light or group.",
  "url": "node-z2m-light.html",
  "text": "Message shapes, output ports and settings for the adapter between a room lighting controller and a Zigbee2MQTT light or group."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Neutral commands in, Zigbee2MQTT out",
  "description": "The zigbee2mqtt light node (type home-z2m-light ; canvas label: its name, its friendly name, or “zigbee2mqtt l",
  "url": "node-z2m-light.html#summary",
  "text": "The zigbee2mqtt light node (type home-z2m-light ; canvas label: its name, its friendly name, or “zigbee2mqtt light”) translates a room lighting controller’s neutral light commands into Zigbee2MQTT’s /set payloads, and the light’s reports into neutral readings. Use one per light in the room’s targets. It also tells the room’s own commands from someone else’s, and skips a restyle the light already shows; both depend on Zigbee2MQTT’s units, so they are done here rather than in the room. Looking for wiring? Follow Wire the room . For a light that isn’t Zigbee2MQTT’s, see the neutral light contract ."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Inputs",
  "description": "Input messages From Message Effect Room controller, output 2 msg.light = {kind: \"command\", target, state, brig",
  "url": "node-z2m-light.html#inputs",
  "text": "Input messages From Message Effect Room controller, output 2 msg.light = {kind: \"command\", target, state, brightnessPct?, colorTempKelvin?, transitionSeconds?, extra?, restyle?, source, id} For its own Target only: published on zigbee2mqtt/<device>/set . Others are ignored, so one wire can feed every light’s node. Room controller, output 2 msg.light = {kind: \"observe\", target} For a light: {\"state\": \"\"} on zigbee2mqtt/<device>/get , asking it to report. For a group: nothing, as a group can’t be asked; the room waits for Zigbee2MQTT’s next state for it. MQTT in on zigbee2mqtt/<device>/# The light’s state on zigbee2mqtt/<device> A reading on output 2. MQTT in on zigbee2mqtt/<device>/# A command on zigbee2mqtt/<device>/set Its own echo is dropped; someone else’s becomes an external reading. Retained messages are ignored. MQTT in on zigbee2mqtt/<device>/# zigbee2mqtt/<device>/availability An availability reading. Not for a group. Topics are shown with the default base topic; <device> is the friendly name. Messages on other topics are ignored."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Outputs",
  "description": "Two output ports Port Message Connect to 1 · To the light {topic: \"zigbee2mqtt/<device>/set\", payload, retain:",
  "url": "node-z2m-light.html#outputs",
  "text": "Two output ports Port Message Connect to 1 · To the light {topic: \"zigbee2mqtt/<device>/set\", payload, retain: false} , or /get An MQTT out node with no topic set. 2 · To the room msg.light readings: observed , external , echo-changed , skipped , availability The room lighting controller’s input. An observed reading is {kind: \"observed\", target, on, brightnessPct?, colorTempKelvin?, fields, showsLast, observedAt} : the values are the light’s, converted back to percent and kelvin; fields lists what it has reported since start ( brightness , colorTemp ); showsLast says it shows exactly the last command sent, in Zigbee2MQTT’s own units. observedAt is when the report arrived."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Settings",
  "description": "Editor settings and exact defaults Setting / property Default Meaning Name / name Empty The canvas label. Brok",
  "url": "node-z2m-light.html#settings",
  "text": "Editor settings and exact defaults Setting / property Default Meaning Name / name Empty The canvas label. Broker / broker None Node-RED’s MQTT broker node. With one, the node subscribes to its device’s topics ( <base>/<friendly name> , its /set and its /availability (exactly these: a friendly name can contain / )) and publishes on them itself: output 1 sends nothing, and the MQTT in and MQTT out nodes around it are no longer needed (still wired, a device message on its input is ignored, with a trace, so nothing is doubled). Its own commands come back through its subscription, as through an MQTT in node before, so it still tells them from someone else’s. It reads its light on each connect (not a group, which Zigbee2MQTT can’t be asked), as a Status node’s startup did through the room. Needed for a new node; opening and saving the node offers the first broker in your flows. A node saved before 6.2 keeps using its MQTT in and out nodes, and needs no broker until you choose one ( publishesThroughOutput , with no form row, true for it and cleared when a broker is chosen). Target / target None: required The light’s id in the room controller’s Targets JSON. Base topic / baseTopic zigbee2mqtt Zigbee2MQTT’s base topic. It cannot contain + or # . Friendly name / friendlyName None: required The light’s or group’s name in Zigbee2MQTT. It cannot contain + or # . Zigbee2MQTT group / group Off On for a Zigbee2MQTT group of lights rather than one light."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Device payloads",
  "description": "Each command becomes the payload the room controller sent before 6.0, field for field and in the same order: t",
  "url": "node-z2m-light.html#device-topics",
  "text": "Each command becomes the payload the room controller sent before 6.0, field for field and in the same order: the state, any other fields the intent gave (an effect, say), brightness (1-254, from percent; 0 % is 1, the dimmest), color_temp (mireds, from kelvin), then transition unless the intent set one. An OFF is {\"state\":\"OFF\"} alone. A styled ON, as published {\"state\":\"ON\",\"brightness\":64,\"color_temp\":400,\"transition\":1} A restyle ( restyle: true , sent only for a light already on) is not published when the light’s last report already shows exactly those values; the node answers {kind: \"skipped\", target, id, observedAt} with the time of that report. Any other command is always published."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Its own commands and someone else’s",
  "description": "Its own: a command on /set exactly as it sent one in the last 5 seconds, even seen twice. Its own, changed on ",
  "url": "node-z2m-light.html#echo",
  "text": "Its own: a command on /set exactly as it sent one in the last 5 seconds, even seen twice. Its own, changed on the way: an ON or OFF arriving while one of its own with that power hasn’t come back, as when a function cut it to {\"state\":\"ON\"} : an echo-changed reading, never someone else’s. Someone else’s: anything else: {kind: \"external\", target, state, setsValues, observedAt} , where setsValues says it sets brightness, colour or an effect. The room may take it as a person’s change."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Groups",
  "description": "A group takes the same commands. Zigbee2MQTT works out a group’s state itself, from what it sent and its membe",
  "url": "node-z2m-light.html#groups",
  "text": "A group takes the same commands. Zigbee2MQTT works out a group’s state itself, from what it sent and its members’ reports, so the group’s report follows a command at once. A group has no availability and can’t be asked to report, so it ignores observe : the room waits for Zigbee2MQTT’s next state for the group. Passing on an old state instead could settle a command still on its way. Switch on the group’s retain in Zigbee2MQTT : retain: true under the group in Zigbee2MQTT’s configuration.yaml (it is off by default). Zigbee2MQTT doesn’t retain a group’s state by default, so after a restart the room has no reading for the group until it changes, and an activity that holds it waits on it. With retain, the broker gives the node the group’s last state as soon as its MQTT in node subscribes."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Availability",
  "description": "zigbee2mqtt/<device>/availability becomes {kind: \"availability\", target, online} on output 2. The room shows i",
  "url": "node-z2m-light.html#availability",
  "text": "zigbee2mqtt/<device>/availability becomes {kind: \"availability\", target, online} on output 2. The room shows it on the light’s control sensor and in its status, and changes nothing because of it. It needs Zigbee2MQTT’s availability setting on."
 },
 {
  "title": "Zigbee2MQTT light",
  "section": "Status",
  "description": "waiting for the device (or group · waiting for its state ), grey ring, until the first report. group · no stat",
  "url": "node-z2m-light.html#status",
  "text": "waiting for the device (or group · waiting for its state ), grey ring, until the first report. group · no state yet: set retain: true for it in Zigbee2MQTT (yellow ring): a group that has had no state 30 seconds after it started. A group can’t be asked for its state, so without Zigbee2MQTT retaining it there is none until it changes, and an activity holding it reports it unobserved . on · 25% 2500K (green) or off (grey) after a report. offline (grey ring) after an availability message saying so."
 },
 {
  "title": "Shelly switch",
  "description": "Message shapes, output ports, modes and settings for the adapter for one switch channel of a Shelly Gen2-or-later relay, over the device’s own MQTT API.",
  "url": "node-shelly-switch.html",
  "text": "Message shapes, output ports, modes and settings for the adapter for one switch channel of a Shelly Gen2-or-later relay, over the device’s own MQTT API."
 },
 {
  "title": "Shelly switch",
  "section": "One switch channel, used as the device is set up",
  "description": "The shelly switch node (type home-shelly-switch ; canvas label: its name, or “shelly switch”) connects one swi",
  "url": "node-shelly-switch.html#summary",
  "text": "The shelly switch node (type home-shelly-switch ; canvas label: its name, or “shelly switch”) connects one switch channel of a Shelly Gen2-or-later relay. It reads the device’s own configuration for the channel and works in one of two ways: detached , where the wall switch’s presses go to a switch lighting policy and the relay keeps smart bulbs powered, or relay , where the relay is the light. With a Target , the relay is a room light in either mode, and the node is its adapter on the neutral light contract : the room switches the relay, and sees its state (see As a room light ). It has no broker connection of its own: device messages arrive from an MQTT in node, and its publications leave through an MQTT out node. No function nodes, no Home Assistant and no HTTP. Looking for wiring? Follow Wire a shelly switch , then the wall switches guide for the switch policy."
 },
 {
  "title": "Shelly switch",
  "section": "Inputs",
  "description": "Input messages From Message Effect MQTT in on <prefix>/# Device topics (see device topics ) Configuration repl",
  "url": "node-shelly-switch.html#inputs",
  "text": "Input messages From Message Effect MQTT in on <prefix>/# Device topics (see device topics ) Configuration replies, status, change notifications, button events and availability; with a Target, also commands on the relay’s command topic. Room controller, output 2 (with a Target) msg.light = {kind: \"command\", target, state, …} or {kind: \"observe\", target} For its own Target only: on or off to the relay, or status_update to have it report. Others are ignored, so one wire can feed every light’s node. Relay mode only msg.switchCommand = {power: \"on\" | \"off\"} Switches the relay. Refused in detached mode, before the mode is known, and while the device is offline; any other power is ignored. msg.status from a Status node MQTT out’s “connected” Taken as the startup message ( msg.shellySwitch = {kind: \"startup\"} ), so the node reads the device’s configuration again once the broker can take it. Wire in a Status node whose scope is your MQTT out node. Any other status message is ignored."
 },
 {
  "title": "Shelly switch",
  "section": "Outputs",
  "description": "Three output ports Port Message Connect to 1 · To the device msg.topic and text msg.payload An MQTT out node o",
  "url": "node-shelly-switch.html#outputs",
  "text": "Three output ports Port Message Connect to 1 · To the device msg.topic and text msg.payload An MQTT out node on the same broker, with no topic set. 2 · Switch messages or relay state Detached: msg.source messages; relay: msg.switchState (see Mode ) Detached: a switch lighting policy , whose intents go to the room controller. Relay: no node of this package reads that state; with a Target, the room reads output 3 instead. 3 · To the room (with a Target) msg.light readings: observed , external , skipped , sent , availability The room lighting controller’s input. Readings are timed ( observedAt ) when they arrive."
 },
 {
  "title": "Shelly switch",
  "section": "Settings",
  "description": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. ",
  "url": "node-shelly-switch.html#settings",
  "text": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Broker broker · mqtt-broker None Node-RED’s MQTT broker node. With one, the node subscribes to its device’s topics ( <prefix>/# ) and publishes on them itself: output 1 sends nothing, and the MQTT in and MQTT out nodes around it are no longer needed (still wired, a device message on its input is ignored, with a trace, so nothing is doubled). Its own commands come back through its subscription, as through an MQTT in node before, so it still tells them from someone else’s. Needed for a new node; opening and saving the node offers the first broker in your flows. A node saved before 6.2 keeps using its MQTT in and out nodes, and needs no broker until you choose one ( publishesThroughOutput , with no form row, true for it and cleared when a broker is chosen). MQTT topic prefix topicPrefix · string Empty Required. The device’s topic prefix: its device ID unless a custom prefix is set on the device. It cannot contain + or # . Switch ID channel · number 0 0 , or the number of another switch on a device with more than one. Use one node per switch. Mode mode · enum auto auto (“As the device is set up”) reads the device’s configuration; detached or relay override it, and are needed when it can’t be read. Target target · string Empty Optional. The room’s id for the light the relay is, in the room controller’s Targets JSON, marked \"onOffOnly\": true . Set, the node is that light’s adapter in either mode. Empty, the relay isn’t a room light, as before. On the device, MQTT must be on with Enable MQTT Control and RPC status notifications (both the default)."
 },
 {
  "title": "Shelly switch",
  "section": "Mode",
  "description": "With auto , the device’s in_mode for switch:<id> decides: detached means detached, and every other mode (follo",
  "url": "node-shelly-switch.html#mode",
  "text": "With auto , the device’s in_mode for switch:<id> decides: detached means detached, and every other mode (follow, flip, momentary and the rest) means relay. The input’s type (switch or button) decides what detached mode emits. What each mode emits on output 2 Mode Event Message Detached, switch-type input Input on or off msg.source = \"switch\" , msg.payload = {state} ; every reading from the device’s whole status carries baseline: true , while a change notification does not Detached, button-type input single_push , double_push , long_push msg.source = \"switch-action\" , msg.payload = {action} with single , double or long . The switch policy acts on single and double; long is passed on for later use. Other events are ignored. Detached Device offline or online msg.source = \"switch-availability\" , msg.payload \"online\" or \"offline\" Relay Relay output reported msg.switchState = {kind: \"observed\", on, person, observedAt} ; person is true when the device names its own input as the source of the change Relay Device offline or online msg.switchState = {kind: \"availability\", online} In detached mode without a Target, the relay is never switched from here. If it reports off, the status warns that the bulbs have lost power."
 },
 {
  "title": "Shelly switch",
  "section": "As a room light",
  "description": "With a Target , the relay is that room light, whether the device is detached (the wall switch’s presses still ",
  "url": "node-shelly-switch.html#room-light",
  "text": "With a Target , the relay is that room light, whether the device is detached (the wall switch’s presses still go to the switch policy, and the room switches the relay) or not (the relay follows the switch, and the room can switch it too). The node speaks the room’s neutral light contract, like the zigbee2mqtt light : Commands: the room’s ON or OFF for its Target becomes on or off on <prefix>/command/switch:<id> . A relay has no brightness, colour or fade, so those are left out: mark the target \"onOffOnly\": true , and the room never sends them. An observe becomes status_update there. A restyle of a relay already on is answered skipped . Readings on output 3: observed with the relay’s output ( fields: [] ; showsLast when it matches the last command sent), each time it reports. A person’s change: external when the relay’s output changes with none of this node’s commands pending (a person at a switch the relay follows, the Shelly app), or when someone else’s on , off or toggle appears on the relay’s command topic. Its own commands’ echoes there are recognised as its own. The room may take an external change as a person’s. Availability: {kind: \"availability\", target, online} , shown by the room, never acted on. msg.switchState and msg.switchCommand in relay mode work as before, for flows that use them."
 },
 {
  "title": "Shelly switch",
  "section": "Device topics and payloads",
  "description": "Topics sent and read Topic Direction Payload <prefix>/rpc Output 1 {\"id\": <n>, \"src\": \"<prefix>/home-automatio",
  "url": "node-shelly-switch.html#device-topics",
  "text": "Topics sent and read Topic Direction Payload <prefix>/rpc Output 1 {\"id\": <n>, \"src\": \"<prefix>/home-automation-switch-<id>\", \"method\": \"Shelly.GetConfig\"} <prefix>/command Output 1 status_update : the device publishes its whole status <prefix>/command/switch:<id> Output 1 (relay mode, or with a Target); read with a Target on or off , or status_update for an observe. Read: its own commands’ echoes, and anyone else’s on , off or toggle . <prefix>/home-automation-switch-<id>/rpc Read The configuration reply: switch:<id> ( in_mode , input_id ) and its input:<n> ( type ). Replies to other requests are ignored. <prefix>/status Read The whole status: the baseline for the relay and the input. <prefix>/status/switch:<id> Read The relay’s status. <prefix>/events/rpc Read NotifyStatus for the relay or input, and NotifyEvent button events. <prefix>/online Read true or false . The reply is addressed under the device’s prefix, so the same MQTT in node on <prefix>/# receives it."
 },
 {
  "title": "Shelly switch",
  "section": "Startup and availability",
  "description": "Once the flows have started, and whenever the device comes back online, the node sends Shelly.GetConfig and st",
  "url": "node-shelly-switch.html#availability",
  "text": "Once the flows have started, and whenever the device comes back online, the node sends Shelly.GetConfig and status_update . If no configuration arrives within 10 seconds, a configuration read earlier is kept; if none was read, it is taken as unreadable, and with Mode on auto nothing is passed on until Mode says how. Offline and online are passed on as shown under Mode , and relay commands are refused while offline."
 },
 {
  "title": "Shelly switch",
  "section": "Status",
  "description": "reading the device’s configuration (grey ring) while the request is out. configuration unreadable: set Mode (r",
  "url": "node-shelly-switch.html#status",
  "text": "reading the device’s configuration (grey ring) while the request is out. configuration unreadable: set Mode (red ring). The mode found, such as detached, switch input (green). With Mode set, it reads detached (set) or relay (set) , followed by what the device says, if read. Relay mode adds the relay state: · on or · off ; with a Target, the light’s: · hall on . Detached, without a Target, with the relay off adds · relay off: bulbs unpowered (yellow ring). offline (grey ring)."
 },
 {
  "title": "WLED",
  "description": "Message shapes, output port and settings for the adapter between a backlighting controller and a WLED light strip.",
  "url": "node-wled.html",
  "text": "Message shapes, output port and settings for the adapter between a backlighting controller and a WLED light strip."
 },
 {
  "title": "WLED",
  "section": "Backlight power through WLED’s own MQTT",
  "description": "The wled node (type home-wled ; canvas label: its name, its device topic, or “wled”) turns a backlighting cont",
  "url": "node-wled.html#summary",
  "text": "The wled node (type home-wled ; canvas label: its name, its device topic, or “wled”) turns a backlighting controller ’s set_power into WLED’s ON or OFF , and WLED’s brightness reports into the controller’s readings. It talks to WLED through Node-RED’s MQTT broker node, with no MQTT in or out nodes, no function nodes, and never Home Assistant."
 },
 {
  "title": "WLED",
  "section": "Inputs",
  "description": "Input messages From Message Effect Backlighting controller, output 1 msg.backlightingCommand = {operation: \"se",
  "url": "node-wled.html#inputs",
  "text": "Input messages From Message Effect Backlighting controller, output 1 msg.backlightingCommand = {operation: \"set_power\", generation, power} Publishes ON or OFF on the device topic and answers command_result ok; while WLED is offline, publishes nothing and answers not ok, reason unavailable . Backlighting controller, output 1 msg.backlightingCommand = {operation: \"observe\", generation} Answers with the last power WLED reported, while it is online. With no report since Node-RED started, it answers when WLED next reports. The broker <device topic>/g , <device topic>/status Its readings and availability (see below). An MQTT in node wired to its input changes nothing."
 },
 {
  "title": "WLED",
  "section": "Output",
  "description": "One output port Port Message Connect to 1 · To the backlighting controller msg.backlighting = {kind: \"observed",
  "url": "node-wled.html#outputs",
  "text": "One output port Port Message Connect to 1 · To the backlighting controller msg.backlighting = {kind: \"observed\", generation, power, observedAt} or {kind: \"command_result\", generation, ok, reason} The backlighting controller’s input. generation is the command in hand’s; nothing is passed on before the controller’s first command. observedAt is when the answer is given."
 },
 {
  "title": "WLED",
  "section": "Settings",
  "description": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. ",
  "url": "node-wled.html#settings",
  "text": "Editor settings and exact defaults Setting / property Default Meaning Name name · string Empty Display label. Broker broker · mqtt-broker None Required. Node-RED’s MQTT broker node, the one WLED connects to. The node subscribes to exactly <device topic>/g and <device topic>/status , and publishes on the device topic. Device topic deviceTopic · string Empty Required. WLED’s Device Topic, from its Config → Sync Interfaces → MQTT (WLED’s own default is wled/ and its MAC address). It cannot contain + or # ."
 },
 {
  "title": "WLED",
  "section": "How WLED is read",
  "description": "Power comes from the brightness WLED publishes on <device topic>/g after every change: 0 is off, anything else",
  "url": "node-wled.html#readings",
  "text": "Power comes from the brightness WLED publishes on <device topic>/g after every change: 0 is off, anything else on. Whose change isn’t said: WLED reports a change from its own app, a button or another system the same as one from this node. The backlighting controller judges a reading against what it wants, so a change it didn’t make is a manual change. Availability is online or offline on <device topic>/status . WLED’s documentation doesn’t describe this topic. On the firmware we tested, the broker holds a retained online for it, and WLED publishes online again, not retained, with each change. Until it reports, a command is sent; only offline refuses one. After a restart there is no reading until WLED next changes. On the firmware we tested, each change publishes /g , /c , /v and /status , none of them retained, and nothing reads its state on demand over MQTT: {\"v\":true} , or an {\"on\":true} that changes nothing, on <device topic>/api publishes nothing. So after a start with nothing saved, the theatre’s recovery gets no backlighting answer until then."
 },
 {
  "title": "Theatre MQTT contract",
  "description": "The topics, payloads and guarantees of the whole-theatre MQTT contract: one request topic in, retained state topics out, and an optional Home Assistant panel.",
  "url": "contract-theatre-mqtt.html",
  "text": "The topics, payloads and guarantees of the whole-theatre MQTT contract: one request topic in, retained state topics out, and an optional Home Assistant panel."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "One request in. Retained state out.",
  "description": "The theatre state contract node bridges the theatre activity controller to MQTT and, optionally, Home Assistan",
  "url": "contract-theatre-mqtt.html#summary",
  "text": "The theatre state contract node bridges the theatre activity controller to MQTT and, optionally, Home Assistant, without moving policy into flow wiring. It accepts activity requests on one topic, passes them on as intents, and publishes each controller snapshot as retained state topics. Looking for wiring? Follow the Home theatre guide for the full flow, and Home Assistant for the optional panel."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Public contract",
  "description": "Each surface of the contract carries a fixed shape and keeps one invariant. Public contract Surface Contract I",
  "url": "contract-theatre-mqtt.html#contract",
  "text": "Each surface of the contract carries a fixed shape and keeps one invariant. Public contract Surface Contract Invariant Request Unique request ID, configured activity and timestamp Retained requests are inert Desired state Activity and generation One current request identity Target evidence Status, observation time, classification and failure Older evidence cannot overwrite newer evidence Outcome Current activity, phase, readiness and failure Ready requires all mandatory targets Operations Latency, retries, fallbacks, outcomes and objective status Expected waiting does not become a false failure"
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Base topic",
  "description": "Every topic sits under one base topic. With the contract node's Base topic setting empty, it is home/<area>/th",
  "url": "contract-theatre-mqtt.html#base-topic",
  "text": "Every topic sits under one base topic. With the contract node's Base topic setting empty, it is home/<area>/theatre , made from the node's Area ; set it to use any concrete MQTT topic instead. Leading and trailing slashes are dropped, and wildcards ( + , # ) are refused. Below, <base> stands for it."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Request",
  "description": "Send requests to <base>/request , not retained. The payload is a JSON object (a string or buffer is parsed as ",
  "url": "contract-theatre-mqtt.html#request",
  "text": "Send requests to <base>/request , not retained. The payload is a JSON object (a string or buffer is parsed as JSON): Request · <base>/request { \"requestId\": \"movie-0001\", \"activity\": \"movie\", \"requestedAt\": \"2026-01-01T20:00:00.000Z\" } Request fields Field Rule requestId Required and unique per request: starts with a letter or digit, then up to 127 letters, digits, . , _ , : or - . Repeating the latest request's ID with the same activity is a duplicate, not a new request; reusing it for another activity is an error. Only the latest request is compared: an older ID sent again is a new request. activity Required; must be one of the activities configured in the contract's Activities JSON . requestedAt Optional ISO timestamp; when absent, the time of receipt. A new request takes the next generation and resumes automation. On acceptance the contract publishes desired , sets phase to requested , clears failure and sets readiness to unknown until the controller reports. Retained requests are inert A request that arrives retained is ignored and traced as retained-request , so a broker replaying an old request never starts an activity. Command and request topics must not be retained."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Retained state topics",
  "description": "Every publication below is retained, so a restarted subscriber rebuilds the theatre's state at once. A snapsho",
  "url": "contract-theatre-mqtt.html#state-topics",
  "text": "Every publication below is retained, so a restarted subscriber rebuilds the theatre's state at once. A snapshot from an older generation than the current request is ignored as stale-generation . Each topic is published only when its payload changes, leaving aside the fields that only say when or how long ago something was seen ( observedAt , evaluatedAt , and in metrics each target’s observationAgeMs ): a steady activity whose targets keep re-confirming publishes nothing new, so Home Assistant records no change for every refresh. A target’s health therefore keeps the time it last changed, not the time it was last confirmed; a target that stops answering is still shown, as readiness going degraded with the target named stale or no-response in transition . Each startup, and with a Broker each connect, publishes every topic again with the next snapshot, in case the broker lost them. Retained state topics Topic Payload <base>/desired JSON {requestId, generation, activity, requestedAt} of the current request, or null when there is none. <base>/current The current activity, or unknown . <base>/phase The controller's phase, for example idle , requested , preparing , transitioning , confirming , recovering or failed . <base>/transition JSON {startedAt, completedAt, degraded} : when the latest transition started and finished, and which targets it left degraded (each {target, reason} ). <base>/failure The failure of the latest transition, or null . <base>/readiness unknown , available , degraded or unavailable . <base>/metrics Transition and per-target counters; see Metrics . <base>/slo The operational objective assessment; see Operational objective . <base>/slo/breach ON while the objective is breached, otherwise OFF . <base>/health/<target> One per target ( display , avr , source , lighting , backlighting ): JSON {status, observedAt, classification, failure, details} ; status is unknown until the target reports. <base>/availability online or offline : whether the contract node is running. See Readiness and availability . Display, AVR and backlighting are mandatory targets; lighting is optional, so its failure degrades a transition instead of failing it."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Readiness and availability",
  "description": "These are two different questions on two topics. <base>/readiness says whether the theatre is ready: unknown ,",
  "url": "contract-theatre-mqtt.html#readiness-availability",
  "text": "These are two different questions on two topics. <base>/readiness says whether the theatre is ready: unknown , available , degraded or unavailable . Ready requires all mandatory targets. Before 4.0 this value was on <base>/availability . <base>/availability says whether the contract node is running: online once the flows have started, offline as it stops. Home Assistant shows the theatre entities as available only while it is online . On a full deploy, a restart or a shutdown, Node-RED closes the broker connection at the same moment, so set the MQTT broker node's Birth message to online and its Close message and Will message to offline , all retained, on <base>/availability ."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Metrics",
  "description": "<base>/metrics exposes transition latency and outcome counts plus per-target evidence. Before the first snapsh",
  "url": "contract-theatre-mqtt.html#metrics",
  "text": "<base>/metrics exposes transition latency and outcome counts plus per-target evidence. Before the first snapshot it carries zeros: Metrics · <base>/metrics { \"requests\": 0, \"ready\": 0, \"failed\": 0, \"superseded\": 0, \"manualOverrides\": 0, \"driftEvents\": 0, \"recoveriesAdopted\": 0, \"recoveriesUnknown\": 0, \"lastTransitionMs\": null, \"maxTransitionMs\": null, \"lastOutcome\": null, \"targets\": {} } Under targets , each target carries retry, fallback, confirmation-latency, failure, manual-override and availability evidence. Its lastConfirmationMs is how long after the transition started the target first reported ready; its refreshes leave it, and the next transition times it again."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Operational objective",
  "description": "The contract keeps a bounded window of transition outcomes and publishes the success rate and the p50 and p95 ",
  "url": "contract-theatre-mqtt.html#slo",
  "text": "The contract keeps a bounded window of transition outcomes and publishes the success rate and the p50 and p95 transition latency on <base>/slo , with a status and a reason . A ready outcome whose transition wasn’t timed counts towards the success rate but not the latency, and stays untimed after a restart. Objective settings and limits Setting Default Range Latency budget (ms) 60000 1000 to 3600000 Success objective (%) 95 50 to 100 SLO window 20 5 to 100 outcomes Minimum samples 5 1 to the window size Values are rounded to whole numbers, and a value outside its range is clamped to the nearest limit, not refused. Objective status Status Reason When breached transition_failed The phase is failed ; breaches at once. breached transition_timeout A transition in progress has run past the latency budget; breaches at once. learning minimum_samples Otherwise, until the window holds the minimum samples. breached success_objective With enough samples, the success rate is below the objective. breached latency_budget With enough samples, p95 latency is above the budget. at_risk error_budget_consumed or latency_headroom Success rate below 100%, or p95 latency at 80% of the budget or more. healthy objectives_met Otherwise, with enough samples. Expected waiting_for_source and physical manual ownership do not create false operational failures."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Observation time and clock skew",
  "description": "Each target report the activity controller receives ( msg.theatre with kind: \"target_state\" ) must carry an IS",
  "url": "contract-theatre-mqtt.html#observations",
  "text": "Each target report the activity controller receives ( msg.theatre with kind: \"target_state\" ) must carry an ISO observedAt , and only reports for the current generation count; others are ignored as stale-generation . A report time more than one second ahead of Node-RED's clock is treated as observed on receipt and traced as clock-skew , so one device with a wrong clock cannot hold back later reports. A report older than the target's latest one is ignored as out-of-order , so older evidence never overwrites newer evidence."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Manual ownership",
  "description": "Unsolicited display, AVR, source and backlighting changes latch manual ownership instead of issuing corrective",
  "url": "contract-theatre-mqtt.html#manual",
  "text": "Unsolicited display, AVR, source and backlighting changes latch manual ownership instead of issuing corrective commands. A newer explicit activity request resumes automation. A target controller that starts with nothing saved (a redeploy or restart without a context store) takes the activity's wanted values from the activity controller's next refresh and only reads its device: it reports ready when the device already matches, and a manual override with reason adopted-mismatch when it doesn't, sending no command until the next request."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Recovery",
  "description": "After a redeploy or restart with nothing saved, the activity controller has no request: the activity is unknow",
  "url": "contract-theatre-mqtt.html#recovery",
  "text": "After a redeploy or restart with nothing saved, the activity controller has no request: the activity is unknown and nothing is commanded until the next request, so a redeploy or restart never switches a running activity off. The controller does not adopt an activity from the devices on its own: adopting one needs a recovery message carrying observations, and the controller's own fallback, when its recovery refreshes run out, recovers with no observations (traced no-observations ), which leaves the activity unknown. After a cold start The activity controller asks every target what its device shows and adopts the one activity that matches, if any, without commanding anything; the contract then publishes it as for any ready activity. While it is unknown, <base>/phase shows idle (the controller isn't working on anything) and <base>/current shows unknown until the next request, even if something is playing."
 },
 {
  "title": "Theatre MQTT contract",
  "section": "Home Assistant entities",
  "description": "With Home Assistant discovery on, the contract announces these entities under the discovery prefix once the fl",
  "url": "contract-theatre-mqtt.html#home-assistant",
  "text": "With Home Assistant discovery on, the contract announces these entities under the discovery prefix once the flows start, before online , and again at a startup event; switched off, the next startup event clears them. They read the topics above and follow <base>/availability . Home Assistant is an optional panel, never the device path. See Home Assistant . Home Assistant entities Entity Component Reads or writes Requested activity select Sends requests; shows the desired activity. Current activity sensor <base>/current Phase sensor <base>/phase , with the transition details as attributes. Readiness sensor <base>/readiness Failure sensor <base>/failure Transition latency sensor <base>/metrics Operational SLO sensor <base>/slo Operational SLO breach binary_sensor <base>/slo/breach : the actionable problem sensor. Display health, Avr health, Source health, Lighting health, Backlighting health sensor <base>/health/<target> The device is named <Display name> Theatre Controller ."
 },
 {
  "title": "Contract examples",
  "description": "Executable, transport-neutral examples of state, intent and evidence across component boundaries.",
  "url": "contract-examples.html",
  "text": "Seven deterministic examples call the same pure reducers used by the Node-RED adapters. Synthetic configuration keeps transport ownership visible."
 },
 {
  "title": "Contract examples",
  "section": "Contract examples",
  "description": "Each example declares configuration, applies deterministic inputs, asserts one consumer-visible invariant and ",
  "url": "contract-examples.html#examples",
  "text": "Each example declares configuration, applies deterministic inputs, asserts one consumer-visible invariant and returns its commands or outputs as JSON. Occupancy fusion Sensor policy Motion establishes occupancy. Optional presence can hold it after motion clears, but cannot establish it alone. Contract presence:on → no output motion:on → occupied:true motion:off → held presence:off → occupied:false Open executable example → Occupancy to lighting intent Motion policy Dark, enabled occupancy produces semantic intent; it does not publish a device command. Contract { occupied: true, trigger: \"motion\" } → { kind: \"intent\", state: \"ON\", targets: [\"ceiling\", \"worktop\"] } Open executable example → Explicit manual brightness Switch policy A classified double action becomes one full-brightness intent with manual ownership. Contract { action: \"double\" } → { state: \"ON\", manual: true, values: { brightnessPct: 100 } } Open executable example → Room lighting boundary Command owner The room controller turns semantic lighting intent into a neutral command for each light, recording its policy source; the light’s adapter turns that into the device’s own message. Contract { kind: \"intent\", state: \"ON\", source: \"motion\" } → { light: { kind: \"command\", target: \"ceiling\", state: \"ON\", source: \"motion\" } } → zigbee2mqtt light { topic: \"demo/ceiling/set\" } Open executable example → Media-source evidence Readiness policy Command success enters confirmation. Fresh active-application evidence is what satisfies application readiness. Contract activate → command_result:ok → confirming observed:{ active, application, paused } → ready Open executable example → Bounded receiver volume Command ownership Rapid relative requests accumulate against one target. Fresh confirmation releases ownership so later external adjustment becomes the baseline. Contract relative:+1 → MV31 relative:+1 → MV32 observed MV32 → ready · released observed MV28 → −52 dB, the external baseline Open executable example → Theatre activity Coordination One activity request fans out semantic target intents and reaches ready only from fresh mandatory evidence. Contract movie_night request → display · receiver · source · lighting · backlighting → fresh target evidence → { phase: \"ready\", availability: \"available\" } Open executable example →"
 },
 {
  "title": "Contract examples",
  "section": "Run the contracts",
  "description": "The aggregate command compiles the package, executes all seven examples and fails if an asserted invariant cha",
  "url": "contract-examples.html#run",
  "text": "The aggregate command compiles the package, executes all seven examples and fails if an asserted invariant changes. Terminal npm ci npm run examples"
 },
 {
  "title": "Contract examples",
  "section": "What the examples preserve",
  "description": "Policy before transport Sensor and user events become semantic outcomes before a target owner selects a protoc",
  "url": "contract-examples.html#preserve",
  "text": "Policy before transport Sensor and user events become semantic outcomes before a target owner selects a protocol. Evidence before ready Command acceptance never substitutes for a fresh observation of the required state. Finite state Timers, retries, generations and traces remain bounded and stale work stays inert. Privacy boundary Every identifier, topic, profile, timestamp and coordinate in these examples is synthetic. The examples contain no device inventory, addresses, credentials, entity identifiers, flow exports or operational records."
 },
 {
  "title": "Releases and upgrading",
  "description": "Supported versions, version numbering, and what to do when upgrading to each major version.",
  "url": "releases.html",
  "text": "Which Node-RED and Node.js versions the package needs, how its versions are numbered, and what each major version changes and asks of you. The GitHub release notes have the detail of every release."
 },
 {
  "title": "Releases and upgrading",
  "section": "Supported versions",
  "description": "The package needs Node-RED 5.0.0 or newer. From 6.0.0, it also needs Node.js 24 or newer. Supported versions P",
  "url": "releases.html#supported",
  "text": "The package needs Node-RED 5.0.0 or newer. From 6.0.0, it also needs Node.js 24 or newer. Supported versions Package Node-RED Node.js 6.x 5.0.0 or newer 24 or newer 5.x 5.0.0 or newer 22.9 or newer Node-RED 5 itself runs on Node.js 22.9 or newer; from 6.0.0 this package asks for 24. Check your Node.js version before you update the package."
 },
 {
  "title": "Releases and upgrading",
  "section": "How versions are numbered",
  "description": "Major: the first number Everything a flow, a saved node or an installation must act on: for example, raising t",
  "url": "releases.html#numbering",
  "text": "Major: the first number Everything a flow, a saved node or an installation must act on: for example, raising the Node.js version the package needs, or removing old units or setting names. Minor: the second number New nodes and features. Patch: the third number Fixes. An old form, such as an old unit or setting name, keeps working through the rest of its major series, with a warning in the log where it can. It is removed in the next major version. This page has a section for each major version; minor and patch releases are described in the GitHub release notes ."
 },
 {
  "title": "Releases and upgrading",
  "section": "How to upgrade",
  "description": "Read before you update. Read the section below for each major version you cross, the supported versions , and ",
  "url": "releases.html#upgrade",
  "text": "Read before you update. Read the section below for each major version you cross, the supported versions , and the GitHub release notes for the releases in between. Update the package. In Node-RED, open Manage palette and update @avantics/node-red-home-automation there. Or, from your Node-RED user directory, install the version you want and restart Node-RED. Pin the version you use. Name the exact version, so a later install doesn’t move you on before you have read its notes. Check your flows. Open and save the nodes the notes mention, and look for nodes marked invalid and warnings in the log. Terminal · from your Node-RED user directory npm install @avantics/node-red-home-automation@<version> Each GitHub Release also attaches the package tarball and its SHA-256 checksum, which Manage palette → Install → Upload module accepts."
 },
 {
  "title": "Releases and upgrading",
  "section": "Version 6",
  "description": "6.0 takes circadian lighting out of the room controller into its own node, the circadian lighting policy , whi",
  "url": "releases.html#v6",
  "text": "6.0 takes circadian lighting out of the room controller into its own node, the circadian lighting policy , which sends rooms the style to use. The room controller applies whatever style it is sent, and a light can be marked on/off only. The room controller also stops speaking Zigbee2MQTT: it sends each light neutral commands through an adapter, the new zigbee2mqtt light node, whose messages to the light are byte for byte what the room sent before, and passes each light’s readings to activity lighting. 6.0 also gathers every change that asks something of you: it needs Node.js 24, takes only true or false on enable inputs, removes what 5.0 deprecated, and no longer lets code import the package’s files. Each of these shows itself, as an invalid node or a warning in the log, rather than failing silently. It also brings what was added since 5.0.0: the zigbee2mqtt cover and shelly switch nodes, discovery announced as the flows start, and a Shelly script that keeps a detached wall switch working without Node-RED. When you upgrade from 5.x Migrate every room lighting controller. A room saved before 6.0 is an invalid configuration, and its lights don’t respond, until you migrate it. In its edit dialog, click Create Zigbee2MQTT light nodes to add and wire a zigbee2mqtt light per light (a light whose topics weren’t Zigbee2MQTT’s is flagged, to set up by hand on the neutral light contract). Add a circadian lighting policy, copy the room’s old circadian, sleep and schedule settings into it (the room’s edit dialog lists them), move any Home Assistant switches, set topics and flows that changed circadian lighting or sleep over to it, then click Done , which keeps only each light’s id in Targets JSON. A room that should stay unstyled needs only the light nodes and that last step. A flow that filtered the room’s output by the old command topics must now take the light nodes’ output. Follow the step-by-step migration in the README . Update Node.js to 24 or newer before you update the package. Send true or false to enable inputs: the motion policy’s area-enabled , global-enabled and pause , and the circadian lighting policy’s circadian and sleep messages. Strings such as \"ON\" are refused with a warning. Home Assistant’s own ON and OFF on the …/set topics still work. Mark a person’s change with manual: true . An intent’s values alone no longer make a light manual. Replace what 5.0 deprecated (see Version 5 ): Zigbee2MQTT’s brightness and color_temp in intents and activity lighting profiles, the receiver’s 0-98 volume, and the display controller’s old projector meter setting. Code that imports the package’s files directly now fails: only the nodes are a public interface. Installing and using the nodes is unchanged. Deprecated, removed in the next major version The 6.0.0 notes deprecate nothing. Details: the README’s 6.0.0 notes ."
 },
 {
  "title": "Releases and upgrading",
  "section": "Version 5",
  "description": "5.0 separates the decisions from the devices they drive. Requests to lights and the receiver use plain units (",
  "url": "releases.html#v5",
  "text": "5.0 separates the decisions from the devices they drive. Requests to lights and the receiver use plain units (percent, kelvin and dB) instead of Zigbee2MQTT’s brightness and mireds and the receiver’s 0-98 scale, so the decisions no longer depend on one kind of device. The display controller’s settings are named by role, and the projector’s power can come from any meter. It also adds the shelly cover adapter, and fixes theatre recovery and screen handling. When you upgrade from 4.x Lighting values: send brightnessPct (0-100) and colorTempKelvin in lighting intents and activity lighting profiles. Brightness 64 becomes 25%, and color_temp 400 becomes 2500 K (1,000,000 ÷ mireds). 0% is the dimmest level, not off. Receiver volume: send valueDb in volume requests (80 on the receiver’s 0-98 scale is 0 dB). Open and save the AVR controller to store its volume bounds in dB, and update any flow or automation that reads the published volume, which is now in dB. Display controller: open and save it to store its renamed settings. Without the built-in power meter host, wire its new third output to ask your meter for the projector’s power, unless the meter reports on its own at least once every query timeout. Screen: a saved viewing position must be above 0 and at most 100, or empty; with none, the screen opens fully with its own command. Code that imports the package’s files directly: the display transport moved to dist/lib/transports/display-transport . Only the nodes are a public interface. Deprecated in 5, removed in 6.0.0 Deprecated in version 5 Old form Use instead In 6.0.0 brightness (1-254) and color_temp (mireds) in lighting intents and activity lighting profiles brightnessPct and colorTempKelvin Left out of an intent, with a warning; an activity lighting profile using them is invalid. value on the receiver’s 0-98 scale in volume requests valueDb Rejected with removed-volume-value , with a warning. A receiver node that still holds only its 0-98 volume bounds is an invalid configuration until its dB bounds are set. The display controller’s saved setting projectorMeterHost Set Projector power meter host ( projectorPowerMeterHost ) No longer read; a node naming only the old key is invalid. Details: 5.0.0 release notes and the README’s 5.0.0 notes . Sources: README Requirements, 6.0.0 and 5.0.0 notes; package.json; CONTRIBUTING Releases."
 },
 {
  "title": "Roadmap",
  "description": "The public progress record: released components and the milestone roadmap.",
  "url": "roadmap.html",
  "text": "What is complete, next and planned. Milestone badges report delivery progress; release badges show what the package includes."
 },
 {
  "title": "Roadmap",
  "section": "Component roadmap",
  "description": "Milestone badges report delivery progress, independently of the release badges in the portfolio below. Candida",
  "url": "roadmap.html#milestones",
  "text": "Milestone badges report delivery progress, independently of the release badges in the portfolio below. Candidate components keep transport, policy, observed state and recovery explicit before joining the package. Milestone complete Contract examples Transport-neutral examples cover room lighting, occupancy, switch gestures, source readiness, volume ownership and coordinated activities. Milestone complete Volume ownership Absolute and relative requests share one bounded command owner, confirm from fresh evidence and preserve external adjustments. Milestone complete Switch-state observability Wall-input reducers preserve restart baselines, distinguish retained replay, refresh duplicate evidence and expose freshness or explicit unavailability. Milestone complete Home Assistant integration Home Assistant is an optional view and control panel: each node can publish its state and announce entities, and Home Assistant controls send MQTT messages that the nodes act on, never commands to devices. Entities report availability, keep stable identifiers through renames, and are cleaned up when their node is removed. Rooms expose circadian and sleep switches and wake and bed times; occupancy, motion, receiver volume and covers have their own entities. Milestone complete Blind and cover control Covers have their own nodes. A cover controller owns one blind, shutter or curtain motor: positions and named presets, open/close-only motors judged honestly from what they report, a moving signal other policies can react to, and a person's move left where they put it. A cover group moves several covers as one and says which confirmed. Each cover can also appear in Home Assistant as a cover entity, whose controls come back to the cover node as requests. Next Device-agnostic core Decision logic is separate from devices. Controllers speak a neutral vocabulary of requests and observations, with lighting in percent and kelvin and receiver volume in dB, and device protocols sit in their own modules and adapters. Defaults name no rooms or devices, and powered devices are judged from observed power, read from any meter or adapter. Still to do: moving the display controller's own device calls into adapters, removing a setting shared between nodes behind the scenes, and simplifying the wiring between controllers and the devices they confirm. Next Device adapters Small device nodes that connect the controllers to real devices over MQTT, so a relay module in cover mode or a Zigbee2MQTT cover wires straight in without function nodes. Each adapter knows one kind of device, and the controllers stay device-neutral. Planned Adaptive covers A policy that decides when covers move, from window contacts, a schedule, an enable switch and readings such as sun or temperature, and asks the cover nodes to move them. A person's move is respected, restarts and repeated messages are handled, and a cover never closes onto an open window. Milestone complete Scenes with restore A scene holds a room's lights on or off and pauses motion lighting. Ending it, by request, a safety timer or a trigger, hands back every light: one the room was running returns to the room, and one that was off or set by hand gets its values back. A person's change during the scene is kept. Scenes stack: the newest holds shared lights and hands them back to the one beneath. Queued Grouped audio Model membership, synchronization and partial failure without hiding which players are unavailable. Planned Water irrigation Run garden zones from schedules and soil or rain evidence, one valve owner per zone. Each run is bounded, confirmed from the valve's observed state, and skipped or cut short when rain or moisture says it isn't needed. A person's manual run takes over until it ends. Planned Heating and climate Hold each room at a scheduled temperature from observed temperature and valve state. A person's manual change wins until the next schedule step, and an open window pauses heating instead of fighting it. Planned Humidity-driven ventilation Run extractor fans in bathrooms and kitchens from a rise in humidity and stop them once it falls back, with a bounded run time, a manual boost and a short overrun. Planned Water leak protection Close a main water valve when a leak sensor trips and confirm it closed from the valve's observed state. The alarm stays latched until a person clears it, and an unconfirmed close is reported, never assumed. Planned Energy-aware scheduling Run deferrable loads, such as a dishwasher, water heating or vehicle charging, in the cheapest or greenest window from tariff or solar data, finishing before a deadline the user sets."
 },
 {
  "title": "Roadmap",
  "section": "Component portfolio",
  "description": "Portfolio badges show whether a capability is released in the package. Roadmap badges show delivery state. Com",
  "url": "roadmap.html#components",
  "text": "Portfolio badges show whether a capability is released in the package. Roadmap badges show delivery state. Components share explicit ownership, semantic commands, observed completion and bounded recovery. Released Home-theatre orchestration Capability milestone A latest-request-wins activity controller coordinates display, receiver, source, lighting and backlighting target owners without embedding transport-specific commands. Fresh observations gate completion Stale generations are inert Recovery and manual ownership are explicit Read the capability reference → Released Media-player readiness Source policy Gate source completion on fresh availability, active-device, application or playback evidence without moving transport logic into orchestration. Configurable readiness depth Application and playback evidence Honest waiting and unavailable outcomes Released Volume ownership Receiver policy One AVR controller coordinates bounded absolute and relative volume requests without fighting later physical adjustments. Rapid relative input accumulates Configured half-step safety bounds Fresh observation confirms and releases ownership Released Contract examples Consumer reference Run deterministic, transport-neutral examples for occupancy, lighting, switch gestures, source readiness, volume ownership and coordinated activities. Real reducer execution Synthetic configuration Asserted consumer-visible invariants Explore the executable contracts → Released Room lighting control Lighting policies One room controller owns adaptive output while independent switch, motion, schedule and activity policies emit semantic intent. Circadian brightness and colour temperature Per-target manual ownership Reducer-owned duplicate and retained-state handling Restart baseline, freshness and availability evidence Independent switch gestures and occupancy policy Released Occupancy fusion Sensor policy Combine motion triggers with optional presence hold while preserving unknown sensor states and preventing one source from clearing another. Released Metrics, traces and objectives Operational evidence Bounded traces and rolling outcome evaluation expose transition latency, retries, fallbacks, target availability and actionable failure."
 },
 {
  "title": "Roadmap",
  "section": "Public boundary",
  "description": "Pages and repository documentation describe source code and generalized behavior only. Credentials, addresses,",
  "url": "roadmap.html#boundary",
  "text": "Pages and repository documentation describe source code and generalized behavior only. Credentials, addresses, coordinates, entity identifiers, flow exports, installation inventory and operational records remain outside this repository."
 }
];
