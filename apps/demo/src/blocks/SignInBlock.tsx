import * as stylex from "@stylexjs/stylex";

import { colors, typography } from "../components/ui/tokens.stylex";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Separator } from "../components/ui/Separator";

const styles = stylex.create({
  card: { maxWidth: "24rem", width: "100%" },
  field: { display: "grid", gap: "0.35rem" },
  divider: { alignItems: "center", display: "flex", gap: "0.6rem" },
  dividerLabel: {
    color: colors.subtleForeground,
    fontFamily: typography.mono,
    fontSize: "0.6875rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  footer: { justifyContent: "space-between" },
  hint: { color: colors.mutedForeground, fontSize: "0.75rem", margin: 0 },
});

export default function SignInBlock() {
  return (
    <Card xstyle={styles.card}>
      <CardHeader divided>
        <CardTitle>Sign in</CardTitle>
        <CardAction>
          <Badge tone="accent" mono>
            SSO
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div {...stylex.attrs(styles.field)}>
          <Label for="signin-email" required>
            Work email
          </Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>
        <div {...stylex.attrs(styles.field)}>
          <Label for="signin-token" required>
            Access token
          </Label>
          <Input id="signin-token" type="password" placeholder="rui_••••••••" mono />
        </div>
        <Button variant="primary" block>
          Continue
        </Button>
        <div {...stylex.attrs(styles.divider)}>
          <Separator decorative />
          <span {...stylex.attrs(styles.dividerLabel)}>or</span>
          <Separator decorative />
        </div>
        <Button variant="outline" block>
          Continue with SAML
        </Button>
      </CardContent>
      <CardFooter divided xstyle={styles.footer}>
        <p {...stylex.attrs(styles.hint)}>Sessions expire after 12 hours.</p>
        <Button size="xs" variant="ghost">
          Need help?
        </Button>
      </CardFooter>
    </Card>
  );
}
