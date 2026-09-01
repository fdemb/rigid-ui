import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function LabelPage() {
  return <ComponentDetail component={componentCatalog.label} />;
}
