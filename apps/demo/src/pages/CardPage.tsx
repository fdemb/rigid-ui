import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function CardPage() {
  return <ComponentDetail component={componentCatalog.card} />;
}
