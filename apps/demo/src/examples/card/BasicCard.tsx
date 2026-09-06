import * as stylex from "@stylexjs/stylex";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "../../components/ui/Card";

const styles = stylex.create({
  root: { display: "grid", gap: "0.5rem", width: "100%", maxWidth: "24rem" },
});

export default function BasicCard() {
  return (
    <div {...stylex.attrs(styles.root)}>
      <Card>
        <CardHeader>
          <CardTitle>Project settings</CardTitle>
          <CardDescription>Manage your project.</CardDescription>
        </CardHeader>
        <CardBody>Project details</CardBody>
      </Card>
    </div>
  );
}
