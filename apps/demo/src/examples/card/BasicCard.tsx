import * as stylex from "@stylexjs/stylex";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";

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
          <CardAction>
            <Badge>Draft</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>Project details</CardContent>
        <CardFooter>
          <Button size="sm" variant="outline">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
