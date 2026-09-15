import { ButtonLink } from "@/components/button-link";

export default function AdminNotFound() {
  return (
    <div className="py-16">
      <p className="font-mono text-label tracking-[0.2em] text-flare uppercase">
        Not found
      </p>
      <h1 className="mt-4 font-mono text-3xl font-extralight text-star font-stretch-semi-expanded">
        Nothing here
      </h1>
      <p className="mt-4 max-w-reading text-dust">
        It may have been deleted, or the link is out of date.
      </p>
      <div className="mt-8">
        <ButtonLink href="/admin" variant="ghost">
          Back to content
        </ButtonLink>
      </div>
    </div>
  );
}
