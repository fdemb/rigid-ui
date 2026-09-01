import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function InputPage() {
  return <ComponentDetail component={componentCatalog.input} />;
}
