export function formatErrorDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((issue) =>
        issue && typeof issue === "object" && "message" in issue
          ? String((issue as { message: unknown }).message)
          : JSON.stringify(issue),
      )
      .join("; ");
  }
  return undefined;
}
