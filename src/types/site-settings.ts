export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  [key: string]: string | undefined;
};

export type AdminSiteSettings = {
  id: number;
  logoUrl: string | null;
  logoStorageKey: string | null;
  faviconUrl: string | null;
  faviconStorageKey: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  showroomAddress: string | null;
  businessHours: string | null;
  socialLinks: SocialLinks | null;
  gstin: string | null;
  pan: string | null;
  cin: string | null;
  announcementText: string | null;
  announcementLinkUrl: string | null;
  announcementIsActive: boolean;
  flatShippingFee: string;
  freeShippingMinAmount: string | null;
  floorDeliveryChargePerFloor: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PublicSiteSettings = {
  logoUrl: string | null;
  faviconUrl: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  showroomAddress: string | null;
  businessHours: string | null;
  socialLinks: SocialLinks | null;
  gstin: string | null;
  pan: string | null;
  cin: string | null;
  announcement: {
    text: string | null;
    linkUrl: string | null;
    isActive: boolean;
  };
  shipping: {
    flatShippingFee: string;
    freeShippingMinAmount: string | null;
    floorDeliveryChargePerFloor: string;
  };
};

export type UpdateSiteSettingsPayload = {
  logoUrl?: string | null;
  logoStorageKey?: string | null;
  faviconUrl?: string | null;
  faviconStorageKey?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  showroomAddress?: string | null;
  businessHours?: string | null;
  socialLinks?: SocialLinks | null;
  gstin?: string | null;
  pan?: string | null;
  cin?: string | null;
  announcementText?: string | null;
  announcementLinkUrl?: string | null;
  announcementIsActive?: boolean;
  flatShippingFee?: number;
  freeShippingMinAmount?: number | null;
  floorDeliveryChargePerFloor?: number;
};
