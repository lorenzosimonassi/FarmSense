// shpjs não publica tipos; só o que o importador de limites usa
declare module "shpjs" {
  import type { FeatureCollection } from "geojson"

  type Parte = ArrayBuffer | ArrayBufferView
  type Arquivos = { shp: Parte; dbf?: Parte; prj?: Parte | string; cpg?: Parte | string }

  export default function shp(base: Arquivos): Promise<FeatureCollection | FeatureCollection[]>
}
