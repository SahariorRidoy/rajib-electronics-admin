"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "@/lib/image";
import {
  CheckCircle, Trash2, Star, Pencil, X, Check,
  Globe, Phone, Mail, Share2, ImageIcon, Settings2,
} from "lucide-react";
import {
  useGetSettingsQuery,
  useUpdateSiteNameMutation,
  useUpdateHotlineMutation,
  useAddLogoMutation,
  useActivateLogoMutation,
  useDeleteLogoMutation,
  useUpdateContactMutation,
  useAddSocialLinkMutation,
  useUpdateSocialLinkMutation,
  useDeleteSocialLinkMutation,
  useGetPublicSettingsQuery,
  useUpdateTiktokPixelMutation,
  type SocialLink,
} from "@/services/settings.api";
import { UploadValue } from "@/components/UploadImage";

const PLATFORM_OPTIONS = [
  "facebook", "youtube", "tiktok", "instagram", "messenger", "whatsapp", "twitter", "linkedin", "other",
];

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-700",
  youtube: "bg-red-100 text-red-700",
  tiktok: "bg-gray-900 text-white",
  instagram: "bg-pink-100 text-pink-700",
  messenger: "bg-purple-100 text-purple-700",
  whatsapp: "bg-green-100 text-green-700",
  twitter: "bg-sky-100 text-sky-700",
  linkedin: "bg-blue-100 text-blue-800",
  other: "bg-gray-100 text-gray-700",
};

function SectionCard({ icon, title, badge, children }: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#167389]/10 text-[#167389]">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-gray-800 flex-1">{title}</h2>
        {badge && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CurrentValue({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 mb-4">
      <span className="text-xs text-gray-400">{label}:</span>
      <span className="text-sm font-medium text-gray-700 truncate">{value || "—"}</span>
    </div>
  );
}

export default function SiteSettingsPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const { refetch: refetchPublic } = useGetPublicSettingsQuery();

  const [updateSiteName, { isLoading: savingName }] = useUpdateSiteNameMutation();
  const [updateHotline, { isLoading: savingHotline }] = useUpdateHotlineMutation();
  const [addLogo, { isLoading: addingLogo }] = useAddLogoMutation();
  const [activateLogo] = useActivateLogoMutation();
  const [deleteLogo] = useDeleteLogoMutation();
  const [updateContact, { isLoading: savingContact }] = useUpdateContactMutation();
  const [addSocialLink, { isLoading: addingSocial }] = useAddSocialLinkMutation();
  const [updateSocialLink] = useUpdateSocialLinkMutation();
  const [deleteSocialLink] = useDeleteSocialLinkMutation();

  const [updateTiktokPixel, { isLoading: savingPixel }] = useUpdateTiktokPixelMutation();
  const [pixelId, setPixelId] = useState("");
  const [pixelEnabled, setPixelEnabled] = useState(false);

  const [siteName, setSiteName] = useState("");
  const [hotline, setHotline] = useState("");
  const [phones, setPhones] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("facebook");
  const [socialValue, setSocialValue] = useState("");
  const [socialLabel, setSocialLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlatform, setEditPlatform] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");

  useEffect(() => {
    if (data) {
      setPhones(data.contactInfo?.phones ?? []);
      setEmails(data.contactInfo?.emails ?? []);
      setPixelEnabled(data.tiktokPixel?.isEnabled ?? false);
    }
  }, [data]);

  const handleSaveTiktokPixel = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTiktokPixel({ pixelId: pixelId.trim() || undefined, isEnabled: pixelEnabled });
    toast.success("TikTok Pixel saved");
    setPixelId("");
  };

  const handleSiteName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    await updateSiteName({ siteName: siteName.trim() });
    refetchPublic();
    setSiteName("");
  };

  const handleHotline = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHotline({ hotline: hotline.trim() });
    refetchPublic();
    toast.success("Hotline saved");
    setHotline("");
  };

  const handleLogoFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { uploadFile } = await import("@/services/uploads");
      const result = await uploadFile(file, "logos");
      await handleUploadLogo({ url: result.url, filePath: result.filePath });
    } catch {
      toast.error("Upload failed");
    } finally {
      e.currentTarget.value = "";
    }
  };

  const handleUploadLogo = async (value: UploadValue) => {
    if (value?.url) {
      try {
        await addLogo({ logoUrl: value.url, logoPublicId: value.filePath });
        refetchPublic();
        toast.success("Logo uploaded");
      } catch {
        toast.error("Upload failed");
      }
    }
  };

  const handleDeleteLogo = async (logoId: string) => {
    toast((t) => (
      <span className="flex items-center gap-3">
        Delete this logo?
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await deleteLogo(logoId);
              refetchPublic();
              toast.success("Logo deleted");
            } catch {
              toast.error("Delete failed");
            }
          }}
          className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg"
        >Delete</button>
        <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg">Cancel</button>
      </span>
    ), { duration: 6000 });
  };

  const handleSaveContact = async () => {
    try {
      await updateContact({ phones, emails }).unwrap();
      toast.success("Contact info saved");
    } catch {
      toast.error("Failed to save contact info");
    }
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialValue.trim()) return;
    await addSocialLink({ platform: socialPlatform, value: socialValue.trim(), label: socialLabel.trim() || undefined });
    setSocialValue("");
    setSocialLabel("");
  };

  const startEdit = (link: SocialLink) => {
    setEditingId(link._id);
    setEditPlatform(link.platform);
    setEditValue(link.value);
    setEditLabel(link.label ?? "");
  };

  const handleSaveEdit = async (id: string) => {
    await updateSocialLink({ id, platform: editPlatform, value: editValue, label: editLabel });
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#167389]/20 border-t-[#167389] rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const logos = data?.logos ?? [];
  const socialLinks = data?.socialLinks ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#167389]/10 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-[#167389]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your store identity and contact info</p>
        </div>
      </div>

      {/* Top 2-col grid: Site Name + Hotline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Site Name */}
        <SectionCard icon={<Globe className="w-4 h-4" />} title="Site Name">
          <CurrentValue label="Current" value={data?.siteName} />
          <form onSubmit={handleSiteName} className="flex gap-2">
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="New site name..."
              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] focus:ring-2 focus:ring-[#167389]/10 transition"
            />
            <button
              type="submit"
              disabled={savingName || !siteName.trim()}
              className="px-4 py-2 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-40 transition shrink-0"
            >
              {savingName ? "..." : "Save"}
            </button>
          </form>
        </SectionCard>

        {/* Hotline */}
        <SectionCard icon={<Phone className="w-4 h-4" />} title="Hotline Number">
          <CurrentValue label="Current" value={data?.hotline} />
          <form onSubmit={handleHotline} className="flex gap-2">
            <input
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              placeholder="e.g. 09611677379"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] focus:ring-2 focus:ring-[#167389]/10 transition"
            />
            <button
              type="submit"
              disabled={savingHotline}
              className="px-4 py-2 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-40 transition shrink-0"
            >
              {savingHotline ? "..." : "Save"}
            </button>
          </form>
        </SectionCard>
      </div>

      {/* Logos */}
      <SectionCard icon={<ImageIcon className="w-4 h-4" />} title="Brand Logos" badge={`${logos.length} / 3`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {logos.map((logo) => (
                <div
                  key={logo._id}
                  className={`relative rounded-xl border-2 overflow-hidden transition ${logo.isActive ? "border-[#167389] shadow-md shadow-[#167389]/10" : "border-gray-200"}`}
                >
                  <div className="relative h-24 bg-gray-50">
                    <Image src={logo.logoUrl} alt="logo" fill className="object-contain p-3" />
                    {logo.isActive && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#167389] text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow">
                        <CheckCircle className="w-2.5 h-2.5" /> Active
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 p-2 bg-white border-t border-gray-100">
                    {!logo.isActive && (
                      <button
                        onClick={async () => { await activateLogo(logo._id); refetchPublic(); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#167389] border border-[#167389]/30 rounded-lg hover:bg-[#167389]/5 transition"
                      >
                        <Star className="w-3 h-3" /> Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteLogo(logo._id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
          ))}
          {logos.length < 3 && (
            <label className="rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-400 hover:text-[#167389] hover:border-[#167389]/40" style={{height: "calc(96px + 2px + 36px)"}}>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoFilePick} disabled={addingLogo} />
              <ImageIcon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{addingLogo ? "Uploading..." : "Add Logo"}</span>
            </label>
          )}
        </div>
      </SectionCard>

      {/* Contact Info */}
      <SectionCard icon={<Mail className="w-4 h-4" />} title="Contact Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Phones */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone Numbers</p>
            <div className="flex gap-2">
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (phoneInput.trim()) { setPhones((p) => [...p, phoneInput.trim()]); setPhoneInput(""); }
                  }
                }}
                placeholder="e.g. 01700000000"
                className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] focus:ring-2 focus:ring-[#167389]/10 transition"
              />
              <button
                type="button"
                onClick={() => { if (phoneInput.trim()) { setPhones((p) => [...p, phoneInput.trim()]); setPhoneInput(""); } }}
                className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition shrink-0"
              >Add</button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {phones.length === 0 && <p className="text-xs text-gray-300 italic">No phones added</p>}
              {phones.map((ph, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-[#167389]/8 border border-[#167389]/20 rounded-full text-xs text-[#167389] font-medium">
                  <Phone className="w-2.5 h-2.5" /> {ph}
                  <button onClick={() => setPhones((p) => p.filter((_, j) => j !== i))} className="text-[#167389]/50 hover:text-red-500 transition ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Emails */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Addresses</p>
            <div className="flex gap-2">
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (emailInput.trim()) { setEmails((em) => [...em, emailInput.trim()]); setEmailInput(""); }
                  }
                }}
                placeholder="e.g. info@example.com"
                className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] focus:ring-2 focus:ring-[#167389]/10 transition"
              />
              <button
                type="button"
                onClick={() => { if (emailInput.trim()) { setEmails((em) => [...em, emailInput.trim()]); setEmailInput(""); } }}
                className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition shrink-0"
              >Add</button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {emails.length === 0 && <p className="text-xs text-gray-300 italic">No emails added</p>}
              {emails.map((em, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-[#167389]/8 border border-[#167389]/20 rounded-full text-xs text-[#167389] font-medium">
                  <Mail className="w-2.5 h-2.5" /> {em}
                  <button onClick={() => setEmails((e) => e.filter((_, j) => j !== i))} className="text-[#167389]/50 hover:text-red-500 transition ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSaveContact}
            disabled={savingContact}
            className="px-5 py-2.5 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-40 transition"
          >
            {savingContact ? "Saving..." : "Save Contact Info"}
          </button>
        </div>
      </SectionCard>

      {/* Social Links */}
      <SectionCard icon={<Share2 className="w-4 h-4" />} title="Social Links" badge={`${socialLinks.length} links`}>

        {/* Add form */}
        <form onSubmit={handleAddSocial} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_100px_80px] gap-2 mb-5">
          <select
            value={socialPlatform}
            onChange={(e) => setSocialPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] capitalize bg-white"
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <input
            value={socialValue}
            onChange={(e) => setSocialValue(e.target.value)}
            placeholder={socialPlatform === "whatsapp" ? "01700000000" : "https://..."}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] focus:ring-2 focus:ring-[#167389]/10 transition"
          />
          <input
            value={socialLabel}
            onChange={(e) => setSocialLabel(e.target.value)}
            placeholder="Label (opt.)"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] transition"
          />
          <button
            type="submit"
            disabled={addingSocial || !socialValue.trim()}
            className="px-4 py-2 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-40 transition"
          >
            {addingSocial ? "..." : "+ Add"}
          </button>
        </form>

        {/* List */}
        {socialLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Share2 className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No social links added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {socialLinks.map((link) =>
              editingId === link._id ? (
                <div key={link._id} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_110px_auto] gap-2 items-center p-3 border border-[#167389]/20 rounded-xl bg-[#167389]/5">
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  />
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(link._id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div key={link._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition group">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shrink-0 ${PLATFORM_COLORS[link.platform] ?? PLATFORM_COLORS.other}`}>
                    {link.platform}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{link.value}</p>
                    {link.label && <p className="text-xs text-gray-400">{link.label}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEdit(link)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#167389]/10 text-gray-400 hover:text-[#167389] transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteSocialLink(link._id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </SectionCard>

      {/* TikTok Pixel */}
      <SectionCard icon={<span className="text-xs font-bold">TT</span>} title="TikTok Pixel">
        <CurrentValue label="Current Pixel ID" value={data?.tiktokPixel?.pixelId || "Not set"} />
        <form onSubmit={handleSaveTiktokPixel} className="space-y-3">
          <input
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            placeholder="Enter TikTok Pixel ID (e.g. C1A2B3D4E5F6G7H8)"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] focus:ring-2 focus:ring-[#167389]/10 transition"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setPixelEnabled((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  pixelEnabled ? "bg-[#167389]" : "bg-gray-200"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  pixelEnabled ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </div>
              <span className="text-sm text-gray-600">{pixelEnabled ? "Enabled" : "Disabled"}</span>
            </label>
            <button
              type="submit"
              disabled={savingPixel}
              className="px-5 py-2 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-40 transition"
            >
              {savingPixel ? "Saving..." : "Save Pixel"}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
