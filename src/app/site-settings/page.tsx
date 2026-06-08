"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { CheckCircle, Trash2, Star, Pencil, X, Check } from "lucide-react";
import {
  useGetSettingsQuery,
  useUpdateSiteNameMutation,
  useAddLogoMutation,
  useActivateLogoMutation,
  useDeleteLogoMutation,
  useUpdateContactMutation,
  useAddSocialLinkMutation,
  useUpdateSocialLinkMutation,
  useDeleteSocialLinkMutation,
  useGetPublicSettingsQuery,
  type SocialLink,
} from "@/services/settings.api";
import UploadImage, { UploadValue } from "@/components/UploadImage";

const PLATFORM_OPTIONS = [
  "facebook", "youtube", "tiktok", "instagram", "messenger", "whatsapp", "twitter", "linkedin", "other",
];

export default function SiteSettingsPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const { refetch: refetchPublic } = useGetPublicSettingsQuery();

  const [updateSiteName, { isLoading: savingName }] = useUpdateSiteNameMutation();
  const [addLogo, { isLoading: addingLogo }] = useAddLogoMutation();
  const [activateLogo] = useActivateLogoMutation();
  const [deleteLogo] = useDeleteLogoMutation();
  const [updateContact, { isLoading: savingContact }] = useUpdateContactMutation();
  const [addSocialLink, { isLoading: addingSocial }] = useAddSocialLinkMutation();
  const [updateSocialLink] = useUpdateSocialLinkMutation();
  const [deleteSocialLink] = useDeleteSocialLinkMutation();

  const [siteName, setSiteName] = useState("");


  // contact state — seeded from DB on load
  const [phones, setPhones] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);

  useEffect(() => {
    if (data) {
      setPhones(data.contactInfo?.phones ?? []);
      setEmails(data.contactInfo?.emails ?? []);
    }
  }, [data]);
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  // social state
  const [socialPlatform, setSocialPlatform] = useState("facebook");
  const [socialValue, setSocialValue] = useState("");
  const [socialLabel, setSocialLabel] = useState("");

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlatform, setEditPlatform] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");

  // ── Site Name ──────────────────────────────────────────────
  const handleSiteName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    await updateSiteName({ siteName: siteName.trim() });
    refetchPublic();
    setSiteName("");
  };

  // ── Logo ───────────────────────────────────────────────────
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

  // ── Contact ────────────────────────────────────────────────
  const handleSaveContact = async () => {
    try {
      await updateContact({ phones, emails }).unwrap();
      toast.success("Contact info saved");
    } catch {
      toast.error("Failed to save contact info");
    }
  };

  // ── Social ─────────────────────────────────────────────────
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

  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  const logos = data?.logos ?? [];
  const socialLinks = data?.socialLinks ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-gray-800">Site Settings</h1>

      {/* ── Site Name ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-700">Site Name</h2>
        <p className="text-sm text-gray-500">
          Current: <span className="font-medium text-gray-800">{data?.siteName || "—"}</span>
        </p>
        <form onSubmit={handleSiteName} className="flex gap-3">
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="New site name..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389]"
          />
          <button
            type="submit"
            disabled={savingName || !siteName.trim()}
            className="px-5 py-2.5 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-50 transition"
          >
            {savingName ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      {/* ── Logos ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">
            Logos <span className="text-gray-400 font-normal text-sm">({logos.length}/3)</span>
          </h2>
        </div>
        {logos.length === 0 ? (
          <UploadImage
            label="Upload Logo"
            value={null}
            onChange={handleUploadLogo}
            disabled={addingLogo}
            folder="logos"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {logos.map((logo) => (
              <div key={logo._id} className={`relative rounded-xl border-2 overflow-hidden ${logo.isActive ? "border-[#167389]" : "border-gray-200"}`}>
                <div className="relative h-28 bg-gray-50">
                  <Image src={logo.logoUrl} alt="logo" fill className="object-contain p-2" />
                </div>
                {logo.isActive && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#167389] text-white text-xs px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Active
                  </div>
                )}
                <div className="flex gap-2 p-2 bg-white">
                  {!logo.isActive && (
                    <button
                      onClick={async () => { await activateLogo(logo._id); refetchPublic(); }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#167389] border border-[#167389] rounded-lg hover:bg-[#167389]/10 transition"
                    >
                      <Star className="w-3 h-3" /> Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteLogo(logo._id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Contact Info ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-700">Contact Info</h2>

        {/* Phones */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Phone Numbers</label>
          <div className="flex gap-2">
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="e.g. 01700000000"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389]"
            />
            <button
              type="button"
              onClick={() => { if (phoneInput.trim()) { setPhones((p) => [...p, phoneInput.trim()]); setPhoneInput(""); } }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phones.map((ph, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {ph}
                <button onClick={() => setPhones((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Emails */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Email Addresses</label>
          <div className="flex gap-2">
            <input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. info@rajibelectronics.com"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389]"
            />
            <button
              type="button"
              onClick={() => { if (emailInput.trim()) { setEmails((e) => [...e, emailInput.trim()]); setEmailInput(""); } }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {emails.map((em, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {em}
                <button onClick={() => setEmails((e) => e.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveContact}
          disabled={savingContact}
          className="px-5 py-2.5 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-50 transition"
        >
          {savingContact ? "Saving..." : "Save Contact Info"}
        </button>
      </section>

      {/* ── Social Links ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-700">Social Links</h2>

        {/* Add form */}
        <form onSubmit={handleAddSocial} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={socialPlatform}
            onChange={(e) => setSocialPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389] capitalize"
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <input
            value={socialValue}
            onChange={(e) => setSocialValue(e.target.value)}
            placeholder={socialPlatform === "whatsapp" ? "01700000000" : "https://..."}
            className="sm:col-span-2 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#167389]"
          />
          <button
            type="submit"
            disabled={addingSocial || !socialValue.trim()}
            className="px-4 py-2 bg-[#167389] text-white text-sm font-medium rounded-xl hover:bg-[#125f73] disabled:opacity-50 transition"
          >
            {addingSocial ? "Adding..." : "+ Add"}
          </button>
        </form>

        {/* List */}
        {socialLinks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No social links added yet.</p>
        ) : (
          <div className="space-y-2">
            {socialLinks.map((link) =>
              editingId === link._id ? (
                <div key={link._id} className="flex gap-2 items-center p-3 border border-[#167389]/30 rounded-xl bg-[#167389]/5">
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  />
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  />
                  <button onClick={() => handleSaveEdit(link._id)} className="text-green-600 hover:text-green-700">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div key={link._id} className="flex items-start justify-between gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#167389] bg-[#167389]/10 px-2 py-0.5 rounded-full shrink-0">
                        {link.platform}
                      </span>
                      {link.label && <span className="text-xs text-gray-400">({link.label})</span>}
                    </div>
                    <span className="text-sm text-gray-700 break-all">{link.value}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(link)} className="text-gray-400 hover:text-[#167389]">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSocialLink(link._id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
