"""
ResuMate Resume Parser – Pure Regex / Rule-Based
─────────────────────────────────────────────────
Fast, deterministic resume parsing using pattern matching.
No external NLP libraries – works on any Python 3.9+.
Returns structured JSON instantly (no LLM needed for parsing).
"""

import re
from typing import Optional

# ══════════════════════════════════════════════════════
#  SKILLS DATABASE (200+ skills)
# ══════════════════════════════════════════════════════

SKILLS_DB = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "ruby", "go",
    "golang", "rust", "swift", "kotlin", "scala", "r", "matlab", "perl", "php",
    "dart", "lua", "haskell", "elixir", "clojure", "objective-c", "assembly",
    "fortran", "cobol", "visual basic", "vb.net", "f#", "groovy", "julia",
    "solidity", "bash", "shell", "powershell", "sql", "nosql", "plsql",

    # Web Frameworks & Libraries
    "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs",
    "vue.js", "svelte", "next.js", "nextjs", "nuxt.js", "nuxtjs", "gatsby",
    "express", "expressjs", "express.js", "django", "flask", "fastapi",
    "spring", "spring boot", "springboot", "asp.net", "laravel", "rails",
    "ruby on rails", "node.js", "nodejs", "node", "deno", "bun",

    # Frontend
    "html", "html5", "css", "css3", "sass", "scss", "less", "tailwind",
    "tailwindcss", "tailwind css", "bootstrap", "material ui", "mui",
    "styled-components", "emotion", "chakra ui", "ant design", "jquery",
    "webpack", "vite", "rollup", "parcel", "babel", "eslint", "prettier",

    # Backend & APIs
    "rest", "restful", "rest api", "graphql", "grpc", "websocket",
    "websockets", "soap", "microservices", "serverless", "api design",
    "oauth", "jwt", "authentication", "authorization",

    # Databases
    "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
    "sqlite", "oracle", "sql server", "mssql", "dynamodb", "cassandra",
    "couchdb", "firebase", "firestore", "supabase", "neo4j", "mariadb",
    "cockroachdb", "influxdb", "timescaledb", "memcached",

    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud",
    "google cloud platform", "docker", "kubernetes", "k8s", "terraform",
    "ansible", "jenkins", "ci/cd", "cicd", "github actions", "gitlab ci",
    "circleci", "travis ci", "nginx", "apache", "linux", "unix",
    "cloudformation", "pulumi", "vagrant", "helm", "istio", "consul",

    # AI / ML / Data Science
    "machine learning", "deep learning", "artificial intelligence", "ai",
    "ml", "nlp", "natural language processing", "computer vision",
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn",
    "opencv", "spacy", "hugging face", "transformers", "bert", "gpt",
    "llm", "large language models", "reinforcement learning",
    "neural networks", "cnn", "rnn", "lstm", "gan",
    "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
    "tableau", "power bi", "data analysis", "data visualization",
    "data engineering", "data mining", "big data", "hadoop", "spark",
    "apache spark", "kafka", "airflow", "etl", "data pipeline",
    "statistical analysis", "statistics", "regression", "classification",
    "clustering", "recommendation systems",

    # Mobile
    "android", "ios", "react native", "flutter", "xamarin", "ionic",
    "cordova", "swift ui", "swiftui", "jetpack compose", "kotlin multiplatform",

    # Testing
    "jest", "mocha", "chai", "cypress", "selenium", "playwright",
    "puppeteer", "pytest", "unittest", "junit", "testng", "rspec",
    "testing", "unit testing", "integration testing", "e2e testing",
    "test driven development", "tdd", "bdd",

    # Tools & Version Control
    "git", "github", "gitlab", "bitbucket", "svn", "jira", "confluence",
    "slack", "trello", "asana", "notion", "figma", "sketch", "adobe xd",
    "postman", "swagger", "openapi",

    # Soft Skills & Management
    "agile", "scrum", "kanban", "project management", "team leadership",
    "leadership", "communication", "problem solving", "problem-solving",
    "critical thinking", "teamwork", "collaboration", "mentoring",
    "stakeholder management", "time management", "presentation",

    # Security
    "cybersecurity", "penetration testing", "ethical hacking", "owasp",
    "encryption", "ssl", "tls", "firewall", "ids", "ips", "siem",
    "security", "information security", "network security",

    # Other
    "blockchain", "web3", "smart contracts", "ethereum", "solana",
    "iot", "internet of things", "embedded systems", "fpga",
    "robotics", "ros", "3d printing", "autocad", "solidworks",
    "erp", "sap", "salesforce", "crm", "excel", "microsoft office",
    "office 365", "sharepoint",
}

SKILLS_LOWER = {s.lower() for s in SKILLS_DB}

# Uppercase-preferred acronyms
UPPERCASE_SKILLS = {
    "html", "css", "sql", "aws", "gcp", "api", "jwt", "ci/cd", "rest",
    "grpc", "nosql", "plsql", "html5", "css3", "npm", "yarn", "pip",
    "ai", "ml", "nlp", "iot", "erp", "crm", "sap", "seo", "ui", "ux",
    "ios", "ssh", "ssl", "tls", "tcp", "udp", "dns", "http", "cnn",
    "rnn", "lstm", "gan", "gpu", "cpu", "etl", "bdd", "tdd", "mvc",
    "orm", "oop", "ide", "xml", "json", "yaml", "csv",
}

# Skill aliases: map variants to canonical names
SKILL_ALIASES = {
    "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js",
    "react": "React", "reactjs": "React", "react.js": "React",
    "angular": "Angular", "angularjs": "Angular",
    "vue": "Vue.js", "vuejs": "Vue.js", "vue.js": "Vue.js",
    "next.js": "Next.js", "nextjs": "Next.js",
    "express": "Express.js", "expressjs": "Express.js", "express.js": "Express.js",
    "typescript": "TypeScript", "javascript": "JavaScript",
    "mongodb": "MongoDB", "mongo": "MongoDB",
    "postgresql": "PostgreSQL", "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "python": "Python", "java": "Java", "golang": "Go", "go": "Go",
    "c++": "C++", "c#": "C#",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch",
    "flask": "Flask", "django": "Django", "fastapi": "FastAPI",
    "spring boot": "Spring Boot", "springboot": "Spring Boot",
    "ruby on rails": "Ruby on Rails",
    "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS",
    "three.js": "Three.js", "threejs": "Three.js",
    "graphql": "GraphQL", "redis": "Redis",
    "elasticsearch": "Elasticsearch",
    "microservices": "Microservices",
}


# ══════════════════════════════════════════════════════
#  SECTION HEADER PATTERNS
# ══════════════════════════════════════════════════════

SECTION_PATTERNS = {
    "experience": [
        r"(?:work|professional|employment|career)\s*(?:experience|history)",
        r"experience",
        r"work\s*history",
        r"employment",
        r"career\s*(?:summary|history|profile)",
        r"professional\s*background",
        r"relevant\s*experience",
        r"internship(?:s)?",
    ],
    "education": [
        r"education(?:al)?\s*(?:background|qualifications?|history)?",
        r"academic\s*(?:background|qualifications?|history|record)",
        r"schooling",
        r"degrees?",
        r"qualifications?",
    ],
    "skills": [
        r"(?:technical|key|core|relevant|professional)?\s*skills?",
        r"(?:areas?\s+of\s+)?expertise",
        r"competenc(?:ies|e)",
        r"technologies",
        r"tech\s*stack",
        r"tools?\s*(?:&|and)\s*technologies",
        r"proficiencies",
        r"capabilities",
    ],
    "projects": [
        r"(?:key|notable|personal|academic|selected)?\s*projects?",
        r"portfolio",
        r"(?:personal|side)\s*projects?",
    ],
    "certifications": [
        r"certifications?\s*(?:&|and)?\s*(?:licenses|awards|achievements)?",
        r"licenses?\s*(?:&|and)?\s*certifications?",
        r"professional\s*certifications?",
        r"awards?\s*(?:&|and)?\s*(?:certifications?|achievements?)",
        r"achievements?\s*(?:&|and)?\s*(?:awards?|certifications?)?",
        r"honors?\s*(?:&|and)?\s*awards?",
    ],
    "summary": [
        r"(?:professional|career|executive)?\s*summary",
        r"(?:professional|career)?\s*objective",
        r"about\s*(?:me)?",
        r"profile",
        r"personal\s*statement",
        r"introduction",
    ],
    "languages": [
        r"languages?\s*(?:spoken|known|proficiency)?",
    ],
    "interests": [
        r"interests?",
        r"hobbies",
        r"extracurricular",
    ],
    "references": [
        r"references?",
    ],
    "publications": [
        r"publications?",
        r"papers?",
        r"research",
    ],
    "volunteer": [
        r"volunteer(?:ing)?\s*(?:experience|work)?",
        r"community\s*(?:service|involvement)",
    ],
}


# ══════════════════════════════════════════════════════
#  LOCATION HELPERS
# ══════════════════════════════════════════════════════

# Words common in job titles that look like city names (avoid matching as locations)
NON_LOCATION_WORDS = {
    'specialist', 'developer', 'engineer', 'manager', 'analyst',
    'designer', 'consultant', 'director', 'administrator', 'coordinator',
    'architect', 'assistant', 'associate', 'executive', 'supervisor',
    'technician', 'intern', 'lead', 'senior', 'junior', 'officer',
    'representative', 'professor', 'teacher', 'instructor', 'programmer',
    'scientist', 'researcher', 'strategist', 'accountant', 'auditor',
    'editor', 'writer', 'producer', 'operator', 'mechanic', 'plumber',
    'student', 'graduate', 'candidate', 'expert', 'trainer', 'tutor',
    'volunteer', 'freelancer', 'contractor', 'advisor', 'advocate',
}

# Common country names for international resume support
COUNTRIES = {
    'pakistan', 'india', 'bangladesh', 'sri lanka', 'nepal', 'afghanistan',
    'united states', 'usa', 'u.s.a.', 'united kingdom', 'uk', 'u.k.',
    'canada', 'australia', 'new zealand',
    'germany', 'france', 'italy', 'spain', 'portugal', 'netherlands',
    'belgium', 'switzerland', 'austria', 'sweden', 'norway', 'denmark',
    'finland', 'ireland', 'poland', 'czech republic', 'romania', 'hungary',
    'greece', 'turkey', 'russia', 'ukraine',
    'china', 'japan', 'south korea', 'singapore', 'malaysia', 'indonesia',
    'philippines', 'thailand', 'vietnam', 'taiwan', 'hong kong',
    'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru',
    'egypt', 'nigeria', 'south africa', 'kenya', 'ghana', 'morocco',
    'saudi arabia', 'uae', 'united arab emirates', 'qatar', 'kuwait',
    'oman', 'bahrain', 'jordan', 'lebanon', 'iraq', 'iran', 'israel',
}

# Valid US state abbreviations
US_STATES = {
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
}


# ══════════════════════════════════════════════════════
#  CONTACT EXTRACTION
# ══════════════════════════════════════════════════════

def extract_email(text: str) -> str:
    match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    patterns = [
        r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}',
        r'\b\d{10,11}\b',
        r'\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b',
    ]
    for pat in patterns:
        match = re.search(pat, text)
        if match:
            phone = match.group(0).strip()
            digits = re.sub(r'\D', '', phone)
            if 7 <= len(digits) <= 15:
                return phone
    return ""


def extract_linkedin(text: str) -> str:
    match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+', text, re.I)
    return match.group(0) if match else ""


def extract_github(text: str) -> str:
    match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+', text, re.I)
    return match.group(0) if match else ""


def extract_location(text: str) -> str:
    """Extract location using common resume patterns, with international support."""
    # Strategy 1: Explicit label patterns (e.g. "Location: New York, NY")
    loc_match = re.search(
        r'(?:location|address|city|based\s+in|residing\s+in)[:\s]+([^\n]+)',
        text[:2000], re.I
    )
    if loc_match:
        loc = loc_match.group(1).strip()[:100]
        loc = re.sub(r'[|]+.*$', '', loc).strip()
        loc = re.sub(r'[\w.+-]+@[\w-]+\.[\w.-]+', '', loc).strip()
        if loc:
            return loc

    # Strategy 2: Scan pipe-separated segments in header area for location patterns
    header_lines = text[:1200].split('\n')[:12]

    for line in header_lines:
        segments = [s.strip() for s in line.split('|')]
        for i, seg in enumerate(segments):
            seg_clean = seg.strip().rstrip(',').strip()
            if not seg_clean or len(seg_clean) < 2:
                continue

            # Skip emails, phones, URLs, parenthesized content
            if re.search(r'@|http|www\.|\.com', seg_clean, re.I):
                continue
            if re.search(r'^\+?\d[\d\s\-().]{5,}$', seg_clean):
                continue
            if re.search(r'^\(.*\)$', seg_clean):
                continue

            seg_lower = seg_clean.lower().strip()

            # Check if this segment is a known country name
            for country in COUNTRIES:
                if seg_lower == country:
                    # Look at previous segment for city/region
                    if i > 0:
                        prev = segments[i - 1].strip().rstrip(',').strip()
                        if prev and not re.search(r'@|http|\d{5,}|\+\d', prev):
                            return f"{prev}, {seg_clean}"
                    return seg_clean

            # Check for "City, Region, Country" within a single segment
            parts = [p.strip() for p in seg_clean.split(',') if p.strip()]
            if len(parts) >= 2:
                last_part = parts[-1].lower().strip()
                if last_part in COUNTRIES:
                    return seg_clean
                # Check if any inner part is a country
                for p in parts:
                    if p.lower().strip() in COUNTRIES:
                        return seg_clean

    # Strategy 3: City, ST pattern (US addresses) with strict validation
    first_lines = text[:800]
    for m in re.finditer(r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2})\b', first_lines):
        city = m.group(1)
        state = m.group(2)
        # Must be a valid US state abbreviation
        if state not in US_STATES:
            continue
        # City's last word must not be a common job-title word
        if city.lower().split()[-1] in NON_LOCATION_WORDS:
            continue
        # State abbreviation must not be followed by a hyphen (MS-Excel, MS-Word)
        end_pos = m.end()
        if end_pos < len(first_lines) and first_lines[end_pos:end_pos + 1] == '-':
            continue
        return f"{city}, {state}"

    return ""


def extract_name(text: str) -> str:
    """Extract name from the first few lines of the resume.
    Handles pipe-separated headers and ALL CAPS names."""
    lines = text.split('\n')
    email = extract_email(text)
    phone = extract_phone(text)

    def _is_name(candidate: str) -> bool:
        """Check if a string looks like a person's name (2-5 words, alpha, capitalized)."""
        words = candidate.split()
        if not (2 <= len(words) <= 5):
            return False
        alpha_words = [w for w in words if re.match(r'^[A-Za-z\'-]+$', w)]
        if len(alpha_words) < 2:
            return False
        # Each word must start with uppercase (covers Title Case and ALL CAPS)
        return all(w[0].isupper() for w in alpha_words)

    def _format_name(candidate: str) -> str:
        """Convert ALL CAPS to Title Case, leave Title Case as-is."""
        words = candidate.split()
        alpha_words = [w for w in words if w.isalpha()]
        if alpha_words and all(w.isupper() for w in alpha_words):
            return ' '.join(w.title() for w in words)
        return candidate

    for line in lines[:8]:
        line = line.strip()
        if not line:
            continue

        # Skip section headers
        clean = re.sub(r'[:\-–—=|_*#]+$', '', line).strip().lower()
        is_header = False
        if len(clean) < 60:
            for patterns in SECTION_PATTERNS.values():
                for pat in patterns:
                    if re.fullmatch(pat, clean, re.I):
                        is_header = True
                        break
                if is_header:
                    break
        if is_header:
            continue

        # If line has pipes, check each segment (first segment is often the name)
        if '|' in line:
            segments = [s.strip() for s in line.split('|') if s.strip()]
            for seg in segments:
                candidate = seg
                # Remove email/phone embedded in segment
                if email:
                    candidate = candidate.replace(email, "").strip()
                if phone:
                    candidate = candidate.replace(phone, "").strip()
                candidate = candidate.strip(' ,|•·')

                if not candidate or len(candidate) < 3:
                    continue
                # Skip if segment looks like email, phone, URL, or parenthesized skills
                if re.search(r'@|http|www\.|\.com|\d{5,}|\+\d', candidate, re.I):
                    continue
                if re.search(r'^\(.*\)$', candidate):
                    continue

                if _is_name(candidate):
                    return _format_name(candidate)
            continue  # Checked all segments, move to next line

        # Non-pipe line: skip if entire line is email/URL/phone
        if re.search(r'^[\w.+-]+@[\w-]+\.[\w.-]+$', line):
            continue
        if re.search(r'^(?:https?://|www\.)', line, re.I):
            continue
        if re.match(r'^\+?\d[\d\s\-().]+$', line) and len(re.sub(r'\D', '', line)) >= 7:
            continue

        candidate = line
        if email:
            candidate = candidate.replace(email, "").strip()
        if phone:
            candidate = candidate.replace(phone, "").strip()
        candidate = candidate.strip(' ,|•·')

        if _is_name(candidate):
            return _format_name(candidate)

    return ""


# ══════════════════════════════════════════════════════
#  SECTION SPLITTING
# ══════════════════════════════════════════════════════

def detect_sections(text: str) -> dict:
    """Split resume text into sections based on header patterns."""
    sections = {}
    lines = text.split('\n')
    current_section = "header"
    current_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            current_lines.append("")
            continue

        # Check if this line is a section header
        found_section = None
        clean = re.sub(r'[:\-–—=|_*#]+$', '', stripped).strip().lower()

        # Only consider as header if line is short enough (< 60 chars)
        if len(clean) < 60:
            for section_name, patterns in SECTION_PATTERNS.items():
                for pat in patterns:
                    if re.fullmatch(pat, clean, re.I):
                        found_section = section_name
                        break
                if found_section:
                    break

        if found_section:
            if current_lines:
                text_block = '\n'.join(current_lines).strip()
                if text_block:
                    sections[current_section] = text_block
            current_section = found_section
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        text_block = '\n'.join(current_lines).strip()
        if text_block:
            sections[current_section] = text_block

    return sections


# ══════════════════════════════════════════════════════
#  SKILLS EXTRACTION (2 strategies: section + DB scan)
# ══════════════════════════════════════════════════════

def extract_skills(text: str, sections: dict) -> list:
    """Extract skills using section analysis + database matching."""
    found_skills = set()

    # Strategy 1: Pull from explicit Skills section
    skills_text = sections.get("skills", "")
    if skills_text:
        items = re.split(r'[,;|•●◦▪▸►\n]+', skills_text)
        for item in items:
            cleaned = item.strip().strip('-').strip('*').strip()
            if cleaned and len(cleaned) > 1 and len(cleaned) < 50:
                if cleaned.lower() in SKILLS_LOWER:
                    found_skills.add(cleaned)
                elif len(cleaned) < 35:
                    found_skills.add(cleaned)

    # Strategy 2: Scan entire text for known skills
    text_lower = text.lower()
    for skill in SKILLS_DB:
        if len(skill) <= 2:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text):
                found_skills.add(skill.upper())
        else:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.add(skill)

    # Normalize casing and deduplicate (case-insensitive)
    seen_lower = {}
    for skill in found_skills:
        s = skill.strip()
        if not s or len(s) <= 1 or re.match(r'^\d+$', s):
            continue

        sl = s.lower()

        # Apply alias mapping first
        if sl in SKILL_ALIASES:
            normalized = SKILL_ALIASES[sl]
        elif sl in UPPERCASE_SKILLS or (s.isupper() and len(s) <= 6):
            normalized = s.upper()
        elif ' ' in s:
            normalized = s.title()
        else:
            normalized = s

        # Use the canonical (lowered) form as key
        canon = normalized.lower()
        # Keep the version with better formatting (has uppercase letters)
        if canon not in seen_lower or (any(c.isupper() for c in normalized) and not any(c.isupper() for c in seen_lower[canon])):
            seen_lower[canon] = normalized

    return sorted(seen_lower.values(), key=str.lower)


# ══════════════════════════════════════════════════════
#  EXPERIENCE EXTRACTION
# ══════════════════════════════════════════════════════

DATE_PATTERN = re.compile(
    r'(?:'
    r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
    r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
    r'[\s,]*(?:19|20)\d{2}'
    r'|(?:0?[1-9]|1[0-2])/(?:19|20)\d{2}'
    r'|(?:19|20)\d{2}'
    r')'
    r'(?:\s*[-–—to]+\s*'
    r'(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
    r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
    r'[\s,]*(?:19|20)\d{2}'
    r'|(?:0?[1-9]|1[0-2])/(?:19|20)\d{2}'
    r'|(?:19|20)\d{2}'
    r'|present|current|now|ongoing'
    r'))?',
    re.I
)


def extract_experience(sections: dict) -> list:
    """Extract work experience entries with validation to avoid garbage entries."""
    exp_text = sections.get("experience", "")
    if not exp_text:
        return []

    entries = []
    lines = exp_text.split('\n')
    current_entry = None

    def _is_contact_line(s: str) -> bool:
        """Check if a line is clearly contact info (email, phone, URL)."""
        # Email
        if re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', s):
            return True
        # Phone number (standalone)
        if re.match(r'^\+?\d[\d\s\-().]+$', s) and len(re.sub(r'\D', '', s)) >= 7:
            return True
        # URL
        if re.search(r'^(?:https?://|www\.)', s, re.I):
            return True
        return False

    def _is_valid_job_title(s: str) -> bool:
        """Check if text looks like a plausible job title."""
        if not s or len(s) < 2:
            return False
        # Reject pure numbers
        if re.match(r'^\d+$', s):
            return False
        # Reject phone numbers
        if re.match(r'^\+?\d[\d\s\-().]+$', s) and len(re.sub(r'\D', '', s)) >= 7:
            return False
        # Reject emails
        if re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', s):
            return False
        # Reject single all-caps word (likely a name part, not a job title)
        words = s.split()
        if len(words) == 1 and words[0].isupper() and words[0].isalpha() and len(words[0]) > 1:
            return False
        # Reject lines with 3+ pipes (likely header/skills content)
        if s.count('|') >= 3:
            return False
        # Reject parenthesized content like (HTML,CSS,JAVASCRIPT)
        if re.match(r'^\(.*\)$', s):
            return False
        return True

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Skip lines that are clearly contact info
        if _is_contact_line(stripped):
            continue

        date_match = DATE_PATTERN.search(stripped)

        if date_match and len(stripped) < 200:
            if current_entry:
                entries.append(current_entry)

            duration = date_match.group(0).strip()
            remainder = stripped[:date_match.start()] + stripped[date_match.end():]
            remainder = re.sub(r'[\s|,\-–—()]+$', '', remainder)
            remainder = re.sub(r'^[\s|,\-–—()]+', '', remainder)
            remainder = re.sub(r'\(\s*\)', '', remainder).strip()

            # Try splitting on common separators: "at", "–", "|", "@", ","
            # Use \s+-\s+ for single hyphen to avoid splitting compound words like "Front-End"
            parts = re.split(r'\s+at\s+|\s*[–—|@]+\s*|\s+-\s+|\s*,\s+', remainder, maxsplit=1)
            job_title = parts[0].strip() if parts else ""
            company = parts[1].strip() if len(parts) > 1 else ""
            # Clean trailing parens/separators
            company = re.sub(r'[()]+$', '', company).strip()
            job_title = re.sub(r'[()]+$', '', job_title).strip()

            # Validate the extracted job title
            title_to_use = job_title or remainder
            if _is_valid_job_title(title_to_use):
                current_entry = {
                    "jobTitle": title_to_use,
                    "company": company,
                    "duration": duration,
                    "description": "",
                }
            else:
                # Date found but title is garbage — skip this entry
                current_entry = None
        elif current_entry:
            desc_line = stripped.lstrip('•●◦▪▸►-*').strip()
            if desc_line:
                if current_entry["description"]:
                    current_entry["description"] += " | " + desc_line
                else:
                    current_entry["description"] = desc_line
        else:
            # Only create entry from non-date line if it looks like a genuine job title
            parts = re.split(r'\s*[–—|@]+\s*|\s+-\s+', stripped, maxsplit=1)
            title = parts[0].strip() if parts else ""

            if _is_valid_job_title(title):
                current_entry = {
                    "jobTitle": title,
                    "company": parts[1].strip() if len(parts) > 1 else "",
                    "duration": "",
                    "description": "",
                }

    if current_entry:
        entries.append(current_entry)

    return entries[:20]


# ══════════════════════════════════════════════════════
#  EDUCATION EXTRACTION
# ══════════════════════════════════════════════════════

DEGREE_PATTERNS = [
    r"(?:Bachelor|B\.?S\.?|B\.?A\.?|B\.?Sc\.?|B\.?E\.?|B\.?Tech\.?|B\.?Com\.?|BBA|BCA)",
    r"(?:Master|M\.?S\.?|M\.?A\.?|M\.?Sc\.?|M\.?E\.?|M\.?Tech\.?|M\.?Com\.?|MBA|MCA|M\.?Phil)",
    r"(?:Doctor(?:ate)?|Ph\.?D\.?|D\.?Phil)",
    r"(?:Associate|A\.?S\.?|A\.?A\.?)",
    r"(?:Diploma|Certificate|Certification)",
    r"(?:High\s*School|Secondary|HSC|SSC|Intermediate|GED|A-Level|O-Level|GCSE)",
]

DEGREE_RE = re.compile('|'.join(DEGREE_PATTERNS), re.I)


def extract_education(sections: dict) -> list:
    """Extract education entries."""
    edu_text = sections.get("education", "")
    if not edu_text:
        return []

    entries = []
    lines = edu_text.split('\n')
    current_entry = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        degree_match = DEGREE_RE.search(stripped)
        year_match = re.search(r'((?:19|20)\d{2})', stripped)

        if degree_match:
            if current_entry:
                entries.append(current_entry)

            # Try to extract school from same line: "BS CS - MIT (2018)" or "BS CS, MIT"
            degree_part = stripped
            school = ""
            
            # Split on dash/pipe/comma to find school
            line_parts = re.split(r'\s*[-–—|]+\s*|\s*,\s+', stripped)
            if len(line_parts) >= 2:
                # Find which part has the degree and which has the school
                degree_part = line_parts[0].strip()
                school_part = line_parts[1].strip()
                # Remove year from school part
                school_part = re.sub(r'\(?\s*(?:19|20)\d{2}\s*\)?', '', school_part).strip()
                school_part = re.sub(r'[()]+$', '', school_part).strip()
                if school_part:
                    school = school_part

            field = ""
            field_match = re.search(r'(?:in|of)\s+(.+?)(?:\s*[-–,|]\s*|\s*$)', degree_part, re.I)
            if field_match:
                field = field_match.group(1).strip()

            # Clean degree part
            degree_part = re.sub(r'\(?\s*(?:19|20)\d{2}\s*\)?', '', degree_part).strip()
            degree_part = re.sub(r'[()]+$', '', degree_part).strip()

            current_entry = {
                "degree": degree_part,
                "school": school,
                "field": field,
                "year": year_match.group(1) if year_match else "",
            }
        elif current_entry and not current_entry["school"]:
            school_name = stripped
            year_in_line = re.search(r'((?:19|20)\d{2})', stripped)
            if year_in_line:
                if not current_entry["year"]:
                    current_entry["year"] = year_in_line.group(1)
                school_name = stripped[:year_in_line.start()].strip().rstrip('-–|, ')

            current_entry["school"] = school_name
        elif not current_entry:
            if re.search(r'(?:university|college|institute|school|academy)', stripped, re.I):
                current_entry = {
                    "degree": "",
                    "school": stripped,
                    "field": "",
                    "year": year_match.group(1) if year_match else "",
                }

    if current_entry:
        entries.append(current_entry)

    cleaned = []
    for entry in entries:
        if entry.get("degree") or entry.get("school"):
            if entry["degree"] and entry["school"]:
                entry["degree"] = entry["degree"].replace(entry["school"], "").strip().rstrip('-–|, ')
            if entry["year"] and entry["degree"]:
                entry["degree"] = entry["degree"].replace(entry["year"], "").strip().rstrip('-–|, ')
            cleaned.append(entry)

    return cleaned[:10]


# ══════════════════════════════════════════════════════
#  PROJECTS EXTRACTION
# ══════════════════════════════════════════════════════

def extract_projects(sections: dict) -> list:
    """Extract project entries."""
    proj_text = sections.get("projects", "")
    if not proj_text:
        return []

    projects = []
    lines = proj_text.split('\n')
    current = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        is_bullet = stripped[0] in '•●◦▪▸►-*'
        is_short = len(stripped) < 80

        if not is_bullet and is_short and current is not None:
            projects.append(current)
            current = {"name": stripped, "description": ""}
        elif not is_bullet and is_short and current is None:
            current = {"name": stripped, "description": ""}
        elif current:
            desc_line = stripped.lstrip('•●◦▪▸►-*').strip()
            if current["description"]:
                current["description"] += " | " + desc_line
            else:
                current["description"] = desc_line
        else:
            current = {"name": stripped[:80], "description": ""}

    if current:
        projects.append(current)

    return projects[:15]


# ══════════════════════════════════════════════════════
#  CERTIFICATIONS EXTRACTION
# ══════════════════════════════════════════════════════

def extract_certifications(sections: dict) -> list:
    cert_text = sections.get("certifications", "")
    if not cert_text:
        return []

    certs = []
    for line in cert_text.split('\n'):
        stripped = line.strip().lstrip('•●◦▪▸►-*').strip()
        if stripped and len(stripped) > 3:
            certs.append(stripped)

    return certs[:20]


# ══════════════════════════════════════════════════════
#  SUMMARY EXTRACTION
# ══════════════════════════════════════════════════════

def extract_summary(sections: dict) -> str:
    summary = sections.get("summary", "")
    if summary:
        cleaned = re.sub(r'^[•●◦▪▸►\-*]\s*', '', summary, flags=re.M)
        return cleaned.strip()[:500]
    return ""


# ══════════════════════════════════════════════════════
#  SCORE CALCULATION
# ══════════════════════════════════════════════════════

def calculate_score(data: dict) -> dict:
    breakdown = {}
    total = 0

    skills_count = len(data.get("skills", []))
    if skills_count >= 10:
        breakdown["skills"] = 25
    elif skills_count >= 5:
        breakdown["skills"] = 20
    elif skills_count >= 3:
        breakdown["skills"] = 15
    elif skills_count >= 1:
        breakdown["skills"] = 10
    else:
        breakdown["skills"] = 0
    total += breakdown["skills"]

    exp = data.get("experience", [])
    if len(exp) >= 3:
        breakdown["experience"] = 25
    elif len(exp) >= 2:
        breakdown["experience"] = 20
    elif len(exp) >= 1:
        has_desc = any(e.get("description") for e in exp)
        breakdown["experience"] = 18 if has_desc else 12
    else:
        breakdown["experience"] = 0
    total += breakdown["experience"]

    edu = data.get("education", [])
    if len(edu) >= 1:
        has_degree = any(DEGREE_RE.search(e.get("degree", "")) for e in edu)
        breakdown["education"] = 20 if has_degree else 12
    else:
        breakdown["education"] = 0
    total += breakdown["education"]

    contact_score = 0
    if data.get("fullName"):
        contact_score += 4
    if data.get("email"):
        contact_score += 4
    if data.get("phone"):
        contact_score += 3
    if data.get("location"):
        contact_score += 2
    if data.get("linkedin"):
        contact_score += 2
    breakdown["contact"] = min(contact_score, 15)
    total += breakdown["contact"]

    struct_score = 0
    if data.get("summary"):
        struct_score += 8
    if data.get("projects"):
        struct_score += 4
    if data.get("certifications"):
        struct_score += 3
    breakdown["structure"] = min(struct_score, 15)
    total += breakdown["structure"]

    return {"score": min(total, 100), "breakdown": breakdown}


# ══════════════════════════════════════════════════════
#  GENERATE STRENGTHS & IMPROVEMENTS
# ══════════════════════════════════════════════════════

def generate_strengths(data: dict) -> list:
    strengths = []
    skills = data.get("skills", [])
    exp = data.get("experience", [])
    edu = data.get("education", [])

    if len(skills) >= 10:
        strengths.append(f"Strong technical profile with {len(skills)} identified skills")
    elif len(skills) >= 5:
        strengths.append(f"Good skill diversity with {len(skills)} skills listed")

    if len(exp) >= 3:
        strengths.append(f"Solid work history with {len(exp)} positions")
    elif len(exp) >= 1:
        strengths.append("Has relevant work experience")

    if any(e.get("description") for e in exp):
        strengths.append("Experience entries include detailed descriptions")

    if edu:
        if any(DEGREE_RE.search(e.get("degree", "")) for e in edu):
            strengths.append("Has formal educational qualifications")

    if data.get("summary"):
        strengths.append("Includes a professional summary")

    if data.get("certifications"):
        strengths.append(f"Has {len(data['certifications'])} certification(s)")

    if data.get("projects"):
        strengths.append(f"Showcases {len(data['projects'])} project(s)")

    if data.get("linkedin"):
        strengths.append("LinkedIn profile linked")

    if data.get("github"):
        strengths.append("GitHub profile linked — shows code portfolio")

    return strengths[:8]


def generate_improvements(data: dict) -> list:
    improvements = []
    skills = data.get("skills", [])
    exp = data.get("experience", [])

    if len(skills) < 5:
        improvements.append("Add more technical skills — aim for at least 8-10 relevant skills")

    if not exp:
        improvements.append("Add work experience — even internships, freelance, or volunteer work counts")
    elif not any(e.get("description") for e in exp):
        improvements.append("Add descriptions to work experience with specific achievements and metrics")

    if not data.get("education"):
        improvements.append("Include education background, even self-taught courses or bootcamps")

    if not data.get("summary"):
        improvements.append("Add a professional summary at the top (2-3 sentences about your value proposition)")

    if not data.get("email"):
        improvements.append("Include your email address for recruiters to contact you")

    if not data.get("phone"):
        improvements.append("Add a phone number for easy contact")

    if not data.get("linkedin"):
        improvements.append("Add your LinkedIn profile URL")

    if not data.get("github") and any(
        s.lower() in {"python", "javascript", "java", "c++", "react", "node.js"}
        for s in skills
    ):
        improvements.append("Add a GitHub link to showcase your coding projects")

    if not data.get("projects"):
        improvements.append("Add a Projects section to demonstrate hands-on experience")

    if not data.get("certifications"):
        improvements.append("Consider adding relevant certifications to stand out")

    return improvements[:8]


# ══════════════════════════════════════════════════════
#  MAIN PARSE FUNCTION
# ══════════════════════════════════════════════════════

def parse_resume(text: str) -> dict:
    """
    Main entry point: parse resume text into structured JSON.
    Returns a dict compatible with the ResuMate frontend schema.
    Pure regex — no external NLP libs needed.
    """
    if not text or not text.strip():
        return {
            "fullName": "", "email": "", "phone": "", "location": "",
            "linkedin": "", "github": "", "summary": "",
            "skills": [], "experience": [], "education": [],
            "projects": [], "certifications": [],
            "score": 0, "scoreBreakdown": {},
            "strengths": ["Upload a resume to see analysis"],
            "improvements": ["No text found in the uploaded file"],
        }

    # 1. Detect sections
    sections = detect_sections(text)

    # 2. Contact info
    full_name = extract_name(text)
    email = extract_email(text)
    phone = extract_phone(text)
    location = extract_location(text)
    linkedin = extract_linkedin(text)
    github = extract_github(text)

    # 3. Structured content
    summary = extract_summary(sections)
    skills = extract_skills(text, sections)
    experience = extract_experience(sections)
    education = extract_education(sections)
    projects = extract_projects(sections)
    certifications = extract_certifications(sections)

    # 4. Build result
    result = {
        "fullName": full_name,
        "email": email,
        "phone": phone,
        "location": location,
        "linkedin": linkedin,
        "github": github,
        "summary": summary,
        "skills": skills,
        "experience": experience,
        "education": education,
        "projects": projects,
        "certifications": certifications,
    }

    # 5. Score
    score_data = calculate_score(result)
    result["score"] = score_data["score"]
    result["scoreBreakdown"] = score_data["breakdown"]

    # 6. Strengths & improvements
    result["strengths"] = generate_strengths(result)
    result["improvements"] = generate_improvements(result)

    return result
