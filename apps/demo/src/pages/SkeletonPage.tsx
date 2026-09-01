import ComponentDetail from "../components/ComponentDetail";
import { componentCatalog } from "../content/components";

export default function SkeletonPage() {
  return <ComponentDetail component={componentCatalog.skeleton} />;
}
