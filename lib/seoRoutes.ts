export type SeoPageKind =
  | "city"
  | "cityArea"
  | "cityCategory"
  | "cityAreaCategory"
  | "cityAreaPlaceType"
  | "cityAreaPlaceTypePlace"
  | "business";

export type ParsedSeoRoute = {
  kind: SeoPageKind;
  citySlug: string;
  areaSlug?: string;
  categorySlug?: string;
  placeTypeSlug?: string;
  placeSlug?: string;
  businessComposite?: string;
  legacy?: boolean;
};

function readPrefixedSegment(segment: string, prefix: string): string | null {
  if (!segment.startsWith(prefix)) {
    return null;
  }
  const slug = segment.slice(prefix.length).trim().toLowerCase();
  if (!slug) {
    return null;
  }

  return slug;
}

function looksLikeBusinessComposite(segment: string): boolean {
  const value = segment.trim().toLowerCase();
  if (!value) {
    return false;
  }

  if (/-b[a-f0-9]{20,}$/.test(value)) {
    return true;
  }

  if (value.includes("-google-cid:") || /-0x[0-9a-f]+-0x[0-9a-f]+$/.test(value)) {
    return true;
  }

  const pieces = value.split("-").filter(Boolean);
  if (pieces.length < 4) {
    return false;
  }

  const cid = pieces[pieces.length - 1] ?? "";
  return /^[a-z0-9:]{6,}$/.test(cid);
}

function extractBusinessAreaCity(composite: string): { areaSlug: string; citySlug: string } | null {
  const pieces = composite.split("-").filter(Boolean);
  if (pieces.length < 4) {
    return null;
  }

  // Canonical tail is either:
  // - ...-{area}-{city}-{cid}
  // - ...-{area}-{city}-0x...-0x... (google cid token)
  const hasGoogleCidTail =
    pieces.length >= 5 &&
    /^0x[0-9a-f]+$/i.test(pieces[pieces.length - 2] ?? "") &&
    /^0x[0-9a-f]+$/i.test(pieces[pieces.length - 1] ?? "");

  const cityIndex = hasGoogleCidTail ? pieces.length - 3 : pieces.length - 2;
  const areaIndex = hasGoogleCidTail ? pieces.length - 4 : pieces.length - 3;
  const areaSlug = pieces[areaIndex];
  const citySlug = pieces[cityIndex];
  if (!areaSlug || !citySlug) {
    return null;
  }

  return { areaSlug, citySlug };
}

export function parseSeoSegments(segments: string[]): ParsedSeoRoute | null {
  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "city" && segments.length >= 2) {
    const citySlug = segments[1]?.trim().toLowerCase();
    if (!citySlug) {
      return null;
    }

    if (segments.length === 2) {
      return { kind: "city", citySlug, legacy: true };
    }

    if (segments.length === 4 && segments[2] === "area") {
      const areaSlug = segments[3]?.trim().toLowerCase();
      if (!areaSlug) {
        return null;
      }
      return { kind: "cityArea", citySlug, areaSlug, legacy: true };
    }

    if (segments.length === 4 && segments[2] === "category") {
      const categorySlug = segments[3]?.trim().toLowerCase();
      if (!categorySlug) {
        return null;
      }
      return { kind: "cityCategory", citySlug, categorySlug, legacy: true };
    }

    if (segments.length === 6 && segments[2] === "area" && segments[4] === "category") {
      const areaSlug = segments[3]?.trim().toLowerCase();
      const categorySlug = segments[5]?.trim().toLowerCase();
      if (!areaSlug || !categorySlug) {
        return null;
      }
      return { kind: "cityAreaCategory", citySlug, areaSlug, categorySlug, legacy: true };
    }

    if (segments.length === 6 && segments[2] === "area" && segments[4] === "place-type") {
      const areaSlug = segments[3]?.trim().toLowerCase();
      const placeTypeSlug = segments[5]?.trim().toLowerCase();
      if (!areaSlug || !placeTypeSlug) {
        return null;
      }
      return { kind: "cityAreaPlaceType", citySlug, areaSlug, placeTypeSlug, legacy: true };
    }

    if (
      segments.length === 8 &&
      segments[2] === "area" &&
      segments[4] === "place-type" &&
      segments[6] === "place"
    ) {
      const areaSlug = segments[3]?.trim().toLowerCase();
      const placeTypeSlug = segments[5]?.trim().toLowerCase();
      const placeSlug = segments[7]?.trim().toLowerCase();
      if (!areaSlug || !placeTypeSlug || !placeSlug) {
        return null;
      }
      return {
        kind: "cityAreaPlaceTypePlace",
        citySlug,
        areaSlug,
        placeTypeSlug,
        placeSlug,
        legacy: true,
      };
    }

    return null;
  }

  if (segments[0] === "business" && segments.length === 2) {
    const cid = segments[1]?.trim().toLowerCase();
    if (!cid) {
      return null;
    }

    return {
      kind: "business",
      citySlug: "unknown",
      areaSlug: "unknown",
      businessComposite: `business-${cid}`,
      legacy: true,
    };
  }

  const citySlug = readPrefixedSegment(segments[0], "c-");
  if (citySlug) {
    if (segments.length === 1) {
      return { kind: "city", citySlug };
    }

    if (segments.length === 2) {
      const areaSlug = readPrefixedSegment(segments[1], "a-");
      if (areaSlug) {
        return { kind: "cityArea", citySlug, areaSlug };
      }

      const categorySlug = readPrefixedSegment(segments[1], "k-");
      if (categorySlug) {
        return { kind: "cityCategory", citySlug, categorySlug };
      }

      return null;
    }

    if (segments.length === 3) {
      const areaSlug = readPrefixedSegment(segments[1], "a-");
      if (!areaSlug) {
        return null;
      }

      const categorySlug = readPrefixedSegment(segments[2], "k-");
      if (categorySlug) {
        return { kind: "cityAreaCategory", citySlug, areaSlug, categorySlug };
      }

      const placeTypeSlug = readPrefixedSegment(segments[2], "t-");
      if (placeTypeSlug) {
        return { kind: "cityAreaPlaceType", citySlug, areaSlug, placeTypeSlug };
      }

      return null;
    }

    if (segments.length === 4) {
      const areaSlug = readPrefixedSegment(segments[1], "a-");
      const placeTypeSlug = readPrefixedSegment(segments[2], "t-");
      const placeSlug = readPrefixedSegment(segments[3], "p-");
      if (!areaSlug || !placeTypeSlug || !placeSlug) {
        return null;
      }

      return {
        kind: "cityAreaPlaceTypePlace",
        citySlug,
        areaSlug,
        placeTypeSlug,
        placeSlug,
      };
    }

    return null;
  }

  if (segments.length === 3) {
    const businessCitySlug = readPrefixedSegment(segments[0], "b-");
    const areaSlug = readPrefixedSegment(segments[1], "a-");
    if (!businessCitySlug || !areaSlug) {
      return null;
    }

    return {
      kind: "business",
      citySlug: businessCitySlug,
      areaSlug,
      businessComposite: segments[2].trim(),
      legacy: true,
    };
  }

  if (segments.length === 1 && looksLikeBusinessComposite(segments[0])) {
    const composite = segments[0].trim();
    const extracted = extractBusinessAreaCity(composite.toLowerCase());
    return {
      kind: "business",
      citySlug: extracted?.citySlug ?? "unknown",
      areaSlug: extracted?.areaSlug ?? "unknown",
      businessComposite: composite,
    };
  }

  return null;
}

export function buildCanonicalPath(parsed: ParsedSeoRoute): string {
  if (parsed.kind === "city") {
    return `/c-${parsed.citySlug}`;
  }

  if (parsed.kind === "cityArea") {
    return `/c-${parsed.citySlug}/a-${parsed.areaSlug}`;
  }

  if (parsed.kind === "cityCategory") {
    return `/c-${parsed.citySlug}/k-${parsed.categorySlug}`;
  }

  if (parsed.kind === "cityAreaCategory") {
    return `/c-${parsed.citySlug}/a-${parsed.areaSlug}/k-${parsed.categorySlug}`;
  }

  if (parsed.kind === "cityAreaPlaceType") {
    return `/c-${parsed.citySlug}/a-${parsed.areaSlug}/t-${parsed.placeTypeSlug}`;
  }

  if (parsed.kind === "cityAreaPlaceTypePlace") {
    return `/c-${parsed.citySlug}/a-${parsed.areaSlug}/t-${parsed.placeTypeSlug}/p-${parsed.placeSlug}`;
  }

  return `/${parsed.businessComposite}`;
}
