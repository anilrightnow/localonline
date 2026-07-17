export type EditorMode = "about" | "businessHours" | "menu";

export interface EditorItem {
  id: string;
  label: string;
  values: string[];
}

export interface EditorCategory {
  id: string;
  name: string;
  items: EditorItem[];
}

export interface EditorModel {
  categories: EditorCategory[];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(asString).filter(Boolean).join(", ");
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return String(v);
}

function asStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(asString);
  if (typeof v === "string") return v.trim() ? [v] : [];
  return [asString(v)];
}

// Resolve a JSON string (handling double-encoded JSON) to a value.
function parseIfString(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t) return null;
  try {
    return parseIfString(JSON.parse(t));
  } catch {
    return v;
  }
}

export function defaultCategoryName(mode: EditorMode): string {
  if (mode === "businessHours") return "Hours";
  if (mode === "menu") return "Menu";
  return "About";
}

// ─────────────────────────────────────────────────────────
// Normalization: turn ANY incoming JSON into a stable model.
// Built to survive "worst case" data (nested categories, mixed
// shapes, scalars, double-encoded JSON) without crashing.
// ─────────────────────────────────────────────────────────

function toItem(node: unknown, mode: EditorMode): EditorItem {
  if (node == null) return { id: "", label: "", values: [""] };
  if (typeof node === "string") return { id: "", label: "", values: [node] };
  if (Array.isArray(node)) return { id: "", label: "", values: node.map(asString) };

  const o = node as Record<string, unknown>;
  const keys = Object.keys(o);

  if (mode === "businessHours") {
    const label = asString(o.Day ?? o.day ?? o.name ?? o.Name ?? "");
    const time = o.Time ?? o.time;
    const values = time == null ? [""] : asStringArray(time);
    return { id: "", label, values: values.length ? values : [""] };
  }

  if (mode === "menu") {
    const label = asString(o.Name ?? o.name ?? o.title ?? o.Title ?? "");
    const price = o.Price ?? o.price;
    const desc = o.Description ?? o.description;
    const values: string[] = [];
    if (price != null && String(price).trim() !== "")
      values.push(asString(price));
    if (desc != null && String(desc).trim() !== "") values.push(asString(desc));
    // support legacy flat Value arrays too
    const extra = o.Value ?? o.value;
    if (Array.isArray(extra)) values.push(...extra.map(asString));
    return { id: "", label, values: values.length ? values : [""] };
  }

  // about (default)
  const label = asString(
    o.Key ?? o.key ?? o.name ?? o.Name ?? o.title ?? o.Title ?? "",
  );
  const value = o.Value ?? o.value;
  let values = value == null ? [] : asStringArray(value);

  // { "Some Label": "some value" } single-key objects
  if (!label && keys.length === 1) {
    return { id: "", label: keys[0], values: asStringArray(o[keys[0]]) };
  }

  return { id: "", label, values: values.length ? values : [""] };
}

function toCategory(
  node: unknown,
  mode: EditorMode,
  fallbackName: string,
): EditorCategory {
  if (node == null)
    return { id: "", name: fallbackName, items: [] };
  if (typeof node === "string" || Array.isArray(node))
    return { id: "", name: fallbackName, items: [toItem(node, mode)] };

  const o = node as Record<string, unknown>;
  const name = asString(
    o.Category ?? o.category ?? o.name ?? o.Name ?? fallbackName,
  );
  const itemsSrc =
    o.Hours ?? o.hours ?? o.Items ?? o.items ?? o.children ?? o.Children;

  let items: EditorItem[];
  if (Array.isArray(itemsSrc)) {
    items = itemsSrc.map((it) => toItem(it, mode));
  } else if (itemsSrc != null) {
    items = [toItem(itemsSrc, mode)];
  } else {
    items = [toItem(node, mode)];
  }
  return { id: "", name, items };
}

function looksCategorized(data: unknown[]): boolean {
  return data.some((el) => {
    if (el && typeof el === "object" && !Array.isArray(el)) {
      const o = el as Record<string, unknown>;
      return (
        o.Category != null ||
        o.category != null ||
        o.Hours != null ||
        o.hours != null ||
        o.Items != null ||
        o.items != null
      );
    }
    return false;
  });
}

export function normalizeToModel(
  raw: unknown,
  mode: EditorMode,
): EditorModel {
  const data = parseIfString(raw);
  const fallback = defaultCategoryName(mode);

  if (data == null) return { categories: [] };

  if (Array.isArray(data)) {
    if (data.length === 0) return { categories: [] };
    if (looksCategorized(data)) {
      return { categories: data.map((el) => toCategory(el, mode, fallback)) };
    }
    return {
      categories: [
        { id: "", name: fallback, items: data.map((el) => toItem(el, mode)) },
      ],
    };
  }

  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (
      o.Category != null ||
      o.category != null ||
      o.Hours != null ||
      o.hours != null ||
      o.Items != null ||
      o.items != null
    ) {
      return { categories: [toCategory(data, mode, fallback)] };
    }
    // object of key/value pairs -> one category, each key an item
    const items = Object.entries(o).map(
      ([k, v]) =>
        ({ id: "", label: k, values: asStringArray(v) }) as EditorItem,
    );
    return { categories: [{ id: "", name: fallback, items }] };
  }

  // primitive
  return {
    categories: [{ id: "", name: fallback, items: [toItem(data, mode)] }],
  };
}

// Assign deterministic positional ids so React keys and accordion
// open/close state stay stable across re-renders.
export function withStableIds(
  model: EditorModel,
  mode: EditorMode,
): EditorModel {
  return {
    categories: model.categories.map((c, ci) => ({
      ...c,
      id: `cat-${mode}-${ci}`,
      items: c.items.map(
        (it, ii) => ({ ...it, id: `item-${mode}-${ci}-${ii}` }) as EditorItem,
      ),
    })),
  };
}

export function normalize(raw: unknown, mode: EditorMode): EditorModel {
  return withStableIds(normalizeToModel(raw, mode), mode);
}

// ─────────────────────────────────────────────────────────
// Export: convert the model back to the stored JSON shape.
// About stays FLAT (legacy {Key,Value[]}); Hours/Menu keep the
// category wrapper so the public renderer is unaffected.
// ─────────────────────────────────────────────────────────

export function modelToPayload(
  model: EditorModel,
  mode: EditorMode,
): unknown {
  if (mode === "about") {
    const out: Array<{ Key: string; Value: string[] }> = [];
    for (const c of model.categories) {
      for (const it of c.items) {
        const key = it.label.trim();
        const vals = it.values.map((v) => v.trim()).filter(Boolean);
        // Only save rows that actually carry a value (pre-populated empty
        // labels must not be persisted).
        if (vals.length) out.push({ Key: key, Value: vals });
      }
    }
    return out;
  }

  if (mode === "businessHours") {
    return model.categories
      .map((c) => ({
        Category: c.name.trim() || defaultCategoryName(mode),
        Hours: c.items
          .map((it) => ({
            Day: it.label.trim(),
            Time: it.values
              .map((v) => v.trim())
              .filter(Boolean)
              .join(" / "),
          }))
          .filter((h) => h.Day && h.Time),
      }))
      .filter((g) => g.Hours.length > 0);
  }

  // menu
  return model.categories
    .map((c) => ({
      Category: c.name.trim() || defaultCategoryName(mode),
      Items: c.items
        .map((it) => {
          const name = it.label.trim();
          const priceRaw = it.values[0]?.trim() ?? "";
          const desc = it.values
            .slice(1)
            .map((v) => v.trim())
            .filter(Boolean)
            .join(" ");
          const price =
            priceRaw !== "" && !Number.isNaN(Number(priceRaw))
              ? Number(priceRaw)
              : priceRaw;
          return { Name: name, Price: price, Description: desc };
        })
        .filter((m) => m.Name && (m.Price || m.Description)),
    }))
    .filter((g) => g.Items.length > 0);
}

// A friendly starting section so an empty tab is easy to fill.
export function emptySampleCategory(mode: EditorMode): EditorCategory {
  if (mode === "businessHours") {
    const mk = (day: string): EditorItem => ({
      id: "",
      label: day,
      values: ["9:00 AM - 9:00 PM"],
    });
    return {
      id: "",
      name: "Monday to Friday",
      items: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(mk),
    };
  }
  if (mode === "menu") {
    return {
      id: "",
      name: "Popular",
      items: [
        { id: "", label: "Signature Dish", values: ["199", "Describe your most popular item."] },
      ],
    };
  }
  return {
    id: "",
    name: "Overview",
    items: [
      { id: "", label: "Overview", values: ["Write a short introduction about your business."] },
    ],
  };
}

// ─────────────────────────────────────────────────────────
// Suggestions
// ─────────────────────────────────────────────────────────

export const DEFAULT_LABEL_SUGGESTIONS: Record<EditorMode, string[]> = {
  about: [
    "Overview",
    "Address",
    "Phone",
    "Website",
    "Email",
    "Specialties",
    "Services",
    "Products",
    "Established",
    "Owner",
    "Highlights",
    "Parking",
    "Payment Modes",
    "Amenities",
    "Timings",
    "Cuisines",
    "Founded",
  ],
  businessHours: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
    "Public Holidays",
  ],
  menu: [
    "Starters",
    "Main Course",
    "Beverages",
    "Desserts",
    "Snacks",
    "Special Thali",
    "Combo",
    "Breads",
    "Rice",
    "Soups",
    "Ice Cream",
    "Salads",
    "Breakfast",
    "Chinese",
    "Italian",
    "South Indian",
    "North Indian",
    "Street Food",
    "Pizza",
    "Burgers",
    "Sandwiches",
    "Juices",
    "Sweets",
    "Grill",
    "Momos",
    "Chaat",
    "Curries",
    "Biryani",
    "Kebabs",
    "Rolls",
    "Wraps",
    "Cakes",
    "Pastries",
    "Shakes",
    "Tandoori",
    "Seafood",
    "Prawns",
    "Noodles",
    "Fried Rice",
    "Tacos",
    "Pasta",
    "Eggetarian",
  ],
};

const LABEL_VALUE_HINTS: Record<string, string[]> = {
  "Payment Modes": ["Cash", "Card", "UPI", "Net Banking", "Wallets"],
  Parking: ["Free Parking", "Paid Parking", "Street Parking", "Valet"],
  Amenities: ["WiFi", "AC", "Wheelchair Accessible", "Outdoor Seating"],
  Cuisines: ["North Indian", "South Indian", "Chinese", "Continental", "Fast Food"],
  Timings: ["Open 24 Hours", "10:00 AM - 10:00 PM"],
};

const DEFAULT_VALUE_SUGGESTIONS: Record<EditorMode, string[]> = {
  about: [],
  businessHours: [
    "9:00 AM - 9:00 PM",
    "10:00 AM - 8:00 PM",
    "11:00 AM - 11:00 PM",
    "Closed",
    "Open 24 Hours",
  ],
  menu: [],
};

export function getDefaultValueSuggestions(
  mode: EditorMode,
  label: string,
): string[] {
  return LABEL_VALUE_HINTS[label] ?? DEFAULT_VALUE_SUGGESTIONS[mode];
}

// Category-aware dish-name suggestions for the Menu editor.
const MENU_ITEM_SUGGESTIONS: Record<string, string[]> = {
  Starters: ["Paneer Tikka", "Veg Spring Rolls", "Chilli Potato", "Garlic Bread", "Chicken Wings", "Fish Fry", "Crispy Corn", "Hara Bhara Kebab"],
  "Main Course": ["Butter Chicken", "Paneer Butter Masala", "Dal Makhani", "Veg Biryani", "Chicken Curry", "Rogan Josh", "Kadai Paneer", "Egg Curry"],
  Beverages: ["Cold Coffee", "Masala Chai", "Fresh Lime Soda", "Mango Shake", "Iced Tea", "Mocktail", "Filter Coffee", "Buttermilk"],
  Desserts: ["Gulab Jamun", "Ice Cream", "Rasgulla", "Brownie", "Kheer", "Fruit Custard", "Phirni", "Gajar Halwa"],
  Snacks: ["Samosa", "Kachori", "Pav Bhaji", "Vada Pav", "Bhel Puri", "Dhokla", "Bread Pakora", "Aloo Tikki"],
  "Special Thali": ["Unlimited Thali", "Mini Thali", "Festive Thali", "Royal Thali", "South Indian Thali", "Rajasthani Thali"],
  Combo: ["Meal Combo", "Snack Combo", "Family Combo", "Lunch Combo", "Dinner Combo"],
  Breads: ["Butter Naan", "Tandoori Roti", "Garlic Naan", "Laccha Paratha", "Kulcha", "Puri", "Rumali Roti", "Missi Roti"],
  Rice: ["Jeera Rice", "Veg Pulao", "Chicken Biryani", "Fried Rice", "Curd Rice", "Lemon Rice", "Mutton Biryani", "Coconut Rice"],
  Soups: ["Tomato Soup", "Sweet Corn Soup", "Manchow Soup", "Hot & Sour Soup", "Veg Clear Soup", "Lemon Coriander Soup"],
  "Ice Cream": ["Vanilla", "Chocolate", "Butterscotch", "Strawberry", "Kulfi", "Mango", "Rajbhog", "Tutti Frutti"],
  Salads: ["Greek Salad", "Caesar Salad", "Sprout Salad", "Fruit Salad", "Cucumber Salad", "Russian Salad"],
  Breakfast: ["Poha", "Upma", "Idli Sambar", "Dosa", "Paratha", "Omelette", "Aloo Puri", "Bread Butter"],
  Chinese: ["Hakka Noodles", "Manchurian", "Fried Rice", "Spring Roll", "Dim Sum", "Schezwan Noodles", "Chilli Chicken", "Veg Dumpling"],
  Italian: ["Margherita Pizza", "Pasta Alfredo", "Lasagna", "Penne Arrabiata", "Garlic Bread", "Tiramisu", "Caprese Salad", "Risotto"],
  "South Indian": ["Dosa", "Idli", "Vada", "Uttapam", "Rasam", "Sambar Rice", "Pongal", "Rava Idli"],
  "North Indian": ["Chole Bhature", "Rajma Chawal", "Kadhi Chawal", "Aloo Paratha", "Paneer Tikka", "Butter Chicken", "Dal Tadka", "Bhindi Masala"],
  "Street Food": ["Pani Puri", "Bhel Puri", "Sev Puri", "Dahi Puri", "Kathi Roll", "Pav Bhaji", "Dahi Bhalle", "Aloo Chaat"],
  Pizza: ["Margherita", "Peppy Paneer", "Farmhouse", "Mexican Wave", "Chicken Tikka", "Cheese Burst", "Veggie Supreme", "Pepper Barbecue"],
  Burgers: ["Veg Burger", "Cheese Burger", "Chicken Burger", "Crispy Burger", "Mushroom Burger", "Paneer Burger", "Double Cheese", "Aloo Tikki Burger"],
  Sandwiches: ["Grilled Sandwich", "Veg Sandwich", "Cheese Sandwich", "Club Sandwich", "Paneer Sandwich", "Paneer Tikka Sandwich", "Veg Mayo", "Bombay Grill"],
  Juices: ["Orange Juice", "Apple Juice", "Mango Juice", "Watermelon Juice", "Mixed Fruit", "Lemon Juice", "Pineapple Juice", "Grape Juice"],
  Sweets: ["Rasgulla", "Gulab Jamun", "Kaju Katli", "Ladoo", "Barfi", "Jalebi", "Soan Papdi", "Peda"],
  Grill: ["Tandoori Chicken", "Seekh Kebab", "Grilled Fish", "Paneer Tikka", "Chicken Tikka", "Mushroom Tikka", "Tangdi Kebab", "Malai Tikka"],
  Momos: ["Veg Momos", "Chicken Momos", "Cheese Momos", "Fried Momos", "Steam Momos", "Paneer Momos", "Soup Momos", "Tandoori Momos"],
  Chaat: ["Aloo Chaat", "Dahi Puri", "Papdi Chaat", "Ragda Pattice", "Sev Puri", "Fruit Chaat", "Raj Kachori", "Bhel Chaat"],
  Curries: ["Dal Makhani", "Paneer Lababdar", "Chana Masala", "Egg Curry", "Korma", "Vindaloo", "Kadai Veg", "Fish Curry"],
  Biryani: ["Veg Biryani", "Chicken Biryani", "Mutton Biryani", "Egg Biryani", "Paneer Biryani", "Fish Biryani", "Hyderabadi Biryani", "Dum Biryani"],
  Kebabs: ["Seekh Kebab", "Tangdi Kebab", "Shami Kebab", "Galouti Kebab", "Reshmi Kebab", "Hariyali Kebab", "Chicken Kebab", "Veg Kebab"],
  Rolls: ["Egg Roll", "Chicken Roll", "Paneer Roll", "Veg Roll", "Mutton Roll", "Cheese Roll", "Aloo Roll", "Double Egg Roll"],
  Wraps: ["Chicken Wrap", "Veg Wrap", "Paneer Wrap", "Tikka Wrap", "Falafel Wrap", "Cheese Wrap", "Schezwan Wrap", "Breakfast Wrap"],
  Cakes: ["Chocolate Cake", "Vanilla Cake", "Red Velvet", "Black Forest", "Butterscotch Cake", "Pineapple Cake", "Fruit Cake", "Cheese Cake"],
  Pastries: ["Chocolate Pastry", "Pineapple Pastry", "Veg Puff", "Chocolate Eclair", "Croissant", "Danish Pastry", "Coconut Tart", "Fruit Tart"],
  Shakes: ["Mango Shake", "Banana Shake", "Strawberry Shake", "Oreo Shake", "Chocolate Shake", "Badam Shake", "Kiwi Shake", "Protein Shake"],
  Tandoori: ["Tandoori Chicken", "Tandoori Paneer", "Tandoori Mushroom", "Tandoori Aloo", "Chicken Tikka", "Fish Tikka", "Tandoori Broccoli", "Soya Chaap"],
  Seafood: ["Grilled Fish", "Prawn Curry", "Fish Fry", "Crab Masala", "Prawn Biryani", "Fish Tikka", "Squid Fry", "Tandoori Prawns"],
  Prawns: ["Chilli Prawns", "Garlic Prawns", "Prawn Curry", "Fried Prawns", "Prawn Biryani", "Tandoori Prawns", "Prawn Koliwada", "Butter Garlic Prawns"],
  Noodles: ["Hakka Noodles", "Schezwan Noodles", "Veg Noodles", "Chicken Noodles", "Singapore Noodles", "Thai Noodles", "Cheese Noodles", "Paneer Noodles"],
  "Fried Rice": ["Veg Fried Rice", "Chicken Fried Rice", "Schezwan Fried Rice", "Egg Fried Rice", "Mushroom Fried Rice", "Prawn Fried Rice", "Burnt Garlic Rice", "Paneer Fried Rice"],
  Tacos: ["Veg Tacos", "Chicken Tacos", "Cheese Tacos", "Paneer Tacos", "Fish Tacos", "Bean Tacos", "Crunchy Tacos", "Soft Tacos"],
  Pasta: ["Alfredo Pasta", "Arrabiata Pasta", "Penne Pasta", "Mac & Cheese", "Pesto Pasta", "Bolognese Pasta", "White Sauce Pasta", "Red Sauce Pasta"],
  Eggetarian: ["Egg Bhurji", "Omelette", "Egg Curry", "Egg Fried Rice", "Boiled Egg", "Egg Roll", "Egg Maggi", "Half Fry"],
};

const GENERIC_MENU_ITEMS = [
  "Special Dish",
  "Chef's Special",
  "Today's Special",
  "Combo Meal",
  "Family Pack",
];

export function getMenuItemSuggestions(categoryName: string): string[] {
  const key = (categoryName || "").trim().toLowerCase();
  for (const k of Object.keys(MENU_ITEM_SUGGESTIONS)) {
    if (k.toLowerCase() === key) return MENU_ITEM_SUGGESTIONS[k];
  }
  return GENERIC_MENU_ITEMS;
}

// ─────────────────────────────────────────────────────────
// Per-mode editor configuration + default pre-population.
// ─────────────────────────────────────────────────────────

export const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface EditorConfig {
  singleCategory: boolean; // collapse to one category, hide category UI
  hideCategory: boolean; // don't show/edit the category name
  hideAddSection: boolean; // hide the "add section/category" control
  hideAddItem: boolean; // hide the "add item" control
  defaultLabels: string[]; // labels pre-populated (empty) when no DB data
  addSectionLabel: string;
  addItemLabel: string;
  labelPlaceholder: string;
  labelWidth: number; // px
  categorySuggestions?: string[]; // datalist for category name
}

export function getEditorConfig(mode: EditorMode): EditorConfig {
  if (mode === "about") {
    return {
      singleCategory: true,
      hideCategory: true,
      hideAddSection: true,
      hideAddItem: false,
      defaultLabels: DEFAULT_LABEL_SUGGESTIONS.about,
      addSectionLabel: "Add section",
      addItemLabel: "Add item",
      labelPlaceholder: "Label",
      labelWidth: 240,
    };
  }
  if (mode === "businessHours") {
    return {
      singleCategory: true,
      hideCategory: true,
      hideAddSection: true,
      hideAddItem: true,
      defaultLabels: WEEKDAY_LABELS,
      addSectionLabel: "Add section",
      addItemLabel: "Add day",
      labelPlaceholder: "Day",
      labelWidth: 240,
    };
  }
  return {
    singleCategory: false,
    hideCategory: false,
    hideAddSection: false,
    hideAddItem: false,
    defaultLabels: [],
    addSectionLabel: "Add Category",
    addItemLabel: "Add Menu Item",
    labelPlaceholder: "Dish Name",
    labelWidth: 340,
    categorySuggestions: DEFAULT_LABEL_SUGGESTIONS.menu,
  };
}

// Merge DB data over a set of default labels: every default label is shown
// (empty if the DB has no value for it), DB-only labels are appended.
function mergeWithDefaultLabels(
  model: EditorModel,
  defaults: string[],
  mode: EditorMode,
): EditorModel {
  const dataMap = new Map<string, EditorItem>();
  for (const c of model.categories) {
    for (const it of c.items) {
      const key = it.label.trim().toLowerCase();
      if (key) dataMap.set(key, it);
    }
  }
  const seen = new Set<string>();
  const items: EditorItem[] = [];
  for (const label of defaults) {
    const key = label.trim().toLowerCase();
    const existing = dataMap.get(key);
    items.push({
      id: "",
      label,
      values: existing ? existing.values.map((v) => v) : [""],
    });
    seen.add(key);
  }
  dataMap.forEach((it, key) => {
    if (!seen.has(key)) items.push(it);
  });
  return {
    categories: [{ id: "", name: defaultCategoryName(mode), items }],
  };
}

// Build the editor model for a mode: collapses to a single category when
// needed and pre-populates default labels (DB values override them).
export function toEditorModel(raw: unknown, mode: EditorMode): EditorModel {
  const cfg = getEditorConfig(mode);
  let base = normalizeToModel(raw, mode);

  if (cfg.singleCategory) {
    const items = base.categories.flatMap((c) => c.items);
    base = {
      categories: [{ id: "", name: defaultCategoryName(mode), items }],
    };
  }

  if (cfg.defaultLabels.length) {
    base = mergeWithDefaultLabels(base, cfg.defaultLabels, mode);
  }

  return withStableIds(base, mode);
}

export function valuePlaceholder(mode: EditorMode, index: number): string {
  if (mode === "menu") return index === 0 ? "Price" : "Description";
  if (mode === "businessHours") return "Time";
  return "Value";
}
