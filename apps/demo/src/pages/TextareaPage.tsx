import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function TextareaPage() {
  return <ComponentDetail component={componentCatalog.textarea} />;
}
