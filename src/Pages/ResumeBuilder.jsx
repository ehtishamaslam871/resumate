import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  Download,
  Edit3,
  Eye,
  FileDown,
  GraduationCap,
  PlusCircle,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import Navbar from "../components/Navbar";

const DRAFT_KEY = "resumate_resume_builder_draft_v1";

const createEntry = () => ({
  id: crypto.randomUUID(),
  role: "",
  company: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

const createEducation = () => ({
  id: crypto.randomUUID(),
  degree: "",
  institution: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

const createProject = () => ({
  id: crypto.randomUUID(),
  title: "",
  organization: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

const defaultForm = {
  fullName: "",
  email: "",
  phone: "",
  linkedin: "",
  twitter: "",
  summary: "",
  skills: "",
  experience: [],
  education: [],
  projects: [],
};

const formatMonthYear = (value) => {
  if (!value) return "Present";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const generateMarkdown = (formData) => {
  const lines = [];

  if (formData.fullName) {
    lines.push(`# ${formData.fullName}`);
    lines.push("");
  }

  const contact = [
    formData.email,
    formData.phone,
    formData.linkedin ? `[LinkedIn](${formData.linkedin})` : "",
    formData.twitter ? `[Twitter/X](${formData.twitter})` : "",
  ].filter(Boolean);

  if (contact.length) {
    lines.push(contact.join(" | "));
    lines.push("");
  }

  if (formData.summary) {
    lines.push("## Professional Summary");
    lines.push("");
    lines.push(formData.summary);
    lines.push("");
  }

  if (formData.skills) {
    lines.push("## Skills");
    lines.push("");
    lines.push(formData.skills);
    lines.push("");
  }

  if (formData.experience.length) {
    lines.push("## Work Experience");
    lines.push("");

    formData.experience.forEach((item) => {
      lines.push(`### ${item.role || "Role"} @ ${item.company || "Company"}`);
      lines.push(`${formatMonthYear(item.startDate)} - ${item.current ? "Present" : formatMonthYear(item.endDate)}`);
      lines.push("");
      if (item.description) {
        lines.push(item.description);
        lines.push("");
      }
    });
  }

  if (formData.education.length) {
    lines.push("## Education");
    lines.push("");

    formData.education.forEach((item) => {
      lines.push(`### ${item.degree || "Degree"} - ${item.institution || "Institution"}`);
      lines.push(`${formatMonthYear(item.startDate)} - ${item.current ? "Present" : formatMonthYear(item.endDate)}`);
      lines.push("");
      if (item.description) {
        lines.push(item.description);
        lines.push("");
      }
    });
  }

  if (formData.projects.length) {
    lines.push("## Projects");
    lines.push("");

    formData.projects.forEach((item) => {
      lines.push(`### ${item.title || "Project"} - ${item.organization || "Organization"}`);
      lines.push(`${formatMonthYear(item.startDate)} - ${item.current ? "Present" : formatMonthYear(item.endDate)}`);
      lines.push("");
      if (item.description) {
        lines.push(item.description);
        lines.push("");
      }
    });
  }

  return lines.join("\n").trim();
};

const parseInlineMarkdown = (text) => {
  const parts = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={`${match[1]}-${match.index}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="text-cyan-600 hover:text-cyan-700 underline decoration-cyan-400"
      >
        {match[1]}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
};

const renderResumePreview = (mdText) => {
  const source = (mdText || "").trim();
  if (!source) {
    return <p className="text-slate-500">Your formatted resume preview will appear here.</p>;
  }

  const lines = source.split("\n");
  const nodes = [];
  let paragraphBuffer = [];

  const flushParagraph = (keyPrefix) => {
    if (!paragraphBuffer.length) return;
    const text = paragraphBuffer.join(" ").trim();
    if (text) {
      nodes.push(
        <p key={`${keyPrefix}-${nodes.length}`} className="text-slate-700 leading-7 mb-4">
          {parseInlineMarkdown(text)}
        </p>
      );
    }
    paragraphBuffer = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(`p-${index}`);
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph(`h1-${index}`);
      nodes.push(
        <h1 key={`h1-${index}`} className="text-4xl font-display font-bold text-slate-900 tracking-tight mb-3">
          {trimmed.replace("# ", "")}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph(`h2-${index}`);
      nodes.push(
        <h2 key={`h2-${index}`} className="text-2xl font-display font-bold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-300">
          {trimmed.replace("## ", "")}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph(`h3-${index}`);
      nodes.push(
        <h3 key={`h3-${index}`} className="text-lg font-bold text-slate-900 mt-5 mb-2">
          {trimmed.replace("### ", "")}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph(`li-${index}`);
      nodes.push(
        <li key={`li-${index}`} className="text-slate-700 ml-5 list-disc leading-7">
          {parseInlineMarkdown(trimmed.slice(2))}
        </li>
      );
      return;
    }

    paragraphBuffer.push(trimmed);
  });

  flushParagraph("end");

  return <>{nodes}</>;
};

function SectionEditor({
  title,
  icon,
  addLabel,
  items,
  onAdd,
  onUpdate,
  onRemove,
  config,
}) {
  const Icon = icon;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-neon-cyan" />
        <h3 className="text-2xl font-display font-bold text-gray-100">{title}</h3>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full border-2 border-dashed border-dark-600 hover:border-neon-cyan/50 rounded-2xl py-6 text-gray-300 hover:text-neon-cyan bg-dark-900/40 hover:bg-dark-800/40 transition-all"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <PlusCircle className="w-5 h-5" />
            {addLabel}
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="card-glass p-6 space-y-4 border-neon-cyan/20 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-400 font-semibold">
                  {title} {index + 1}
                </p>
                <button
                  type="button"
                  className="btn-danger px-4 py-2"
                  onClick={() => onRemove(item.id)}
                >
                  Remove
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  className="input-modern"
                  placeholder={config.field1Placeholder}
                  value={item[config.field1Key]}
                  onChange={(e) => onUpdate(item.id, config.field1Key, e.target.value)}
                />
                <input
                  type="text"
                  className="input-modern"
                  placeholder={config.field2Placeholder}
                  value={item[config.field2Key]}
                  onChange={(e) => onUpdate(item.id, config.field2Key, e.target.value)}
                />
                <label className="input-modern flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="month"
                    className="bg-transparent outline-none w-full"
                    value={item.startDate}
                    onChange={(e) => onUpdate(item.id, "startDate", e.target.value)}
                  />
                </label>
                <label className="input-modern flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="month"
                    className="bg-transparent outline-none w-full"
                    value={item.endDate}
                    onChange={(e) => onUpdate(item.id, "endDate", e.target.value)}
                    disabled={item.current}
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  className="accent-neon-cyan"
                  checked={item.current}
                  onChange={(e) => onUpdate(item.id, "current", e.target.checked)}
                />
                Current {title.slice(0, -1)}
              </label>

              <textarea
                rows={4}
                className="input-modern resize-y min-h-[120px]"
                placeholder={config.descriptionPlaceholder}
                value={item.description}
                onChange={(e) => onUpdate(item.id, "description", e.target.value)}
              />
            </div>
          ))}

          <button type="button" onClick={onAdd} className="btn-secondary w-full">
            <PlusCircle className="inline w-4 h-4 mr-2" />
            {addLabel}
          </button>
        </div>
      )}
    </section>
  );
}

export default function ResumeBuilder() {
  const [formData, setFormData] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState("form");
  const [status, setStatus] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [isMarkdownEdited, setIsMarkdownEdited] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData({ ...defaultForm, ...parsed });
      }
    } catch (error) {
      console.warn("Unable to load resume draft:", error.message);
    }
  }, []);

  const autoMarkdown = useMemo(() => generateMarkdown(formData), [formData]);

  useEffect(() => {
    if (!isMarkdownEdited) {
      setMarkdown(autoMarkdown);
    }
  }, [autoMarkdown, isMarkdownEdited]);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateEntry = (key, id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const removeEntry = (key, id) => {
    setFormData((prev) => ({ ...prev, [key]: prev[key].filter((item) => item.id !== id) }));
  };

  const downloadPdf = () => {
    const previewHtml = markdown
      .split("\n")
      .map((line) => {
        if (line.startsWith("### ")) return `<h3>${line.replace("### ", "")}</h3>`;
        if (line.startsWith("## ")) return `<h2>${line.replace("## ", "")}</h2>`;
        if (line.startsWith("# ")) return `<h1>${line.replace("# ", "")}</h1>`;
        if (!line.trim()) return "<br />";
        return `<p>${line}</p>`;
      })
      .join("");

    const popup = window.open("", "_blank", "width=900,height=1000");
    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>${formData.fullName || "Resume"}</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; padding: 36px; color: #0f172a; line-height: 1.55; }
            h1 { font-size: 32px; margin-bottom: 16px; }
            h2 { font-size: 24px; margin-top: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
            h3 { font-size: 18px; margin-top: 20px; margin-bottom: 8px; }
            p { font-size: 15px; margin: 8px 0; }
          </style>
        </head>
        <body>${previewHtml}</body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="card-glass-hover p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
          <div>
            <p className="badge-primary mb-3 inline-flex">
              <Sparkles className="w-3.5 h-3.5" />
              ATS Resume Studio
            </p>
            <h1 className="text-4xl font-display font-bold text-gray-100">Resume Builder</h1>
            <p className="text-gray-400 mt-2">Build a recruiter-ready, ATS-friendly resume in minutes.</p>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={downloadPdf} className="btn-primary">
              <FileDown className="inline w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>

        {status && (
          <div className="rounded-xl border border-neon-green/40 bg-neon-green/10 px-4 py-3 text-neon-green font-semibold animate-slide-up">
            {status}
          </div>
        )}

        <section className="card-glass-hover p-6 md:p-8 animate-fade-in-up">
          <div className="inline-flex bg-dark-900/80 p-1 rounded-xl border border-dark-700/60 mb-6">
            <button
              type="button"
              className={`px-5 py-2 rounded-lg font-semibold transition ${
                activeTab === "form"
                  ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("form")}
            >
              <Edit3 className="w-4 h-4 inline mr-2" />
              Form
            </button>
            <button
              type="button"
              className={`px-5 py-2 rounded-lg font-semibold transition ${
                activeTab === "preview"
                  ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Preview & Markdown
            </button>
          </div>

          {activeTab === "form" ? (
            <div className="space-y-10 animate-fade-in">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-neon-cyan" />
                  <h2 className="text-2xl font-display font-bold text-gray-100">Contact Information</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input className="input-modern" placeholder="Full Name" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} />
                  <input className="input-modern" placeholder="you@email.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} />
                  <input className="input-modern" placeholder="+1 234 567 8900" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  <input className="input-modern" placeholder="https://linkedin.com/in/username" value={formData.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
                  <input className="input-modern md:col-span-2" placeholder="https://twitter.com/username" value={formData.twitter} onChange={(e) => updateField("twitter", e.target.value)} />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-display font-bold text-gray-100">Professional Summary</h2>
                <textarea
                  className="input-modern min-h-[160px]"
                  placeholder="Write a concise, impact-driven professional summary..."
                  value={formData.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-neon-cyan" />
                  <h2 className="text-2xl font-display font-bold text-gray-100">Skills</h2>
                </div>
                <textarea
                  className="input-modern min-h-[120px]"
                  placeholder="React | JavaScript | MongoDB | REST APIs | Node.js"
                  value={formData.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                />
              </section>

              <SectionEditor
                title="Experiences"
                icon={Briefcase}
                addLabel="Add Experience"
                items={formData.experience}
                onAdd={() => updateField("experience", [...formData.experience, createEntry()])}
                onUpdate={(id, field, value) => updateEntry("experience", id, field, value)}
                onRemove={(id) => removeEntry("experience", id)}
                config={{
                  field1Key: "role",
                  field1Placeholder: "Title/Position",
                  field2Key: "company",
                  field2Placeholder: "Organization/Company",
                  descriptionPlaceholder: "Description of your experience",
                }}
              />

              <SectionEditor
                title="Education"
                icon={GraduationCap}
                addLabel="Add Education"
                items={formData.education}
                onAdd={() => updateField("education", [...formData.education, createEducation()])}
                onUpdate={(id, field, value) => updateEntry("education", id, field, value)}
                onRemove={(id) => removeEntry("education", id)}
                config={{
                  field1Key: "degree",
                  field1Placeholder: "Degree/Program",
                  field2Key: "institution",
                  field2Placeholder: "Institute/University",
                  descriptionPlaceholder: "Highlights, achievements, coursework",
                }}
              />

              <SectionEditor
                title="Projects"
                icon={Download}
                addLabel="Add Project"
                items={formData.projects}
                onAdd={() => updateField("projects", [...formData.projects, createProject()])}
                onUpdate={(id, field, value) => updateEntry("projects", id, field, value)}
                onRemove={(id) => removeEntry("projects", id)}
                config={{
                  field1Key: "title",
                  field1Placeholder: "Project Title",
                  field2Key: "organization",
                  field2Placeholder: "Company/Client/Organization",
                  descriptionPlaceholder: "Description of your project and impact",
                }}
              />
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-yellow-300 text-sm">
                Editing markdown directly may diverge from form values. Save when you are satisfied.
              </div>

              <div className="grid xl:grid-cols-2 gap-6 items-start">
                <div className="card-glass p-4 md:p-5">
                  <h3 className="text-lg font-display font-bold text-gray-100 mb-3">Markdown Editor</h3>
                  <textarea
                    className="input-modern min-h-[420px] font-mono text-sm"
                    value={markdown}
                    onChange={(e) => {
                      setMarkdown(e.target.value);
                      setIsMarkdownEdited(true);
                    }}
                  />
                </div>

                <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-neon-cyan/60 via-neon-purple/40 to-neon-cyan/30">
                  <div className="rounded-2xl bg-white min-h-[420px] max-h-[70vh] overflow-auto p-7 md:p-9 shadow-2xl">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
                      <h3 className="text-sm font-semibold tracking-[0.14em] uppercase text-slate-500">Live Resume Preview</h3>
                      <span className="text-xs font-semibold text-slate-500">ATS-ready layout</span>
                    </div>

                    <article className="resume-preview">
                      {renderResumePreview(markdown)}
                    </article>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
