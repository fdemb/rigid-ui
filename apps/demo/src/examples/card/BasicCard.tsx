import * as stylex from "@stylexjs/stylex";
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
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { colors, typography } from "../../components/ui/tokens.stylex";

const styles = stylex.create({
  card: { maxWidth: "24rem", width: "100%" },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  field: { display: "grid", gap: "0.4rem" },
  labelRow: { alignItems: "center", display: "flex" },
  link: {
    color: colors.foreground,
    fontSize: typography.sm,
    marginInlineStart: "auto",
    textDecoration: { default: "none", ":hover": "underline" },
    textUnderlineOffset: "4px",
  },
  footer: { alignItems: "stretch", flexDirection: "column" },
});

export default function BasicCard() {
  return (
    <Card xstyle={styles.card}>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">
            Sign up
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form
          id="login-form"
          onSubmit={(event) => event.preventDefault()}
          {...stylex.attrs(styles.form)}
        >
          <div {...stylex.attrs(styles.field)}>
            <Label for="login-email">Email</Label>
            <Input id="login-email" type="email" placeholder="m@example.com" required />
          </div>
          <div {...stylex.attrs(styles.field)}>
            <div {...stylex.attrs(styles.labelRow)}>
              <Label for="login-password">Password</Label>
              <a href="#" {...stylex.attrs(styles.link)}>
                Forgot your password?
              </a>
            </div>
            <Input id="login-password" type="password" required />
          </div>
        </form>
      </CardContent>
      <CardFooter xstyle={styles.footer}>
        <Button type="submit" form="login-form" block>
          Login
        </Button>
        <Button variant="outline" block>
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  );
}
