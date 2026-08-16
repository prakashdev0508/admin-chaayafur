import { formatPhone } from "@/lib/format";
import { quotationImageProxyUrl } from "@/lib/quotation-image";
import {
  formatQuoteAmount,
  formatQuoteBannerDate,
  formatQuoteDate,
  formatQuoteDateTime,
  formatQuoteRupees,
  gstAmount,
  lineTotal,
  quotationTotals,
  taxableAmount,
} from "@/lib/quotation";
import type { QuotationCompanyInfo, QuotationDraft } from "@/types/quotation";
import type { CSSProperties } from "react";

type QuotationPreviewProps = {
  draft: QuotationDraft;
  company: QuotationCompanyInfo;
};

function contactLine(company: QuotationCompanyInfo) {
  return [company.phone, company.email].filter(Boolean).join("  ·  ");
}

function imageSrc(url: string) {
  if (url.startsWith("data:")) return url;
  return quotationImageProxyUrl(url);
}

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
    'Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif',
};

const label: CSSProperties = {
  margin: 0,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: BROWN,
};

const money: CSSProperties = {
  textAlign: "right",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
  verticalAlign: "middle",
};

export function QuotationPreview({ draft, company }: QuotationPreviewProps) {
  const issued = formatQuoteBannerDate();
  const issuedAt = formatQuoteDateTime();
  const totals = quotationTotals(draft.items);
  const contact = contactLine(company);

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
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "28px 32px 20px",
        }}
      >
        <div>
          <p
            style={{
              ...label,
              fontSize: 11,
              letterSpacing: "0.28em",
            }}
          >
            Chaaya Furnitures
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: BROWN_DARK,
            }}
          >
            QUOTATION
          </p>
          <div
            style={{
              marginTop: 10,
              height: 1,
              width: 56,
              backgroundColor: BROWN,
            }}
          />
          <p
            style={{
              margin: "10px 0 0",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              letterSpacing: "0.04em",
              color: MUTED,
            }}
          >
            No. {draft.quoteNumber}
          </p>
        </div>
        {company.logoUrl ? (
          <img
            src={imageSrc(company.logoUrl)}
            alt={company.name}
            crossOrigin="anonymous"
            style={{
              height: 56,
              width: "auto",
              maxWidth: 132,
              objectFit: "contain",
            }}
          />
        ) : null}
      </div>

      <div
        style={{
          margin: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          borderTop: `1px solid ${LINE}`,
          borderBottom: `1px solid ${LINE}`,
          backgroundColor: WASH,
          padding: "10px 16px",
          fontSize: 11,
          color: BROWN_DARK,
        }}
      >
        <span>
          <span style={{ letterSpacing: "0.12em", color: BROWN, textTransform: "uppercase" }}>
            Date
          </span>
          {"  "}
          {issued}
        </span>
        {contact ? <span>{contact}</span> : <span />}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 32,
          padding: "20px 32px",
        }}
      >
        <div
          style={{
            minWidth: 0,
            borderLeft: `2px solid ${BROWN}`,
            paddingLeft: 12,
            fontSize: 12,
            lineHeight: "20px",
          }}
        >
          <p style={label}>Prepared for</p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 14,
              fontWeight: 600,
              color: INK,
            }}
          >
            {draft.customerName.trim() || "Customer name"}
          </p>
          {draft.customerAddress.trim() ? (
            <p
              style={{
                margin: "2px 0 0",
                whiteSpace: "pre-wrap",
                color: BODY,
              }}
            >
              {draft.customerAddress.trim()}
            </p>
          ) : null}
          <p style={{ margin: "4px 0 0", color: BODY }}>
            {draft.customerPhone.trim()
              ? formatPhone(draft.customerPhone.trim())
              : "—"}
          </p>
          {draft.customerEmail.trim() ? (
            <p style={{ margin: 0, color: BODY }}>{draft.customerEmail.trim()}</p>
          ) : null}
        </div>
        <div
          style={{
            flexShrink: 0,
            textAlign: "right",
            fontSize: 11,
            lineHeight: "24px",
            color: BODY,
          }}
        >
          {draft.validUntil ? (
            <p style={{ margin: 0 }}>
              <span
                style={{
                  letterSpacing: "0.12em",
                  color: BROWN,
                  textTransform: "uppercase",
                }}
              >
                Valid until
              </span>
              <br />
              {formatQuoteDate(draft.validUntil)}
            </p>
          ) : null}
          <p style={{ margin: "8px 0 0" }}>{issuedAt}</p>
        </div>
      </div>

      <div style={{ padding: "0 20px 8px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 10.5,
          }}
        >
          <colgroup>
            <col style={{ width: "7%" }} />
            <col style={{ width: "33%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "13.25%" }} />
            <col style={{ width: "13.25%" }} />
            <col style={{ width: "13.25%" }} />
            <col style={{ width: "13.25%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: BROWN_DARK, color: CREAM }}>
              {(
                [
                  ["S No.", "left"],
                  ["Product", "left"],
                  ["Qty", "right"],
                  ["Unit", "right"],
                  ["Taxable", "right"],
                  ["GST", "right"],
                  ["Total", "right"],
                ] as const
              ).map(([title, align], index, all) => (
                <th
                  key={title}
                  style={{
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: index === 0 ? 10 : 6,
                    paddingRight: index === all.length - 1 ? 10 : 6,
                    textAlign: align,
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: "0.08em",
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
                  colSpan={7}
                  style={{
                    padding: "32px 12px",
                    textAlign: "center",
                    color: PLACEHOLDER,
                  }}
                >
                  Line items will appear here.
                </td>
              </tr>
            ) : (
              draft.items.map((item, index) => {
                const inclusive = lineTotal(item);
                const rowBg = index % 2 === 1 ? "rgba(243, 237, 230, 0.55)" : CREAM;
                return (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: rowBg,
                      borderBottom: `1px solid ${LINE}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 4px 12px 10px",
                        verticalAlign: "middle",
                        color: PLACEHOLDER,
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "12px 6px", verticalAlign: "middle" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={imageSrc(item.imageUrl)}
                            alt=""
                            crossOrigin="anonymous"
                            style={{
                              width: 40,
                              height: 40,
                              flexShrink: 0,
                              objectFit: "cover",
                              border: `1px solid ${LINE}`,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              flexShrink: 0,
                              backgroundColor: LINE,
                            }}
                          />
                        )}
                        <span
                          style={{
                            lineHeight: "16px",
                            fontWeight: 500,
                            color: INK,
                            wordBreak: "break-word",
                          }}
                        >
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        ...money,
                        padding: "12px 6px",
                      }}
                    >
                      {item.quantity}
                    </td>
                    <td style={{ ...money, padding: "12px 6px" }}>
                      {formatQuoteAmount(taxableAmount(item.unitPrice))}
                    </td>
                    <td style={{ ...money, padding: "12px 6px" }}>
                      {formatQuoteAmount(taxableAmount(inclusive))}
                    </td>
                    <td style={{ ...money, padding: "12px 6px" }}>
                      {formatQuoteAmount(gstAmount(inclusive))}
                    </td>
                    <td
                      style={{
                        ...money,
                        padding: "12px 10px 12px 6px",
                        fontWeight: 600,
                      }}
                    >
                      {formatQuoteAmount(inclusive)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p
          style={{
            margin: "6px 0 0",
            textAlign: "right",
            fontSize: 9,
            letterSpacing: "0.04em",
            color: PLACEHOLDER,
          }}
        >
          Amounts in Rs
        </p>
      </div>

      {draft.notes.trim() ? (
        <div
          style={{
            margin: "8px 32px 0",
            borderTop: `1px solid ${LINE}`,
            paddingTop: 12,
            fontSize: 11,
            color: BODY,
          }}
        >
          <p style={label}>Notes</p>
          <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
            {draft.notes.trim()}
          </p>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          padding: "16px 32px 24px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 20,
              color: BROWN,
              fontStyle: "italic",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Thanks for business!
          </p>
          {company.gstin ? (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 10,
                letterSpacing: "0.04em",
                color: PLACEHOLDER,
              }}
            >
              GSTIN {company.gstin}
            </p>
          ) : null}
        </div>
        <div
          style={{
            minWidth: 220,
            border: `1px solid ${LINE}`,
            backgroundColor: "#ffffff",
            padding: "12px 16px",
            fontSize: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 32,
              padding: "2px 0",
              color: BODY,
            }}
          >
            <span>Sub total</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatQuoteRupees(totals.taxable)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 32,
              padding: "2px 0",
              color: BODY,
            }}
          >
            <span>GST total</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatQuoteRupees(totals.gst)}
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              gap: 32,
              borderTop: `1px solid ${BROWN_DARK}`,
              paddingTop: 8,
              fontWeight: 600,
              color: BROWN_DARK,
            }}
          >
            <span>Total</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatQuoteRupees(totals.inclusive)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
