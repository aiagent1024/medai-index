/*
 * taxonomy.js — Controlled vocabularies for Responsible AI-enabled MD Hub.
 * Single source of truth for every filter facet, badge, and matrix axis.
 * Each value is { id, label, description }. The `id` is stable (used in URLs,
 * cross-links, and the LIBRARY entries); the `label` is what users see.
 *
 * To add a new value, append an object here. Nothing else needs to change —
 * the UI renders filters, chips, tooltips, and matrix axes from this file.
 */
const TAXONOMY = {
  /* The 5 priority themes the team cares about. These are the matrix columns
   * and the Topic pages. Order here is the order shown everywhere. */
  themes: [
    {
      id: "risk-management",
      label: "Risk Management",
      description:
        "Identifying, estimating, evaluating and controlling hazards and risks across the device and AI lifecycle, including benefit–risk analysis.",
    },
    {
      id: "safety-assessment",
      label: "Safety Assessment",
      description:
        "Evaluating clinical safety and performance — robustness, accuracy, validation evidence, and essential performance of the AI function.",
    },
    {
      id: "guardrails",
      label: "Guardrails",
      description:
        "Controls against jailbreak / prompt injection, toxic or harmful content, bias, confabulation and other GenAI-specific failure modes.",
    },
    {
      id: "monitoring-postmarket",
      label: "Monitoring & Post-Market",
      description:
        "Ongoing real-world performance monitoring, post-market surveillance, vigilance, drift detection, and change management of deployed models.",
    },
    {
      id: "best-practices",
      label: "Best Practices",
      description:
        "Recommended principles and practices for responsible, high-quality AI/ML medical-device development and deployment.",
    },
  ],

  /* Risk types — the kinds of harm/failure an instrument addresses. */
  riskTypes: [
    {
      id: "security-jailbreak",
      label: "Security & Jailbreak",
      description:
        "Adversarial inputs, prompt injection, jailbreaking, cybersecurity threats to the model and surrounding system.",
    },
    {
      id: "bias-fairness",
      label: "Bias & Fairness",
      description:
        "Algorithmic bias, demographic performance gaps, equity across patient subgroups.",
    },
    {
      id: "toxicity",
      label: "Toxic / Harmful Content",
      description:
        "Generation of harmful, dangerous, hateful, or otherwise inappropriate content.",
    },
    {
      id: "privacy",
      label: "Privacy & Data Protection",
      description:
        "Protection of personal and health data, confidentiality, and data-leakage risks.",
    },
    {
      id: "transparency-explainability",
      label: "Transparency & Explainability",
      description:
        "Disclosure of model behaviour, limitations, intended use, and interpretability of outputs.",
    },
    {
      id: "robustness",
      label: "Robustness & Reliability",
      description:
        "Stability under perturbation, distribution shift, edge cases; consistent and reliable performance.",
    },
    {
      id: "human-oversight",
      label: "Human Oversight",
      description:
        "Human-in/over-the-loop control, the human–AI team, automation bias, and meaningful clinician review.",
    },
    {
      id: "data-governance",
      label: "Data Governance",
      description:
        "Representativeness, quality, provenance, and management of training, tuning and test data.",
    },
  ],

  /* Instrument types. */
  types: [
    {
      id: "standard",
      label: "Standard",
      description: "A consensus standard (may be certifiable).",
    },
    {
      id: "regulation",
      label: "Regulation",
      description: "Binding law.",
    },
    {
      id: "guidance",
      label: "Guidance",
      description: "Regulator guidance (final or draft).",
    },
    {
      id: "framework",
      label: "Framework",
      description: "A voluntary risk/management framework.",
    },
    {
      id: "guiding-principles",
      label: "Guiding Principles",
      description: "A set of high-level guiding principles.",
    },
    {
      id: "programme",
      label: "Programme / Institution",
      description: "An evolving regulatory programme, sandbox, or institution — not a fixed document.",
    },
  ],

  /* Status — drives the colour-coded badge. */
  statuses: [
    {
      id: "in-force",
      label: "In force",
      description: "Binding law currently applicable.",
    },
    {
      id: "final",
      label: "Final",
      description: "Finalised guidance or principles.",
    },
    {
      id: "published",
      label: "Published / current",
      description: "Published standard, current edition.",
    },
    {
      id: "draft",
      label: "Draft",
      description: "Issued in draft; not yet finalised.",
    },
    {
      id: "provisional",
      label: "Provisional",
      description: "A proposed change not yet enacted — verify before relying on it.",
    },
    {
      id: "under-revision",
      label: "Under revision",
      description: "Current edition is valid; a revision is in development.",
    },
    {
      id: "evolving",
      label: "Evolving",
      description: "An ongoing programme or institution that changes over time.",
    },
  ],

  /* Issuing bodies. */
  bodies: [
    { id: "iso-iec", label: "ISO/IEC", description: "ISO/IEC JTC 1/SC 42 and related joint technical committees." },
    { id: "iso", label: "ISO", description: "International Organization for Standardization." },
    { id: "iec", label: "IEC", description: "International Electrotechnical Commission." },
    { id: "aami", label: "AAMI", description: "Association for the Advancement of Medical Instrumentation (US)." },
    { id: "imdrf", label: "IMDRF", description: "International Medical Device Regulators Forum." },
    { id: "who", label: "WHO", description: "World Health Organization." },
    { id: "fda", label: "US FDA", description: "US Food and Drug Administration (CDRH)." },
    { id: "nist", label: "NIST", description: "US National Institute of Standards and Technology." },
    { id: "caisi", label: "US CAISI", description: "US Center for AI Standards and Innovation (formerly the US AI Safety Institute)." },
    { id: "eu", label: "European Union", description: "European Parliament, Council & Commission." },
    { id: "mhra", label: "UK MHRA", description: "UK Medicines and Healthcare products Regulatory Agency." },
    { id: "multi-regulator", label: "Multi-regulator", description: "Jointly issued by several regulators (e.g. FDA / Health Canada / MHRA)." },
  ],

  /* Jurisdictions. */
  jurisdictions: [
    { id: "international", label: "International", description: "Globally applicable standards or guidance." },
    { id: "us", label: "United States", description: "US frameworks and regulation." },
    { id: "eu", label: "European Union", description: "EU regulation." },
    { id: "uk", label: "United Kingdom", description: "UK regulation and programmes." },
    { id: "multi-regulator", label: "Multi-regulator", description: "Coordinated across several jurisdictions." },
  ],

  /* AI / medical-device lifecycle stages — blended GMLP/TPLC + device lifecycle. */
  lifecycleStages: [
    { id: "design-intended-use", label: "Design & Intended Use", description: "Defining intended use, users, clinical context, and requirements." },
    { id: "data-management", label: "Data Management", description: "Sourcing, curating, labelling and governing data; representativeness." },
    { id: "training-validation", label: "Training & Validation", description: "Model development, tuning, and independent validation/verification." },
    { id: "clinical-evaluation", label: "Clinical Evaluation", description: "Clinical evidence, performance evaluation, benefit–risk." },
    { id: "deployment-release", label: "Deployment & Release", description: "Release, labelling, transparency to users, and conformity assessment." },
    { id: "post-market-monitoring", label: "Post-Market Monitoring", description: "Real-world performance monitoring, surveillance and vigilance." },
    { id: "change-management", label: "Change Management", description: "Controlled model updates, retraining, and predetermined change control." },
  ],

  /* Applicability — what kind of system the instrument actually governs.
   * Lets users filter to "what applies to a cloud GenAI SaMD". */
  appliesTo: [
    { id: "org-governance", label: "Organisational governance", description: "Applies at the organisation/management-system level." },
    { id: "general-ai", label: "General AI systems", description: "Any AI system, not medical-specific." },
    { id: "samd", label: "Software as a Medical Device (SaMD)", description: "Software intended for a medical purpose without being part of hardware." },
    { id: "ai-safety-component", label: "AI safety component", description: "AI that is a safety component of a regulated product." },
    { id: "genai-llm", label: "GenAI / LLM", description: "Generative AI and large language models." },
    { id: "genai-lmm", label: "GenAI / multi-modal (LMM)", description: "Large multi-modal generative models." },
    { id: "medical-electrical-equipment", label: "Medical electrical equipment", description: "AI embedded in medical electrical equipment/systems." },
  ],
};
