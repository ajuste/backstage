import Okta from './Okta';
import Jenkins from './Jenkins';
import Drone from './Drone';
import Consul from './Consul';
import Vault from './Vault';
import Nomad from './Nomad';
import Architecture from './Architecture';
import Prometheus from './Prometheus';
import Grafana from './Grafana';
import Superset from './Superset';
import OpenMetadata from './OpenMetadata';
import Airflow from './Airflow';
import Metaflow from './Metaflow';

export const getAllTools = () => [Okta, Jenkins, Drone, Consul, Vault, Nomad, Architecture, Prometheus, Grafana, Superset, OpenMetadata, Airflow, Metaflow];
