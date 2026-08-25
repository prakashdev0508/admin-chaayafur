import {
  amountInWordsInr,
  formatPoAmount,
  formatPoDate,
  formatPoRupees,
  lineBasicValue,
  lineCgstAmount,
  lineDiscAmount,
  lineFinalAmount,
  lineSgstAmount,
  lineTotal,
  purchaseOrderTotals,
} from "@/lib/purchase-order";
import { quotationImageProxyUrl } from "@/lib/quotation-image";
import type {
  PurchaseOrderCompanyInfo,
  PurchaseOrderDraft,
  PurchaseOrderParty,
  PurchaseOrderVendor,
} from "@/types/purchase-order";
import type { CSSProperties, ReactNode } from "react";

type PurchaseOrderPreviewProps = {
  draft: PurchaseOrderDraft;
  company: PurchaseOrderCompanyInfo;
};

const CREAM = "#faf8f5";
const INK = "#2c2419";
const BROWN = "#a67c52";
const BROWN_DARK = "#6b4e3d";
const MUTED = "#7a6f63";
const BODY = "#5c5146";
const LINE = "#e8dfd4";
const WASH = "#f3ede6";
const PLACEHOLDER = "#9a8f84";

const sheet: CSSProperties = {
  boxSizing: "border-box",
  width: "210mm",
  backgroundColor: CREAM,
  color: INK,
  fontFamily:
    "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif",
};

const label: CSSProperties = {
  margin: 0,
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: BROWN,
};

const money: CSSProperties = {
  textAlign: "right",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
  verticalAlign: "middle",
};

function imageSrc(url: string) {
  if (url.startsWith("data:")) return url;
  return quotationImageProxyUrl(url);
}

function PartyBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        border: `1px solid ${LINE}`,
        backgroundColor: "#ffffff",
        padding: "8px 10px",
        fontSize: 9.5,
        lineHeight: "14px",
        color: BODY,
      }}
    >
      <p style={{ ...label, marginBottom: 6 }}>{title}</p>
      {children}
    </div>
  );
}

function Field({
  label: fieldLabel,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p style={{ margin: "0 0 2px" }}>
      <span style={{ color: MUTED }}>{fieldLabel}: </span>
      <span style={{ color: INK }}>{value.trim() || "—"}</span>
    </p>
  );
}

function VendorFields({ vendor }: { vendor: PurchaseOrderVendor }) {
  return (
    <>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: INK, fontSize: 11 }}>
        {vendor.name.trim() || "Vendor name"}
      </p>
      <Field label="Address" value={vendor.address} />
      <Field label="GSTIN" value={vendor.gstin} />
      <Field label="Contact Person" value={vendor.contactPerson} />
      <Field label="Mob No" value={vendor.phone} />
      <Field label="Email" value={vendor.email} />
    </>
  );
}

function PartyFields({ party }: { party: PurchaseOrderParty }) {
  return (
    <>
      <p style={{ margin: "0 0 2px", fontWeight: 600, color: INK, fontSize: 11 }}>
        {party.name.trim() || "Company name"}
      </p>
      {party.unitName.trim() ? (
        <p style={{ margin: "0 0 4px", color: BODY }}>
          Unit: {party.unitName.trim()}
        </p>
      ) : null}
      <Field label="Address" value={party.address} />
      <Field label="State" value={party.state} />
      <Field label="GSTIN" value={party.gstin} />
      <Field label="Mob No" value={party.phone} />
      <Field label="Email-Id" value={party.email} />
    </>
  );
}

export function PurchaseOrderPreview({
  draft,
  company,
}: PurchaseOrderPreviewProps) {
  const totals = purchaseOrderTotals(draft.items);
  const words = amountInWordsInr(totals.netAmount);
  const terms = draft.terms.map((term) => term.trim()).filter(Boolean);

  return (
    <div style={sheet}>
      <div
        style={{
          height: 6,
          width: "100%",
          backgroundColor: BROWN_DARK,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 24px 12px",
        }}
      >
        <div style={{ minWidth: 120, fontSize: 9, lineHeight: "14px", color: MUTED }}>
          {draft.companyLegal.pan.trim() ? (
            <p style={{ margin: 0 }}>
              PAN No. : {draft.companyLegal.pan.trim()}
            </p>
          ) : null}
          {draft.companyLegal.cin.trim() ? (
            <p style={{ margin: "2px 0 0" }}>
              CIN No. : {draft.companyLegal.cin.trim()}
            </p>
          ) : null}
        </div>

        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: BROWN_DARK,
            }}
          >
            Purchase Order
          </p>
        </div>

        <div style={{ minWidth: 120, textAlign: "right" }}>
          {company.logoUrl ? (
            <img
              src={imageSrc(company.logoUrl)}
              alt={company.name}
              crossOrigin="anonymous"
              style={{
                height: 48,
                width: "auto",
                maxWidth: 110,
                objectFit: "contain",
                marginLeft: "auto",
              }}
            />
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 8,
          padding: "0 20px 8px",
          alignItems: "stretch",
        }}
      >
        <PartyBox title="Vendor">
          <VendorFields vendor={draft.vendor} />
        </PartyBox>
        <PartyBox title="Ship To">
          <PartyFields party={draft.shipTo} />
        </PartyBox>
        <PartyBox title="Bill To">
          <PartyFields party={draft.billTo} />
        </PartyBox>
      </div>

      <p
        style={{
          margin: "4px 24px 8px",
          fontSize: 9,
          fontStyle: "italic",
          color: MUTED,
        }}
      >
        Please supply following material/service subject to the terms and
        condition mentioned overleaf.
      </p>

      <div style={{ padding: "0 12px 8px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 8,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: BROWN_DARK, color: CREAM }}>
              {(
                [
                  ["Sr.", "3%"],
                  ["Description", "16%"],
                  ["HSN/SAC", "7%"],
                  ["Work Date", "7%"],
                  ["UOM", "4%"],
                  ["Qty", "4%"],
                  ["Basic", "7%"],
                  ["Disc %", "5%"],
                  ["Disc Amt", "7%"],
                  ["Final Amt", "8%"],
                  ["CGST", "8%"],
                  ["SGST", "8%"],
                  ["Total", "8%"],
                ] as const
              ).map(([title, width], index, all) => (
                <th
                  key={title}
                  style={{
                    width,
                    paddingTop: 7,
                    paddingBottom: 7,
                    paddingLeft: index === 0 ? 4 : 2,
                    paddingRight: index === all.length - 1 ? 4 : 2,
                    textAlign: index <= 4 ? "left" : "right",
                    fontSize: 7,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: CREAM,
                    backgroundColor: BROWN_DARK,
                  }}
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draft.items.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  style={{
                    padding: "24px 8px",
                    textAlign: "center",
                    color: PLACEHOLDER,
                  }}
                >
                  Line items will appear here.
                </td>
              </tr>
            ) : (
              draft.items.map((item, index) => {
                const rowBg =
                  index % 2 === 1 ? "rgba(243, 237, 230, 0.55)" : CREAM;
                return (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: rowBg,
                      borderBottom: `1px solid ${LINE}`,
                    }}
                  >
                    <td style={{ padding: "6px 2px 6px 4px", color: PLACEHOLDER }}>
                      {index + 1}
                    </td>
                    <td
                      style={{
                        padding: "6px 2px",
                        fontWeight: 500,
                        color: INK,
                        wordBreak: "break-word",
                      }}
                    >
                      {item.description}
                    </td>
                    <td style={{ padding: "6px 2px" }}>{item.hsn || "—"}</td>
                    <td style={{ padding: "6px 2px" }}>
                      {item.workCompDate
                        ? formatPoDate(item.workCompDate)
                        : "—"}
                    </td>
                    <td style={{ padding: "6px 2px" }}>{item.uom || "—"}</td>
                    <td style={{ ...money, padding: "6px 2px" }}>
                      {item.quantity}
                    </td>
                    <td style={{ ...money, padding: "6px 2px" }}>
                      {formatPoAmount(lineBasicValue(item))}
                    </td>
                    <td style={{ ...money, padding: "6px 2px" }}>
                      {formatPoAmount(item.discPercent)}
                    </td>
                    <td style={{ ...money, padding: "6px 2px" }}>
                      {formatPoAmount(lineDiscAmount(item))}
                    </td>
                    <td style={{ ...money, padding: "6px 2px" }}>
                      {formatPoAmount(lineFinalAmount(item))}
                    </td>
                    <td style={{ ...money, padding: "6px 2px", fontSize: 7.5 }}>
                      {formatPoAmount(lineCgstAmount(item))}
                      <br />
                      <span style={{ color: MUTED }}>
                        ({formatPoAmount(item.cgstPercent)}%)
                      </span>
                    </td>
                    <td style={{ ...money, padding: "6px 2px", fontSize: 7.5 }}>
                      {formatPoAmount(lineSgstAmount(item))}
                      <br />
                      <span style={{ color: MUTED }}>
                        ({formatPoAmount(item.sgstPercent)}%)
                      </span>
                    </td>
                    <td
                      style={{
                        ...money,
                        padding: "6px 4px 6px 2px",
                        fontWeight: 600,
                      }}
                    >
                      {formatPoAmount(lineTotal(item))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          margin: "0 16px",
          border: `1px solid ${LINE}`,
          backgroundColor: WASH,
          padding: "8px 12px",
          fontSize: 10,
          color: BODY,
        }}
      >
        <span style={{ ...label, letterSpacing: "0.1em" }}>
          Amount In Words :{" "}
        </span>
        <span style={{ fontWeight: 600, color: INK }}>{words}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          padding: "12px 16px 8px",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 10,
            lineHeight: "15px",
            color: BODY,
          }}
        >
          <p style={{ ...label, marginBottom: 4 }}>Address</p>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", color: INK }}>
            {(draft.companyLegal.address.trim() ||
              company.showroomAddress?.trim() ||
              "—")}
          </p>
          <p style={{ ...label, marginTop: 8, marginBottom: 4 }}>Date</p>
          <p style={{ margin: 0, color: INK }}>
            {formatPoDate(draft.date) || "—"}
          </p>
        </div>
        <div
          style={{
            minWidth: 240,
            border: `1px solid ${LINE}`,
            backgroundColor: "#ffffff",
            padding: "10px 14px",
            fontSize: 11,
          }}
        >
          {(
            [
              ["Total Basic Value", totals.totalBasic],
              ["Total Taxable Value", totals.totalTaxable],
              ["Total Tax Amount", totals.totalTax],
            ] as const
          ).map(([title, value]) => (
            <div
              key={title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 24,
                padding: "2px 0",
                color: BODY,
              }}
            >
              <span>{title}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatPoRupees(value)}
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              borderTop: `1px solid ${BROWN_DARK}`,
              paddingTop: 6,
              fontWeight: 700,
              color: BROWN_DARK,
            }}
          >
            <span>Net Amount</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatPoRupees(totals.netAmount)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 24,
          padding: "16px 24px 8px",
          fontSize: 11,
          color: BODY,
        }}
      >
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: 600, color: BROWN_DARK }}>
            {company.name}
          </p>
          <p style={{ margin: "20px 0 0", ...label }}>Authorized Signatory</p>
        </div>
      </div>

      {terms.length > 0 ? (
        <div
          style={{
            margin: "4px 24px 0",
            borderTop: `1px solid ${LINE}`,
            paddingTop: 12,
          }}
        >
          <p style={{ ...label, marginBottom: 8 }}>Terms & Conditions</p>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 14px",
              fontSize: 9.5,
              lineHeight: "15px",
              color: BODY,
            }}
          >
            {terms.map((term, index) => (
              <li key={index} style={{ marginBottom: 4 }}>
                {term}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p
        style={{
          margin: "8px 24px 16px",
          textAlign: "center",
          fontSize: 9,
          color: PLACEHOLDER,
        }}
      >
        This is a computer generated Purchase Order hence Signature is not
        required.
      </p>
    </div>
  );
}
