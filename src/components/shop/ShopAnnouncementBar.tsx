import { Link } from "react-router-dom";
import type { PublicSiteSettings } from "@/types/site-settings";

type ShopAnnouncementBarProps = {
  announcement: PublicSiteSettings["announcement"];
};

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function ShopAnnouncementBar({ announcement }: ShopAnnouncementBarProps) {
  if (!announcement.isActive || !announcement.text?.trim()) {
    return null;
  }

  const text = announcement.text.trim();
  const linkUrl = announcement.linkUrl?.trim();

  const content = (
    <p className="text-center text-sm font-medium text-[#3D2B1F]">{text}</p>
  );

  if (!linkUrl) {
    return (
      <div className="border-b border-[#E8DFD3] bg-[#F3EBE0] px-4 py-2.5">
        {content}
      </div>
    );
  }

  if (isExternalUrl(linkUrl)) {
    return (
      <div className="border-b border-[#E8DFD3] bg-[#F3EBE0] px-4 py-2.5">
        <a
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          className="block transition hover:opacity-80"
        >
          {content}
        </a>
      </div>
    );
  }

  const to = linkUrl.startsWith("/") ? linkUrl : `/${linkUrl}`;

  return (
    <div className="border-b border-[#E8DFD3] bg-[#F3EBE0] px-4 py-2.5">
      <Link to={to} className="block transition hover:opacity-80">
        {content}
      </Link>
    </div>
  );
}
