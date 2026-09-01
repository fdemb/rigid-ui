import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function SeparatorPage() {
  return <ComponentDetail component={componentCatalog.separator} />;
}
