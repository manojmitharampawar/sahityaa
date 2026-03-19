import fs from 'fs';
import path from 'path';

const chaptersMeta = [
  { num: 2, title: "सांख्य योग", titleLatin: "Sankhya Yoga", desc: "सांख्य योग", descSa: "Sankhya Yoga", total: 18 },
  { num: 3, title: "कर्म योग", titleLatin: "Karma Yoga", desc: "कर्म योग", descSa: "Karma Yoga", total: 18 },
  { num: 4, title: "ज्ञान कर्म संन्यास योग", titleLatin: "Jnana Karma Sanyasa Yoga", desc: "ज्ञान कर्म संन्यास योग", descSa: "Jnana Karma Sanyasa Yoga", total: 18 },
  { num: 5, title: "कर्म संन्यास योग", titleLatin: "Karma Sanyasa Yoga", desc: "कर्म संन्यास योग", descSa: "Karma Sanyasa Yoga", total: 18 },
  { num: 6, title: "आत्मसंयम योग", titleLatin: "Atmasanyam Yoga", desc: "आत्मसंयम योग", descSa: "Atmasanyam Yoga", total: 18 },
  { num: 7, title: "ज्ञानविज्ञान योग", titleLatin: "Jnana Vijnana Yoga", desc: "ज्ञानविज्ञान योग", descSa: "Jnana Vijnana Yoga", total: 18 },
  { num: 8, title: "अक्षरब्रह्म योग", titleLatin: "Akshara Brahma Yoga", desc: "अक्षरब्रह्म योग", descSa: "Akshara Brahma Yoga", total: 18 },
  { num: 9, title: "राजविद्याराजगुह्य योग", titleLatin: "Raja Vidya Raja Guhya Yoga", desc: "राजविद्याराजगुह्य योग", descSa: "Raja Vidya Raja Guhya Yoga", total: 18 },
  { num: 10, title: "विभूति योग", titleLatin: "Vibhuti Yoga", desc: "विभूति योग", descSa: "Vibhuti Yoga", total: 18 },
  { num: 11, title: "विश्वरूपदर्शन योग", titleLatin: "Vishwaroopa Darshana Yoga", desc: "विश्वरूपदर्शन योग", descSa: "Vishwaroopa Darshana Yoga", total: 18 },
  { num: 12, title: "भक्ति योग", titleLatin: "Bhakti Yoga", desc: "भक्ति योग", descSa: "Bhakti Yoga", total: 18 },
  { num: 13, title: "क्षेत्रक्षेत्रज्ञविभाग योग", titleLatin: "Kshetra Kshetrajna Vibhaga Yoga", desc: "क्षेत्रक्षेत्रज्ञविभाग योग", descSa: "Kshetra Kshetrajna Vibhaga Yoga", total: 18 },
  { num: 14, title: "गुणत्रयविभाग योग", titleLatin: "Gunatraya Vibhaga Yoga", desc: "गुणत्रयविभाग योग", descSa: "Gunatraya Vibhaga Yoga", total: 18 },
  { num: 15, title: "पुरुषोत्तम योग", titleLatin: "Purushottama Yoga", desc: "पुरुषोत्तम योग", descSa: "Purushottama Yoga", total: 18 },
  { num: 16, title: "दैवासुरसम्पद्विभाग योग", titleLatin: "Daivasura Sampad Vibhaga Yoga", desc: "दैवासुरसम्पद्विभाग योग", descSa: "Daivasura Sampad Vibhaga Yoga", total: 18 },
  { num: 17, title: "श्रद्धात्रयविभाग योग", titleLatin: "Shraddhatraya Vibhaga Yoga", desc: "श्रद्धात्रयविभाग योग", descSa: "Shraddhatraya Vibhaga Yoga", total: 18 },
  { num: 18, title: "मोक्षसंन्यास योग", titleLatin: "Moksha Sanyasa Yoga", desc: "मोक्षसंन्यास योग", descSa: "Moksha Sanyasa Yoga", total: 18 }
];

const basePath = path.join(process.cwd(), 'src/content/texts/gitas/bhagavad-gita');

chaptersMeta.forEach(ch => {
  const chStr = ch.num.toString().padStart(2, '0');
  const dirPath = path.join(basePath, `chapter-${chStr}`);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Hindi MD
  const hiContent = `---
title: "${ch.title}"
titleLatin: "Bhagavad Gita - Chapter ${ch.num} - ${ch.titleLatin}"
language: "hi"
scripture: "bhagavad-gita"
category: "gitas"
author: "vyasa"
panth: "common"
religion: "hindu"
chapterNumber: ${ch.num}
chapterTitle: "${ch.title}"
totalChapters: 18
description: "भगवद्गीता का ${ch.num}वाँ अध्याय - ${ch.title}।"
tags: ["${ch.title}", "भगवद्गीता"]
---

## श्रीमद्भगवद्गीता

### अध्याय ${ch.num} — ${ch.title}

<div class="divider"></div>

## श्लोक १
यह अध्याय ${ch.title} का वर्णन करता है। सम्पूर्ण श्लोकों का संकलन प्रगति पर है।

<div class="divider"></div>

इस प्रकार श्रीमद्भगवद्गीता के ${ch.title} नामक ${ch.num}वें अध्याय का विवरण समाप्त हुआ।
`;

  // Sanskrit MD
  const saContent = `---
title: "${ch.title}"
titleLatin: "Bhagavad Gita - Chapter ${ch.num} - ${ch.titleLatin}"
language: "sa"
scripture: "bhagavad-gita"
category: "gitas"
author: "vyasa"
panth: "common"
religion: "hindu"
chapterNumber: ${ch.num}
chapterTitle: "${ch.title}"
totalChapters: 18
description: "The ${ch.num}th chapter of the Bhagavad Gita - ${ch.titleLatin}."
tags: ["${ch.titleLatin}", "gita"]
---

## ॐ श्रीमद्भगवद्गीता

### अथ ${ch.num} अध्यायः — ${ch.title}

<div class="divider"></div>

## श्लोक १
तत्राध्यायस्य श्लोकाः संकलिताः भविष्यन्ति।

<div class="divider"></div>

ॐ तत्सदिति श्रीमद्भगवद्गीतासूपनिषत्सु ब्रह्मविद्यायां योगशास्त्रे श्रीकृष्णार्जुनसंवादे ${ch.title} नाम ${ch.num} अध्यायः ॥ ${ch.num} ॥
`;

  fs.writeFileSync(path.join(dirPath, 'hi.md'), hiContent);
  fs.writeFileSync(path.join(dirPath, 'sa.md'), saContent);
});

console.log("Generated chapters 2-18 successfully.");
