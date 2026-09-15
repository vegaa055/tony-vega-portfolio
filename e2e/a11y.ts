import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** The WCAG 2.2 rules at levels A and AA, the level the site aims for. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Accessibility problems axe finds on the page, one line per rule with the
 * elements that break it. An empty list means none were found.
 */
export async function accessibilityProblems(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ")})`,
  );
}

export type FocusStop = {
  /** The focused element's label or text. */
  name: string;
  /** A focus outline shows on it, or on a box around it (a card, say). */
  showsFocus: boolean;
  /** Something like a sticky header or save bar hides it. */
  covered: boolean;
};

/** Presses Tab and describes where focus lands, or null if it left the page. */
export async function tabToNext(page: Page): Promise<FocusStop | null> {
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement) || element === document.body) {
      return null;
    }

    // A visually hidden control, like a radio button styled through its
    // label, shows focus on the nearest element around it that has a size.
    let shown: HTMLElement = element;
    const tiny = (node: Element) => {
      const box = node.getBoundingClientRect();
      return box.width <= 2 || box.height <= 2;
    };
    while (tiny(shown) && shown.parentElement) shown = shown.parentElement;

    // The outline can be on the element or on a close ancestor: a card around
    // its link, or the box around a tag input.
    const hasOutline = (node: Element | null, depth = 0): boolean => {
      if (!node || depth > 3) return false;
      const style = getComputedStyle(node);
      if (
        style.outlineStyle !== "none" &&
        Number.parseFloat(style.outlineWidth) >= 2
      ) {
        return true;
      }
      return hasOutline(node.parentElement, depth + 1);
    };

    // Whatever is on top in the middle of the part that's on screen. For a
    // tall text area, that's enough of it to count as visible.
    const box = shown.getBoundingClientRect();
    const top = Math.max(box.top, 0);
    const bottom = Math.min(box.bottom, innerHeight);
    const left = Math.max(box.left, 0);
    const right = Math.min(box.right, innerWidth);
    const onTop =
      bottom > top && right > left
        ? document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
        : null;

    const label =
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
        ? element.labels?.[0]?.textContent
        : null;

    return {
      name: (
        element.getAttribute("aria-label") ||
        label ||
        element.textContent ||
        element.tagName
      )
        .trim()
        .slice(0, 40),
      showsFocus: hasOutline(shown),
      covered:
        onTop === null || !(shown.contains(onTop) || onTop.contains(shown)),
    };
  });
}
