import Okta from './Okta';
import Jenkins from './Jenkins';
import Drone from './Drone';
import Consul from './Consul';
import Vault from './Vault';
import Nomad from './Nomad';
import HashiUI from './HashiUI';
import Architecture from './Architecture';
import Prometheus from './Prometheus';
import Grafana from './Grafana';

export const getAllTools = () => [Okta, Jenkins, Drone, Consul, Vault, Nomad, HashiUI, Architecture, Prometheus, Grafana];
