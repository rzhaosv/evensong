#!/usr/bin/env python3
"""
Build content/readings.json from public-domain sources.

  * Spurgeon, "Morning and Evening" (1865) - CCEL XML edition
      https://ccel.org/ccel/s/spurgeon/morneve.xml
  * World English Bible (public domain) - eBible.org USFM edition
      https://ebible.org/Scriptures/eng-web_usfm.zip

Usage:
  python3 scripts/build_content.py [--src DIR]

With --src, the script reads morneve_full.xml and a usfm2/ directory from DIR
instead of downloading. Downloads are cached in .cache/ next to this script.

Output: content/readings.json (732 entries) with a light modernization pass over
Spurgeon's text (thee/thou/thy/ye, hath/doth, -eth/-est verb endings).
"""
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from html import unescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache')
OUT = os.path.join(ROOT, 'content', 'readings.json')

SPURGEON_URL = 'https://ccel.org/ccel/s/spurgeon/morneve.xml'
WEB_URL = 'https://ebible.org/Scriptures/eng-web_usfm.zip'

# --------------------------------------------------------------------------- sources


def fetch(url: str, name: str) -> bytes:
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if os.path.exists(path):
        return open(path, 'rb').read()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (evensong content build)'})
    data = urllib.request.urlopen(req, timeout=120).read()
    open(path, 'wb').write(data)
    return data


def load_sources(src_dir):
    if src_dir:
        xml = open(os.path.join(src_dir, 'morneve_full.xml'), encoding='utf-8').read()
        usfm = {}
        d = os.path.join(src_dir, 'usfm2')
        for fn in os.listdir(d):
            if fn.endswith('.usfm'):
                usfm[fn] = open(os.path.join(d, fn), encoding='utf-8').read()
        return xml, usfm
    xml = fetch(SPURGEON_URL, 'morneve.xml').decode('utf-8')
    z = zipfile.ZipFile(io.BytesIO(fetch(WEB_URL, 'eng-web_usfm.zip')))
    usfm = {n: z.read(n).decode('utf-8') for n in z.namelist() if n.endswith('.usfm')}
    return xml, usfm


# --------------------------------------------------------------------------- WEB

BOOK_CODES = {
    'Gen': 'GEN', 'Exod': 'EXO', 'Lev': 'LEV', 'Num': 'NUM', 'Deut': 'DEU', 'Josh': 'JOS', 'Judg': 'JDG', 'Ruth': 'RUT',
    '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', 'Ezra': 'EZR', 'Neh': 'NEH',
    'Esth': 'EST', 'Job': 'JOB', 'Ps': 'PSA', 'Prov': 'PRO', 'Eccl': 'ECC', 'Song': 'SNG', 'Isa': 'ISA', 'Jer': 'JER',
    'Lam': 'LAM', 'Ezek': 'EZK', 'Dan': 'DAN', 'Hos': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obad': 'OBA', 'Jonah': 'JON',
    'Mic': 'MIC', 'Nah': 'NAM', 'Hab': 'HAB', 'Zeph': 'ZEP', 'Hag': 'HAG', 'Zech': 'ZEC', 'Mal': 'MAL', 'Matt': 'MAT',
    'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT', 'Rom': 'ROM', '1Cor': '1CO', '2Cor': '2CO', 'Gal': 'GAL',
    'Eph': 'EPH', 'Phil': 'PHP', 'Col': 'COL', '1Thess': '1TH', '2Thess': '2TH', '1Tim': '1TI', '2Tim': '2TI',
    'Titus': 'TIT', 'Phlm': 'PHM', 'Heb': 'HEB', 'Jas': 'JAS', '1Pet': '1PE', '2Pet': '2PE', '1John': '1JN',
    '2John': '2JN', '3John': '3JN', 'Jude': 'JUD', 'Rev': 'REV',
}


def clean_usfm(s: str) -> str:
    s = re.sub(r'\\f\s.*?\\f\*', '', s)  # footnotes
    s = re.sub(r'\\x\s.*?\\x\*', '', s)  # cross refs
    s = re.sub(r'\\\+?w\s([^|\\]*)\|[^\\]*?\\\+?w\*', r'\1', s)  # \w word|strong="..."\w* (also nested \+w)
    s = re.sub(r'\\\+?w\s([^|\\]*)\\\+?w\*', r'\1', s)  # \w word\w* without attributes
    s = re.sub(r'\\\+?\w+\*', '', s)  # closing markers \wj* \add* ...
    s = re.sub(r'\\\+?[a-z0-9]+\s?', ' ', s)  # remaining markers \q1 \p \wj \add
    s = s.replace('\u00a0', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'\s+([,.;:!?’”])', r'\1', s)
    return s


def build_web_index(usfm: dict) -> dict:
    """{ 'JOS': { (chapter, verse): text } }"""
    index = {}
    for name, text in usfm.items():
        m = re.search(r'\\id\s+([A-Z0-9]{3})', text)
        if not m:
            continue
        code = m.group(1)
        verses = {}
        chapter = 0
        for line in text.split('\n'):
            cm = re.match(r'\\c\s+(\d+)', line)
            if cm:
                chapter = int(cm.group(1))
                continue
            if chapter == 0:
                continue
            # a line may hold several \v markers
            parts = re.split(r'(\\v\s+\d+[a-z]?\s)', line)
            if len(parts) == 1:
                # continuation of the current verse (poetry lines)
                if verses and not line.startswith('\\s') and not line.startswith('\\d') and not line.startswith('\\r'):
                    last = max(verses.keys())
                    if last[0] == chapter:
                        verses[last] += ' ' + line
                continue
            for i in range(1, len(parts), 2):
                vm = re.match(r'\\v\s+(\d+)', parts[i])
                v = int(vm.group(1))
                verses[(chapter, v)] = parts[i + 1]
            # text before the first \v belongs to the previous verse
            if parts[0].strip() and verses:
                keys = [k for k in verses if k[0] == chapter and k[1] < int(re.match(r'\\v\s+(\d+)', parts[1]).group(1))]
                if keys:
                    verses[max(keys)] += ' ' + parts[0]
        index[code] = {k: clean_usfm(v) for k, v in verses.items()}
    return index


def web_verse(index: dict, parsed: str):
    """parsed like '|Josh|5|12|0|0' or '|Song|2|16|2|17' or two refs joined by ';'"""
    out = []
    for piece in parsed.split(';'):
        f = piece.split('|')
        book, ch, v, ch2, v2 = f[1], int(f[2]), int(f[3]), int(f[4]), int(f[5])
        code = BOOK_CODES[book]
        if code not in index:
            return None
        if ch2 == 0:
            ch2, v2 = ch, v
        for c in range(ch, ch2 + 1):
            start = v if c == ch else 1
            end = v2 if c == ch2 else max(k[1] for k in index[code] if k[0] == c)
            for vv in range(start, end + 1):
                t = index[code].get((c, vv))
                if t:
                    out.append(t)
    return ' '.join(out) if out else None


# --------------------------------------------------------------------------- modernizer

WORDS = set()
try:
    WORDS = set(w.strip() for w in open('/usr/share/dict/words', encoding='utf-8', errors='ignore'))
except OSError:
    pass

# Explicit forms (case-insensitive on the first letter).
WORD_MAP = {
    'hath': 'has', 'doth': 'does', 'dost': 'do', 'saith': 'says', 'sayest': 'say', 'sayst': 'say',
    'hast': 'have', 'hadst': 'had', 'wilt': 'will', 'shalt': 'shall', 'canst': 'can', 'didst': 'did',
    'wast': 'were', 'wert': 'were', 'wouldst': 'would', 'couldst': 'could', 'shouldst': 'should',
    'mayest': 'may', 'mayst': 'may', 'mightest': 'might', 'mightst': 'might', 'needst': 'need',
    'knowest': 'know', 'seest': 'see', 'goest': 'go', 'doest': 'do', 'comest': 'come', 'lovest': 'love',
    'shew': 'show', 'shewed': 'showed', 'shewn': 'shown', 'sheweth': 'shows', 'shewest': 'show', 'shewing': 'showing',
    'seeth': 'sees', 'fleeth': 'flees', 'freeth': 'frees', 'agreeth': 'agrees', 'decreeth': 'decrees',
    'goeth': 'goes', 'doeth': 'does', 'undoeth': 'undoes', 'lieth': 'lies', 'dieth': 'dies', 'vieth': 'vies',
    'expelleth': 'expels', 'compelleth': 'compels', 'dispelleth': 'dispels', 'propelleth': 'propels',
    'impelleth': 'impels', 'repelleth': 'repels', 'excelleth': 'excels', 'rebelleth': 'rebels',
    'controlleth': 'controls', 'extolleth': 'extols', 'fulfilleth': 'fulfils', 'enrolleth': 'enrols',
    'quelleth': 'quells', 'welleth': 'wells', 'bathes': 'bathes', 'thyself': 'yourself', 'thyselves': 'yourselves',
    'wotteth': 'knows', 'wot': 'know', 'wist': 'knew', 'listeth': 'wishes', 'quoth': 'said',
    'yea': 'yes', 'nay': 'no', 'wouldest': 'would', 'couldest': 'could', 'shouldest': 'should',
    'owest': 'owe', 'liest': 'lie', 'diest': 'die', 'puttest': 'put', 'holdest': 'hold', 'lookest': 'look',
    'believest': 'believe', 'thinkest': 'think', 'speakest': 'speak', 'needest': 'need', 'wantest': 'want',
    'requirest': 'require', 'hearest': 'hear', 'feedest': 'feed', 'standest': 'stand', 'wakest': 'wake',
    'passest': 'pass', 'livest': 'live', 'dwellest': 'dwell', 'renewest': 'renew', 'desirest': 'desire',
    'cravest': 'crave', 'reachest': 'reach', 'magnifiest': 'magnify', 'rememberest': 'remember',
    'carriest': 'carry', 'waitest': 'wait', 'gloriest': 'glory', 'contendest': 'contend', 'fallest': 'fall',
    'bleedest': 'bleed', 'gettest': 'get', 'callest': 'call', 'beholdest': 'behold', 'feelest': 'feel',
    'seekest': 'seek', 'findest': 'find', 'fearest': 'fear', 'walkest': 'walk', 'makest': 'make', 'givest': 'give',
    'takest': 'take', 'sittest': 'sit', 'keepest': 'keep', 'trustest': 'trust', 'prayest': 'pray', 'criest': 'cry',
    'gaddest': 'gad', 'weepest': 'weep', 'declaredst': 'declared', 'saidst': 'said', 'thinkest': 'think',
}

# Words ending in -eth that are not verbs (never touched); capitalized words are also skipped.
ETH_SKIP = {
    'teeth', 'eth', 'heth', 'beth', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth', 'seventieth',
    'eightieth', 'ninetieth', 'hundredth', 'beneath', 'seth', 'sheth', 'jepheth', 'shibboleth',
}
NO_DOUBLE = set('lsfzck')
NGE_VERBS = {'change', 'range', 'hinge', 'lounge', 'plunge', 'avenge', 'revenge', 'cringe', 'singe', 'tinge', 'fringe',
             'arrange', 'exchange', 'challenge', 'scavenge', 'sponge', 'lunge', 'expunge', 'impinge', 'infringe',
             'twinge', 'derange', 'estrange', 'unhinge'}  # consonants whose doubling is normally part of the base (fall, pass, stuff, buzz, back)


def third_person(stem: str) -> str:
    """'remain' -> 'remains', 'com' -> 'comes', 'sitt' -> 'sits', 'carri' -> 'carries', 'bless' -> 'blesses'"""
    if stem.endswith('i'):
        return stem + 'es'
    if len(stem) >= 3 and stem[-1] == stem[-2] and stem[-1] not in NO_DOUBLE and stem[-1] not in 'aeiou':
        if stem not in WORDS or stem[:-1] in WORDS:
            return stem[:-1] + 's'
    if re.search(r'(s|sh|ch|x|z|o)$', stem):
        return stem + 'es'
    if stem.endswith('ng'):
        return stem + 'es' if stem + 'e' in NGE_VERBS else stem + 's'
    if stem + 'e' in WORDS and (stem not in WORDS or re.search(r'[aeiou][bdgmnprtv]$', stem)):
        return stem + 'es'
    if stem not in WORDS and stem + 'e' in WORDS:
        return stem + 'es'
    return stem + 's'


def base_form(stem: str) -> str:
    """'know' -> 'know', 'lov' -> 'love', 'sitt' -> 'sit', 'carri' -> 'carry', 'li' -> 'lie'"""
    if len(stem) >= 3 and stem[-1] == stem[-2] and stem[-1] not in NO_DOUBLE and stem[-1] not in 'aeiou' and stem[:-1] in WORDS:
        return stem[:-1]
    if stem in WORDS:
        return stem
    if stem.endswith('i'):
        return stem[:-1] + 'y' if len(stem) > 2 else stem + 'e'
    if stem + 'e' in WORDS:
        return stem + 'e'
    return stem


def keep_case(src: str, out: str) -> str:
    return out[:1].upper() + out[1:] if src[:1].isupper() else out


def eth_word(m):
    w = m.group(0)
    lw = w.lower()
    if lw in WORD_MAP:
        return keep_case(w, WORD_MAP[lw])
    if lw in ETH_SKIP:
        return w
    stem = lw[:-3]
    if len(stem) < 2:
        return w
    if w[0].isupper() and stem not in WORDS and stem + 'e' not in WORDS and stem.rstrip('t') not in WORDS:
        return w  # probably a proper noun (Nazareth, Elizabeth, Mephibosheth)
    return keep_case(w, third_person(stem))


def est_after_thou(m):
    thou, verb = m.group(1), m.group(2)
    return keep_case(thou, 'you') + ' ' + second_person(verb)


def second_person(verb: str) -> str:
    lv = verb.lower()
    if lv in WORD_MAP:
        return keep_case(verb, WORD_MAP[lv])
    if lv.endswith('edst'):
        return keep_case(verb, lv[:-2])
    if lv.endswith('est'):
        stem = lv[:-3]
        if lv in WORDS and not lv.endswith('iest'):
            return verb  # 'best', 'rest', 'honest' ...
        if len(stem) >= 2:
            return keep_case(verb, base_form(stem))
    if lv.endswith('st') and lv[:-2] in WORDS and len(lv) > 4:
        return keep_case(verb, lv[:-2])
    return verb


def modernize(text: str) -> str:
    # 1. "thou <verb>" and "<verb> thou" (questions), with the verb adjacent
    text = re.sub(r'\b([Tt]hou)\s+([A-Za-z]+(?:est|st|art|ilt|alt))\b', est_after_thou, text)
    text = re.sub(r'\b(Hast|Art|Wilt|Shalt|Canst|Dost|Didst|Wast|Hadst|Wouldst|Couldst|Shouldst|Mayest|Mightest)\s+thou\b',
                  lambda m: {'hast': 'Have', 'art': 'Are', 'wilt': 'Will', 'shalt': 'Shall', 'canst': 'Can', 'dost': 'Do',
                             'didst': 'Did', 'wast': 'Were', 'hadst': 'Had', 'wouldst': 'Would', 'couldst': 'Could',
                             'shouldst': 'Should', 'mayest': 'May', 'mightest': 'Might'}[m.group(1).lower()] + ' you', text)
    text = re.sub(r'\b(hast|art|wilt|shalt|canst|dost|didst|wast|hadst|wouldst|couldst|shouldst|mayest|mightest)\s+thou\b',
                  lambda m: {'hast': 'have', 'art': 'are', 'wilt': 'will', 'shalt': 'shall', 'canst': 'can', 'dost': 'do',
                             'didst': 'did', 'wast': 'were', 'hadst': 'had', 'wouldst': 'would', 'couldst': 'could',
                             'shouldst': 'should', 'mayest': 'may', 'mightest': 'might'}[m.group(1).lower()] + ' you', text)
    def invert(m):
        v = m.group(1)
        lv = v.lower()
        if lv in WORD_MAP:
            return keep_case(v, WORD_MAP[lv]) + ' you'
        if lv in WORDS and not lv.endswith('iest'):
            return v + ' you'
        return keep_case(v, 'do you ' + second_person(v).lower())
    text = re.sub(r'\b([A-Za-z]+est)\s+thou\b', invert, text)
    # 2. pronouns
    text = re.sub(r'\b[Tt]hou\b', lambda m: keep_case(m.group(0), 'you'), text)
    text = re.sub(r'\b[Tt]hee\b', lambda m: keep_case(m.group(0), 'you'), text)
    text = re.sub(r'\b[Tt]hy\b', lambda m: keep_case(m.group(0), 'your'), text)
    text = re.sub(r'\b([Tt]hine)\b(?=\s+[aeiouAEIOUh])', lambda m: keep_case(m.group(0), 'your'), text)
    text = re.sub(r'\b[Tt]hine\b', lambda m: keep_case(m.group(0), 'yours'), text)
    text = re.sub(r'\b[Tt]hyself\b', lambda m: keep_case(m.group(0), 'yourself'), text)
    text = re.sub(r'\b[Yy]e\b', lambda m: keep_case(m.group(0), 'you'), text)
    # 3. explicit map (hath, doth, saith, shew, hast, wilt ...) anywhere
    text = re.sub(r'\b[A-Za-z]+\b', lambda m: keep_case(m.group(0), WORD_MAP[m.group(0).lower()])
                  if m.group(0).lower() in WORD_MAP else m.group(0), text)
    # 4. -eth verbs
    text = re.sub(r'\b[A-Za-z]{2,}eth\b', eth_word, text)
    # 5. "you art/hast" left over from "thou, ..., art" patterns
    text = re.sub(r'\b(you|You)\s+art\b', r'\1 are', text)
    text = re.sub(r'\b(you|You)\s+is\b', r'\1 are', text)
    text = re.sub(r'\b(you|You)\s+was\b', r'\1 were', text)
    text = re.sub(r'\b(you|You)\s+has\b', r'\1 have', text)
    text = re.sub(r'\b(who|that|which)\s+art\b', r'\1 are', text)
    return text


# --------------------------------------------------------------------------- titles / prayers

SMALL = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'the', 'to',
         'with', 'nor', 'so', 'yet', 'up', 'be', 'are', 'was', 'were', 'if', 'than', 'that', 'this', 'his', 'her',
         'its', 'our', 'my', 'your', 'their', 'not', 'no', 'will', 'shall', 'which', 'who', 'it', 'he', 'she', 'we',
         'they', 'you', 'i', 'o', 'has', 'have', 'had', 'do', 'does', 'did', 'let', 'us', 'me', 'him', 'them', 'may',
         'can', 'would', 'should', 'could', 'very', 'all', 'any', 'each', 'how', 'when', 'where', 'what', 'while',
         'because', 'though', 'although', 'there', 'here', 'then', 'thus', 'even', 'ever', 'never', 'only', 'more',
         'most', 'much', 'many', 'such', 'also', 'still', 'too', 'now', 'again', 'once', 'about', 'over', 'under',
         'after', 'before', 'through', 'like', 'unto', 'upon', 'against', 'without', 'within', 'been', 'being', 'am'}
END_BAD = SMALL - {'us', 'me', 'him', 'them', 'here', 'there', 'now', 'again', 'you', 'more', 'still'}
TITLE_SMALL = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'the',
               'to', 'with', 'nor', 'so', 'yet', 'be', 'are', 'was', 'were', 'if', 'than', 'that', 'this', 'it', 'not',
               'unto', 'upon', 'over', 'up', 'no', 'has', 'have', 'had', 'do', 'does', 'did', 'am', 'been', 'being',
               'its', 'his', 'her', 'our', 'my', 'your', 'their'}


def make_title(body: str, passage: str) -> str:
    first = re.split(r'(?<=[.!?])\s', body.strip(), maxsplit=1)[0]
    first = first.strip('“”"\'')
    # cut at the first clause boundary
    clause = re.split(r'[,;:—]|\s-\s|\(', first)[0]
    words = re.findall(r"[A-Za-z][A-Za-z'’-]*", clause)
    if len(words) < 3:
        words = re.findall(r"[A-Za-z][A-Za-z'’-]*", first)
    if len(words) < 3:
        pclause = re.split(r'[,;:—]|\s-\s|\(', passage)[0]
        words = re.findall(r"[A-Za-z][A-Za-z'’-]*", pclause)
        if len(words) < 3:
            words = re.findall(r"[A-Za-z][A-Za-z'’-]*", passage)
    # trim leading connectives
    while words and words[0].lower() in {'and', 'but', 'for', 'so', 'now', 'then', 'yet', 'o', 'oh', 'yes', 'no'}:
        words = words[1:]
    words = words[:6]
    while len(words) > 3 and words[-1].lower() in END_BAD:
        words = words[:-1]
    if len(words) < 3:
        words = re.findall(r"[A-Za-z][A-Za-z'’-]*", passage)[:5]
        while len(words) > 3 and words[-1].lower() in END_BAD:
            words = words[:-1]
    out = []
    for i, w in enumerate(words):
        lw = w.lower()
        if 0 < i < len(words) - 1 and lw in TITLE_SMALL:
            out.append(lw)
        else:
            out.append(w[0].upper() + w[1:])
    return ' '.join(out)


THEMES = [
    (('sin', 'sins', 'sinner', 'guilt', 'pardon', 'forgive', 'forgiveness', 'repent', 'cleanse', 'blood'),
     'Lord, today, you know how far short I fall; wash me, and let me begin again in your mercy.',
     'Lord, as this day ends, forgive what I did and left undone, and let me sleep as one who is pardoned.'),
    (('trial', 'trials', 'affliction', 'afflictions', 'trouble', 'troubles', 'suffering', 'sorrow', 'sorrows', 'grief', 'tears', 'furnace'),
     'Lord, today, when trouble comes, keep me close, and let me trust that you are working good in it.',
     'Lord, as this day ends, take the weight I have carried since morning, and let me rest in your keeping.'),
    (('fear', 'fears', 'afraid', 'terror', 'dread', 'anxious', 'anxiety', 'doubt', 'doubts', 'unbelief'),
     'Lord, today, quiet my fears, and give me a faith that rests on your word rather than on what I can see.',
     'Lord, as this day ends, still the worries I am tempted to carry into the night, and let me rest in you.'),
    (('prayer', 'pray', 'prays', 'praying', 'petition', 'petitions', 'supplication', 'ask', 'asking'),
     'Lord, today, teach me to pray, to keep asking, and to expect you to answer.',
     'Lord, as this day ends, hear the prayers I did not find words for, and answer in your time.'),
    (('praise', 'praises', 'rejoice', 'joy', 'joyful', 'gladness', 'sing', 'song', 'thanks', 'thanksgiving', 'thankful'),
     'Lord, today, put a song in me, and let gratitude be the first thing on my lips.',
     'Lord, as this day ends, let thanks be the last thing on my lips before I sleep.'),
    (('grace', 'gracious', 'mercy', 'merciful', 'lovingkindness', 'kindness', 'goodness'),
     'Lord, today, let me live as one who has received far more grace than I deserve.',
     'Lord, as this day ends, let me count the mercies I walked past today, and thank you for each one.'),
    (('love', 'loved', 'loves', 'beloved', 'lovest', 'loveth', 'affection'),
     'Lord, today, let your love be the thing I am most sure of, and let it overflow to the people around me.',
     'Lord, as this day ends, let me lie down certain that I am loved, and wake ready to love in return.'),
    (('serve', 'service', 'servant', 'servants', 'work', 'works', 'labour', 'labor', 'duty', 'diligent', 'diligence'),
     'Lord, today, give me willing hands and a glad heart for whatever work you set before me.',
     'Lord, as this day ends, receive the work of my hands, imperfect as it was, and let me rest tonight.'),
    (('rest', 'peace', 'quiet', 'still', 'stillness', 'calm', 'comfort', 'comforted'),
     'Lord, today, give me your peace, the kind the world cannot take away, and let me carry it into everything.',
     'Lord, as this day ends, give me your peace, the kind the world cannot take away, and let me rest in you.'),
    (('hope', 'heaven', 'glory', 'eternal', 'everlasting', 'crown', 'inheritance', 'promise', 'promises'),
     'Lord, today, lift my eyes above the day in front of me, and let your promises steady me.',
     'Lord, as this day ends, remind me that every day is one day nearer home, and let that hope quiet me.'),
    (('holy', 'holiness', 'obedience', 'obey', 'walk', 'righteous', 'righteousness', 'pure', 'purity'),
     'Lord, today, make me more like you in the small choices no one else sees.',
     'Lord, as this day ends, show me where I wandered today, and set my feet on your path again by morning.'),
    (('faith', 'believe', 'believing', 'trust', 'trusting', 'confidence', 'assurance'),
     'Lord, today, give me a simple, steady faith that takes you at your word.',
     'Lord, as this day ends, let me trust you with what is unfinished, and sleep as one who is held.'),
    (('cross', 'crucified', 'atonement', 'redeemed', 'redemption', 'saviour', 'savior', 'sacrifice'),
     'Lord, today, let me never grow used to the cross, and let what you have done for me shape what I do.',
     'Lord, as this day ends, let me look again at the cross, and lie down grateful that the work is finished.'),
]
DEFAULT_PRAYER = ('Lord, today, let this word sink deep into me and change how I live.',
                  'Lord, as this day ends, let this word stay with me through the night and be there when I wake.')


def make_prayer(body: str, period: str, ref: str) -> str:
    words = re.findall(r"[a-z]+", body.lower())
    counts = {}
    for i, theme in enumerate(THEMES):
        counts[i] = sum(1 for w in words if w in theme[0])
    best = max(counts, key=lambda k: counts[k])
    pair = THEMES[best][1:] if counts[best] > 0 else DEFAULT_PRAYER
    return pair[1] if period == 'evening' else pair[0]


# --------------------------------------------------------------------------- parse Spurgeon


def strip_tags(s: str) -> str:
    s = re.sub(r'<scripRef[^>]*>(.*?)</scripRef>', r'\1', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '', s)
    s = unescape(s)
    s = s.replace('\u00a0', ' ')
    s = re.sub(r'\s*\n\s*', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def parse_spurgeon(xml: str):
    entries = []
    for m in re.finditer(r'<div2 title="(Morning|Evening), ([A-Za-z]+) (\d+)"[^>]*id="d(\d\d)(\d\d)(am|pm)">(.*?)</div2>', xml, flags=re.S):
        period, _, _, mm, dd, _, inner = m.groups()
        passage = re.search(r'<(?:p|h3) class="passage"[^>]*>(.*?)</(?:p|h3)>', inner, flags=re.S)
        ref = re.search(r'<h3 class="scripPassage"[^>]*><scripRef[^>]*parsed="([^"]*)"[^>]*>(.*?)</scripRef>', inner, flags=re.S)
        paras = [strip_tags(p) for p in re.findall(r'<p class="normal"[^>]*>(.*?)</p>', inner, flags=re.S)]
        paras = [p for p in paras if p]
        entries.append({
            'month': int(mm), 'day': int(dd), 'period': 'morning' if period == 'Morning' else 'evening',
            'passage': strip_tags(passage.group(1)).strip('“”"') if passage else '', 'parsed': ref.group(1) if ref else '',
            'ref': strip_tags(ref.group(2)) if ref else '', 'paras': paras,
        })
    return entries


def main():
    src = None
    if '--src' in sys.argv:
        src = sys.argv[sys.argv.index('--src') + 1]
    xml, usfm = load_sources(src)
    web = build_web_index(usfm)
    raw = parse_spurgeon(xml)
    out = []
    missing_web = 0
    for e in raw:
        body = '\n\n'.join(modernize(p) for p in e['paras'])
        verse = web_verse(web, e['parsed']) if e['parsed'] else None
        if not verse:
            missing_web += 1
        ref = re.sub(r'\s*,\s*', ', ', e['ref']).replace('Song of Solomon', 'Song of Songs')
        entry = {
            'id': f"{e['month']:02d}-{e['day']:02d}-{'m' if e['period'] == 'morning' else 'e'}",
            'month': e['month'], 'day': e['day'], 'period': e['period'], 'ref': ref,
            'verse': verse or modernize(e['passage']),
            'verseSource': 'WEB' if verse else 'KJV',
            'title': make_title(body, e['passage']),
            'body': body,
            'prayer': make_prayer(body, e['period'], ref),
        }
        out.append(entry)
    out.sort(key=lambda x: (x['month'], x['day'], 0 if x['period'] == 'morning' else 1))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    print(f'wrote {len(out)} readings to {OUT}; missing WEB verse: {missing_web}')


if __name__ == '__main__':
    main()
