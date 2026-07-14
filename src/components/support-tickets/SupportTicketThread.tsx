import { formatDate } from "@/lib/format";
import type { SupportTicket, SupportTicketMessage } from "@/types/support-ticket";

type SupportTicketThreadProps = {
  messages: SupportTicketMessage[];
};

export function SupportTicketThread({ messages }: SupportTicketThreadProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No messages yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: SupportTicketMessage }) {
  const isStaff = message.authorType === "STAFF";

  return (
    <div
      className={
        isStaff
          ? "ml-0 mr-8 rounded-xl border bg-muted/40 p-4"
          : "ml-8 mr-0 rounded-xl border border-primary/20 bg-primary/5 p-4"
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium">
          {isStaff ? "Staff" : "Customer"}
        </span>
        <span>{formatDate(message.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
      {message.attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {message.attachments.map((attachment) => (
            <a
              key={attachment.id ?? attachment.url}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border bg-background"
            >
              <img
                src={attachment.url}
                alt="Support attachment"
                className="aspect-square size-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function SupportTicketMeta({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>
        Order{" "}
        <span className="font-medium text-foreground">
          {ticket.order.orderNumber}
        </span>
      </p>
      {ticket.customer && (
        <p>
          Customer{" "}
          <span className="font-medium text-foreground">
            {ticket.customer.phone}
          </span>
        </p>
      )}
    </div>
  );
}
