"use strict";

// What every Home Assistant discovery entry shares: the origin that says
// which software published it, the discovery prefix setting, and the
// availability payloads.

import {textSetting} from "./settings";
import {areaId} from "./topic-names";
import {clockMinutes} from "./circadian-schedule";

// The package's own manifest, loaded as a module from the package root (two
// levels above dist/lib), so no file is read here. A JSON import would make
// the compiler copy package.json into dist/, which isn't published.
const manifest = require("../../package.json") as {name: string; version: string; repository: {url: string}};

// Home Assistant's `origin` block, abbreviated `o`, with its `name`,
// `sw` (software version) and `url` (support URL): the repository, where
// issues are raised.
export const DISCOVERY_ORIGIN = Object.freeze({
  name: manifest.name,
  sw: manifest.version,
  url: manifest.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")
});

// Home Assistant's default discovery prefix.
export const DEFAULT_DISCOVERY_PREFIX = "homeassistant";

// The topic prefix Home Assistant listens on for discovery; absent means
// Home Assistant's default.
export function discoveryPrefixSetting(value: unknown): string {
  const prefix = textSetting(value, "discovery prefix", DEFAULT_DISCOVERY_PREFIX).replace(/^\/+|\/+$/g, "");
  if (!prefix || /[+#]/.test(prefix)) throw new Error("discovery prefix must be a concrete MQTT topic prefix");
  return prefix;
}

// A publishing node's availability, retained on its availability topic:
// online when it starts, offline when it stops. These are Home Assistant's
// default availability payloads, so entities need only the topic.
export const ONLINE = "online";
export const OFFLINE = "offline";

// How a node names its Home Assistant device and entities. "area" is how
// every node did before node IDs: unique IDs, discovery topics and the
// device come from the area. "node" names them after the Node-RED node, so
// they stay the same when the area changes. Saved nodes keep "area"; the
// editor gives new nodes "node".
export const ID_SCHEMES = ["area", "node"] as const;
export type IdScheme = typeof ID_SCHEMES[number];

// Who an entity belongs to: the Node-RED node that publishes it and how it
// names things (absent means "area"), the area its entity ID is named after,
// and where Home Assistant listens.
export interface DiscoveryOwner {
  nodeId?: string;
  idScheme?: IdScheme;
  area: string;
  discoveryPrefix: string;
}

// The node's ID in a form fit for unique IDs and discovery topics.
function nodeKey(nodeId: string): string {
  return "nrha_" + nodeId.replace(/[^A-Za-z0-9_-]+/g, "_");
}

// The device that groups a node's entities, one per node. Under "area" it
// is nodered_<area ID>_<kind>, for example nodered_kitchen_lighting.
export function discoveryDevice(owner: DiscoveryOwner, kind: string): {identifiers: string[]} {
  return {identifiers: [owner.idScheme === "node" ? nodeKey(owner.nodeId ?? "") : `nodered_${areaId(owner.area)}_${kind}`]};
}

// Of the given topics, the discovery topics named after this node itself:
// under the "node" scheme, those whose object ID is nrha_<node ID>_<entity>
// (the key ends in "_", and the IDs Node-RED makes never contain one: hex
// digits, joined with "-" for a node in a subflow, so one node's key can't
// prefix another's; only an ID written by hand with "_" could). Under
// "area" none are, since another node may share the area, so a node can
// clear these without ever touching another node's topics.
export function ownDiscoveryTopics(owner: DiscoveryOwner, topics: readonly string[]): string[] {
  if (owner.idScheme !== "node" || !owner.nodeId) return [];
  const key = nodeKey(owner.nodeId) + "_";
  return topics.filter((topic) => {
    const parts = topic.split("/");
    return topic.startsWith(owner.discoveryPrefix + "/") && parts.at(-1) === "config" && (parts.at(-2) ?? "").startsWith(key);
  });
}

// An entity's discovery topic and IDs: the topic's object ID and the unique
// ID are <area ID>_<entity> under "area" and nrha_<node ID>_<entity> under
// "node". The entity ID Home Assistant first gives it comes from the area
// either way, with "-" as "_", since entity IDs allow only lowercase
// letters, digits and "_".
export function discoveryEntity(owner: DiscoveryOwner, component: string, entity: string) {
  const uniqueId = (owner.idScheme === "node" ? nodeKey(owner.nodeId ?? "") : areaId(owner.area)) + "_" + entity;
  return {
    topic: `${owner.discoveryPrefix}/${component}/${uniqueId}/config`,
    uniqueId,
    defaultEntityId: `${component}.${areaId(owner.area).replace(/-/g, "_")}_${entity}`
  };
}

// A time from Home Assistant's time entity ("HH:MM:SS", in ISO format), or
// "HH:MM", as "HH:MM"; null if it isn't one.
export function timeEntityValue(payload: unknown): string | null {
  const match = typeof payload === "string" ? /^(\d{2}:\d{2})(?::[0-5]\d(?:\.\d+)?)?$/.exec(payload.trim()) : null;
  return match && clockMinutes(match[1]) !== null ? match[1]! : null;
}
