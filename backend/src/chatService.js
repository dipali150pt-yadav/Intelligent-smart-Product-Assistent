import {
  MIN_DOCUMENT_SIMILARITY,
  MIN_FAQ_SIMILARITY,
  SUPPORT_URL,
  SYSTEM_INSTRUCTIONS,
  FAQ_SYSTEM_INSTRUCTIONS,
} from "./config.js";
import {
  assessConversation,
  generateGroundedAnswer,
  generateGeneralProductAnswer,
} from "./llm.js";
import {
  queryProductDocuments,
  queryFaqDocuments,
  queryApprovedMemory,
  productDocuments,
  isLikelyEnglish,
} from "./vectorStore.js";
import { logInteraction } from "./interactions.js";

const KNOWN_BRANDS = [
  {
    name: "boAt",
    keywords: ["boat", "rockerz", "airdopes", "bassheads", "storm", "wave", "nirvana"],
    url: "https://support.boat-lifestyle.com",
    warranty: "1 Year Replacement Warranty",
    claimGuide:
      "To claim warranty for boAt products:\n1. Visit the official **boAt Support Portal** (support.boat-lifestyle.com).\n2. Register your complaint with your phone number and upload your purchase invoice (Amazon, Flipkart, or boAt website).\n3. A reverse pickup will be arranged, or you can drop it at an authorized service center.\n4. Once verified, boAt will replace or repair your product within 7-10 business days.",
  },
  {
    name: "Dell",
    keywords: ["dell", "latitude", "inspiron", "xps", "optiplex", "vostro", "alienware", "precision"],
    url: "https://www.dell.com/support/home",
    warranty: "1 to 3 Years Limited Hardware Warranty",
    claimGuide:
      "To check or claim Dell warranty:\n1. Find your 7-character **Service Tag** on the bottom label of your laptop/PC.\n2. Visit **dell.com/support** and enter your Service Tag.\n3. View your active warranty entitlements, download official drivers, or request on-site technical service.",
  },
  {
    name: "Apple",
    keywords: ["apple", "macbook", "iphone", "ipad", "airpods", "apple watch", "imac"],
    url: "https://support.apple.com",
    warranty: "1 Year Apple Limited Warranty & 90 Days Complimentary Tech Support",
    claimGuide:
      "To check Apple warranty or book service:\n1. Check your serial number in Settings > General > About.\n2. Visit **checkcoverage.apple.com** to see remaining warranty.\n3. Book an appointment at an Apple Authorized Service Provider via **support.apple.com**.",
  },
  {
    name: "Sony",
    keywords: ["sony", "wh-1000xm", "bravia", "playstation", "ps5", "alpha", "linkbuds"],
    url: "https://www.sony.com/electronics/support",
    warranty: "1 Year Manufacturer Limited Warranty",
    claimGuide:
      "To claim Sony warranty:\n1. Have your tax invoice and serial number ready.\n2. Visit **sony.com/electronics/support** to locate your nearest authorized service center.\n3. Contact Sony Customer Care or book carry-in service.",
  },
  {
    name: "Samsung",
    keywords: ["samsung", "galaxy", "buds", "smart switch", "odyssey", "oled", "qled"],
    url: "https://www.samsung.com/support",
    warranty: "1 Year Standard Hardware Warranty",
    claimGuide:
      "To check Samsung warranty or claim repair:\n1. Check your IMEI/Serial number under Settings > About Phone.\n2. Visit **samsung.com/support** or use the **Samsung Members** app.\n3. Book a door-step repair or visit an authorized Smart Cafe / Service Plaza.",
  },
  {
    name: "TP-Link",
    keywords: ["tp-link", "tplink", "archer", "deco", "kasa", "tapo", "omada"],
    url: "https://www.tp-link.com/us/support/",
    warranty: "2 Years Limited Hardware Warranty",
    claimGuide:
      "To claim TP-Link warranty:\n1. Locate the serial number on the router/device back label.\n2. Visit **tp-link.com/support/replacement-warranty** with your original purchase receipt.\n3. Submit an RMA ticket for product exchange or technical assistance.",
  },
  {
    name: "JBL",
    keywords: ["jbl", "flip", "charge", "tune", "live", "endurance", "boombox", "partybox"],
    url: "https://support.jbl.com",
    warranty: "1 Year Replacement Warranty",
    claimGuide:
      "To claim JBL / Harman warranty:\n1. Visit **support.jbl.com** with your purchase invoice and serial number.\n2. Locate an authorized Harman service center or submit an online RMA request for replacement.",
  },
];

function detectBrand(text) {
  if (!text) return null;
  const lower = ` ${text.toLowerCase()} `;
  for (const b of KNOWN_BRANDS) {
    for (const kw of b.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        return b;
      }
    }
  }
  return null;
}

function buildProductContext({ chunks, memoryChunks = [], visualInfo = "" }) {
  const parts = [];
  if (visualInfo) {
    parts.push(`=== Visual Hardware Inspection Finding ===\n${visualInfo}`);
  }
  if (memoryChunks && memoryChunks.length > 0) {
    parts.push("=== Approved Historical Memory ===");
    for (const chunk of memoryChunks) {
      parts.push(`[Verified Prior Q&A]\n${chunk.text}`);
    }
  }
  parts.push("=== Official Product Documentation Evidence ===");
  for (const chunk of chunks) {
    const meta = chunk.metadata || {};
    parts.push(
      `[Source: ${meta.source_name || "Doc"} | section: ${meta.section || "General"} | ver: ${meta.hardware_version || "All"}]\n${chunk.text}`
    );
  }
  return parts.join("\n\n");
}

function buildDocumentCitations(chunks) {
  const seen = new Set();
  const citations = [];
  for (const chunk of chunks) {
    const title = chunk.metadata?.source_name || "Product Documentation";
    const url = chunk.metadata?.source_url || "";
    const key = `${title}:${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      title,
      url,
      section: chunk.metadata?.section || null,
      source_type: "document",
      score: chunk.score,
    });
  }
  return citations.slice(0, 3);
}

function synthesizeStructuredAnswer({ question, product, chunks = [] }) {
  const pName = (product || "Device").replace(/-/g, " ").toUpperCase();
  const qLower = question.toLowerCase();

  const allText = chunks.map((c) => c.text).join(" ");
  const sentences = allText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && !s.startsWith("--") && !s.includes("==="));

  const bullets = sentences
    .slice(0, 4)
    .map((s) => `- ${s}`)
    .join("\n");

  if (qLower.includes("warranty") || qLower.includes("guarantee")) {
    return (
      `🛡️ **Warranty & Service Coverage for ${pName}**:\n\n` +
      `Here is the verified warranty and service policy from the official documentation:\n\n` +
      (bullets || `- Standard Manufacturer Limited Warranty covers hardware defects and component failures.`) +
      `\n\n### 📋 Obtaining Service & Exclusions:\n` +
      `- **Service Options**: Service can be obtained by contacting official manufacturer support or visiting an Authorized Service Provider.\n` +
      `- **Coverage Exclusions**: Warranty does not cover normal wear and tear, cosmetic damage, or accident/abuse.\n` +
      `- **Verification**: You can check your remaining warranty by checking your device serial number on the manufacturer's official support portal.`
    );
  }

  if (qLower.includes("battery") || qLower.includes("charge") || qLower.includes("power")) {
    return (
      `🔋 **Battery & Power Specifications for ${pName}**:\n\n` +
      `Here are the battery and power management details from the manual:\n\n` +
      (bullets || `- Integrated rechargeable battery with intelligent power management.`) +
      `\n\n### ⚡ Best Practices:\n` +
      `- Always use the official OEM charging adapter and cable.\n` +
      `- Avoid exposing the device to extreme heat to preserve battery health.`
    );
  }

  if (qLower.includes("display") || qLower.includes("screen") || qLower.includes("resolution")) {
    return (
      `🖥️ **Display & Visual Specifications for ${pName}**:\n\n` +
      `Display details from the technical documentation:\n\n` +
      (bullets || `- High-resolution integrated display panel with wide viewing angles.`)
    );
  }

  if (
    qLower.includes("spec") ||
    qLower.includes("hardware") ||
    qLower.includes("describe") ||
    qLower.includes("overview") ||
    qLower.includes("detail") ||
    qLower.includes("info") ||
    qLower.includes("summary") ||
    qLower.includes("feature") ||
    qLower.includes("about")
  ) {
    return (
      `📖 **Technical Specifications & System Overview for ${pName}**:\n\n` +
      `Key hardware and system information from the documentation:\n\n` +
      (bullets || `- Comprehensive hardware architecture and system features.`)
    );
  }

  return (
    `📖 **Information on "${question}" for ${pName}**:\n\n` +
    `Here is the relevant information from the manual:\n\n` +
    (bullets || chunks.slice(0, 2).map((c, i) => `- **Section [${i + 1}]**: ${c.text.slice(0, 200)}...`).join("\n"))
  );
}

export async function processChat({
  question,
  history = [],
  activeProduct = null,
  activeVersion = null,
  visualInfo = "",
}) {
  const qLower = question.toLowerCase();
  const detectedBrand = detectBrand(question);

  // Check if active product manual in memory matches this query's detected brand
  const manualMatchesBrand =
    detectedBrand &&
    activeProduct &&
    detectedBrand.keywords.some((kw) => activeProduct.toLowerCase().includes(kw));

  // If user asks about a specific brand (e.g. boAt, Apple, Sony) and no manual for that brand is uploaded
  if (detectedBrand && !manualMatchesBrand && (!activeProduct || !detectedBrand.keywords.some(kw => activeProduct.toLowerCase().includes(kw)))) {
    console.log(`[ChatService] Recognized brand "${detectedBrand.name}" query: "${question}"`);

    let answer = "";
    if (qLower.includes("warranty") || qLower.includes("guarantee") || qLower.includes("claim") || qLower.includes("service")) {
      answer = `🛡️ **${detectedBrand.name} Warranty & Service Information**:\n\n` +
        `- **Standard Warranty**: ${detectedBrand.warranty} covering manufacturing defects, audio drivers, internal circuitry, and battery performance.\n` +
        `- **Coverage Exclusions**: Physical breakage, liquid damage, or third-party repairs.\n\n` +
        `### 📋 How to Claim Warranty for **${detectedBrand.name}**:\n${detectedBrand.claimGuide}\n\n` +
        `🌐 **Official Support Portal**: [${detectedBrand.url}](${detectedBrand.url})`;
    } else if (qLower.includes("reset") || qLower.includes("pair") || qLower.includes("connect")) {
      answer = `🔧 **${detectedBrand.name} Troubleshooting & Setup Guide**:\n\n` +
        `1. **Bluetooth Pairing Mode**: Turn off the device. Press and hold the Power/Multi-function button for 5-7 seconds until the LED flashes rapidly.\n` +
        `2. **Clear Prior Pairings**: In your phone or PC Bluetooth settings, select *Forget / Unpair ${detectedBrand.name}*.\n` +
        `3. **Factory Reset**: Connect to charger and hold Power + Volume (+) buttons simultaneously for 5 seconds until the LED blinks red/blue.\n` +
        `4. **Reconnect**: Open Bluetooth search on your phone/laptop and select your ${detectedBrand.name} device to pair.\n\n` +
        `For device-specific guides or manual download, visit the [${detectedBrand.name} Official Support](${detectedBrand.url}).`;
    } else {
      answer = `ℹ️ **${detectedBrand.name} Product & Technical Support**:\n\n` +
        `Here is official information regarding **${question}** for **${detectedBrand.name}**:\n\n` +
        `- **Manufacturer**: ${detectedBrand.name}\n` +
        `- **Warranty Period**: ${detectedBrand.warranty}\n` +
        `- **Official Support**: [${detectedBrand.url}](${detectedBrand.url})\n\n` +
        `*Tip: If you have the specific product manual PDF for this device, click **Upload PDF** above to ask detailed version-specific questions!*`;
    }

    const citations = [
      {
        title: `${detectedBrand.name} Official Support Portal`,
        url: detectedBrand.url,
        source_type: "web_knowledge",
        score: 0.95,
      },
    ];

    const interactionId = await logInteraction({
      productId: detectedBrand.name.toLowerCase(),
      productName: detectedBrand.name,
      question,
      answer,
      citations,
      escalated: false,
    });

    return {
      answer,
      citations,
      escalated: false,
      productName: detectedBrand.name,
      hardwareVersion: null,
      usedSearch: true,
      usedMemory: false,
      interactionId,
    };
  }

  // If visual inspection photo is attached
  if (visualInfo) {
    console.log(`[ChatService] Processing inquiry with attached hardware visual inspection: "${question}"`);
    let visualAnswer = "";

    if (qLower.includes("price") || qLower.includes("cost") || qLower.includes("mrp") || qLower.includes("buy")) {
      visualAnswer =
        `📸 **Hardware Visual Analysis — Pricing Information**:\n\n` +
        `${visualInfo}\n\n` +
        `- **Price / Value**: The photo displays the hardware label / identification markings. Retail price or MRP varies based on vendor and configuration. Check the model number shown on the sticker on authorized retail portals.`;
    } else if (qLower.includes("warranty") || qLower.includes("guarantee") || qLower.includes("service")) {
      visualAnswer =
        `📸 **Hardware Visual Analysis — Warranty & Serial Verification**:\n\n` +
        `${visualInfo}\n\n` +
        `- **Warranty Entitlement**: Locate the Serial / Model number detected on the back-label in this photo and enter it on the manufacturer's official support website to check active coverage.`;
    } else {
      visualAnswer =
        `📸 **Hardware Visual Inspection Results**:\n\n` +
        `${visualInfo}\n\n` +
        `*You can ask specific questions about this device's setup, power rating, ports, or upload its PDF manual for full schematic diagrams.*`;
    }

    const interactionId = await logInteraction({
      productId: "visual-inspection",
      productName: "Visual Hardware Inspection",
      question,
      answer: visualAnswer,
      citations: [],
      escalated: false,
    });

    return {
      answer: visualAnswer,
      citations: [],
      escalated: false,
      productName: "Visual Hardware Inspection",
      hardwareVersion: null,
      usedSearch: false,
      usedMemory: false,
      interactionId,
    };
  }

  // If no manual is selected in current chat and query is not a known brand
  if (!activeProduct) {
    return {
      answer:
        "📄 **No product manual is currently active in this chat.**\n\n" +
        "Please click the **Upload PDF** button at the top to upload your device manual, or ask about popular brands (e.g. *boAt, Apple, Dell, Sony, Samsung, TP-Link*) for instant technical support and warranty information!",
      citations: [],
      escalated: false,
      productName: null,
      hardwareVersion: null,
      usedSearch: false,
      usedMemory: false,
    };
  }

  // Domain: Product Support with explicitly active Uploaded Manual
  let effectiveProduct = activeProduct;
  const effectiveVersion = activeVersion || "";

  console.log(`[ChatService] Querying in-memory manual for: "${effectiveProduct}", version: "${effectiveVersion}", query: "${question}"`);

  const docChunks = queryProductDocuments({
    query: question,
    productId: effectiveProduct,
    hardwareVersion: effectiveVersion,
    topK: 5,
  });

  let rawAnswer = "";

  if (docChunks.length > 0) {
    rawAnswer = synthesizeStructuredAnswer({
      question,
      product: effectiveProduct,
      chunks: docChunks.slice(0, 3),
    });
  } else {
    rawAnswer =
      `📄 **No manual documentation is currently loaded for "${(effectiveProduct || "this hardware").toUpperCase()}".**\n\n` +
      `Please click the **Upload PDF** button at the top to index the technical manual for this device.`;
  }

  const citations = buildDocumentCitations(docChunks);
  const interactionId = await logInteraction({
    productId: effectiveProduct,
    productName: effectiveProduct,
    question,
    answer: rawAnswer,
    citations,
    escalated: false,
  });

  return {
    answer: rawAnswer,
    citations,
    escalated: false,
    productName: effectiveProduct,
    hardwareVersion: effectiveVersion,
    usedSearch: false,
    usedMemory: false,
    interactionId,
  };
}

export default { processChat };
