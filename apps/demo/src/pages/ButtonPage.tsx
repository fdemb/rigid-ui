import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function ButtonPage() {
  return <ComponentDetail component={componentCatalog.button} />;
}
