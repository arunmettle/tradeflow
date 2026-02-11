import React from "react";
import { Prisma } from "@prisma/client";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

type NumericLike = Prisma.Decimal | number | string | null | undefined;

type QuoteLine = {
  name: string;
  category: string;
  qty: NumericLike;
  unit: string;
  unitRate: NumericLike;
  lineTotal?: NumericLike;
};

type Tradie = {
  businessName: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  logoUrl?: string | null;
  plan?: string;
  brandSettings?: unknown;
};

type Quote = {
  number: number;
  status: string;
  createdAt: Date;
  customerName: string;
  customerEmail?: string | null;
  siteAddress?: string | null;
  jobDescriptionRaw: string;
  trade?: string | null;
  jobType?: string | null;
  scopeBullets?: unknown;
  exclusions?: unknown;
  terms?: unknown;
  includeGst: boolean;
  subTotal: NumericLike;
  gstAmount: NumericLike;
  total: NumericLike;
  lines: QuoteLine[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontSize: 10,
    color: "#0f172a",
  },
  section: {
    marginBottom: 14,
    border: "1 solid #e2e8f0",
    borderRadius: 6,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 2,
  },
  subHeading: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#475569",
  },
  muted: {
    color: "#475569",
  },
  grid2: {
    flexDirection: "row",
    gap: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#475569",
    marginBottom: 4,
  },
  strong: {
    fontWeight: 700,
  },
  spacer4: {
    marginTop: 4,
  },
  spacer8: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1 solid #cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8,
    textTransform: "uppercase",
    color: "#475569",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  itemCol: { width: "40%" },
  qtyCol: { width: "12%" },
  unitCol: { width: "12%" },
  rateCol: { width: "18%", textAlign: "right" },
  totalCol: { width: "18%", textAlign: "right" },
  listItem: {
    marginBottom: 3,
  },
  footer: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 8,
    color: "#64748b",
  },
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const toNumber = (value: NumericLike) =>
  value === null || value === undefined ? 0 : Number(value);

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? (value as string[]).filter((v) => typeof v === "string") : [];

const toTerms = (value: unknown) =>
  (value as { depositPercent?: number; validityDays?: number; notes?: string } | null) ?? {};

const formatAddress = (tradie: Tradie) => {
  const parts = [
    tradie.addressLine1,
    tradie.addressLine2,
    [tradie.suburb, tradie.state, tradie.postcode].filter(Boolean).join(" "),
  ]
    .map((x) => (x ?? "").trim())
    .filter(Boolean);
  return parts.join(", ");
};

type QuotePdfDocumentProps = {
  quote: Quote;
  tradie: Tradie;
};

function QuotePdfDocument({ quote, tradie }: QuotePdfDocumentProps) {
  const scope = toStringArray(quote.scopeBullets);
  const exclusions = toStringArray(quote.exclusions);
  const terms = toTerms(quote.terms);
  const tradieAddress = formatAddress(tradie);

  return (
    <Document title={`Quote #${quote.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={[styles.section, { paddingBottom: 8 }]}>
          <Text style={styles.subHeading}>Quote #{quote.number}</Text>
          <View style={styles.row}>
            <View style={{ maxWidth: "70%" }}>
              <Text style={styles.heading}>{tradie.businessName}</Text>
              <Text style={styles.muted}>
                {quote.trade ?? "General"} {quote.jobType ? `• ${quote.jobType}` : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.strong}>{quote.status}</Text>
              <Text style={[styles.spacer4, styles.muted]}>
                Date: {dateFormat.format(new Date(quote.createdAt))}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.grid2]}>
          <View style={styles.col}>
            <Text style={styles.label}>Business details</Text>
            <Text style={styles.strong}>{tradie.businessName}</Text>
            {tradie.email ? <Text>{tradie.email}</Text> : null}
            {tradie.phone ? <Text>{tradie.phone}</Text> : null}
            {tradie.website ? <Text>{tradie.website}</Text> : null}
            {tradieAddress ? <Text>{tradieAddress}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Customer details</Text>
            <Text style={styles.strong}>{quote.customerName}</Text>
            {quote.customerEmail ? <Text>{quote.customerEmail}</Text> : null}
            {quote.siteAddress ? <Text>{quote.siteAddress}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Job description</Text>
          <Text>{quote.jobDescriptionRaw}</Text>
        </View>

        {scope.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.label}>Scope of works</Text>
            <View style={styles.spacer4}>
              {scope.map((item, idx) => (
                <Text key={`scope-${idx}`} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.itemCol}>Item</Text>
            <Text style={styles.qtyCol}>Qty</Text>
            <Text style={styles.unitCol}>Unit</Text>
            <Text style={styles.rateCol}>Rate</Text>
            <Text style={styles.totalCol}>Total</Text>
          </View>
          {quote.lines.map((line, idx) => (
            <View key={`line-${idx}`} style={styles.tableRow}>
              <View style={styles.itemCol}>
                <Text style={styles.strong}>{line.name}</Text>
                <Text style={styles.muted}>{line.category}</Text>
              </View>
              <Text style={styles.qtyCol}>{toNumber(line.qty).toFixed(2)}</Text>
              <Text style={styles.unitCol}>{line.unit}</Text>
              <Text style={styles.rateCol}>{currency.format(toNumber(line.unitRate))}</Text>
              <Text style={[styles.totalCol, styles.strong]}>
                {currency.format(toNumber(line.lineTotal))}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, styles.grid2]}>
          <View style={styles.col}>
            <Text style={styles.label}>Terms</Text>
            <Text>Deposit: {Number(terms.depositPercent ?? 0)}%</Text>
            <Text>Validity: {Number(terms.validityDays ?? 0)} days</Text>
            {terms.notes ? <Text style={styles.spacer4}>{terms.notes}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Totals</Text>
            <View style={styles.row}>
              <Text>Subtotal</Text>
              <Text>{currency.format(toNumber(quote.subTotal))}</Text>
            </View>
            <View style={styles.row}>
              <Text>GST</Text>
              <Text>
                {quote.includeGst ? currency.format(toNumber(quote.gstAmount)) : "$0.00"}
              </Text>
            </View>
            <View style={[styles.row, styles.spacer4]}>
              <Text style={styles.strong}>Total</Text>
              <Text style={styles.strong}>{currency.format(toNumber(quote.total))}</Text>
            </View>
          </View>
        </View>

        {exclusions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.label}>Exclusions</Text>
            <View style={styles.spacer4}>
              {exclusions.map((item, idx) => (
                <Text key={`excl-${idx}`} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {tradie.plan !== "PAID" ? (
          <Text style={styles.footer}>Generated with TradeFlow</Text>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderQuotePdfBufferAsync(props: QuotePdfDocumentProps) {
  return renderToBuffer(<QuotePdfDocument {...props} />);
}
