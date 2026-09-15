import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { TwoFactorSettings } from "@/components/admin/two-factor-settings";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Security",
};

export const instant = false; // See (panel)/layout.tsx.

const sectionHeading =
  "font-mono text-section tracking-[0.2em] text-dust uppercase";

export default async function SecurityPage() {
  const user = await requireAdmin();

  return (
    <div className="space-y-14">
      <AdminPageHeader
        title="Security"
        description={`Signed in as ${user.email}.`}
      />

      <section aria-labelledby="two-factor-heading" className="space-y-5">
        <h2 id="two-factor-heading" className={sectionHeading}>
          Two-factor login
        </h2>
        <TwoFactorSettings enabled={user.twoFactorEnabled} />
      </section>

      <section
        aria-labelledby="password-heading"
        className="space-y-5 border-t border-line pt-10"
      >
        <h2 id="password-heading" className={sectionHeading}>
          Password
        </h2>
        <ChangePasswordForm />
        <p className="max-w-reading text-sm leading-relaxed text-faint">
          Locked out? From the project folder, run{" "}
          <code className="rounded-xs bg-nebula px-1.5 py-0.5 font-mono text-xs text-dust">
            npm run admin:reset
          </code>{" "}
          to set a new password, or add{" "}
          <code className="rounded-xs bg-nebula px-1.5 py-0.5 font-mono text-xs text-dust">
            -- --disable-2fa
          </code>{" "}
          if you&apos;ve lost your authenticator app and backup codes.
        </p>
      </section>
    </div>
  );
}
