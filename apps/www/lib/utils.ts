import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and resolves Tailwind conflicts. Published as the `@aedis/utils` registry item. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Base UI also takes a className function of state; Aedis components take a plain string so `cn` can merge it. */
export type WithClassName<P> = Omit<P, "className"> & { className?: string };
