import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function BadgePage() {
  return <ComponentDetail component={componentCatalog.badge} />;
}
