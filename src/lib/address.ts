// Handles both old object format {houseOrVillage, roadOrPostOffice, blockOrThana, district}
// and new plain string format from the backend.
export function formatAddress(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof address === "object") {
    const a = address as Record<string, string>;
    return [a.houseOrVillage, a.roadOrPostOffice, a.blockOrThana, a.district]
      .filter(Boolean)
      .join(", ");
  }
  return String(address);
}
