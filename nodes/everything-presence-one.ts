"use strict";

import {esphomeSensorNode} from "./esphome-sensor";

// Its entities are in ESPHOME_MODELS["everything-presence-one"] (lib/esphome-sensor.ts).
export = esphomeSensorNode("home-everything-presence-one", "everything-presence-one");
