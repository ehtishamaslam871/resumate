/**
 * Universal Resume Parser — handles all common resume formats
 *
 * Supports:
 *  - Single/multi-column layouts (text extracted from PDF/DOCX)
 *  - ALL CAPS / Title Case / lowercase section headers
 *  - Separators: lines, pipes, bullets, dashes, equals, colons
 *  - Category-based skills ("Programming: Java, Python, C++")
 *  - Bullet/dash/arrow lists
 *  - Multiple date formats (Jan 2020, 01/2020, 2020-Present, etc.)
 *  - Diverse section names (Core Competencies, Technical Proficiencies, etc.)
 */

// ===================================================================
// SECTION DETECTION — recognise 60+ header variations
// ===================================================================

const SECTION_ALIASES = {
  summary: [
    'summary', 'professional summary', 'career summary', 'executive summary',
    'objective', 'career objective', 'professional objective',
    'profile', 'professional profile', 'personal profile',
    'about me', 'about', 'introduction', 'overview',
  ],
  skills: [
    'skills', 'technical skills', 'core skills', 'key skills',
    'skills & competencies', 'skills and competencies',
    'core competencies', 'competencies',
    'technical proficiencies', 'proficiencies',
    'technologies', 'technical expertise', 'expertise',
    'tools & technologies', 'tools and technologies',
    'tech stack', 'areas of expertise',
    'professional skills', 'relevant skills',
    'skills & tools', 'skills and tools',
    'skills & abilities', 'skills and abilities',
  ],
  experience: [
    'experience', 'work experience', 'professional experience',
    'employment', 'employment history', 'work history',
    'career history', 'relevant experience',
    'professional background', 'internship',
    'internships', 'internship experience',
    'job experience', 'working experience',
  ],
  education: [
    'education', 'academic background', 'academic qualifications',
    'qualifications', 'educational background', 'educational qualifications',
    'academic history', 'schooling', 'degrees',
    'education & training', 'education and training',
    'academic details', 'education details',
  ],
  projects: [
    'projects', 'personal projects', 'academic projects',
    'key projects', 'portfolio', 'selected projects',
    'project experience', 'featured projects',
    'notable projects', 'side projects',
  ],
  certifications: [
    'certifications', 'certificates', 'certification',
    'training', 'training & certifications', 'certifications & training',
    'professional development', 'courses',
    'licenses & certifications', 'licenses and certifications',
    'certifications and training', 'accreditations',
  ],
  languages: [
    'languages', 'language proficiency', 'language skills',
  ],
  references: [
    'references', 'referees',
  ],
  awards: [
    'awards', 'achievements', 'honors', 'honours',
    'awards & achievements', 'accomplishments',
  ],
  interests: [
    'interests', 'hobbies', 'hobbies & interests',
    'extracurricular', 'extracurricular activities',
    'activities', 'volunteer', 'volunteer experience',
  ],
};

// Build a map from alias → section name
const ALIAS_MAP = {};
for (const [section, aliases] of Object.entries(SECTION_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_MAP[alias.toLowerCase()] = section;
  }
}

// Words that are section headers (to filter from skills)
const SECTION_HEADER_WORDS = new Set(
  Object.values(SECTION_ALIASES).flat().map(a => a.toLowerCase())
);

// ===================================================================
// SKILL KEYWORDS — 120+ patterns (regex-safe)
// ===================================================================
const SKILL_KEYWORDS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'C(?!\\w)',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go(?:lang)?', 'Rust', 'Scala', 'Perl',
  'R(?=\\s|,|$)', 'MATLAB', 'Dart', 'Objective-C', 'Lua', 'Haskell',
  'Elixir', 'Clojure', 'Assembly', 'VB\\.?NET', 'F#', 'COBOL',
  // Web / Markup
  'SQL', 'HTML5?', 'CSS3?', 'SASS', 'SCSS', 'LESS', 'XML', 'JSON', 'YAML',
  'Shell', 'Bash', 'PowerShell', 'Solidity',
  // Frameworks & Libraries
  'React(?:\\.?js)?', 'React\\s*Native', 'Angular(?:\\.?js)?',
  'Vue(?:\\.?js)?', 'Next\\.?js', 'Nuxt(?:\\.?js)?', 'Svelte',
  'Node\\.?js', 'Express(?:\\.?js)?', 'Django', 'Flask', 'FastAPI',
  'Spring\\s*Boot', 'Spring', 'Laravel', 'Rails', 'Ruby on Rails',
  'ASP\\.?NET', 'jQuery', 'Bootstrap', 'Tailwind(?:\\s*CSS)?',
  'Material\\s*UI', 'Chakra\\s*UI', 'Ant\\s*Design',
  'Redux', 'MobX', 'Zustand', 'GraphQL', 'REST(?:\\s*API)?',
  'Socket\\.?io', 'Vite', 'Webpack', 'Babel', 'Gatsby',
  'Electron', 'Flutter', 'Ionic', 'Xamarin', '.NET',
  'Three\\.?js', 'D3\\.?js', 'Chart\\.?js',
  // Databases
  'MongoDB', 'MySQL', 'PostgreSQL', 'Postgres', 'SQLite', 'Redis',
  'Firebase', 'Firestore', 'DynamoDB', 'Cassandra', 'Oracle(?:\\s*DB)?',
  'SQL\\s*Server', 'MariaDB', 'Supabase', 'CouchDB', 'Neo4j',
  'Elasticsearch', 'Prisma', 'Mongoose', 'Sequelize',
  // Cloud & DevOps
  'AWS', 'Amazon\\s*Web\\s*Services', 'Azure', 'GCP', 'Google\\s*Cloud',
  'Docker', 'Kubernetes', 'K8s', 'CI/?CD', 'Jenkins', 'GitHub\\s*Actions',
  'GitLab\\s*CI', 'Travis\\s*CI', 'CircleCI', 'Terraform', 'Ansible',
  'Puppet', 'Chef', 'Vagrant', 'Linux', 'Ubuntu', 'CentOS',
  'Nginx', 'Apache', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
  'Cloudflare', 'S3', 'EC2', 'Lambda',
  // Tools
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
  'Trello', 'Slack', 'Notion', 'Asana',
  'Figma', 'Sketch', 'Adobe\\s*XD', 'Adobe\\s*Photoshop', 'Illustrator',
  'Postman', 'Insomnia', 'Swagger',
  'VS\\s*Code', 'Visual\\s*Studio', 'IntelliJ', 'Eclipse', 'PyCharm',
  'Xcode', 'Android\\s*Studio',
  'npm', 'yarn', 'pnpm', 'pip', 'Maven', 'Gradle',
  'VirtualBox', 'VMware', 'Wireshark',
  // Data & AI / ML
  'Machine\\s*Learning', 'Deep\\s*Learning', 'TensorFlow', 'PyTorch',
  'Keras', 'Scikit-learn', 'OpenCV',
  'NLP', 'Natural\\s*Language\\s*Processing', 'Computer\\s*Vision',
  'Pandas', 'NumPy', 'SciPy', 'Matplotlib',
  'Data\\s*Analysis', 'Data\\s*Science', 'Data\\s*Engineering',
  'Big\\s*Data', 'Hadoop', 'Spark', 'Kafka',
  'Power\\s*BI', 'Tableau', 'Looker', 'Metabase',
  'Jupyter', 'Colab',
  // Testing
  'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Playwright',
  'JUnit', 'PyTest', 'RSpec', 'Enzyme', 'Testing\\s*Library',
  // Soft skills / methodology
  'Leadership', 'Communication', 'Team\\s*Management', 'Agile', 'Scrum',
  'Kanban', 'Problem\\s*Solving', 'Critical\\s*Thinking',
  'Project\\s*Management', 'Time\\s*Management',
  // General tech
  'SEO', 'UI/?UX', 'UX\\s*Design', 'Responsive\\s*Design',
  'Web\\s*Development', 'Mobile\\s*Development', 'API\\s*Design',
  'Microservices', 'Serverless', 'OAuth', 'JWT',
  'Frontend', 'Backend', 'Full\\s*Stack', 'DevOps',
  'Data\\s*Entry', 'Technical\\s*Writing', 'Content\\s*Management',
  'WordPress', 'Shopify', 'Magento', 'Drupal',
];

// ===================================================================
// SECTION FINDER — robust, handles many header styles
// ===================================================================

function findSections(text) {
  const sections = {};
  const allMatches = [];

  // Normalise the text: collapse \r\n → \n
  const norm = text.replace(/\r\n/g, '\n');

  // Strategy 1: scan line by line for header-like lines
  const lines = norm.split('\n');
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const raw = line.trim();

    // Quick skip long lines (headers are short) or very short
    if (raw.length > 60 || raw.length < 3) {
      offset += line.length + 1;
      continue;
    }

    // Strip decorations: bullets, dashes, underscores, equals, pipes, numbers, special chars
    const cleaned = raw
      .replace(/^[\s\-\u2013\u2014=_*#\u25BA\u25A0\u25CF\u2022\u25AA\u25B8\u2192|~`0-9.)\]]+/g, '')  // leading decorations
      .replace(/[\s\-\u2013\u2014=_*#:\u25BA\u25A0\u25CF\u2022\u25AA\u25B8\u2192|~`]+$/g, '')          // trailing decorations
      .trim();

    if (cleaned.length < 3 || cleaned.length > 50) {
      offset += line.length + 1;
      continue;
    }

    const lower = cleaned.toLowerCase();

    // Check if this line matches any known alias
    if (ALIAS_MAP[lower]) {
      const sectionName = ALIAS_MAP[lower];
      const headerStart = offset;
      const contentStart = offset + line.length + 1; // after the newline
      if (!sections[sectionName] || headerStart < sections[sectionName].headerStart) {
        const entry = { name: sectionName, headerStart, contentStart };
        // Remove old entry if lower position found
        const existingIdx = allMatches.findIndex(m => m.name === sectionName);
        if (existingIdx >= 0) allMatches.splice(existingIdx, 1);
        allMatches.push(entry);
        sections[sectionName] = entry;
      }
    }

    offset += line.length + 1;
  }

  // Sort by position
  allMatches.sort((a, b) => a.headerStart - b.headerStart);

  // Build section boundaries: content starts after header, ends at next header
  const result = {};
  for (let i = 0; i < allMatches.length; i++) {
    const m = allMatches[i];
    const end = i + 1 < allMatches.length
      ? allMatches[i + 1].headerStart
      : norm.length;
    result[m.name] = { start: m.contentStart, end };
  }

  return { sections: result, text: norm };
}

function getSectionText(norm, sections, name) {
  const s = sections[name];
  if (!s) return '';
  return norm.substring(s.start, s.end).trim();
}

// ===================================================================
// CONTACT INFO EXTRACTORS
// ===================================================================

function extractEmail(text) {
  const match = text.match(/[\w.%+\-]+@[\w.\-]+\.[A-Za-z]{2,}/);
  return match ? match[0] : '';
}

function extractPhone(text) {
  const patterns = [
    // International: +92-300-1234567, +1 (555) 123-4567
    /\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/,
    // Standard: (555) 123-4567, 555-123-4567, 555.123.4567
    /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/,
    // 10+ digit string: 03001234567
    /(?<!\d)\d{10,13}(?!\d)/,
  ];
  // Only search in first ~12 lines (header area)
  const header = text.split('\n').slice(0, 12).join('\n');
  for (const p of patterns) {
    const m = header.match(p);
    if (m) {
      const val = m[0].trim();
      // Skip if it's just X placeholders
      if (/X{4,}/i.test(val)) continue;
      return val;
    }
  }
  return '';
}

function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    // Skip lines with email, URL, phone, section headers
    if (/@|https?:|www\.|resume|curriculum|\bcv\b/i.test(line)) continue;
    if (/^\+?\d[\d\s()\-]{7,}/.test(line)) continue;
    if (SECTION_HEADER_WORDS.has(line.toLowerCase().replace(/[^a-z\s&]/g, '').trim())) continue;

    // A name: 2-5 words, mainly letters, <55 chars
    const clean = line.replace(/[|\u2022\u00B7\u25BA\u25A0].*$/, '').replace(/,.*$/, '').trim();
    const words = clean.split(/\s+/);
    if (
      clean.length >= 3 && clean.length <= 55 &&
      words.length >= 2 && words.length <= 5 &&
      /^[A-Za-z\s.''\-]+$/.test(clean) &&
      !(words.length === 1 && clean === clean.toUpperCase())
    ) {
      return clean;
    }
  }
  // Fallback: first non-empty line if short
  const first = (lines[0] || '').trim();
  return first.length > 3 && first.length < 55 ? first : '';
}

function extractLocation(text) {
  const header = text.split('\n').slice(0, 10).join('\n');

  // Explicit label
  const labeled = header.match(/(?:Location|Address|Based in|Located in|City)\s*[:\-\u2013]\s*([^\n|\u2022]{3,50})/i);
  if (labeled) return labeled[1].trim();

  // City, State ZIP
  const cityState = header.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}\s*\d{5})/);
  if (cityState) return cityState[1];

  // City, Country / Country alone
  const countries = [
    'Pakistan', 'India', 'USA', 'United States', 'UK', 'United Kingdom',
    'Canada', 'Australia', 'Germany', 'UAE', 'Saudi Arabia', 'Dubai',
    'Singapore', 'Malaysia', 'China', 'Japan', 'France', 'Italy', 'Spain',
    'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Ireland',
    'New Zealand', 'South Korea', 'Brazil', 'Mexico', 'Turkey', 'Egypt',
    'South Africa', 'Nigeria', 'Kenya', 'Bangladesh', 'Sri Lanka', 'Nepal',
    'Qatar', 'Bahrain', 'Kuwait', 'Oman', 'Jordan', 'Lebanon', 'Iraq',
  ];
  const cities = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar',
    'Multan', 'Hyderabad', 'Quetta', 'Sialkot',
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Kolkata',
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Seattle', 'Austin',
    'London', 'Manchester', 'Toronto', 'Vancouver', 'Sydney', 'Melbourne',
    'Berlin', 'Munich', 'Dubai', 'Abu Dhabi', 'Riyadh', 'Jeddah',
    'Singapore', 'Kuala Lumpur', 'Tokyo', 'Beijing', 'Shanghai',
  ];
  const allPlaces = [...cities, ...countries];
  for (const place of allPlaces) {
    const re = new RegExp(`\\b${place}\\b`, 'i');
    if (re.test(header)) {
      const full = header.match(new RegExp(`${place}[,\\s]+([A-Z][a-z]+(?:\\s[A-Z][a-z]+)*)`, 'i'));
      if (full) return `${place}, ${full[1]}`;
      return place;
    }
  }
  return '';
}

// ===================================================================
// SKILLS EXTRACTOR — multi-strategy
// ===================================================================

function extractSkills(text, sections) {
  const found = new Set();

  // Strategy 1: Parse skills section (handles many formats)
  const skillsText = getSectionText(text, sections, 'skills');
  if (skillsText) {
    const lines = skillsText.split('\n').filter(l => l.trim());
    for (const line of lines) {
      // Remove category labels: "Programming Languages:", "Frontend:", etc.
      let content = line;
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 40) {
        content = line.substring(colonIdx + 1);
      }

      // Split by various delimiters: comma, bullet, pipe, semicolon, tab, multi-space
      const items = content
        .split(/[,;\|\u2022\u25CF\u25AA\u25B8\u2605\u2714\u2713\u25BA\u25A0\t]+|(?:\s{3,})/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length < 60);

      for (const item of items) {
        // Clean: remove leading/trailing dashes, bullets, whitespace
        let clean = item
          .replace(/^[\s\-\u2013\u2014*\u00B7\u2022\u25BA\u25A0]+/, '')
          .replace(/[\s\-\u2013\u2014*\u00B7\u2022\u25BA\u25A0]+$/, '')
          .trim();

        // Strip parenthetical proficiency notes: "React (Advanced)" → "React"
        clean = clean.replace(/\s*\((?:advanced|intermediate|beginner|proficient|expert|basic|familiar|good|strong)\)/gi, '').trim();

        if (clean.length > 1 && clean.length < 55) {
          if (/^\d+$/.test(clean)) continue;
          if (SECTION_HEADER_WORDS.has(clean.toLowerCase())) continue;
          found.add(clean);
        }
      }
    }
  }

  // Strategy 2: regex-match known skill keywords across entire text
  for (const skill of SKILL_KEYWORDS) {
    try {
      const regex = new RegExp(`\\b${skill}\\b`, 'i');
      const match = text.match(regex);
      if (match) found.add(match[0]);
    } catch {
      // Skip broken regex patterns
    }
  }

  // Deduplicate: case-insensitive, remove section headers
  const unique = [];
  const lowerSeen = new Set();
  for (const skill of found) {
    const lower = skill.toLowerCase().trim();
    if (!lowerSeen.has(lower) && lower.length > 1 && !SECTION_HEADER_WORDS.has(lower)) {
      lowerSeen.add(lower);
      unique.push(skill);
    }
  }

  // Remove single-word skills that are substrings of a multi-word skill
  // e.g. "Oracle" removed if "Oracle DB" exists; "CSS" removed if "Tailwind CSS" exists
  const multiWord = unique.filter(s => /\s/.test(s));
  const filtered = unique.filter(skill => {
    if (/\s/.test(skill)) return true; // keep compound skills
    const lower = skill.toLowerCase();
    for (const mw of multiWord) {
      const mwParts = mw.toLowerCase().split(/\s+/);
      if (mwParts.includes(lower)) return false;
    }
    return true;
  });

  return filtered;
}

// ===================================================================
// EXPERIENCE EXTRACTOR — handles many formats
// ===================================================================

// Date patterns used across extractors
const DATE_TOKEN = '(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+)?(?:19|20)\\d{2}';
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*[-\\u2013\\u2014to]+\\s*(${DATE_TOKEN}|[Pp]resent|[Cc]urrent|[Nn]ow|[Oo]ngoing)`,
  'i'
);
const SINGLE_YEAR_RE = /\b((?:19|20)\d{2})\b/;

function extractExperience(text, sections) {
  const experiences = [];
  const expText = getSectionText(text, sections, 'experience');
  if (!expText) return experiences;

  const lines = expText.split('\n').map(l => l.trim()).filter(Boolean);
  let current = null;
  let descLines = [];

  const flush = () => {
    if (!current) return;
    current.description = descLines.join(' ').substring(0, 400).trim();
    experiences.push(current);
    descLines = [];
    current = null;
  };

  for (const line of lines) {
    if (line.length < 3) continue;

    // Is this a bullet/description line?
    const isBullet = /^[\u2022\-\u2013\u2014*\u25B8\u25BA\u25A0\u2192\u2713\u2714\u25CB\u25E6\u2043\u27A4]/.test(line) || /^\d+[.)]\s/.test(line);

    // Does this line contain a date range or year?
    const hasDateRange = DATE_RANGE_RE.test(line);
    const hasYear = SINGLE_YEAR_RE.test(line);
    const hasDate = hasDateRange || hasYear;

    // Is this a header line? (job title / company / date)
    const isHeader = hasDate && !isBullet && line.length < 150;

    // Alternative: line with separator (role separators)
    const hasSep = /\s+[\u2013\u2014|]\s+|\s+at\s+/i.test(line);
    const isRoleLine = hasSep && !isBullet && line.length < 150 && line.length > 5;

    if (isHeader || (isRoleLine && !hasDate && !current)) {
      flush();

      // Extract date range
      let duration = '';
      const rangeMatch = line.match(DATE_RANGE_RE);
      if (rangeMatch) {
        duration = rangeMatch[0].trim();
      } else {
        const yearMatch = line.match(/\(?((?:19|20)\d{2})\s*[-\u2013\u2014]\s*(?:((?:19|20)\d{2})|[Pp]resent|[Cc]urrent|[Nn]ow)?\)?/);
        if (yearMatch) duration = yearMatch[0].replace(/[()]/g, '').trim();
      }

      // Remove the date part from line
      let rest = line
        .replace(DATE_RANGE_RE, '')
        .replace(/\(?((?:19|20)\d{2})\s*[-\u2013\u2014]\s*(?:((?:19|20)\d{2})|[Pp]resent|[Cc]urrent|[Nn]ow)?\)?/i, '')
        .replace(/\s*[-\u2013\u2014|/]\s*$/, '')
        .replace(/^\s*[-\u2013\u2014|/]\s*/, '')
        .trim();

      // Split on broad separators (" – ", " — ", " | ", " at ")
      // but NOT on hyphens inside compound words like "Part-Time"
      const parts = rest.split(/\s+[\u2013\u2014|]\s+|\s+at\s+/i).map(p => p.trim()).filter(Boolean);

      const jobTitle = parts[0] || rest || line;
      let company = parts.slice(1).join(', ').replace(/\s*[-\u2013\u2014|/]\s*$/, '').trim();
      // Clean empty parens left after date removal: "Freelance / Intern ()" → "Freelance / Intern"
      company = company.replace(/\s*\(\s*\)/, '').trim();

      current = { jobTitle, company, duration, description: '' };
    } else if (isBullet && current) {
      descLines.push(line.replace(/^[\u2022\-\u2013\u2014*\u25B8\u25BA\u25A0\u2192\u2713\u2714\u25CB\u25E6\u2043\u27A4\d.)]+\s*/, ''));
    } else if (current && !isBullet && line.length > 10) {
      // Continuation or sub-line (company on next line, etc.)
      if (!current.company && !hasDate) {
        current.company = line;
      } else {
        descLines.push(line);
      }
    }
  }
  flush();

  return experiences.slice(0, 15);
}

// ===================================================================
// EDUCATION EXTRACTOR
// ===================================================================

const DEGREE_KEYWORDS_RE = /bachelor|master|phd|ph\.d|doctorate|diploma|associate|b\.?\s?s\.?\s?c?|m\.?\s?s\.?\s?c?|b\.?\s?a\.?|m\.?\s?a\.?|mba|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|engineering|computer\s*science|degree|intermediate|matric(?:ulation)?|high\s*school|a[\s-]?levels?|o[\s-]?levels?|fsc|ics|icom|fa|bba|bcom|mcom|mphil|dba|llb|llm|md|bds|mbbs|pharm/i;

function extractEducation(text, sections) {
  const education = [];
  const eduText = getSectionText(text, sections, 'education');
  if (!eduText) return education;

  const lines = eduText.split('\n').map(l => l.trim()).filter(Boolean);
  let current = null;

  const flush = () => {
    if (!current) return;
    // Clean up degree formatting
    current.degree = current.degree
      .replace(/\s*[-\u2013\u2014]+\s*$/, '')
      .replace(/\s*[-\u2013\u2014]+\s*\(/, ' (')
      .replace(/\s{2,}/g, ' ')
      .trim();
    education.push(current);
    current = null;
  };

  for (const line of lines) {
    if (line.length < 3) continue;

    const isBullet = /^[\u2022\-\u2013\u2014*\u25B8\u25BA\u25A0]/.test(line);
    const hasDegree = DEGREE_KEYWORDS_RE.test(line);
    const hasYear = SINGLE_YEAR_RE.test(line);

    // Detect institution/school lines (should NOT start a new entry)
    const isInstitutionLine = /university|college|institute|school|academy|polytechnic/i.test(line);

    if (current && !current.school && !isBullet && isInstitutionLine && line.length > 3) {
      // This is the school/institution line for the current entry
      current.school = line
        .replace(/\s*[-\u2013\u2014]+\s*$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      continue;
    }

    if ((hasDegree || (hasYear && !isBullet)) && line.length > 5) {
      flush();

      // Extract year/range
      const yearMatch = line.match(/\(?((?:19|20)\d{2})\s*[-\u2013\u2014]\s*(?:((?:19|20)\d{2})|[Pp]resent|[Cc]urrent|[Ee]xpected)?\)?/);
      const year = yearMatch ? yearMatch[0].replace(/[()]/g, '').trim() : '';

      let degreeLine = line
        .replace(/\(?((?:19|20)\d{2})\s*[-\u2013\u2014]\s*(?:((?:19|20)\d{2})|[Pp]resent|[Cc]urrent|[Ee]xpected)?\)?/, '')
        .replace(/\s*[-\u2013\u2014]+\s*$/, '')
        .replace(/\s*[-\u2013\u2014]+\s*\(/, ' (')
        .replace(/\s{2,}/g, ' ')
        .trim();

      current = { degree: degreeLine || line, school: '', field: '', year };
    } else if (current && !current.school && !isBullet && line.length > 3) {
      current.school = line
        .replace(/\s*[-\u2013\u2014]+\s*$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
  }
  flush();

  return education.slice(0, 8);
}

// ===================================================================
// SUMMARY EXTRACTOR
// ===================================================================

function extractSummary(text, sections) {
  const summaryText = getSectionText(text, sections, 'summary');
  if (summaryText) {
    return summaryText
      .split('\n')
      .filter(l => l.trim())
      .slice(0, 4)
      .join(' ')
      .substring(0, 400)
      .trim();
  }

  // Fallback: look for first paragraph-like block before first section
  const sectionStarts = Object.values(sections).map(s => s.start).filter(Boolean);
  const firstSectionStart = sectionStarts.length > 0 ? Math.min(...sectionStarts) : text.length;
  const headerArea = text.substring(0, Math.min(firstSectionStart, 800));
  const lines = headerArea.split('\n').filter(l => l.trim());
  const paragraphLines = lines.filter(l =>
    l.length > 30 &&
    !/@/.test(l) &&
    !/^\+?\d[\d\s()\-]{7,}/.test(l) &&
    !/^https?:/.test(l)
  );
  if (paragraphLines.length > 0) {
    return paragraphLines.slice(0, 3).join(' ').substring(0, 400).trim();
  }

  return '';
}

// ===================================================================
// PROJECTS EXTRACTOR
// ===================================================================

function extractProjects(text, sections) {
  const projects = [];
  const projText = getSectionText(text, sections, 'projects');
  if (!projText) return projects;

  const lines = projText.split('\n').map(l => l.trim()).filter(Boolean);
  let current = null;
  let descLines = [];

  const flush = () => {
    if (!current) return;
    current.description = descLines.join(' ').substring(0, 300).trim();
    projects.push(current);
    descLines = [];
    current = null;
  };

  for (const line of lines) {
    if (line.length < 3) continue;
    const isBullet = /^[\u2022\-\u2013\u2014*\u25B8\u25BA\u25A0\u2192\u2713\u2714\u25CB\u25E6]/.test(line);

    if (!isBullet && line.length > 5) {
      // Stop if this line is a known section header (boundary bleed)
      const cleaned = line
        .replace(/^[\s\-\u2013\u2014=_*#\u25BA\u25A0\u25CF\u2022|]+/, '')
        .replace(/[\s\-\u2013\u2014=_*#:\u25BA\u25A0\u25CF\u2022|]+$/, '')
        .trim();
      if (SECTION_HEADER_WORDS.has(cleaned.toLowerCase())) {
        flush();
        break;
      }
      flush();
      current = { name: line, description: '' };
    } else if (current && isBullet) {
      descLines.push(line.replace(/^[\u2022\-\u2013\u2014*\u25B8\u25BA\u25A0\u2192\u2713\u2714\u25CB\u25E6]+\s*/, ''));
    }
  }
  flush();

  return projects.slice(0, 15);
}

// ===================================================================
// SCORE CALCULATOR
// ===================================================================

function calculateScore(data) {
  let score = 0;

  // Contact: 15 pts
  if (data.fullName) score += 5;
  if (data.email) score += 5;
  if (data.phone) score += 5;

  // Summary: 10 pts
  if (data.summary && data.summary.length > 20) score += 10;

  // Skills: up to 25 pts (scales)
  const sc = (data.skills || []).length;
  if (sc >= 10) score += 25;
  else if (sc >= 7) score += 22;
  else if (sc >= 5) score += 20;
  else if (sc >= 3) score += 15;
  else if (sc >= 1) score += 10;

  // Experience: up to 25 pts
  const ec = (data.experience || []).length;
  if (ec >= 3) score += 25;
  else if (ec >= 2) score += 20;
  else if (ec >= 1) score += 15;

  // Education: up to 15 pts
  const edc = (data.education || []).length;
  if (edc >= 2) score += 15;
  else if (edc >= 1) score += 12;

  // Projects: 5 pts
  if ((data.projects || []).length > 0) score += 5;

  // Location: 5 pts
  if (data.location) score += 5;

  return Math.min(score, 100);
}

// ===================================================================
// MAIN ENTRY — parseResumeText
// ===================================================================

function parseResumeText(resumeText) {
  const { sections, text } = findSections(resumeText);

  const fullName = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const location = extractLocation(text);
  const summary = extractSummary(text, sections);
  const skills = extractSkills(text, sections);
  const experience = extractExperience(text, sections);
  const education = extractEducation(text, sections);
  const projects = extractProjects(text, sections);

  const data = {
    fullName,
    email,
    phone,
    location,
    summary,
    skills,
    experience,   // uses { jobTitle, company, duration, description }
    education,     // uses { degree, school, field, year }
    projects,
    score: 0,
    strengths: [],
    improvements: [],
  };

  data.score = calculateScore(data);

  // --- Strengths ---
  if (skills.length >= 8) data.strengths.push(`Diverse skill set with ${skills.length} skills detected`);
  else if (skills.length >= 4) data.strengths.push(`Good skill set with ${skills.length} skills listed`);
  if (experience.length >= 2) data.strengths.push('Multiple work experience entries');
  else if (experience.length === 1) data.strengths.push('Work experience listed');
  if (education.length >= 1) data.strengths.push('Education background present');
  if (email && phone) data.strengths.push('Complete contact information');
  if (projects.length >= 2) data.strengths.push(`${projects.length} projects showcased`);
  else if (projects.length === 1) data.strengths.push('Project showcased');
  if (summary) data.strengths.push('Professional summary included');

  // --- Improvement suggestions ---
  if (skills.length < 3) data.improvements.push('Add more relevant technical skills');
  if (experience.length === 0) data.improvements.push('Add detailed work experience with bullet points');
  if (education.length === 0) data.improvements.push('Include your educational background');
  if (!email) data.improvements.push('Add your email address');
  if (!phone) data.improvements.push('Add your phone number');
  if (!summary) data.improvements.push('Add a professional summary or objective statement');
  if (projects.length === 0 && experience.length < 2) data.improvements.push('Add projects to showcase your abilities');
  if (!location) data.improvements.push('Add your location for better job matching');

  return data;
}

module.exports = { parseResumeText };
