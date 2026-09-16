import { Michroma } from "next/font/google";

/**
 * Michroma, for your name on the home page and for project and post titles,
 * wherever they appear. Each page loads it only if it uses it. It has a single
 * weight, so don't combine it with font-medium or bolder (the browser would
 * fake the weight).
 */
export const displayFont = Michroma({ subsets: ["latin"], weight: "400" });
