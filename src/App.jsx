import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  firebaseReady, signInWithGoogle, consumeRedirectResult, watchAuth, signOutUser,
  fetchCloudSave, writeCloudSave, watchCloudSave,
} from "./firebase";

/* ============================================================
   kuekachinese · v5
   Fixes: learn cards now save + count. One topic list. Ruby pinyin.
   Sentence audio. Onboarding + help. AI "Add topic".
   ============================================================ */

const LEGACY_KEY = "bluepanda_v1";           // pre-profiles save
const PROFILES_KEY = "bp_profiles";           // { list: [names], active: name }
const keyFor = (name) => "bp_save__" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

/* One-time migration helper: pulls whatever this browser saved before
   cloud sync existed (named local profile, or the very first pre-profiles
   save) so a fresh Google sign-in doesn't start empty. */
function readLocalSeed() {
  try {
    const metaRaw = localStorage.getItem(PROFILES_KEY);
    const meta = metaRaw ? JSON.parse(metaRaw) : null;
    const name = meta && (meta.active || (meta.list || [])[0]);
    if (name) {
      const raw = localStorage.getItem(keyFor(name));
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) return JSON.parse(legacyRaw);
  } catch (e) {}
  return null;
}

/* Charlotte's kuekadoodledoo logo, embedded so it works offline */
const LOGO = "data:image/png;base64,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";

/* ---------------- icons ---------------- */
const PATHS = {
  briefcase: ["M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z", "M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2", "M3 13h18"],
  home: ["M4 11l8-7 8 7", "M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9", "M10 20v-5h4v5"],
  train: ["M6 3h12a2 2 0 012 2v9a3 3 0 01-3 3H7a3 3 0 01-3-3V5a2 2 0 012-2z", "M4 10h16", "M8.5 14.2h.01", "M15.5 14.2h.01", "M8 17l-1.5 3", "M16 17l1.5 3"],
  qr: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h3v3h-3z", "M20 14v2", "M17 20h3", "M20 18h.01"],
  bowl: ["M4 12h16a8 8 0 01-16 0z", "M9 3l2 7", "M15 2l-1 8"],
  people: ["M9 11a3 3 0 100-6 3 3 0 000 6z", "M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5", "M16.5 11a2.3 2.3 0 100-4.6", "M16 14.3c2.4.4 4 2.3 4 4.7"],
  clipboard: ["M7 4h10a2 2 0 012 2v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z", "M9 2h6v4H9z", "M9 13.5l2 2 4-4.5"],
  code: ["M9 8l-4 4 4 4", "M15 8l4 4-4 4"],
  chat: ["M5 4h14a2 2 0 012 2v8a2 2 0 01-2 2h-9l-5 4v-4a2 2 0 01-2-2V6a2 2 0 012-2z", "M8 10h.01", "M12 10h.01", "M16 10h.01"],
  calendar: ["M4 5h16a1 1 0 011 1v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a1 1 0 011-1z", "M3 10h18", "M8 3v4", "M16 3v4"],
  chart: ["M4 20h16", "M7 20v-6", "M12 20v-10", "M17 20v-14"],
  martini: ["M4 5h16l-8 9-8-9z", "M12 14v7", "M8 21h8", "M7.5 8.5h9"],
  pen: ["M14 4l6 6L9 21H4v-5L14 4z", "M12 6l6 6"],
  bank: ["M3 9.5L12 4l9 5.5", "M5 10v8", "M9.7 10v8", "M14.3 10v8", "M19 10v8", "M3 20.5h18"],
  mail: ["M4 5h16a1 1 0 011 1v11a2 2 0 01-2 2H5a2 2 0 01-2-2V6a1 1 0 011-1z", "M3 7l9 6 9-6"],
  med: ["M12 21a9 9 0 100-18 9 9 0 000 18z", "M12 8v8", "M8 12h8"],
  bottle: ["M10 3h4v4l2.5 3.5V19a2 2 0 01-2 2h-5a2 2 0 01-2-2v-8.5L10 7V3z", "M8 14h8"],
  cart: ["M3 4h2.4L8 15h10.5L21 7.5H6.2", "M9.5 20a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8z", "M17 20a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8z"],
  plane: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"],
  trend: ["M3 17l6-6 4 4 8-9", "M16 6h5v5"],
  hash: ["M9.5 4L7.5 20", "M16.5 4l-2 16", "M4 9h17", "M3 15h17"],
  key: ["M7.5 19a3.5 3.5 0 100-7 3.5 3.5 0 000 7z", "M10.2 13L19.5 3.5", "M16 5l3 3"],
  dict: ["M4 5.5A2 2 0 016 3.5h5v16H6a2 2 0 00-2 2V5.5z", "M20 5.5a2 2 0 00-2-2h-5v16h5a2 2 0 012 2V5.5z", "M7 7.5h2.5", "M14.5 7.5H17", "M7 11h2.5", "M14.5 11H17"],
  trash: ["M4 7h16", "M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2", "M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13", "M10 11.5v5.5", "M14 11.5v5.5"],
  flame: ["M12 2c.6 3.5-2.4 5-2.4 8 0 1.4 1 2.4 2.4 2.4s2.4-1.1 2.2-2.7c1.9 1.6 3.3 3.8 3.3 6A5.5 5.5 0 0112 21.5 5.5 5.5 0 016.5 16c0-3.4 2.6-5 3.4-8.2C10.7 5.5 11.4 4 12 2z"],
  book: ["M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z", "M4 19.5A2.5 2.5 0 016.5 17H20", "M9 7h7"],
  sliders: ["M4 7h16", "M4 12h16", "M4 17h16", "M15 7h.01", "M8 12h.01", "M12 17h.01"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  check: ["M5 13l4 4L19 7"],
  chevron: ["M9 6l6 6-6 6"],
  back: ["M19 12H5", "M11 6l-6 6 6 6"],
  volume: ["M11 5L6.5 9H3v6h3.5L11 19V5z", "M15 9a4.2 4.2 0 010 6", "M17.8 6.5a8 8 0 010 11"],
  star: ["M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9 2.9-6z"],
  search: ["M11 17a6 6 0 100-12 6 6 0 000 12z", "M16 16l5 5"],
  lock: ["M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z", "M8 11V8a4 4 0 018 0v3", "M12 15v2.5"],
  sparkle: ["M12 3l1.6 4.9L18.5 9.5l-4.9 1.6L12 16l-1.6-4.9L5.5 9.5l4.9-1.6L12 3z", "M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"],
  bolt: ["M13 2L4 14h6l-1 8 9-12h-6l1-8z"],
  puzzle: ["M9 3h6v4a2 2 0 104 0h2v6h-4a2 2 0 100 4h4v4h-6v-4a2 2 0 10-4 0v4H5v-4a2 2 0 100-4H3V7h4a2 2 0 104 0V3z"],
  target: ["M12 21a9 9 0 100-18 9 9 0 000 18z", "M12 17a5 5 0 100-10 5 5 0 000 10z", "M12 13a1 1 0 100-2 1 1 0 000 2z"],
  timer: ["M12 21a8 8 0 100-16 8 8 0 000 16z", "M12 9v4l2.5 2", "M9 2h6"],
  clock: ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 6.5V12l3.8 2.4", "M12 2.6v1.6", "M12 19.8v1.6", "M2.6 12h1.6", "M19.8 12h1.6"],
  plus: ["M12 5v14", "M5 12h14"],
  help: ["M12 21a9 9 0 100-18 9 9 0 000 18z", "M9.3 9.3a2.8 2.8 0 015.4 1c0 1.9-2.7 2.4-2.7 4", "M12 17.2h.01"],
  cards: ["M7 7h11a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z", "M9 4h9a3 3 0 013 3"],
  globe: ["M12 21a9 9 0 100-18 9 9 0 000 18z", "M3 12h18", "M12 3a15 15 0 010 18", "M12 3a15 15 0 000 18"],
  shuffle: ["M4 6h3.5l9 12H20", "M16.5 6H20v3.5", "M20 6l-4.5 4.5", "M4 18h3.5l3-4", "M16.5 18H20v-3.5", "M20 18l-3-3"],
};

function I({ n, size = 20, color = "currentColor", sw = 2.1, fill = "none", style }) {
  const filled = ["flame", "star", "sparkle", "bolt"].includes(n) && fill !== "none";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {(PATHS[n] || PATHS.sparkle).map((d, i) => (
        <path key={i} d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill={filled ? fill : "none"} />
      ))}
    </svg>
  );
}

/* ---------------- topics ---------------- */
const CORE_TOPICS = [
  { id: "interview", name: "Interview & recruitment", zh: "面试求职", color: "#6FA3D8", icon: "briefcase" },
  { id: "housing",   name: "Housing & setup",         zh: "租房安顿", color: "#FF7A45", icon: "home" },
  { id: "transit",   name: "Getting around",          zh: "交通出行", color: "#16C79A", icon: "train" },
  { id: "pay",       name: "Payments & apps",         zh: "支付软件", color: "#8B5CF6", icon: "qr" },
  { id: "food",      name: "Food & ordering",         zh: "点餐吃饭", color: "#F0663A", icon: "bowl" },
  { id: "people",    name: "People & structure",      zh: "同事职级", color: "#0CA678", icon: "people" },
  { id: "work",      name: "Daily work actions",      zh: "日常工作", color: "#3B5BDB", icon: "clipboard" },
  { id: "tech",      name: "Tech & software",         zh: "技术开发", color: "#4C6EF5", icon: "code" },
  { id: "comms",     name: "Workplace comms",         zh: "沟通反馈", color: "#F06595", icon: "chat" },
  { id: "meetings",  name: "Meetings",                zh: "开会讨论", color: "#12B886", icon: "calendar" },
  { id: "commercial",name: "Commercial & business",   zh: "商务合作", color: "#845EF7", icon: "chart" },
  { id: "social",    name: "Networking & social",     zh: "人际应酬", color: "#FF922B", icon: "martini" },
];

/* offered by the Add-topic sheet alongside AI ideas */
const LIBRARY = [
  { id: "negotiation", name: "Negotiation & contracts", zh: "谈判合同", color: "#3B5BDB", icon: "pen" },
  { id: "banking",     name: "Banking & finance",       zh: "银行金融", color: "#0B7285", icon: "bank" },
  { id: "email",       name: "Business writing",        zh: "商务写作", color: "#5F3DC4", icon: "mail" },
  { id: "doctor",      name: "Seeing a doctor",         zh: "看病就医", color: "#E64980", icon: "med" },
  { id: "dinner",      name: "Dinners & 应酬",          zh: "饭局应酬", color: "#D9480F", icon: "bottle" },
  { id: "shopping",    name: "Shopping & live-selling", zh: "网购直播", color: "#F06595", icon: "cart" },
  { id: "travel",      name: "Business travel",         zh: "出差旅行", color: "#1098AD", icon: "plane" },
  { id: "career",      name: "Career & performance",    zh: "职业发展", color: "#2F9E44", icon: "trend" },
  { id: "slang",       name: "Tech slang 黑话",         zh: "互联网黑话", color: "#7048E8", icon: "hash" },
  { id: "renting",     name: "Renting deep-dive",       zh: "租房进阶", color: "#F76707", icon: "key" },
];

const PALETTE = ["#6FA3D8", "#7048E8", "#16C79A", "#FF7A45", "#E64980", "#0CA678", "#845EF7", "#1098AD", "#F0663A", "#3B5BDB"];

/* ---------------- seed words ---------------- */
const SEED = {
  interview: [
    ["实习","shíxí","internship","我下个月开始在深圳实习。","Wǒ xià gè yuè kāishǐ zài Shēnzhèn shíxí.","I start my internship in Shenzhen next month."],
    ["面试","miànshì","job interview","我明天有一个面试。","Wǒ míngtiān yǒu yí gè miànshì.","I have an interview tomorrow."],
    ["简历","jiǎnlì","resume / CV","请把简历发到这个邮箱。","Qǐng bǎ jiǎnlì fā dào zhège yóuxiāng.","Please send your resume to this email."],
    ["录取","lùqǔ","to be accepted / offered","我被这家公司录取了。","Wǒ bèi zhè jiā gōngsī lùqǔ le.","I was accepted by this company."],
    ["评估","pínggū","assessment / to assess","这轮是技术能力评估。","Zhè lún shì jìshù nénglì pínggū.","This round is a technical assessment."],
    ["投简历","tóu jiǎnlì","to submit an application","我投了十家公司的简历。","Wǒ tóu le shí jiā gōngsī de jiǎnlì.","I applied to ten companies."],
    ["笔试","bǐshì","written test","笔试在下周一。","Bǐshì zài xià zhōuyī.","The written test is next Monday."],
    ["岗位","gǎngwèi","position / role","这个岗位需要三年经验。","Zhège gǎngwèi xūyào sān nián jīngyàn.","This role requires three years of experience."],
    ["招聘","zhāopìn","recruitment / to hire","公司正在招聘实习生。","Gōngsī zhèngzài zhāopìn shíxíshēng.","The company is recruiting interns."],
    ["自我介绍","zìwǒ jièshào","self-introduction","请先做个自我介绍。","Qǐng xiān zuò gè zìwǒ jièshào.","Please introduce yourself first."],
    ["薪资","xīnzī","salary","薪资可以再谈。","Xīnzī kěyǐ zài tán.","The salary is negotiable."],
    ["入职","rùzhí","to start a job / onboard","我一月份入职。","Wǒ yī yuèfèn rùzhí.","I start the job in January."],
    ["经验","jīngyàn","experience","我没有相关经验。","Wǒ méiyǒu xiāngguān jīngyàn.","I don't have relevant experience."],
    ["实习生","shíxíshēng","intern (person)","他是今年的实习生。","Tā shì jīnnián de shíxíshēng.","He's this year's intern."],
    ["岗位描述","gǎngwèi miáoshù","job description","这份岗位描述写得很详细。","Zhè fèn gǎngwèi miáoshù xiě de hěn xiángxì.","This job description is very detailed."],
    ["招聘启事","zhāopìn qǐshì","job posting","我在网上看到一条招聘启事。","Wǒ zài wǎngshàng kàndào yì tiáo zhāopìn qǐshì.","I saw a job posting online."],
    ["内推","nèituī","internal referral","我朋友帮我内推了这家公司。","Wǒ péngyou bāng wǒ nèituī le zhè jiā gōngsī.","My friend referred me internally at this company."],
    ["人力资源","rénlì zīyuán","human resources","人力资源部会联系你。","Rénlì zīyuán bù huì liánxì nǐ.","HR will contact you."],
    ["面试官","miànshìguān","interviewer","面试官问了很多技术问题。","Miànshìguān wèn le hěn duō jìshù wèntí.","The interviewer asked a lot of technical questions."],
    ["群面","qúnmiàn","group interview","群面有六个候选人一起讨论。","Qúnmiàn yǒu liù gè hòuxuǎnrén yìqǐ tǎolùn.","The group interview has six candidates discussing together."],
    ["视频面试","shìpín miànshì","video interview","这轮是视频面试。","Zhè lún shì shìpín miànshì.","This round is a video interview."],
    ["终面","zhōngmiàn","final-round interview","我下周要参加终面。","Wǒ xià zhōu yào cānjiā zhōngmiàn.","I have my final interview next week."],
    ["录用通知","lùyòng tōngzhī","offer letter","我收到录用通知了！","Wǒ shōudào lùyòng tōngzhī le!","I got the offer letter!"],
    ["试用期","shìyòngqī","probation period","试用期是三个月。","Shìyòngqī shì sān gè yuè.","The probation period is three months."],
    ["转正","zhuǎnzhèng","to become a full employee","我下个月就转正了。","Wǒ xià gè yuè jiù zhuǎnzhèng le.","I become a full employee next month."],
    ["背景调查","bèijǐng diàochá","background check","公司在做背景调查。","Gōngsī zài zuò bèijǐng diàochá.","The company is doing a background check."],
    ["求职信","qiúzhíxìn","cover letter","请附上你的求职信。","Qǐng fùshàng nǐ de qiúzhíxìn.","Please attach your cover letter."],
    ["应届生","yīngjièshēng","fresh graduate","很多应届生都在投这家公司。","Hěn duō yīngjièshēng dōu zài tóu zhè jiā gōngsī.","Lots of fresh graduates are applying to this company."],
    ["校招","xiàozhāo","campus recruitment","校招一般在秋天开始。","Xiàozhāo yìbān zài qiūtiān kāishǐ.","Campus recruitment usually starts in autumn."],
    ["社招","shèzhāo","experienced-hire recruitment","社招要求至少两年经验。","Shèzhāo yāoqiú zhìshǎo liǎng nián jīngyàn.","Experienced-hire recruitment requires at least two years' experience."],
    ["谈薪","tánxīn","to negotiate salary","我们可以谈薪吗？","Wǒmen kěyǐ tánxīn ma?","Can we negotiate the salary?"],
    ["婉拒","wǎnjù","to politely decline","我婉拒了另一份offer。","Wǒ wǎnjù le lìng yí fèn offer.","I politely declined the other offer."],
    ["三方协议","sānfāng xiéyì","tripartite agreement","签三方协议前要仔细看条款。","Qiān sānfāng xiéyì qián yào zǐxì kàn tiáokuǎn.","Read the terms carefully before signing the tripartite agreement."],
    ["入职培训","rùzhí péixùn","onboarding training","入职培训会持续一周。","Rùzhí péixùn huì chíxù yì zhōu.","Onboarding training will last a week."],
    ["工作证","gōngzuòzhèng","work badge","别忘了带工作证。","Bié wàngle dài gōngzuòzhèng.","Don't forget to bring your work badge."],
    ["直属领导","zhíshǔ lǐngdǎo","direct supervisor","这是我的直属领导。","Zhè shì wǒ de zhíshǔ lǐngdǎo.","This is my direct supervisor."],
    ["猎头","liètóu","headhunter","一个猎头联系了我。","Yí gè liètóu liánxì le wǒ.","A headhunter reached out to me."],
    ["竞争力","jìngzhēnglì","competitiveness","你的简历很有竞争力。","Nǐ de jiǎnlì hěn yǒu jìngzhēnglì.","Your resume is very competitive."],
    ["优势","yōushì","strength / advantage","你的优势是什么？","Nǐ de yōushì shì shénme?","What's your strength?"],
    ["劣势","lièshì","weakness","每个人都有劣势。","Měi gè rén dōu yǒu lièshì.","Everyone has weaknesses."],
    ["职业规划","zhíyè guīhuà","career plan","面试官问了我的职业规划。","Miànshìguān wèn le wǒ de zhíyè guīhuà.","The interviewer asked about my career plan."],
    ["跳槽","tiàocáo","to switch jobs","他刚跳槽到一家新公司。","Tā gāng tiàocáo dào yì jiā xīn gōngsī.","He just switched to a new company."],
    ["裸辞","luǒcí","to quit without a new job lined up","我不建议裸辞。","Wǒ bú jiànyì luǒcí.","I don't recommend quitting without a new job lined up."],
    ["offer比较","offer bǐjiào","comparing offers","我在做offer比较。","Wǒ zài zuò offer bǐjiào.","I'm comparing my offers."],
    ["笔试题","bǐshìtí","written test question","这道笔试题很难。","Zhè dào bǐshìtí hěn nán.","This written test question is hard."],
  ],
  tech: [
    ["开发","kāifā","to develop","我们在开发一个新功能。","Wǒmen zài kāifā yí gè xīn gōngnéng.","We're developing a new feature."],
    ["需求","xūqiú","requirement / spec","这个需求还没确定。","Zhège xūqiú hái méi quèdìng.","This requirement isn't finalized."],
    ["上线","shàngxiàn","to launch / go live","新版本下周上线。","Xīn bǎnběn xià zhōu shàngxiàn.","The new version goes live next week."],
    ["报错","bàocuò","to throw an error","这里报错了。","Zhèlǐ bàocuò le.","It's throwing an error here."],
    ["测试","cèshì","testing / to test","测试环境挂了。","Cèshì huánjìng guà le.","The test environment is down."],
    ["数据库","shùjùkù","database","数据库连不上。","Shùjùkù lián bu shàng.","Can't connect to the database."],
    ["前端","qiánduān","frontend","我负责前端。","Wǒ fùzé qiánduān.","I'm responsible for the frontend."],
    ["产品经理","chǎnpǐn jīnglǐ","product manager","产品经理改需求了。","Chǎnpǐn jīnglǐ gǎi xūqiú le.","The PM changed the requirements."],
    ["版本","bǎnběn","version","这是最新版本。","Zhè shì zuìxīn bǎnběn.","This is the latest version."],
    ["迭代","diédài","iteration","我们每两周迭代一次。","Wǒmen měi liǎng zhōu diédài yí cì.","We iterate once every two weeks."],
    ["需求文档","xūqiú wéndàng","requirements document","请先看一下需求文档。","Qǐng xiān kàn yíxià xūqiú wéndàng.","Please read the requirements document first."],
    ["原型","yuánxíng","prototype","设计师做了一个原型。","Shèjìshī zuò le yí gè yuánxíng.","The designer made a prototype."],
    ["用户体验","yònghù tǐyàn","user experience","这个流程的用户体验不好。","Zhège liúchéng de yònghù tǐyàn bù hǎo.","This flow's user experience isn't good."],
    ["界面","jièmiàn","interface / UI","界面需要重新设计。","Jièmiàn xūyào chóngxīn shèjì.","The interface needs to be redesigned."],
    ["后端","hòuduān","backend","后端接口还没写好。","Hòuduān jiēkǒu hái méi xiěhǎo.","The backend API isn't written yet."],
    ["服务器","fúwùqì","server","服务器又宕机了。","Fúwùqì yòu dàngjī le.","The server is down again."],
    ["云","yún","cloud","数据存在云上。","Shùjù cún zài yún shàng.","The data is stored in the cloud."],
    ["接口","jiēkǒu","API / interface","这个接口调用失败了。","Zhège jiēkǒu diàoyòng shībài le.","This API call failed."],
    ["算法","suànfǎ","algorithm","推荐算法需要优化。","Tuījiàn suànfǎ xūyào yōuhuà.","The recommendation algorithm needs optimizing."],
    ["人工智能","réngōng zhìnéng","artificial intelligence","这个功能用了人工智能。","Zhège gōngnéng yòng le réngōng zhìnéng.","This feature uses artificial intelligence."],
    ["大数据","dàshùjù","big data","公司很重视大数据。","Gōngsī hěn zhòngshì dàshùjù.","The company values big data a lot."],
    ["崩溃","bēngkuì","to crash","App又崩溃了。","App yòu bēngkuì le.","The app crashed again."],
    ["兼容","jiānróng","compatible","新版本不兼容旧数据。","Xīn bǎnběn bù jiānróng jiù shùjù.","The new version isn't compatible with old data."],
    ["优化","yōuhuà","to optimize","我们在优化加载速度。","Wǒmen zài yōuhuà jiāzài sùdù.","We're optimizing the loading speed."],
    ["部署","bùshǔ","to deploy","代码已经部署到线上。","Dàimǎ yǐjīng bùshǔ dào xiànshàng.","The code has been deployed to production."],
    ["敏捷开发","mǐnjié kāifā","agile development","我们团队用敏捷开发。","Wǒmen tuánduì yòng mǐnjié kāifā.","Our team uses agile development."],
    ["代码","dàimǎ","code","这段代码有问题。","Zhè duàn dàimǎ yǒu wèntí.","This piece of code has a problem."],
    ["开源","kāiyuán","open source","这是一个开源项目。","Zhè shì yí gè kāiyuán xiàngmù.","This is an open source project."],
    ["补丁","bǔdīng","patch","我们马上发一个补丁。","Wǒmen mǎshàng fā yí gè bǔdīng.","We'll release a patch right away."],
    ["漏洞","lòudòng","vulnerability / bug","安全团队发现了一个漏洞。","Ānquán tuánduì fāxiàn le yí gè lòudòng.","The security team found a vulnerability."],
    ["修复","xiūfù","to fix","这个问题已经修复了。","Zhège wèntí yǐjīng xiūfù le.","This issue has already been fixed."],
    ["权限","quánxiàn","permissions","你没有编辑权限。","Nǐ méiyǒu biānjí quánxiàn.","You don't have edit permissions."],
    ["登录","dēnglù","to log in","请用工作账号登录。","Qǐng yòng gōngzuò zhànghào dēnglù.","Please log in with your work account."],
    ["注册","zhùcè","to register","用户需要先注册。","Yònghù xūyào xiān zhùcè.","Users need to register first."],
    ["用户","yònghù","user","这个功能是给新用户看的。","Zhège gōngnéng shì gěi xīn yònghù kàn de.","This feature is for new users."],
    ["流量","liúliàng","(web) traffic","这个页面流量很大。","Zhège yèmiàn liúliàng hěn dà.","This page gets a lot of traffic."],
    ["转化率","zhuǎnhuàlǜ","conversion rate","这个活动的转化率很高。","Zhège huódòng de zhuǎnhuàlǜ hěn gāo.","This campaign's conversion rate is very high."],
    ["灰度发布","huīdù fābù","staged rollout","新功能先灰度发布。","Xīn gōngnéng xiān huīdù fābù.","The new feature will be rolled out in stages first."],
    ["回滚","huígǔn","to roll back","出问题了，赶紧回滚。","Chū wèntí le, gǎnjǐn huígǔn.","There's a problem, roll it back quickly."],
    ["埋点","máidiǎn","tracking point","这里需要加一个埋点。","Zhèlǐ xūyào jiā yí gè máidiǎn.","We need to add a tracking point here."],
    ["日志","rìzhì","log","去看看服务器日志。","Qù kànkan fúwùqì rìzhì.","Go check the server logs."],
    ["排查","páichá","to troubleshoot","工程师在排查问题。","Gōngchéngshī zài páichá wèntí.","The engineer is troubleshooting the issue."],
    ["复现","fùxiàn","to reproduce (a bug)","这个bug很难复现。","Zhège bug hěn nán fùxiàn.","This bug is hard to reproduce."],
    ["用户反馈","yònghù fǎnkuì","user feedback","用户反馈说加载太慢。","Yònghù fǎnkuì shuō jiāzài tài màn.","User feedback says loading is too slow."],
    ["技术栈","jìshù zhàn","tech stack","我们的技术栈用的是这个框架。","Wǒmen de jìshù zhàn yòng de shì zhège kuàngjià.","Our tech stack uses this framework."],
    ["数据分析","shùjù fēnxī","data analysis","我们靠数据分析做决定。","Wǒmen kào shùjù fēnxī zuò juédìng.","We make decisions based on data analysis."],
    ["私有化部署","sīyǒuhuà bùshǔ","on-premise deployment","有些客户要求私有化部署。","Yǒuxiē kèhù yāoqiú sīyǒuhuà bùshǔ.","Some clients require on-premise deployment."],
    ["中台","zhōngtái","middle platform","这个能力由中台统一提供。","Zhège nénglì yóu zhōngtái tǒngyī tígōng.","This capability is provided uniformly by the middle platform."],
    ["研发","yánfā","R&D","研发团队在加班。","Yánfā tuánduì zài jiābān.","The R&D team is working overtime."],
    ["排期","páiqī","schedule / timeline","这个功能的排期是下个月。","Zhège gōngnéng de páiqī shì xià gè yuè.","This feature's schedule is next month."],
    ["需求变更","xūqiú biàngēng","requirement change","又有需求变更了。","Yòu yǒu xūqiú biàngēng le.","There's another requirement change."],
    ["技术债","jìshù zhài","technical debt","这里积累了不少技术债。","Zhèlǐ jīlěi le bùshǎo jìshù zhài.","We've accumulated quite a bit of technical debt here."],
    ["单元测试","dānyuán cèshì","unit test","记得写单元测试。","Jìde xiě dānyuán cèshì.","Remember to write unit tests."],
    ["需求评审","xūqiú píngshěn","requirements review","下午三点开需求评审。","Xiàwǔ sān diǎn kāi xūqiú píngshěn.","Requirements review starts at 3pm."],
    ["数据可视化","shùjù kěshìhuà","data visualization","这个报表做了数据可视化。","Zhège bàobiǎo zuò le shùjù kěshìhuà.","This report includes data visualization."],
  ],
  work: [
    ["开会","kāihuì","to have a meeting","我们十点开会。","Wǒmen shí diǎn kāihuì.","We have a meeting at ten."],
    ["汇报","huìbào","to report to someone","我每周汇报一次。","Wǒ měi zhōu huìbào yí cì.","I report once a week."],
    ["项目","xiàngmù","project","这个项目很赶。","Zhège xiàngmù hěn gǎn.","This project is rushed."],
    ["截止","jiézhǐ","deadline / to be due","截止时间是周五。","Jiézhǐ shíjiān shì zhōuwǔ.","The deadline is Friday."],
    ["加班","jiābān","to work overtime","今天要加班。","Jīntiān yào jiābān.","I have to work overtime today."],
    ["处理","chǔlǐ","to handle / deal with","我正在处理这个问题。","Wǒ zhèngzài chǔlǐ zhège wèntí.","I'm handling this issue."],
    ["完成","wánchéng","to complete","任务已经完成了。","Rènwù yǐjīng wánchéng le.","The task is already complete."],
    ["负责","fùzé","to be responsible for","这块由我负责。","Zhè kuài yóu wǒ fùzé.","I'm responsible for this part."],
    ["安排","ānpái","to arrange","会议已经安排好了。","Huìyì yǐjīng ānpái hǎo le.","The meeting has been arranged."],
    ["提交","tíjiāo","to submit","请在周五前提交。","Qǐng zài zhōuwǔ qián tíjiāo.","Please submit it before Friday."],
    ["审核","shěnhé","to review / approve","这份文件还在审核。","Zhè fèn wénjiàn hái zài shěnhé.","This document is still under review."],
    ["批准","pīzhǔn","to approve","预算已经批准了。","Yùsuàn yǐjīng pīzhǔn le.","The budget has been approved."],
    ["拒绝","jùjué","to reject","领导拒绝了这个方案。","Lǐngdǎo jùjué le zhège fāng'àn.","The boss rejected this proposal."],
    ["修改","xiūgǎi","to revise","请再修改一下这份报告。","Qǐng zài xiūgǎi yíxià zhè fèn bàogào.","Please revise this report again."],
    ["更新","gēngxīn","to update","数据每天更新一次。","Shùjù měitiān gēngxīn yí cì.","The data updates once a day."],
    ["进度","jìndù","progress","项目进度怎么样了？","Xiàngmù jìndù zěnmeyàng le?","How's the project progress going?"],
    ["优先级","yōuxiānjí","priority","这个任务的优先级最高。","Zhège rènwù de yōuxiānjí zuì gāo.","This task has the highest priority."],
    ["紧急","jǐnjí","urgent","这是一个紧急情况。","Zhè shì yí gè jǐnjí qíngkuàng.","This is an urgent situation."],
    ["拖延","tuōyán","to procrastinate / delay","别再拖延了。","Bié zài tuōyán le.","Stop procrastinating."],
    ["效率","xiàolǜ","efficiency","这样做效率更高。","Zhèyàng zuò xiàolǜ gèng gāo.","Doing it this way is more efficient."],
    ["任务","rènwù","task","今天有三个任务要完成。","Jīntiān yǒu sān gè rènwù yào wánchéng.","There are three tasks to complete today."],
    ["分配","fēnpèi","to assign / allocate","领导把任务分配给了我。","Lǐngdǎo bǎ rènwù fēnpèi gěi le wǒ.","The boss assigned the task to me."],
    ["协作","xiézuò","to collaborate","这需要跨部门协作。","Zhè xūyào kuà bùmén xiézuò.","This requires cross-department collaboration."],
    ["推进","tuījìn","to push forward / advance","我们需要推进这个项目。","Wǒmen xūyào tuījìn zhège xiàngmù.","We need to push this project forward."],
    ["汇总","huìzǒng","to compile / summarize","请把数据汇总一下。","Qǐng bǎ shùjù huìzǒng yíxià.","Please compile the data."],
    ["提醒","tíxǐng","to remind","谢谢提醒。","Xièxie tíxǐng.","Thanks for the reminder."],
    ["请假","qǐngjià","to take leave","我明天要请假。","Wǒ míngtiān yào qǐngjià.","I need to take leave tomorrow."],
    ["打卡","dǎkǎ","to clock in/out","别忘了打卡。","Bié wàngle dǎkǎ.","Don't forget to clock in."],
    ["出差","chūchāi","to go on a business trip","我下周要出差。","Wǒ xià zhōu yào chūchāi.","I have a business trip next week."],
    ["加急","jiājí","to expedite / rush","这份订单需要加急处理。","Zhè fèn dìngdān xūyào jiājí chǔlǐ.","This order needs to be expedited."],
    ["延期","yánqī","to postpone","会议延期到下周了。","Huìyì yánqī dào xià zhōu le.","The meeting has been postponed to next week."],
    ["提前","tíqián","in advance / ahead of schedule","项目提前完成了。","Xiàngmù tíqián wánchéng le.","The project finished ahead of schedule."],
    ["落实","luòshí","to implement / follow through","这个计划要尽快落实。","Zhège jìhuà yào jǐnkuài luòshí.","This plan needs to be implemented soon."],
    ["执行","zhíxíng","to execute","方案已经开始执行了。","Fāng'àn yǐjīng kāishǐ zhíxíng le.","The plan has started being executed."],
    ["复盘","fùpán","to do a retrospective","我们复盘一下这次的失误。","Wǒmen fùpán yíxià zhè cì de shīwù.","Let's do a retrospective on this mistake."],
    ["交付","jiāofù","to deliver","项目下周交付。","Xiàngmù xià zhōu jiāofù.","The project will be delivered next week."],
    ["里程碑","lǐchéngbēi","milestone","我们达成了一个重要里程碑。","Wǒmen dáchéng le yí gè zhòngyào lǐchéngbēi.","We've reached an important milestone."],
    ["待办事项","dàibàn shìxiàng","to-do item","我的待办事项还有很多。","Wǒ de dàibàn shìxiàng hái yǒu hěn duō.","I still have a lot of to-do items."],
    ["排班","páibān","shift schedule","这周的排班表出来了。","Zhè zhōu de páibānbiǎo chūlái le.","This week's shift schedule is out."],
    ["值班","zhíbān","to be on duty","今天谁值班？","Jīntiān shéi zhíbān?","Who's on duty today?"],
    ["请示","qǐngshì","to ask for approval","这件事要先请示领导。","Zhè jiàn shì yào xiān qǐngshì lǐngdǎo.","We need to ask the boss for approval on this first."],
    ["授权","shòuquán","to authorize","这个操作需要授权。","Zhège cāozuò xūyào shòuquán.","This action needs authorization."],
    ["归档","guīdàng","to archive","文件用完记得归档。","Wénjiàn yòngwán jìde guīdàng.","Remember to archive the file when you're done."],
    ["备份","bèifèn","to back up","记得定期备份数据。","Jìde dìngqī bèifèn shùjù.","Remember to back up the data regularly."],
    ["流程","liúchéng","process / workflow","申请流程有点复杂。","Shēnqǐng liúchéng yǒudiǎn fùzá.","The application process is a bit complicated."],
    ["规范","guīfàn","standard / norm","请按照公司规范操作。","Qǐng ànzhào gōngsī guīfàn cāozuò.","Please follow the company's standards."],
    ["考核","kǎohé","performance evaluation","年底有一次考核。","Niándǐ yǒu yí cì kǎohé.","There's a performance evaluation at year end."],
    ["绩效","jìxiào","performance (KPI)","我的绩效还不错。","Wǒ de jìxiào hái búcuò.","My performance is pretty good."],
    ["述职","shùzhí","performance review presentation","下周要述职。","Xià zhōu yào shùzhí.","I have a performance review presentation next week."],
    ["交接","jiāojiē","to hand over (work)","我在做工作交接。","Wǒ zài zuò gōngzuò jiāojiē.","I'm handing over my work."],
    ["顶班","dǐngbān","to cover someone's shift","我今天帮同事顶班。","Wǒ jīntiān bāng tóngshì dǐngbān.","I'm covering my colleague's shift today."],
    ["兼顾","jiāngù","to balance / juggle","很难兼顾工作和生活。","Hěn nán jiāngù gōngzuò hé shēnghuó.","It's hard to balance work and life."],
    ["忙不过来","mángbuguòlái","too busy to manage","这周事情太多，忙不过来。","Zhè zhōu shìqing tài duō, mángbuguòlái.","There's too much this week, I can't keep up."],
    ["顺手","shùnshǒu","while at it / conveniently","你顺手把这个也发一下。","Nǐ shùnshǒu bǎ zhège yě fā yíxià.","While you're at it, please send this too."],
  ],
  pay: [
    ["扫码","sǎomǎ","to scan a QR code","扫码支付就行。","Sǎomǎ zhīfù jiù xíng.","Just scan the code to pay."],
    ["转账","zhuǎnzhàng","to transfer money","我给你转账。","Wǒ gěi nǐ zhuǎnzhàng.","I'll transfer it to you."],
    ["余额","yú'é","balance","我余额不够。","Wǒ yú'é bú gòu.","My balance isn't enough."],
    ["实名认证","shímíng rènzhèng","identity verification","要先做实名认证。","Yào xiān zuò shímíng rènzhèng.","You need to verify your identity first."],
    ["微信支付","Wēixìn Zhīfù","WeChat Pay","我一般用微信支付。","Wǒ yìbān yòng Wēixìn Zhīfù.","I usually use WeChat Pay."],
    ["支付宝","Zhīfùbǎo","Alipay","这家店只收支付宝。","Zhè jiā diàn zhǐ shōu Zhīfùbǎo.","This shop only accepts Alipay."],
    ["密码","mìmǎ","password / PIN","别忘了支付密码。","Bié wàngle zhīfù mìmǎ.","Don't forget your payment password."],
    ["收款码","shōukuǎnmǎ","receiving QR code","老板拿出了收款码。","Lǎobǎn náchū le shōukuǎnmǎ.","The shop owner brought out the receiving QR code."],
    ["付款码","fùkuǎnmǎ","paying QR code","打开付款码给他扫。","Dǎkāi fùkuǎnmǎ gěi tā sǎo.","Open your paying QR code for them to scan."],
    ["红包","hóngbāo","red envelope","过年要发红包。","Guònián yào fā hóngbāo.","You give out red envelopes during New Year."],
    ["抢红包","qiǎng hóngbāo","to grab a red envelope","大家都在群里抢红包。","Dàjiā dōu zài qún lǐ qiǎng hóngbāo.","Everyone's grabbing red envelopes in the group chat."],
    ["账单","zhàngdān","bill / statement","这是这个月的账单。","Zhè shì zhège yuè de zhàngdān.","This is this month's bill."],
    ["账户","zhànghù","account","请检查一下你的账户。","Qǐng jiǎnchá yíxià nǐ de zhànghù.","Please check your account."],
    ["绑定银行卡","bǎngdìng yínhángkǎ","to link a bank card","先绑定银行卡才能支付。","Xiān bǎngdìng yínhángkǎ cáinéng zhīfù.","You need to link a bank card before you can pay."],
    ["提现","tíxiàn","to withdraw cash","我想把钱提现。","Wǒ xiǎng bǎ qián tíxiàn.","I want to withdraw the money."],
    ["充值","chōngzhí","to top up","记得给手机充值。","Jìde gěi shǒujī chōngzhí.","Remember to top up your phone."],
    ["免密支付","miǎnmì zhīfù","passwordless payment","小额可以免密支付。","Xiǎo'é kěyǐ miǎnmì zhīfù.","Small amounts can be paid without a password."],
    ["手续费","shǒuxùfèi","transaction fee","转账有手续费吗？","Zhuǎnzhàng yǒu shǒuxùfèi ma?","Is there a transaction fee for transfers?"],
    ["汇率","huìlǜ","exchange rate","今天的汇率是多少？","Jīntiān de huìlǜ shì duōshǎo?","What's today's exchange rate?"],
    ["消费记录","xiāofèi jìlù","spending record","我在查消费记录。","Wǒ zài chá xiāofèi jìlù.","I'm checking my spending record."],
    ["花呗","Huābei","Alipay's buy-now-pay-later","这个月用花呗付的。","Zhège yuè yòng Huābei fù de.","I paid with Huabei this month."],
    ["信用卡","xìnyòngkǎ","credit card","你有信用卡吗？","Nǐ yǒu xìnyòngkǎ ma?","Do you have a credit card?"],
    ["借记卡","jièjìkǎ","debit card","这是我的借记卡。","Zhè shì wǒ de jièjìkǎ.","This is my debit card."],
    ["AA制","AA zhì","splitting the bill evenly","我们AA制吧。","Wǒmen AA zhì ba.","Let's split the bill evenly."],
    ["拼单","pīndān","to split an order","我们拼单买吧。","Wǒmen pīndān mǎi ba.","Let's split the order and buy together."],
    ["退款","tuìkuǎn","refund","商家同意退款了。","Shāngjiā tóngyì tuìkuǎn le.","The seller agreed to a refund."],
    ["找零","zhǎolíng","change (money)","不用找零了。","Búyòng zhǎolíng le.","Keep the change."],
    ["现金","xiànjīn","cash","这里不收现金。","Zhèlǐ bù shōu xiànjīn.","Cash isn't accepted here."],
    ["电子发票","diànzǐ fāpiào","e-invoice","可以开电子发票吗？","Kěyǐ kāi diànzǐ fāpiào ma?","Can I get an e-invoice?"],
    ["会员卡","huìyuánkǎ","membership card","办一张会员卡更划算。","Bàn yì zhāng huìyuánkǎ gèng huásuàn.","It's better value to get a membership card."],
    ["优惠券","yōuhuìquàn","coupon","我有一张优惠券。","Wǒ yǒu yì zhāng yōuhuìquàn.","I have a coupon."],
    ["扫一扫","sǎoyisǎo","to scan (the QR feature)","用扫一扫功能就行。","Yòng sǎoyisǎo gōngnéng jiù xíng.","Just use the scan feature."],
    ["转错账","zhuǎncuò zhàng","to transfer to the wrong account","我不小心转错账了。","Wǒ bù xiǎoxīn zhuǎncuò zhàng le.","I accidentally transferred to the wrong account."],
    ["挂失","guàshī","to report (a card) lost","卡丢了要马上挂失。","Kǎ diū le yào mǎshàng guàshī.","If the card is lost, you need to report it immediately."],
    ["冻结","dòngjié","to freeze (an account)","账户被冻结了。","Zhànghù bèi dòngjié le.","The account has been frozen."],
    ["到账","dàozhàng","to arrive (funds)","钱已经到账了。","Qián yǐjīng dàozhàng le.","The money has already arrived."],
    ["交易","jiāoyì","transaction","这笔交易失败了。","Zhè bǐ jiāoyì shībài le.","This transaction failed."],
    ["支付失败","zhīfù shībài","payment failed","显示支付失败。","Xiǎnshì zhīfù shībài.","It shows the payment failed."],
    ["生物识别","shēngwù shìbié","biometric verification","用生物识别更方便。","Yòng shēngwù shìbié gèng fāngbiàn.","Biometric verification is more convenient."],
  ],
  food: [
    ["点餐","diǎncān","to order food","我们先点餐吧。","Wǒmen xiān diǎncān ba.","Let's order first."],
    ["外卖","wàimài","food delivery","我叫了外卖。","Wǒ jiào le wàimài.","I ordered delivery."],
    ["买单","mǎidān","to pay the bill","我来买单。","Wǒ lái mǎidān.","I'll pay the bill."],
    ["微辣","wēilà","mildly spicy","要微辣，谢谢。","Yào wēilà, xièxie.","Mildly spicy please."],
    ["菜单","càidān","menu","请给我看一下菜单。","Qǐng gěi wǒ kàn yíxià càidān.","Please show me the menu."],
    ["服务员","fúwùyuán","waiter / waitress","服务员，点餐！","Fúwùyuán, diǎncān!","Waiter, I'd like to order!"],
    ["打包","dǎbāo","to pack / takeaway","没吃完的可以打包。","Méi chīwán de kěyǐ dǎbāo.","You can pack up what you didn't finish."],
    ["堂食","tángshí","to dine in","堂食还是外带？","Tángshí háishi wàidài?","For here or to go?"],
    ["外带","wàidài","takeout","我要外带。","Wǒ yào wàidài.","I'd like it to go."],
    ["预订","yùdìng","to reserve / book","我想预订一张桌子。","Wǒ xiǎng yùdìng yì zhāng zhuōzi.","I'd like to reserve a table."],
    ["拼桌","pīnzhuō","to share a table","不介意拼桌吗？","Bú jièyì pīnzhuō ma?","Do you mind sharing a table?"],
    ["主食","zhǔshí","staple food","主食要米饭还是面？","Zhǔshí yào mǐfàn háishi miàn?","For the staple, rice or noodles?"],
    ["素食","sùshí","vegetarian food","我吃素食。","Wǒ chī sùshí.","I eat vegetarian food."],
    ["忌口","jìkǒu","dietary restriction","你有什么忌口吗？","Nǐ yǒu shénme jìkǒu ma?","Do you have any dietary restrictions?"],
    ["过敏","guòmǐn","allergic","我对花生过敏。","Wǒ duì huāshēng guòmǐn.","I'm allergic to peanuts."],
    ["口味","kǒuwèi","taste / flavor preference","你喜欢什么口味？","Nǐ xǐhuan shénme kǒuwèi?","What flavors do you like?"],
    ["清淡","qīngdàn","light (flavor)","我想吃清淡一点的。","Wǒ xiǎng chī qīngdàn yìdiǎn de.","I'd like something a bit lighter."],
    ["麻辣","málà","numbing-spicy","四川菜很麻辣。","Sìchuān cài hěn málà.","Sichuan food is very numbing-spicy."],
    ["甜","tián","sweet","这个甜点很甜。","Zhège tiándiǎn hěn tián.","This dessert is very sweet."],
    ["咸","xián","salty","这道菜有点咸。","Zhè dào cài yǒudiǎn xián.","This dish is a bit salty."],
    ["酸","suān","sour","这个汤有点酸。","Zhège tāng yǒudiǎn suān.","This soup is a bit sour."],
    ["加辣","jiā là","add spice","可以帮我加辣吗？","Kěyǐ bāng wǒ jiā là ma?","Can you add extra spice for me?"],
    ["不要香菜","búyào xiāngcài","no cilantro","不要香菜，谢谢。","Búyào xiāngcài, xièxie.","No cilantro, thanks."],
    ["特色菜","tèsècài","specialty dish","这是我们的特色菜。","Zhè shì wǒmen de tèsècài.","This is our specialty dish."],
    ["招牌菜","zhāopáicài","signature dish","招牌菜一定要试试。","Zhāopáicài yídìng yào shìshi.","You have to try the signature dish."],
    ["好吃","hǎochī","delicious","这个真好吃！","Zhège zhēn hǎochī!","This is so delicious!"],
    ["难吃","nánchī","not tasty","这个有点难吃。","Zhège yǒudiǎn nánchī.","This isn't very tasty."],
    ["送餐","sòngcān","to deliver food","外卖大概半小时送餐。","Wàimài dàgài bàn xiǎoshí sòngcān.","Delivery takes about half an hour."],
    ["骑手","qíshǒu","delivery rider","骑手已经在路上了。","Qíshǒu yǐjīng zài lùshang le.","The delivery rider is already on the way."],
    ["起送费","qǐsòngfèi","minimum order for delivery","起送费是20元。","Qǐsòngfèi shì èrshí yuán.","The minimum order for delivery is 20 yuan."],
    ["配送费","pèisòngfèi","delivery fee","配送费是多少？","Pèisòngfèi shì duōshǎo?","How much is the delivery fee?"],
    ["备注","bèizhù","special note","记得写备注不要辣。","Jìde xiě bèizhù búyào là.","Remember to note down no spice."],
    ["加料","jiāliào","extra topping","可以加料吗？","Kěyǐ jiāliào ma?","Can I add extra toppings?"],
    ["火锅","huǒguō","hotpot","我们今晚吃火锅吧。","Wǒmen jīnwǎn chī huǒguō ba.","Let's have hotpot tonight."],
    ["烧烤","shāokǎo","barbecue","周末去吃烧烤吧。","Zhōumò qù chī shāokǎo ba.","Let's go eat barbecue this weekend."],
    ["早餐","zǎocān","breakfast","你吃早餐了吗？","Nǐ chī zǎocān le ma?","Have you had breakfast?"],
    ["午餐","wǔcān","lunch","我们一起吃午餐吧。","Wǒmen yìqǐ chī wǔcān ba.","Let's have lunch together."],
    ["晚餐","wǎncān","dinner","晚餐想吃什么？","Wǎncān xiǎng chī shénme?","What do you want for dinner?"],
    ["夜宵","yèxiāo","late-night snack","要不要一起去吃夜宵？","Yàobúyào yìqǐ qù chī yèxiāo?","Want to grab a late-night snack together?"],
    ["饮料","yǐnliào","drink / beverage","要点饮料吗？","Yào diǎn yǐnliào ma?","Would you like to order a drink?"],
    ["奶茶","nǎichá","milk tea","我想喝奶茶。","Wǒ xiǎng hē nǎichá.","I want to drink milk tea."],
    ["白开水","báikāishuǐ","plain water","给我一杯白开水就好。","Gěi wǒ yì bēi báikāishuǐ jiù hǎo.","Just give me a glass of plain water."],
    ["加冰","jiā bīng","add ice","加冰还是常温？","Jiā bīng háishi chángwēn?","With ice or room temperature?"],
    ["去冰","qù bīng","no ice","我要去冰的。","Wǒ yào qù bīng de.","I'd like no ice."],
    ["半糖","bàntáng","half sugar","半糖，谢谢。","Bàntáng, xièxie.","Half sugar, thanks."],
    ["免费续杯","miǎnfèi xùbēi","free refill","这里可以免费续杯。","Zhèlǐ kěyǐ miǎnfèi xùbēi.","You can get free refills here."],
    ["打折","dǎzhé","to discount","今天全场打折。","Jīntiān quánchǎng dǎzhé.","Everything's discounted today."],
    ["团购","tuángòu","group buy","这个可以团购更便宜。","Zhège kěyǐ tuángòu gèng piányi.","This is cheaper if you group-buy."],
    ["排队","páiduì","to queue","这家店要排队。","Zhè jiā diàn yào páiduì.","You have to queue at this restaurant."],
    ["翻台","fāntái","table turnover","周末翻台很快。","Zhōumò fāntái hěn kuài.","Table turnover is fast on weekends."],
    ["剩菜","shèngcài","leftovers","剩菜可以打包带走。","Shèngcài kěyǐ dǎbāo dàizǒu.","Leftovers can be packed to take away."],
    ["米饭","mǐfàn","rice","再来一碗米饭。","Zài lái yì wǎn mǐfàn.","One more bowl of rice, please."],
    ["面条","miàntiáo","noodles","这家的面条很好吃。","Zhè jiā de miàntiáo hěn hǎochī.","This place's noodles are delicious."],
    ["套餐","tàocān","set meal / combo","我要这个套餐。","Wǒ yào zhège tàocān.","I'll have this set meal."],
    ["加菜","jiācài","to order more dishes","要不要再加个菜？","Yàobúyào zài jiā gè cài?","Want to order another dish?"],
  ],
  transit: [
    ["地铁","dìtiě","metro / subway","坐地铁比较快。","Zuò dìtiě bǐjiào kuài.","The metro is faster."],
    ["打车","dǎchē","to hail a ride","下雨了，我们打车吧。","Xià yǔ le, wǒmen dǎchē ba.","It's raining, let's get a ride."],
    ["导航","dǎoháng","navigation","我用手机导航。","Wǒ yòng shǒujī dǎoháng.","I'll navigate with my phone."],
    ["换乘","huànchéng","to transfer (lines)","在这一站换乘。","Zài zhè yí zhàn huànchéng.","Transfer at this station."],
    ["网约车","wǎngyuēchē","ride-hailing car","我叫了一辆网约车。","Wǒ jiào le yí liàng wǎngyuēchē.","I called a ride-hailing car."],
    ["公交车","gōngjiāochē","bus","坐公交车更便宜。","Zuò gōngjiāochē gèng piányi.","Taking the bus is cheaper."],
    ["站台","zhàntái","platform","请在二号站台等车。","Qǐng zài èr hào zhàntái děng chē.","Please wait at platform 2."],
    ["出口","chūkǒu","exit","从A出口出去。","Cóng A chūkǒu chūqù.","Go out through exit A."],
    ["入口","rùkǒu","entrance","入口在那边。","Rùkǒu zài nàbiān.","The entrance is over there."],
    ["刷卡","shuākǎ","to tap / swipe a card","上车刷卡就行。","Shàngchē shuākǎ jiù xíng.","Just tap your card when you board."],
    ["交通卡","jiāotōngkǎ","transit card","记得给交通卡充值。","Jìde gěi jiāotōngkǎ chōngzhí.","Remember to top up your transit card."],
    ["共享单车","gòngxiǎng dānchē","shared bike","我骑共享单车上班。","Wǒ qí gòngxiǎng dānchē shàngbān.","I ride a shared bike to work."],
    ["扫码开锁","sǎomǎ kāisuǒ","to scan to unlock","扫码开锁就能骑走。","Sǎomǎ kāisuǒ jiù néng qízǒu.","Scan the code to unlock and ride off."],
    ["堵车","dǔchē","traffic jam","现在很堵车。","Xiànzài hěn dǔchē.","There's a lot of traffic right now."],
    ["高峰期","gāofēngqī","rush hour","高峰期地铁很挤。","Gāofēngqī dìtiě hěn jǐ.","The metro is very crowded during rush hour."],
    ["红绿灯","hónglǜdēng","traffic light","前面有个红绿灯。","Qiánmiàn yǒu gè hónglǜdēng.","There's a traffic light ahead."],
    ["十字路口","shízì lùkǒu","intersection","在十字路口右转。","Zài shízì lùkǒu yòuzhuǎn.","Turn right at the intersection."],
    ["直行","zhíxíng","go straight","一直直行就到了。","Yìzhí zhíxíng jiù dào le.","Just go straight and you'll get there."],
    ["左转","zuǒzhuǎn","turn left","前面左转。","Qiánmiàn zuǒzhuǎn.","Turn left ahead."],
    ["右转","yòuzhuǎn","turn right","下个路口右转。","Xià gè lùkǒu yòuzhuǎn.","Turn right at the next intersection."],
    ["掉头","diàotóu","to make a U-turn","这里不能掉头。","Zhèlǐ bùnéng diàotóu.","You can't make a U-turn here."],
    ["路况","lùkuàng","traffic conditions","路况不太好。","Lùkuàng bú tài hǎo.","Traffic conditions aren't great."],
    ["拼车","pīnchē","to carpool","我们拼车去吧。","Wǒmen pīnchē qù ba.","Let's carpool there."],
    ["起步价","qǐbùjià","starting fare","起步价是十块。","Qǐbùjià shì shí kuài.","The starting fare is ten yuan."],
    ["车费","chēfèi","fare","车费一共三十块。","Chēfèi yígòng sānshí kuài.","The fare is thirty yuan in total."],
    ["加油站","jiāyóuzhàn","gas station","前面有个加油站。","Qiánmiàn yǒu gè jiāyóuzhàn.","There's a gas station ahead."],
    ["停车场","tíngchēchǎng","parking lot","停车场在地下一层。","Tíngchēchǎng zài dìxià yì céng.","The parking lot is on basement level 1."],
    ["违章","wéizhāng","traffic violation","他违章停车了。","Tā wéizhāng tíngchē le.","He parked illegally."],
    ["罚单","fádān","traffic ticket","他收到了一张罚单。","Tā shōudào le yì zhāng fádān.","He got a traffic ticket."],
    ["高铁","gāotiě","high-speed rail","我坐高铁去深圳。","Wǒ zuò gāotiě qù Shēnzhèn.","I'm taking the high-speed rail to Shenzhen."],
    ["机场大巴","jīchǎng dàbā","airport shuttle bus","我们坐机场大巴吧。","Wǒmen zuò jīchǎng dàbā ba.","Let's take the airport shuttle bus."],
    ["打表","dǎbiǎo","to use the meter","师傅，请打表。","Shīfu, qǐng dǎbiǎo.","Sir, please use the meter."],
    ["目的地","mùdìdì","destination","请输入目的地。","Qǐng shūrù mùdìdì.","Please enter your destination."],
    ["定位","dìngwèi","to locate / GPS location","手机定位不准。","Shǒujī dìngwèi bù zhǔn.","My phone's location isn't accurate."],
    ["迷路","mílù","to get lost","我们好像迷路了。","Wǒmen hǎoxiàng mílù le.","I think we're lost."],
    ["步行","bùxíng","to walk","步行大概十分钟。","Bùxíng dàgài shí fēnzhōng.","It's about a ten-minute walk."],
    ["骑车","qíchē","to ride a bike","我喜欢骑车上班。","Wǒ xǐhuan qíchē shàngbān.","I like riding my bike to work."],
    ["车牌","chēpái","license plate","记一下车牌号。","Jì yíxià chēpái hào.","Note down the license plate number."],
    ["末班车","mòbānchē","last train/bus","小心赶不上末班车。","Xiǎoxīn gǎn bu shàng mòbānchē.","Be careful not to miss the last train."],
    ["首班车","shǒubānchē","first train/bus","首班车是六点。","Shǒubānchē shì liù diǎn.","The first train is at six."],
  ],
  housing: [
    ["租房","zūfáng","to rent a place","我在找租房。","Wǒ zài zhǎo zūfáng.","I'm looking for a place to rent."],
    ["押金","yājīn","deposit","押金是一个月房租。","Yājīn shì yí gè yuè fángzū.","The deposit is one month's rent."],
    ["房东","fángdōng","landlord","房东人很好。","Fángdōng rén hěn hǎo.","The landlord is nice."],
    ["水电费","shuǐdiànfèi","utilities","水电费另算。","Shuǐdiànfèi lìng suàn.","Utilities are charged separately."],
    ["房租","fángzū","rent","这个月房租涨了。","Zhège yuè fángzū zhǎng le.","Rent went up this month."],
    ["中介","zhōngjiè","agent / agency","我通过中介找的房子。","Wǒ tōngguò zhōngjiè zhǎo de fángzi.","I found this place through an agent."],
    ["合租","hézū","to share a rental","我和朋友合租。","Wǒ hé péngyou hézū.","I share a rental with a friend."],
    ["单间","dānjiān","studio / single room","这是一个单间。","Zhè shì yí gè dānjiān.","This is a single room."],
    ["精装修","jīngzhuāngxiū","fully furnished","这套房是精装修的。","Zhè tào fáng shì jīngzhuāngxiū de.","This apartment is fully furnished."],
    ["物业费","wùyèfèi","property management fee","物业费每月两百。","Wùyèfèi měi yuè liǎngbǎi.","The property management fee is 200 a month."],
    ["小区","xiǎoqū","residential compound","这个小区很安静。","Zhège xiǎoqū hěn ānjìng.","This residential compound is very quiet."],
    ["楼层","lóucéng","floor","你住在几楼层？","Nǐ zhù zài jǐ lóucéng?","Which floor do you live on?"],
    ["电梯","diàntī","elevator","电梯坏了。","Diàntī huài le.","The elevator is broken."],
    ["家具","jiājù","furniture","房间里的家具很旧。","Fángjiān lǐ de jiājù hěn jiù.","The furniture in the room is old."],
    ["家电","jiādiàn","home appliances","家电都配齐了。","Jiādiàn dōu pèiqí le.","All the home appliances are provided."],
    ["空调","kōngtiáo","air conditioner","空调不太冷。","Kōngtiáo bú tài lěng.","The air conditioner isn't very cold."],
    ["热水器","rèshuǐqì","water heater","热水器坏了。","Rèshuǐqì huài le.","The water heater is broken."],
    ["洗衣机","xǐyījī","washing machine","洗衣机在阳台。","Xǐyījī zài yángtái.","The washing machine is on the balcony."],
    ["冰箱","bīngxiāng","fridge","冰箱里没东西了。","Bīngxiāng lǐ méi dōngxi le.","There's nothing in the fridge."],
    ["宽带","kuāndài","broadband","宽带还没装好。","Kuāndài hái méi zhuānghǎo.","The broadband isn't set up yet."],
    ["报修","bàoxiū","to report for repair","我要报修一下水管。","Wǒ yào bàoxiū yíxià shuǐguǎn.","I need to report the pipe for repair."],
    ["维修","wéixiū","to repair","师傅在维修空调。","Shīfu zài wéixiū kōngtiáo.","The technician is repairing the air conditioner."],
    ["搬家","bānjiā","to move house","我们下周搬家。","Wǒmen xià zhōu bānjiā.","We're moving house next week."],
    ["退租","tuìzū","to move out / end lease","我打算下个月退租。","Wǒ dǎsuàn xià gè yuè tuìzū.","I plan to move out next month."],
    ["续租","xùzū","to renew a lease","你要续租吗？","Nǐ yào xùzū ma?","Are you renewing the lease?"],
    ["房源","fángyuán","available listing","中介发了几个房源。","Zhōngjiè fā le jǐ gè fángyuán.","The agent sent a few listings."],
    ["户型","hùxíng","floor plan","这个户型采光不错。","Zhège hùxíng cǎiguāng búcuò.","This floor plan has good natural light."],
    ["朝向","cháoxiàng","orientation (facing)","房子朝南。","Fángzi cháo nán.","The apartment faces south."],
    ["采光","cǎiguāng","natural lighting","这间屋子采光很好。","Zhè jiān wūzi cǎiguāng hěn hǎo.","This room has great natural lighting."],
    ["室友","shìyǒu","roommate","我的室友很好相处。","Wǒ de shìyǒu hěn hǎo xiāngchǔ.","My roommate is easy to get along with."],
    ["门禁","ménjìn","access control","小区有门禁。","Xiǎoqū yǒu ménjìn.","The compound has access control."],
    ["快递","kuàidì","courier / parcel","我的快递到了。","Wǒ de kuàidì dào le.","My parcel has arrived."],
    ["驿站","yìzhàn","parcel pickup station","去驿站拿快递。","Qù yìzhàn ná kuàidì.","Go to the pickup station to collect the parcel."],
    ["垃圾分类","lājī fēnlèi","waste sorting","这里要做垃圾分类。","Zhèlǐ yào zuò lājī fēnlèi.","You need to sort your waste here."],
    ["押一付三","yā yī fù sān","1 month deposit, 3 months rent upfront","这里一般是押一付三。","Zhèlǐ yìbān shì yā yī fù sān.","It's usually one month deposit, three months rent upfront here."],
    ["看房","kànfáng","to view a property","我周末要去看房。","Wǒ zhōumò yào qù kànfáng.","I'm going to view a property this weekend."],
    ["出租","chūzū","to rent out","这套房子在出租。","Zhè tào fángzi zài chūzū.","This apartment is for rent."],
    ["二房东","èrfángdōng","sub-landlord","我是从二房东手里租的。","Wǒ shì cóng èrfángdōng shǒu lǐ zū de.","I rented from a sub-landlord."],
    ["合同到期","hétong dàoqī","lease expires","合同下个月到期。","Hétong xià gè yuè dàoqī.","The lease expires next month."],
    ["邻居","línjū","neighbor","我的邻居很吵。","Wǒ de línjū hěn chǎo.","My neighbor is very noisy."],
    ["阳台","yángtái","balcony","阳台可以晒衣服。","Yángtái kěyǐ shài yīfu.","You can dry clothes on the balcony."],
    ["装修","zhuāngxiū","renovation","隔壁在装修。","Gébì zài zhuāngxiū.","The neighbor next door is renovating."],
    ["水管","shuǐguǎn","pipe","水管漏水了。","Shuǐguǎn lòushuǐ le.","The pipe is leaking."],
    ["钥匙","yàoshi","key","我把钥匙忘在家里了。","Wǒ bǎ yàoshi wàng zài jiā lǐ le.","I forgot my key at home."],
    ["门锁","ménsuǒ","door lock","门锁换过了。","Ménsuǒ huàn guò le.","The door lock has been changed."],
  ],
  people: [
    ["同事","tóngshì","colleague","我的同事都很友好。","Wǒ de tóngshì dōu hěn yǒuhǎo.","My colleagues are all friendly."],
    ["领导","lǐngdǎo","boss / leadership","这个要问领导。","Zhège yào wèn lǐngdǎo.","We need to ask the boss about this."],
    ["部门","bùmén","department","我在技术部门。","Wǒ zài jìshù bùmén.","I'm in the tech department."],
    ["团队","tuánduì","team","我们团队有八个人。","Wǒmen tuánduì yǒu bā gè rén.","Our team has eight people."],
    ["老板","lǎobǎn","boss","老板今天不在。","Lǎobǎn jīntiān bú zài.","The boss isn't in today."],
    ["上司","shàngsi","superior","我的上司很好说话。","Wǒ de shàngsi hěn hǎo shuōhuà.","My superior is easy to talk to."],
    ["下属","xiàshǔ","subordinate","他有五个下属。","Tā yǒu wǔ gè xiàshǔ.","He has five subordinates."],
    ["同级","tóngjí","peer / same level","我们是同级的。","Wǒmen shì tóngjí de.","We're at the same level."],
    ["前辈","qiánbèi","senior colleague","多向前辈请教。","Duō xiàng qiánbèi qǐngjiào.","Ask the senior colleagues for advice more."],
    ["新人","xīnrén","newcomer","他是团队里的新人。","Tā shì tuánduì lǐ de xīnrén.","He's the newcomer on the team."],
    ["老员工","lǎo yuángōng","veteran employee","她是公司的老员工了。","Tā shì gōngsī de lǎo yuángōng le.","She's a veteran employee at the company."],
    ["总监","zǒngjiān","director","总监会参加这次评审。","Zǒngjiān huì cānjiā zhè cì píngshěn.","The director will join this review."],
    ["经理","jīnglǐ","manager","我的经理很支持我。","Wǒ de jīnglǐ hěn zhīchí wǒ.","My manager is very supportive."],
    ["主管","zhǔguǎn","supervisor","请联系你的主管。","Qǐng liánxì nǐ de zhǔguǎn.","Please contact your supervisor."],
    ["副总","fùzǒng","vice president","副总也来开会了。","Fùzǒng yě lái kāihuì le.","The VP also came to the meeting."],
    ["创始人","chuàngshǐrén","founder","他是这家公司的创始人。","Tā shì zhè jiā gōngsī de chuàngshǐrén.","He's the founder of this company."],
    ["助理","zhùlǐ","assistant","我的助理帮我安排日程。","Wǒ de zhùlǐ bāng wǒ ānpái rìchéng.","My assistant helps arrange my schedule."],
    ["人事","rénshì","HR / personnel","这件事要问人事。","Zhè jiàn shì yào wèn rénshì.","You need to ask HR about this."],
    ["财务","cáiwù","finance (department)","报销要找财务。","Bàoxiāo yào zhǎo cáiwù.","Go to finance for reimbursements."],
    ["法务","fǎwù","legal (department)","合同要先给法务看。","Hétong yào xiān gěi fǎwù kàn.","The contract needs to go to legal first."],
    ["行政","xíngzhèng","admin","行政部负责订会议室。","Xíngzhèng bù fùzé dìng huìyìshì.","Admin is responsible for booking meeting rooms."],
    ["客服","kèfú","customer service","可以联系客服问问。","Kěyǐ liánxì kèfú wènwen.","You can contact customer service to ask."],
    ["保安","bǎo'ān","security guard","保安在门口。","Bǎo'ān zài ménkǒu.","The security guard is at the entrance."],
    ["前台","qiántái","receptionist / front desk","去前台登记一下。","Qù qiántái dēngjì yíxià.","Go register at the front desk."],
    ["组长","zǔzhǎng","team leader","她是我们的组长。","Tā shì wǒmen de zǔzhǎng.","She's our team leader."],
    ["队友","duìyǒu","teammate","我的队友很靠谱。","Wǒ de duìyǒu hěn kàopǔ.","My teammate is very reliable."],
    ["搭档","dādàng","partner (work)","我们是老搭档了。","Wǒmen shì lǎo dādàng le.","We're long-time partners."],
    ["甲方","jiǎfāng","client (contract term)","甲方改需求了。","Jiǎfāng gǎi xūqiú le.","The client changed the requirements."],
    ["乙方","yǐfāng","vendor (contract term)","我们是乙方。","Wǒmen shì yǐfāng.","We're the vendor."],
    ["外包","wàibāo","outsourced","这部分工作外包出去了。","Zhè bùfen gōngzuò wàibāo chūqù le.","This part of the work is outsourced."],
    ["兼职","jiānzhí","part-time worker","她是兼职员工。","Tā shì jiānzhí yuángōng.","She's a part-time employee."],
    ["全职","quánzhí","full-time worker","我现在是全职了。","Wǒ xiànzài shì quánzhí le.","I'm full-time now."],
    ["董事会","dǒngshìhuì","board of directors","这要董事会批准。","Zhè yào dǒngshìhuì pīzhǔn.","This needs board approval."],
    ["汇报对象","huìbào duìxiàng","the person you report to","我的汇报对象换了。","Wǒ de huìbào duìxiàng huàn le.","The person I report to has changed."],
    ["跨部门","kuà bùmén","cross-department","这是一个跨部门项目。","Zhè shì yí gè kuà bùmén xiàngmù.","This is a cross-department project."],
    ["前同事","qián tóngshì","former colleague","他是我的前同事。","Tā shì wǒ de qián tóngshì.","He's my former colleague."],
    ["校友","xiàoyǒu","alumnus / schoolmate","我们是校友。","Wǒmen shì xiàoyǒu.","We're alumni of the same school."],
    ["老乡","lǎoxiāng","person from same hometown","我们是老乡。","Wǒmen shì lǎoxiāng.","We're from the same hometown."],
    ["元老","yuánlǎo","founding member","他是公司的元老。","Tā shì gōngsī de yuánlǎo.","He's a founding member of the company."],
    ["实习导师","shíxí dǎoshī","internship mentor","我的实习导师人很好。","Wǒ de shíxí dǎoshī rén hěn hǎo.","My internship mentor is very nice."],
    ["带教","dàijiào","to mentor / coach","她负责带教新人。","Tā fùzé dàijiào xīnrén.","She's in charge of mentoring newcomers."],
    ["公司","gōngsī","company","这家公司很大。","Zhè jiā gōngsī hěn dà.","This company is very big."],
    ["职位","zhíwèi","position / title","他的职位是产品经理。","Tā de zhíwèi shì chǎnpǐn jīnglǐ.","His position is product manager."],
    ["晋升","jìnshēng","to be promoted","她刚晋升为主管。","Tā gāng jìnshēng wéi zhǔguǎn.","She was just promoted to supervisor."],
    ["资历","zīlì","seniority / qualifications","他资历比较老。","Tā zīlì bǐjiào lǎo.","He has more seniority."],
    ["职场","zhíchǎng","workplace","职场新人要多学习。","Zhíchǎng xīnrén yào duō xuéxí.","Workplace newcomers should learn a lot."],
  ],
  comms: [
    ["沟通","gōutōng","to communicate","我们需要多沟通。","Wǒmen xūyào duō gōutōng.","We need to communicate more."],
    ["反馈","fǎnkuì","feedback","谢谢你的反馈。","Xièxie nǐ de fǎnkuì.","Thanks for your feedback."],
    ["确认","quèrèn","to confirm","请确认一下时间。","Qǐng quèrèn yíxià shíjiān.","Please confirm the time."],
    ["跟进","gēnjìn","to follow up","这件事我来跟进。","Zhè jiàn shì wǒ lái gēnjìn.","I'll follow up on this."],
    ["消息","xiāoxi","message","我收到你的消息了。","Wǒ shōudào nǐ de xiāoxi le.","I got your message."],
    ["已读","yǐdú","read (message status)","他已读但没回。","Tā yǐdú dàn méi huí.","He read it but didn't reply."],
    ["秒回","miǎohuí","to reply instantly","领导消息一般都秒回。","Lǐngdǎo xiāoxi yìbān dōu miǎohuí.","I always reply instantly to the boss's messages."],
    ["群","qún","group chat","把这个发到群里。","Bǎ zhège fā dào qún lǐ.","Send this in the group chat."],
    ["拉群","lāqún","to create a group chat","我先拉个群。","Wǒ xiān lā gè qún.","Let me create a group chat first."],
    ["艾特","àitè","to @ someone","记得艾特一下负责人。","Jìde àitè yíxià fùzérén.","Remember to @ the person in charge."],
    ["私聊","sīliáo","to DM privately","我们私聊说吧。","Wǒmen sīliáo shuō ba.","Let's talk in a private message."],
    ["抄送","chāosòng","to CC","邮件记得抄送给我。","Yóujiàn jìde chāosòng gěi wǒ.","Remember to CC me on the email."],
    ["转发","zhuǎnfā","to forward","帮我把这条消息转发一下。","Bāng wǒ bǎ zhè tiáo xiāoxi zhuǎnfā yíxià.","Please forward this message for me."],
    ["语音消息","yǔyīn xiāoxi","voice message","他发了一条语音消息。","Tā fā le yì tiáo yǔyīn xiāoxi.","He sent a voice message."],
    ["通知","tōngzhī","notification / to notify","请通知大家开会时间改了。","Qǐng tōngzhī dàjiā kāihuì shíjiān gǎi le.","Please notify everyone the meeting time changed."],
    ["提出","tíchū","to raise / propose","他提出了一个新想法。","Tā tíchū le yí gè xīn xiǎngfǎ.","He raised a new idea."],
    ["澄清","chéngqīng","to clarify","我想澄清一下这件事。","Wǒ xiǎng chéngqīng yíxià zhè jiàn shì.","I'd like to clarify this."],
    ["误会","wùhuì","misunderstanding","这是一个误会。","Zhè shì yí gè wùhuì.","This is a misunderstanding."],
    ["委婉","wěiwǎn","tactful / euphemistic","他委婉地拒绝了。","Tā wěiwǎn de jùjué le.","He declined tactfully."],
    ["直接","zhíjiē","direct / straightforward","有什么问题可以直接说。","Yǒu shénme wèntí kěyǐ zhíjiē shuō.","If there's a problem, just say it directly."],
    ["客套","kètào","polite formalities","不用跟我客套。","Búyòng gēn wǒ kètào.","No need for formalities with me."],
    ["升级","shēngjí","to escalate","这个问题需要升级处理。","Zhège wèntí xūyào shēngjí chǔlǐ.","This issue needs to be escalated."],
    ["汇报工作","huìbào gōngzuò","to report on work","我每周一汇报工作。","Wǒ měi zhōuyī huìbào gōngzuò.","I report on my work every Monday."],
    ["口头","kǒutóu","verbal","先口头同意，之后补合同。","Xiān kǒutóu tóngyì, zhīhòu bǔ hétong.","Verbal agreement first, contract to follow."],
    ["书面","shūmiàn","in writing","请给我一份书面说明。","Qǐng gěi wǒ yí fèn shūmiàn shuōmíng.","Please give me a written explanation."],
    ["邮件","yóujiàn","email","我已经把邮件发给你了。","Wǒ yǐjīng bǎ yóujiàn fā gěi nǐ le.","I've already sent you the email."],
    ["附件","fùjiàn","attachment","请查收附件。","Qǐng cháshōu fùjiàn.","Please check the attachment."],
    ["回复","huífù","to reply","请尽快回复。","Qǐng jǐnkuài huífù.","Please reply as soon as possible."],
    ["收到","shōudào","received (acknowledged)","收到，谢谢。","Shōudào, xièxie.","Received, thanks."],
    ["麻烦您","máfan nín","sorry to trouble you","麻烦您帮我看一下。","Máfan nín bāng wǒ kàn yíxià.","Sorry to trouble you, could you take a look for me?"],
    ["打扰","dǎrǎo","to disturb / interrupt","不好意思打扰一下。","Bù hǎoyìsi dǎrǎo yíxià.","Sorry to disturb you."],
    ["插话","chāhuà","to interrupt / cut in","抱歉插话一下。","Bàoqiàn chāhuà yíxià.","Sorry to interrupt for a moment."],
    ["语气","yǔqì","tone (of speech)","他说话的语气很急。","Tā shuōhuà de yǔqì hěn jí.","His tone was very urgent."],
    ["态度","tàidu","attitude","他工作态度很认真。","Tā gōngzuò tàidu hěn rènzhēn.","His work attitude is very serious."],
    ["表达","biǎodá","to express","我想表达一下我的看法。","Wǒ xiǎng biǎodá yíxià wǒ de kànfǎ.","I'd like to express my view."],
    ["意见","yìjiàn","opinion","你对这个有什么意见？","Nǐ duì zhège yǒu shénme yìjiàn?","What's your opinion on this?"],
    ["建议","jiànyì","suggestion","我有一个建议。","Wǒ yǒu yí gè jiànyì.","I have a suggestion."],
    ["达成共识","dáchéng gòngshí","to reach consensus","我们最终达成了共识。","Wǒmen zuìzhōng dáchéng le gòngshí.","We finally reached consensus."],
    ["分歧","fēnqí","disagreement","我们在这一点上有分歧。","Wǒmen zài zhè yìdiǎn shàng yǒu fēnqí.","We have a disagreement on this point."],
    ["妥协","tuǒxié","to compromise","双方都做了一些妥协。","Shuāngfāng dōu zuò le yìxiē tuǒxié.","Both sides made some compromises."],
    ["背锅","bēiguō","to take the blame","我不想替别人背锅。","Wǒ bùxiǎng tì biéren bēiguō.","I don't want to take the blame for someone else."],
    ["甩锅","shuǎiguō","to shift blame","他老是甩锅给别人。","Tā lǎoshì shuǎiguō gěi biéren.","He always shifts the blame onto others."],
    ["站队","zhànduì","to take sides","我不想在这件事上站队。","Wǒ bùxiǎng zài zhè jiàn shì shàng zhànduì.","I don't want to take sides on this."],
    ["敬请","jìngqǐng","please kindly","敬请留意邮件通知。","Jìngqǐng liúyì yóujiàn tōngzhī.","Please kindly pay attention to the email notification."],
    ["随时联系","suíshí liánxì","feel free to contact anytime","有问题随时联系我。","Yǒu wèntí suíshí liánxì wǒ.","Feel free to contact me anytime if there's a problem."],
  ],
  meetings: [
    ["讨论","tǎolùn","to discuss","这个我们再讨论。","Zhège wǒmen zài tǎolùn.","Let's discuss this further."],
    ["方案","fāng'àn","proposal / plan","我准备了两个方案。","Wǒ zhǔnbèi le liǎng gè fāng'àn.","I prepared two proposals."],
    ["目标","mùbiāo","goal","这个季度的目标是什么？","Zhège jìdù de mùbiāo shì shénme?","What's this quarter's goal?"],
    ["决定","juédìng","to decide","还没决定。","Hái méi juédìng.","It hasn't been decided yet."],
    ["会议室","huìyìshì","meeting room","会议在三号会议室。","Huìyì zài sān hào huìyìshì.","The meeting is in meeting room 3."],
    ["议程","yìchéng","agenda","请先看一下今天的议程。","Qǐng xiān kàn yíxià jīntiān de yìchéng.","Please look at today's agenda first."],
    ["主持","zhǔchí","to chair / host","今天由我主持会议。","Jīntiān yóu wǒ zhǔchí huìyì.","I'll be chairing the meeting today."],
    ["记录","jìlù","to record / take notes","谁来做会议记录？","Shéi lái zuò huìyì jìlù?","Who's taking the meeting notes?"],
    ["纪要","jìyào","meeting minutes","请把会议纪要发给大家。","Qǐng bǎ huìyì jìyào fā gěi dàjiā.","Please send the meeting minutes to everyone."],
    ["出席","chūxí","to attend","领导也会出席这次会议。","Lǐngdǎo yě huì chūxí zhè cì huìyì.","The boss will also attend this meeting."],
    ["缺席","quēxí","to be absent","他今天缺席了。","Tā jīntiān quēxí le.","He was absent today."],
    ["迟到","chídào","to be late","抱歉，我迟到了。","Bàoqiàn, wǒ chídào le.","Sorry, I'm late."],
    ["改期","gǎiqī","to reschedule","这个会议要改期。","Zhège huìyì yào gǎiqī.","This meeting needs to be rescheduled."],
    ["视频会议","shìpín huìyì","video conference","下午三点有个视频会议。","Xiàwǔ sān diǎn yǒu gè shìpín huìyì.","There's a video conference at 3pm."],
    ["连麦","liánmài","to connect on a call","我们连麦讨论一下。","Wǒmen liánmài tǎolùn yíxià.","Let's hop on a call to discuss."],
    ["静音","jìngyīn","mute","请把麦克风静音。","Qǐng bǎ màikèfēng jìngyīn.","Please mute your microphone."],
    ["共享屏幕","gòngxiǎng píngmù","to share your screen","我先共享一下屏幕。","Wǒ xiān gòngxiǎng yíxià píngmù.","Let me share my screen first."],
    ["议题","yìtí","agenda item","今天有三个议题。","Jīntiān yǒu sān gè yìtí.","There are three agenda items today."],
    ["结论","jiélùn","conclusion","我们得出了一个结论。","Wǒmen déchū le yí gè jiélùn.","We reached a conclusion."],
    ["总结","zǒngjié","to summarize","我来总结一下今天的重点。","Wǒ lái zǒngjié yíxià jīntiān de zhòngdiǎn.","Let me summarize today's key points."],
    ["补充","bǔchōng","to add / supplement","我想补充一点。","Wǒ xiǎng bǔchōng yìdiǎn.","I'd like to add one point."],
    ["提问","tíwèn","to ask a question","欢迎大家提问。","Huānyíng dàjiā tíwèn.","Everyone's welcome to ask questions."],
    ["举手","jǔshǒu","to raise a hand","有问题的话请举手。","Yǒu wèntí dehuà qǐng jǔshǒu.","Please raise your hand if you have a question."],
    ["投票","tóupiào","to vote","我们投票决定吧。","Wǒmen tóupiào juédìng ba.","Let's decide by voting."],
    ["一致同意","yízhì tóngyì","unanimous agreement","大家一致同意这个方案。","Dàjiā yízhì tóngyì zhège fāng'àn.","Everyone unanimously agreed to this plan."],
    ["反对","fǎnduì","to oppose","我反对这个决定。","Wǒ fǎnduì zhège juédìng.","I oppose this decision."],
    ["弃权","qìquán","to abstain","他选择弃权。","Tā xuǎnzé qìquán.","He chose to abstain."],
    ["休会","xiūhuì","to adjourn","我们先休会十分钟。","Wǒmen xiān xiūhuì shí fēnzhōng.","Let's adjourn for ten minutes."],
    ["延长","yáncháng","to extend","会议延长了半小时。","Huìyì yáncháng le bàn xiǎoshí.","The meeting was extended by half an hour."],
    ["简短","jiǎnduǎn","brief / short","请尽量简短一点。","Qǐng jǐnliàng jiǎnduǎn yìdiǎn.","Please try to keep it brief."],
    ["跑题","pǎotí","to go off-topic","我们好像跑题了。","Wǒmen hǎoxiàng pǎotí le.","We seem to have gone off-topic."],
    ["切入正题","qiērù zhèngtí","to get to the point","我们直接切入正题吧。","Wǒmen zhíjiē qiērù zhèngtí ba.","Let's get straight to the point."],
    ["站会","zhànhuì","stand-up meeting","我们每天早上开站会。","Wǒmen měitiān zǎoshang kāi zhànhuì.","We have a stand-up meeting every morning."],
    ["周会","zhōuhuì","weekly meeting","周会改到周三了。","Zhōuhuì gǎi dào zhōusān le.","The weekly meeting has been moved to Wednesday."],
    ["复盘会","fùpánhuì","retrospective meeting","项目结束后要开复盘会。","Xiàngmù jiéshù hòu yào kāi fùpánhuì.","We need a retrospective meeting after the project ends."],
    ["头脑风暴","tóunǎo fēngbào","brainstorm","我们先头脑风暴一下。","Wǒmen xiān tóunǎo fēngbào yíxià.","Let's brainstorm first."],
    ["白板","báibǎn","whiteboard","把想法写在白板上。","Bǎ xiǎngfǎ xiě zài báibǎn shàng.","Write the ideas on the whiteboard."],
    ["会前","huìqián","before the meeting","会前请先看一下资料。","Huìqián qǐng xiān kàn yíxià zīliào.","Please review the materials before the meeting."],
    ["会后","huìhòu","after the meeting","会后我们再聊。","Huìhòu wǒmen zài liáo.","Let's talk after the meeting."],
    ["待定","dàidìng","to be determined","时间还待定。","Shíjiān hái dàidìng.","The time is still to be determined."],
    ["确认参会","quèrèn cānhuì","to confirm attendance","请回复确认参会。","Qǐng huífù quèrèn cānhuì.","Please reply to confirm your attendance."],
  ],
  commercial: [
    ["客户","kèhù","client / customer","客户很满意。","Kèhù hěn mǎnyì.","The client is satisfied."],
    ["市场","shìchǎng","market","中国市场很大。","Zhōngguó shìchǎng hěn dà.","The Chinese market is huge."],
    ["合作","hézuò","to cooperate","期待和你们合作。","Qīdài hé nǐmen hézuò.","Looking forward to working with you."],
    ["合同","hétong","contract","合同还没签。","Hétong hái méi qiān.","The contract isn't signed yet."],
    ["供应商","gōngyìngshāng","supplier","我们换了一个供应商。","Wǒmen huàn le yí gè gōngyìngshāng.","We switched suppliers."],
    ["采购","cǎigòu","to procure / purchase","采购部在比价。","Cǎigòu bù zài bǐjià.","The procurement department is comparing prices."],
    ["报价","bàojià","to quote a price","请给我们报个价。","Qǐng gěi wǒmen bào gè jià.","Please give us a quote."],
    ["定价","dìngjià","pricing","这个产品的定价偏高。","Zhège chǎnpǐn de dìngjià piān gāo.","This product's pricing is a bit high."],
    ["折扣","zhékòu","discount","批量订购有折扣。","Pīliàng dìnggòu yǒu zhékòu.","There's a discount for bulk orders."],
    ["利润","lìrùn","profit","这个季度利润不错。","Zhège jìdù lìrùn búcuò.","Profit this quarter is pretty good."],
    ["成本","chéngběn","cost","我们要控制成本。","Wǒmen yào kòngzhì chéngběn.","We need to control costs."],
    ["营收","yíngshōu","revenue","公司营收增长了。","Gōngsī yíngshōu zēngzhǎng le.","The company's revenue has grown."],
    ["业绩","yèjì","business performance","这个月业绩很好。","Zhège yuè yèjì hěn hǎo.","This month's performance was very good."],
    ["增长","zēngzhǎng","growth","用户数量在快速增长。","Yònghù shùliàng zài kuàisù zēngzhǎng.","The number of users is growing rapidly."],
    ["份额","fèn'é","market share","我们的市场份额在扩大。","Wǒmen de shìchǎng fèn'é zài kuòdà.","Our market share is expanding."],
    ["竞争对手","jìngzhēng duìshǒu","competitor","这是我们的主要竞争对手。","Zhè shì wǒmen de zhǔyào jìngzhēng duìshǒu.","This is our main competitor."],
    ["战略","zhànlüè","strategy","这是公司的长期战略。","Zhè shì gōngsī de chángqī zhànlüè.","This is the company's long-term strategy."],
    ["拓展","tuòzhǎn","to expand","我们在拓展新市场。","Wǒmen zài tuòzhǎn xīn shìchǎng.","We're expanding into new markets."],
    ["渠道","qúdào","channel","这是一个新的销售渠道。","Zhè shì yí gè xīn de xiāoshòu qúdào.","This is a new sales channel."],
    ["代理商","dàilǐshāng","agent / distributor","他们是我们的代理商。","Tāmen shì wǒmen de dàilǐshāng.","They're our distributor."],
    ["供应链","gōngyìngliàn","supply chain","供应链出了点问题。","Gōngyìngliàn chū le diǎn wèntí.","There's an issue in the supply chain."],
    ["库存","kùcún","inventory","库存不多了。","Kùcún bù duō le.","Inventory is running low."],
    ["订单","dìngdān","order","我们收到了一个大订单。","Wǒmen shōudào le yí gè dà dìngdān.","We received a big order."],
    ["发票","fāpiào","invoice","请开一张发票。","Qǐng kāi yì zhāng fāpiào.","Please issue an invoice."],
    ["付款","fùkuǎn","to pay / payment","请在月底前付款。","Qǐng zài yuèdǐ qián fùkuǎn.","Please make the payment before the end of the month."],
    ["结算","jiésuàn","to settle (payment)","我们按月结算。","Wǒmen àn yuè jiésuàn.","We settle payments monthly."],
    ["佣金","yōngjīn","commission","中介收取佣金。","Zhōngjiè shōuqǔ yōngjīn.","The agent charges a commission."],
    ["提成","tíchéng","sales commission","销售有提成。","Xiāoshòu yǒu tíchéng.","Sales staff get commission."],
    ["融资","róngzī","to raise funding","公司刚完成一轮融资。","Gōngsī gāng wánchéng yì lún róngzī.","The company just completed a round of funding."],
    ["投资","tóuzī","to invest","他们投资了这家公司。","Tāmen tóuzī le zhè jiā gōngsī.","They invested in this company."],
    ["股东","gǔdōng","shareholder","股东们今天开会。","Gǔdōngmen jīntiān kāihuì.","The shareholders are meeting today."],
    ["估值","gūzhí","valuation","这家公司的估值很高。","Zhè jiā gōngsī de gūzhí hěn gāo.","This company's valuation is very high."],
    ["盈利","yínglì","to be profitable","公司终于盈利了。","Gōngsī zhōngyú yínglì le.","The company is finally profitable."],
    ["亏损","kuīsǔn","to lose money","这个季度出现了亏损。","Zhège jìdù chūxiàn le kuīsǔn.","There was a loss this quarter."],
    ["风险","fēngxiǎn","risk","这个决定有一定风险。","Zhège juédìng yǒu yídìng fēngxiǎn.","This decision carries some risk."],
    ["商机","shāngjī","business opportunity","这是一个不错的商机。","Zhè shì yí gè búcuò de shāngjī.","This is a good business opportunity."],
    ["洽谈","qiàtán","to discuss business terms","双方正在洽谈合作细节。","Shuāngfāng zhèngzài qiàtán hézuò xìjié.","Both sides are discussing the cooperation details."],
    ["意向","yìxiàng","intent","客户表达了合作意向。","Kèhù biǎodá le hézuò yìxiàng.","The client expressed intent to cooperate."],
    ["签约","qiānyuē","to sign a contract","我们下周签约。","Wǒmen xià zhōu qiānyuē.","We're signing the contract next week."],
    ["违约","wéiyuē","to breach a contract","对方违约了。","Duìfāng wéiyuē le.","The other party breached the contract."],
    ["续约","xùyuē","to renew a contract","客户决定续约。","Kèhù juédìng xùyuē.","The client decided to renew the contract."],
    ["报表","bàobiǎo","report / statement","请准备一份财务报表。","Qǐng zhǔnbèi yí fèn cáiwù bàobiǎo.","Please prepare a financial statement."],
    ["季度","jìdù","quarter","这是第三季度的数据。","Zhè shì dì sān jìdù de shùjù.","This is the third quarter's data."],
    ["财年","cáinián","fiscal year","新财年从四月开始。","Xīn cáinián cóng sìyuè kāishǐ.","The new fiscal year starts in April."],
    ["预算","yùsuàn","budget","这个项目的预算有限。","Zhège xiàngmù de yùsuàn yǒuxiàn.","This project's budget is limited."],
    ["客户关系","kèhù guānxi","customer relations","维护客户关系很重要。","Wéihù kèhù guānxi hěn zhòngyào.","Maintaining customer relations is important."],
    ["售后","shòuhòu","after-sales service","他们的售后服务很好。","Tāmen de shòuhòu fúwù hěn hǎo.","Their after-sales service is very good."],
    ["服务费","fúwùfèi","service fee","还需要支付服务费。","Hái xūyào zhīfù fúwùfèi.","A service fee also needs to be paid."],
    ["定金","dìngjīn","deposit","请先付定金。","Qǐng xiān fù dìngjīn.","Please pay a deposit first."],
    ["尾款","wěikuǎn","final payment","交货后付尾款。","Jiāohuò hòu fù wěikuǎn.","The final payment is due after delivery."],
    ["招标","zhāobiāo","to put out a tender","政府项目在招标。","Zhèngfǔ xiàngmù zài zhāobiāo.","The government project is out for tender."],
    ["投标","tóubiāo","to bid","我们决定参与投标。","Wǒmen juédìng cānyù tóubiāo.","We decided to submit a bid."],
    ["中标","zhòngbiāo","to win a bid","我们中标了！","Wǒmen zhòngbiāo le!","We won the bid!"],
    ["商业模式","shāngyè móshì","business model","他们的商业模式很创新。","Tāmen de shāngyè móshì hěn chuàngxīn.","Their business model is very innovative."],
    ["客单价","kèdānjià","average order value","这个季度客单价上升了。","Zhège jìdù kèdānjià shàngshēng le.","Average order value went up this quarter."],
  ],
  social: [
    ["请客","qǐngkè","to treat someone","今天我请客。","Jīntiān wǒ qǐngkè.","It's on me today."],
    ["客气","kèqì","polite / formal","别客气。","Bié kèqì.","Don't be so polite."],
    ["麻烦","máfan","to trouble someone","麻烦你了。","Máfan nǐ le.","Sorry to trouble you."],
    ["关系","guānxi","connections / relationship","他们关系很好。","Tāmen guānxi hěn hǎo.","They have a good relationship."],
    ["敬酒","jìngjiǔ","to toast (offer a drink)","他过来敬酒了。","Tā guòlái jìngjiǔ le.","He came over to offer a toast."],
    ["干杯","gānbēi","cheers / bottoms up","来，干杯！","Lái, gānbēi!","Come on, cheers!"],
    ["随礼","suílǐ","to give a monetary gift","结婚要随礼。","Jiéhūn yào suílǐ.","You give a monetary gift at weddings."],
    ["送礼","sònglǐ","to give a gift","中国人很讲究送礼。","Zhōngguórén hěn jiǎngjiu sònglǐ.","Chinese people take gift-giving seriously."],
    ["人情","rénqíng","favor / social obligation","这是个人情。","Zhè shì gè rénqíng.","This is a favor I owe."],
    ["面子","miànzi","face (social standing)","别让他丢面子。","Bié ràng tā diū miànzi.","Don't make him lose face."],
    ["给面子","gěi miànzi","to give face","谢谢你给我面子。","Xièxie nǐ gěi wǒ miànzi.","Thanks for giving me face."],
    ["熟人","shúrén","acquaintance","这里都是熟人。","Zhèlǐ dōu shì shúrén.","Everyone here is an acquaintance."],
    ["陌生人","mòshēngrén","stranger","别跟陌生人说话。","Bié gēn mòshēngrén shuōhuà.","Don't talk to strangers."],
    ["寒暄","hánxuān","small talk","他们先寒暄了几句。","Tāmen xiān hánxuān le jǐ jù.","They made small talk first."],
    ["加微信","jiā Wēixìn","to add on WeChat","加一下微信吧。","Jiā yíxià Wēixìn ba.","Let's add each other on WeChat."],
    ["朋友圈","péngyǒuquān","WeChat Moments","他发了朋友圈。","Tā fā le péngyǒuquān.","He posted to WeChat Moments."],
    ["点赞","diǎnzàn","to like (a post)","记得给我点赞。","Jìde gěi wǒ diǎnzàn.","Remember to like my post."],
    ["应酬","yìngchou","business socializing","今晚有个应酬。","Jīnwǎn yǒu gè yìngchou.","There's a business dinner tonight."],
    ["饭局","fànjú","dinner gathering","这周有两个饭局。","Zhè zhōu yǒu liǎng gè fànjú.","There are two dinner gatherings this week."],
    ["聚餐","jùcān","group meal","周五团队聚餐。","Zhōuwǔ tuánduì jùcān.","The team is having a group meal on Friday."],
    ["聚会","jùhuì","get-together","周末有个朋友聚会。","Zhōumò yǒu gè péngyou jùhuì.","There's a friends' get-together this weekend."],
    ["派对","pàiduì","party","公司办了一个派对。","Gōngsī bàn le yí gè pàiduì.","The company threw a party."],
    ["客人","kèrén","guest","客人马上就到了。","Kèrén mǎshàng jiù dào le.","The guests will arrive soon."],
    ["主人","zhǔrén","host","主人很热情。","Zhǔrén hěn rèqíng.","The host is very warm and welcoming."],
    ["招待","zhāodài","to host / entertain","谢谢你的招待。","Xièxie nǐ de zhāodài.","Thank you for your hospitality."],
    ["热情","rèqíng","warm / enthusiastic","大家都很热情。","Dàjiā dōu hěn rèqíng.","Everyone was very warm and welcoming."],
    ["客套话","kètàohuà","polite formalities","这不是客套话。","Zhè búshì kètàohuà.","This isn't just polite formality."],
    ["互相认识","hùxiāng rènshi","to get to know each other","我们互相认识一下吧。","Wǒmen hùxiāng rènshi yíxià ba.","Let's get to know each other."],
    ["名片","míngpiàn","business card","这是我的名片。","Zhè shì wǒ de míngpiàn.","This is my business card."],
    ["交换名片","jiāohuàn míngpiàn","to exchange business cards","我们交换一下名片吧。","Wǒmen jiāohuàn yíxià míngpiàn ba.","Let's exchange business cards."],
    ["人脉","rénmài","network / connections","他人脉很广。","Tā rénmài hěn guǎng.","He has a wide network of connections."],
    ["拉近关系","lājìn guānxi","to build closer ties","吃饭能拉近关系。","Chīfàn néng lājìn guānxi.","Eating together helps build closer ties."],
    ["套近乎","tào jìnhu","to get friendly (with someone)","他老是跟领导套近乎。","Tā lǎoshì gēn lǐngdǎo tào jìnhu.","He's always trying to get chummy with the boss."],
    ["敬语","jìngyǔ","honorific / polite language","对长辈要用敬语。","Duì zhǎngbèi yào yòng jìngyǔ.","You should use polite language with elders."],
    ["长辈","zhǎngbèi","elder","要尊重长辈。","Yào zūnzhòng zhǎngbèi.","You should respect your elders."],
    ["晚辈","wǎnbèi","younger generation","晚辈要主动打招呼。","Wǎnbèi yào zhǔdòng dǎ zhāohu.","The younger generation should greet elders first."],
    ["冷场","lěngchǎng","awkward silence","气氛突然冷场了。","Qìfēn tūrán lěngchǎng le.","The atmosphere suddenly went quiet and awkward."],
    ["活跃气氛","huóyuè qìfēn","to liven up the mood","他很会活跃气氛。","Tā hěn huì huóyuè qìfēn.","He's good at livening up the mood."],
    ["主动","zhǔdòng","proactive","要主动一点。","Yào zhǔdòng yìdiǎn.","You should be more proactive."],
    ["内向","nèixiàng","introverted","我性格比较内向。","Wǒ xìnggé bǐjiào nèixiàng.","I'm a fairly introverted person."],
    ["外向","wàixiàng","extroverted","她性格很外向。","Tā xìnggé hěn wàixiàng.","She's a very extroverted person."],
    ["圈子","quānzi","social circle","我们不是一个圈子的。","Wǒmen búshì yí gè quānzi de.","We're not in the same social circle."],
    ["随和","suíhe","easygoing","他人很随和。","Tā rén hěn suíhe.","He's a very easygoing person."],
    ["打招呼","dǎ zhāohu","to greet","记得跟大家打招呼。","Jìde gēn dàjiā dǎ zhāohu.","Remember to greet everyone."],
    ["告辞","gàocí","to take one's leave","我先告辞了。","Wǒ xiān gàocí le.","I'll take my leave now."],
  ],
};

const seedFor = (topicId) =>
  (SEED[topicId] || []).map((w) => ({
    hanzi: w[0], pinyin: w[1], en: w[2], sZh: w[3], sPy: w[4], sEn: w[5], topicId,
  }));

/* Each topic's "mastered" target is its actual bank size (they range from
   ~30 to ~80 words/phrases/idioms depending on topic), not a flat number. */
const targetFor = (topicId) => (SEED[topicId] || []).length || 30;

/* ---------------- helpers ---------------- */
const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
/* Local-calendar-day helpers. Date.toISOString()/Date.now() are UTC-based,
   which silently mis-attributes early-morning sessions to the previous day
   for anyone east of UTC (e.g. Singapore, UTC+8) — that mismatch is what
   was causing the streak to falsely reset even after practicing daily. */
const localDayShift = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};
const todayStr = () => localDayShift().toISOString().slice(0, 10);
const dayNum = () => Math.floor(localDayShift().getTime() / 86400000);
const INTERVALS = [0, 1, 2, 4, 8, 16];
const MASTER_BOX = 4;
const TOPIC_ROW_CLS = "bp-btn w-full text-left rounded-[22px] p-4 flex items-center gap-3.5";
const TOPIC_TARGET = 30; // fallback "mastered" target for a topic with no static bank (see targetFor)

/* "Mastered" is strict: the box must be high AND the word answered
   correctly on 3 separate days. Same-day cramming can't fake it —
   only recall that survives sleep counts as long-term memory. */
const DAYS_TO_MASTER = 3;
const isMastered = (c) => c.known || (c.box >= MASTER_BOX && (c.days || []).length >= DAYS_TO_MASTER);
/* A leech is a word you keep missing — these eat your accuracy. */
const isLeech = (c) => !c.known && (c.misses || 0) >= 4 && c.box <= 2;

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

function shade(hex, amt) {
  const n = parseInt((hex || "#6FA3D8").replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const variantFor = (card) => {
  const box = card.box || 0;
  const inSentence = card.sZh && card.sZh.includes(card.hanzi);
  if (box <= 1) return Math.random() < 0.5 ? "zh2en" : "en2zh";
  if (box <= 3) {
    const r = Math.random();
    if (r < 0.45) return "en2zh";
    if (r < 0.75 && inSentence) return "cloze";
    return "audio";
  }
  const r = Math.random();
  if (r < 0.5 && inSentence) return "cloze";
  if (r < 0.8) return "audio";
  return "en2zh";
};

/* ---------------- pinyin syllable splitter (for ruby text) ---------------- */
const VOWELS = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜêAEIOUÜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ";
const isVowel = (c) => VOWELS.includes(c);

function splitSyllables(word) {
  const chars = [...word];
  const out = [];
  let cur = "";
  for (let i = 0; i < chars.length; i++) {
    cur += chars[i];
    if (!isVowel(chars[i])) continue;
    let j = i + 1;
    while (j < chars.length && isVowel(chars[j])) { cur += chars[j]; j++; }
    const rest = chars.slice(j).join("").toLowerCase();
    if (/^ng/.test(rest) && !isVowel(rest[2] || "")) { cur += chars[j] + chars[j + 1]; j += 2; }
    else if (/^n/.test(rest) && !isVowel(rest[1] || "")) { cur += chars[j]; j += 1; }
    else if (/^r$/.test(rest)) { cur += chars[j]; j += 1; }
    out.push(cur); cur = ""; i = j - 1;
  }
  if (cur) { if (out.length) out[out.length - 1] += cur; else out.push(cur); }
  return out;
}

const PUNCT = "，。！？、；：“”‘’（）《》…—,.!?;:()\"' ";
const isHan = (c) => /[\u4e00-\u9fff]/.test(c);

/* Pairs each Chinese character with its pinyin syllable. */
function zipRuby(zh, pinyin) {
  if (!zh || !pinyin) return null;
  const sylls = pinyin.split(/\s+/).flatMap((w) => {
    const core = w.replace(/[.,!?;:"'“”‘’]/g, "");
    return core ? splitSyllables(core) : [];
  });
  const chars = [...zh];
  const hanCount = chars.filter(isHan).length;
  if (hanCount !== sylls.length) return null; // mismatch → caller falls back
  let k = 0;
  return chars.map((c, i) => ({
    zh: c,
    py: isHan(c) ? sylls[k++] : "",
    key: i,
  }));
}

/* ---------------- sound ---------------- */
let audioCtx = null;
const actx = () => {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  /* Browsers auto-suspend an idle AudioContext to save power, and a
     suspended context adds an audible wake-up lag the next time it's used —
     resuming here on every play call keeps that gap from creeping back in. */
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

const click = (on) => {
  if (!on) return;
  const c = actx(); if (!c) return;
  const t = c.currentTime;
  const buf = c.createBuffer(1, 1200, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 8);
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2300; bp.Q.value = 1.2;
  const g = c.createGain(); g.gain.setValueAtTime(0.26, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(bp).connect(g).connect(c.destination); src.start(t); src.stop(t + 0.06);
  const o = c.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(185, t);
  o.frequency.exponentialRampToValueAtTime(88, t + 0.05);
  const g2 = c.createGain(); g2.gain.setValueAtTime(0.15, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  o.connect(g2).connect(c.destination); o.start(t); o.stop(t + 0.07);
};

const ding = (on) => {
  if (!on) return;
  const c = actx(); if (!c) return;
  const t = c.currentTime;
  [880, 1320].forEach((f, i) => {
    const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t + i * 0.07);
    g.gain.linearRampToValueAtTime(0.2, t + i * 0.07 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.32);
    o.connect(g).connect(c.destination); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.34);
  });
};

/* bright arcade-style "correct answer" chime — punchy square-wave arpeggio
   with a sparkle overtone, distinct from the softer `ding` and the
   session-complete `fanfare`. */
const chime = (on) => {
  if (!on) return;
  const c = actx(); if (!c) return;
  const t = c.currentTime;
  [784, 988, 1319].forEach((f, i) => {
    const o = c.createOscillator(); o.type = "square"; o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t + i * 0.055);
    g.gain.linearRampToValueAtTime(0.16, t + i * 0.055 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.055 + 0.22);
    o.connect(g).connect(c.destination); o.start(t + i * 0.055); o.stop(t + i * 0.055 + 0.24);
  });
  const sp = c.createOscillator(); sp.type = "triangle"; sp.frequency.value = 1976;
  const gs = c.createGain();
  gs.gain.setValueAtTime(0, t + 0.11);
  gs.gain.linearRampToValueAtTime(0.1, t + 0.12);
  gs.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  sp.connect(gs).connect(c.destination); sp.start(t + 0.11); sp.stop(t + 0.34);
};

const buzz = (on) => {
  if (!on) return;
  const c = actx(); if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator(); o.type = "square"; o.frequency.setValueAtTime(150, t);
  o.frequency.linearRampToValueAtTime(95, t + 0.18);
  const g = c.createGain(); g.gain.setValueAtTime(0.13, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.21);
  if (navigator.vibrate) navigator.vibrate(60);
};

const fanfare = (on) => {
  if (!on) return;
  const c = actx(); if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => {
    const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t + i * 0.09);
    g.gain.linearRampToValueAtTime(0.18, t + i * 0.09 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.4);
    o.connect(g).connect(c.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.42);
  });
};

/* --- speech: pick the most natural available Mandarin voice --- */
let cachedVoice = null;
const PREFERRED = ["Tingting", "Ting-Ting", "Meijia", "Sinji", "Li-mu", "Yu-shu",
  "Google 普通话", "Google Mandarin", "Xiaoxiao", "Yaoyao", "Huihui", "Kangkang", "Siri"];

function pickVoice() {
  if (cachedVoice) return cachedVoice;
  if (!window.speechSynthesis) return null;
  const vs = window.speechSynthesis.getVoices().filter((v) => /^(zh|cmn)/i.test(v.lang || ""));
  if (!vs.length) return null;
  for (const p of PREFERRED) {
    const m = vs.find((v) => (v.name || "").toLowerCase().includes(p.toLowerCase()));
    if (m) { cachedVoice = m; return m; }
  }
  const cn = vs.find((v) => /zh[-_]?CN|Hans/i.test(v.lang)) || vs[0];
  cachedVoice = cn;
  return cn;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickVoice(); };
}

function speak(text, { slow = false } = {}) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = slow ? 0.72 : 1.0;   // natural pace, not sluggish
  u.pitch = 1.12;               // slightly brighter = more energetic
  u.volume = 1;
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

/* ---------------- ruby text component ---------------- */
function Ruby({ zh, pinyin, size = 30, pySize = 12, color, sub, center = true, gapClass = "gap-x-1 gap-y-2" }) {
  const pairs = zipRuby(zh, pinyin);
  if (!pairs) {
    return (
      <div className={center ? "text-center" : ""}>
        <div className="disp font-bold leading-snug" style={{ fontSize: size }}>{zh}</div>
        <div className="font-extrabold mt-1" style={{ fontSize: pySize + 1, color }}>{pinyin}</div>
      </div>
    );
  }
  return (
    <div className={`flex flex-wrap ${gapClass} ${center ? "justify-center" : ""} items-end`}>
      {pairs.map((p) => (
        <div key={p.key} className="flex flex-col items-center leading-none">
          <span className="font-extrabold" style={{ fontSize: pySize, color, minHeight: p.py ? undefined : 0, marginBottom: p.py ? 3 : 0 }}>
            {p.py}
          </span>
          <span className="disp font-bold" style={{ fontSize: size, color: sub }}>{p.zh}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- mascot ---------------- */
function Panda({ size = 96, mood = "happy" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <ellipse cx="26" cy="30" rx="14" ry="14" fill="#33566E" />
      <ellipse cx="94" cy="30" rx="14" ry="14" fill="#33566E" />
      <ellipse cx="26" cy="30" rx="7" ry="7" fill="#6FA3D8" opacity=".5" />
      <ellipse cx="94" cy="30" rx="7" ry="7" fill="#6FA3D8" opacity=".5" />
      <ellipse cx="60" cy="62" rx="42" ry="38" fill="#E3EEF9" />
      <ellipse cx="38" cy="55" rx="13" ry="15" fill="#6FA3D8" transform="rotate(-12 38 55)" />
      <ellipse cx="82" cy="55" rx="13" ry="15" fill="#6FA3D8" transform="rotate(12 82 55)" />
      {mood === "happy" ? (
        <>
          <circle cx="38" cy="56" r="5.5" fill="#0B1B33" />
          <circle cx="82" cy="56" r="5.5" fill="#0B1B33" />
          <circle cx="40" cy="54" r="2" fill="#fff" />
          <circle cx="84" cy="54" r="2" fill="#fff" />
        </>
      ) : (
        <>
          <path d="M32 56 q6 -6 12 0" stroke="#0B1B33" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M76 56 q6 -6 12 0" stroke="#0B1B33" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="60" cy="72" rx="6" ry="4.5" fill="#0B1B33" />
      <path d="M52 82 q8 8 16 0" stroke="#0B1B33" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="47" cy="70" rx="5" ry="3.5" fill="#FFB3C1" opacity=".55" />
      <ellipse cx="73" cy="70" rx="5" ry="3.5" fill="#FFB3C1" opacity=".55" />
    </svg>
  );
}

/* ============================================================ */
export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState("home");
  const [state, setState] = useState({
    streak: 0, lastDay: null, todayDate: todayStr(), todayCount: 0,
    cards: {}, topics: {}, customTopics: [], pool: {}, curriculum: {}, flags: {}, notes: [], onboarded: false,
    settings: { burst: 10, dark: false, sound: true, goal: 10, szDate: "2027-01-01", fontZh: "ZCOOL XiaoWei", fontEn: "Space Grotesk" },
    recent: [],
  });
  const stateRef = useRef(state);
  const [authUser, setAuthUser] = useState(null); // { uid, name, email, photo }
  const profileRef = useRef(null); // holds the Firebase uid once signed in
  const lastPushedRef = useRef(null); // last payload we pushed, to ignore our own snapshot echo
  const cloudSaveTimer = useRef(null);
  const pendingWriteRef = useRef(null); // { uid, payload } waiting on the debounce timer
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [mode, setMode] = useState("learn");
  const [queue, setQueue] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ right: 0, wrong: 0, learned: 0 });
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [sheet, setSheet] = useState(null); // 'help' | 'add'
  const [flash, setFlash] = useState(null); // { deck, mode }

  const s = state.settings;
  const dark = s.dark;

  useEffect(() => { stateRef.current = state; }, [state]);

  const applySave = (saved) => {
    const t = todayStr();
    if (saved.lastDay && saved.lastDay !== t) {
      const gap = (new Date(t) - new Date(saved.lastDay)) / 86400000;
      if (gap > 1) saved.streak = 0;
    }
    if (saved.todayDate !== t) { saved.todayDate = t; saved.todayCount = 0; }
    setState((p) => {
      const base = { streak: 0, lastDay: null, todayDate: t, todayCount: 0, cards: {}, topics: {},
        customTopics: [], pool: {}, curriculum: {}, flags: {}, notes: [], hidden: [], onboarded: false, recent: [], settings: p.settings };
      const merged = { ...base, ...saved, settings: { ...p.settings, ...(saved.settings || {}) } };
      merged.settings.goal = merged.settings.burst;
      stateRef.current = merged;
      return merged;
    });
    return saved;
  };

  /* Auth is the source of truth for "which save file". On sign-in we pull
     the cloud copy (or migrate a pre-sync local save up on first sign-in),
     then keep listening for changes pushed from other devices. */
  useEffect(() => {
    let unsubSnap = null;
    consumeRedirectResult().catch(() => {});

    const unsubAuth = watchAuth(async (user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }

      if (!user) {
        profileRef.current = null;
        setAuthUser(null);
        setScreen("signin");
        setReady(true);
        return;
      }

      const uid = user.uid;
      profileRef.current = uid;
      setAuthUser({ uid, name: user.displayName, email: user.email, photo: user.photoURL });

      // instant paint from this device's cache while the cloud fetch is in flight
      try {
        const cached = localStorage.getItem(keyFor(uid));
        if (cached) applySave(JSON.parse(cached));
      } catch (e) {}

      let cloud = null;
      try { cloud = firebaseReady ? await fetchCloudSave(uid) : null; } catch (e) {}

      if (cloud && cloud.save) {
        const parsed = JSON.parse(cloud.save);
        lastPushedRef.current = cloud.save;
        const saved = applySave(parsed);
        if (!saved.onboarded) setSheet("help");
      } else {
        const seed = readLocalSeed();
        const saved = applySave(seed || {});
        if (!seed) setSheet("help");
        if (firebaseReady) {
          const payload = JSON.stringify(saved);
          lastPushedRef.current = payload;
          writeCloudSave(uid, { save: payload, updatedAt: Date.now() }).catch(() => {});
        }
      }

      setScreen("home");
      setReady(true);

      if (firebaseReady) {
        unsubSnap = watchCloudSave(uid, (data) => {
          if (!data || !data.save || data.save === lastPushedRef.current) return;
          try {
            lastPushedRef.current = data.save;
            applySave(JSON.parse(data.save));
          } catch (e) {}
        });
      }
    });

    pickVoice();
    return () => { unsubAuth && unsubAuth(); if (unsubSnap) unsubSnap(); };
  }, []);

  /* Sends whatever cloud write is currently waiting on the debounce timer,
     right now, instead of waiting out the delay. Used when the app is about
     to be backgrounded/closed — otherwise a session finished right before
     switching away could lose its last few seconds of progress (streak
     included) because the debounce timer never gets to fire. */
  const flushCloudSave = useCallback(() => {
    if (!pendingWriteRef.current) return;
    clearTimeout(cloudSaveTimer.current);
    const { uid, payload } = pendingWriteRef.current;
    pendingWriteRef.current = null;
    lastPushedRef.current = payload;
    writeCloudSave(uid, { save: payload, updatedAt: Date.now() }).catch(() => {});
  }, []);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flushCloudSave(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushCloudSave);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushCloudSave);
    };
  }, [flushCloudSave]);

  /* functional update — avoids stale-state bugs on rapid taps */
  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev);
      stateRef.current = next;
      if (profileRef.current) {
        try { localStorage.setItem(keyFor(profileRef.current), JSON.stringify(next)); } catch (e) {}
        if (firebaseReady) {
          clearTimeout(cloudSaveTimer.current);
          const uid = profileRef.current;
          const payload = JSON.stringify(next);
          pendingWriteRef.current = { uid, payload };
          cloudSaveTimer.current = setTimeout(() => {
            pendingWriteRef.current = null;
            lastPushedRef.current = payload;
            writeCloudSave(uid, { save: payload, updatedAt: Date.now() }).catch(() => {});
          }, 400);
        }
      }
      return next;
    });
  }, []);

  const allTopics = [
    ...CORE_TOPICS.filter((t) => !(state.hidden || []).includes(t.id)),
    ...(state.customTopics || []),
  ];
  const topicById = (id) => allTopics.find((t) => t.id === id) || [...LIBRARY, ...CORE_TOPICS].find((t) => t.id === id) || CORE_TOPICS[0];

  /* Every topic's full word list ships baked into the app (see seedFor) —
     no network call needed to teach or browse a topic. */
  const availableWords = (topicId) => {
    const st = stateRef.current;
    const seen = new Set(Object.values(st.cards).filter((c) => c.topicId === topicId).map((c) => c.hanzi));
    return seedFor(topicId).filter((w) => !seen.has(w.hanzi));
  };

  const openDict = (topic) => {
    click(s.sound);
    setActiveTopic(topic);
    setScreen("dict");
    if (!((stateRef.current.curriculum || {})[topic.id] || []).length) {
      update((prev) => ({ ...prev, curriculum: { ...(prev.curriculum || {}), [topic.id]: seedFor(topic.id) } }));
    }
  };

  const openTopic = (topic) => {
    click(s.sound);
    setActiveTopic(topic);
    setMode("learn");
    const tState = stateRef.current.topics[topic.id] || {};
    if (!tState.triaged) {
      const words = availableWords(topic.id).slice(0, 10);
      if (!words.length) { setBanner("You've already met every word in this topic! Check back once review words are due."); setActiveTopic(null); return; }
      setQueue(words.map((w) => ({ type: "triage", word: w })));
      setQIndex(0);
      setScreen("triage");
    } else {
      buildSession(topic);
    }
  };

  const buildSession = (topic) => {
    const burst = stateRef.current.settings.burst;
    const d = dayNum();
    const all = Object.values(stateRef.current.cards).filter((c) => !c.known);
    const dueHere = shuffle(all.filter((c) => c.topicId === topic.id && c.due <= d));
    const dueElsewhere = shuffle(all.filter((c) => c.topicId !== topic.id && c.due <= d));

    const items = [];
    dueHere.slice(0, burst).forEach((c) => items.push({ type: "quiz", word: c, variant: variantFor(c) }));

    /* interleaving: sprinkle in a couple of overdue words from earlier topics */
    const mixIn = Math.min(dueElsewhere.length, Math.max(0, Math.ceil(burst / 3)), Math.max(0, burst - items.length));
    dueElsewhere.slice(0, mixIn).forEach((c) => items.push({ type: "quiz", word: c, variant: variantFor(c) }));

    const newNeeded = Math.max(0, burst - items.length);
    if (newNeeded > 0) {
      availableWords(topic.id).slice(0, newNeeded).forEach((w) => items.push({ type: "learn", word: w }));
    }

    if (!items.length) {
      setBanner("Nothing due right now — you've learned every word in this topic! Try another topic or the Daily Quiz.");
      setActiveTopic(null);
      setScreen("home"); // otherwise the button just silently does nothing on the Done screen
      return;
    }
    setMode("learn");
    setQueue(shuffle(items));
    setQIndex(0);
    setSessionStats({ right: 0, wrong: 0, learned: 0 });
    setScreen("session");
  };

  /* A full burst-sized session, same shape as buildSession, but not tied
     to any one topic: due reviews from everywhere, new words pulled from
     whichever topics you've already started. Lets you hit today's goal
     without deciding which topic to open. */
  const buildDailyMix = () => {
    click(s.sound);
    const burst = stateRef.current.settings.burst;
    const d = dayNum();
    const all = Object.values(stateRef.current.cards).filter((c) => !c.known);
    const due = shuffle(all.filter((c) => c.due <= d));

    const items = due.slice(0, burst).map((c) => ({ type: "quiz", word: c, variant: variantFor(c) }));

    const newNeeded = Math.max(0, burst - items.length);
    if (newNeeded > 0) {
      const startedTopics = allTopics.filter((t) => (stateRef.current.topics[t.id] || {}).triaged);
      const fresh = shuffle(startedTopics.flatMap((t) => availableWords(t.id)));
      fresh.slice(0, newNeeded).forEach((w) => items.push({ type: "learn", word: w }));
    }

    if (!items.length) {
      setBanner("Nothing to review right now — start a topic first, then come back here.");
      return;
    }
    setMode("mixed");
    setActiveTopic(null);
    setQueue(shuffle(items));
    setQIndex(0);
    setSessionStats({ right: 0, wrong: 0, learned: 0 });
    setScreen("session");
  };

  /* Daily Quiz — 5 questions, only words you've actually learned,
     weighted to what's due but happy to revisit anything older. */
  const startDailyQuiz = () => {
    click(s.sound);
    const learned = Object.values(stateRef.current.cards).filter((c) => !c.known && c.seen > 0);
    if (learned.length < 5) {
      const n = 5 - learned.length;
      setBanner(`Learn ${n} more word${n === 1 ? "" : "s"} to unlock the quiz.`);
      return;
    }
    const d = dayNum();
    const leeches = shuffle(learned.filter(isLeech));
    const due = shuffle(learned.filter((c) => c.due <= d && !isLeech(c)));
    const older = shuffle(learned.filter((c) => c.due > d && !isLeech(c)));
    const picked = shuffle([...leeches, ...due, ...older].slice(0, 5));
    setMode("quiz");
    setActiveTopic(null);
    setQueue(picked.map((c) => ({ type: "quiz", word: c, variant: variantFor(c) })));
    setQIndex(0);
    setSessionStats({ right: 0, wrong: 0, learned: 0 });
    setScreen("session");
  };

  /* save a newly-taught word so it exists in the word bank right away */
  const addCard = (word) => {
    update((prev) => {
      if (prev.cards[word.hanzi]) return prev;
      return {
        ...prev,
        cards: { ...prev.cards, [word.hanzi]: { ...word, box: 0, seen: 0, starred: !!(prev.flags || {})[word.hanzi], known: false, due: dayNum() } },
      };
    });
  };

  const recordAnswer = (word, correct) => {
    update((prev) => {
      const next = { ...prev, cards: { ...prev.cards } };
      const prevCard = next.cards[word.hanzi] || { ...word, box: 0, seen: 0, starred: !!(next.flags || {})[word.hanzi], known: false, days: [], misses: 0 };
      const box = correct ? Math.min(5, prevCard.box + 1) : Math.max(0, prevCard.box - 1);
      const days = correct ? Array.from(new Set([...(prevCard.days || []), dayNum()])) : (prevCard.days || []);
      next.cards[word.hanzi] = {
        ...prevCard, ...word, box, days,
        misses: (prevCard.misses || 0) + (correct ? 0 : 1),
        seen: prevCard.seen + 1, due: dayNum() + INTERVALS[box],
      };
      next.recent = [...(next.recent || []), correct ? 1 : 0].slice(-20);
      const t = todayStr();
      if (next.todayDate !== t) { next.todayDate = t; next.todayCount = 0; }
      next.todayCount += 1;
      if (next.todayCount >= next.settings.goal && next.lastDay !== t) {
        next.lastDay = t;
        next.streak = (next.streak || 0) + 1;
        setTimeout(() => setBanner(`Day ${next.streak} streak locked in!`), 10);
      }
      return next;
    });
  };

  const markKnown = (word) => {
    update((prev) => ({
      ...prev,
      cards: { ...prev.cards, [word.hanzi]: { ...word, box: 5, seen: 1, known: true, starred: false, due: dayNum() + 30 } },
    }));
  };

  /* Stars live in their own map so you can flag a word in the dictionary
     long before it becomes a card. Cards mirror the flag when they exist. */
  const toggleStar = (hanzi) => {
    update((prev) => {
      const flags = { ...(prev.flags || {}) };
      const on = !flags[hanzi];
      if (on) flags[hanzi] = true; else delete flags[hanzi];
      const cards = prev.cards[hanzi]
        ? { ...prev.cards, [hanzi]: { ...prev.cards[hanzi], starred: on } }
        : prev.cards;
      return { ...prev, flags, cards };
    });
  };

  const removeCard = (hanzi) => {
    update((prev) => {
      const cards = { ...prev.cards };
      delete cards[hanzi];
      return { ...prev, cards };
    });
  };

  const addTopic = (t) => {
    update((prev) => {
      const isCore = CORE_TOPICS.some((x) => x.id === t.id);
      if (isCore) return { ...prev, hidden: (prev.hidden || []).filter((id) => id !== t.id) };
      if ([...CORE_TOPICS, ...(prev.customTopics || [])].some((x) => x.id === t.id)) return prev;
      return { ...prev, customTopics: [...(prev.customTopics || []), t] };
    });
    setBanner(`${t.name} added to your line`);
  };

  const deleteTopic = (t) => {
    if (allTopics.length <= 1) { setBanner("Keep at least one topic."); return; }
    update((prev) => {
      const isCustom = (prev.customTopics || []).some((x) => x.id === t.id);
      return {
        ...prev,
        customTopics: isCustom ? prev.customTopics.filter((x) => x.id !== t.id) : (prev.customTopics || []),
        hidden: isCustom ? (prev.hidden || []) : [...(prev.hidden || []), t.id],
      };
    });
    setBanner(`${t.name} removed — your words are safe in the Word bank`);
  };

  const createNote = () => {
    const id = "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    update((prev) => ({ ...prev, notes: [{ id, title: "", html: "", updatedAt: Date.now() }, ...(prev.notes || [])] }));
    setActiveNoteId(id);
    setScreen("noteEditor");
  };

  const saveNote = (id, patch) => {
    update((prev) => ({
      ...prev,
      notes: (prev.notes || []).map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    }));
  };

  const deleteNote = (id) => {
    update((prev) => ({ ...prev, notes: (prev.notes || []).filter((n) => n.id !== id) }));
    setActiveNoteId(null);
    setScreen("notes");
  };

  const T = dark
    ? { bg: "#12202E", card: "#1C2E40", text: "#E3EEF9", sub: "#8FA9BE", line: "#2C4258", chip: "#223447", hero: "linear-gradient(140deg,#3E6D9C,#6FA3D8 60%,#96C2E8)" }
    : { bg: "#EAF3FB", card: "#FFFFFF", text: "#2E4258", sub: "#6E8AA3", line: "#D3E4F2", chip: "#E3EEF9", hero: "linear-gradient(140deg,#6FA3D8,#96C2E8 60%,#C7E0F5)" };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#EAF3FB" }}>
        <div style={{ width: 38, height: 38, border: "4px solid #D3E4F2", borderTopColor: "#6FA3D8", borderRadius: "50%", animation: "bpSpin .8s linear infinite" }} />
        <style>{`@keyframes bpSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const doSignIn = async () => {
    click(s.sound);
    try { await signInWithGoogle(); } catch (e) { setBanner("Couldn't sign in — try again."); }
  };

  const doSignOut = async () => {
    click(s.sound);
    try { await signOutUser(); setBanner("Signed out"); } catch (e) { setBanner("Couldn't sign out."); }
  };

  const shared = { state, update, T, dark, s, click: () => click(s.sound), setScreen, setBanner, topicById, authUser };

  return (
    <div className="min-h-screen w-full" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=ZCOOL+KuaiLe&family=ZCOOL+QingKe+HuangYou&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;700&family=Ma+Shan+Zheng&family=Long+Cang&family=Liu+Jian+Mao+Cao&family=Zhi+Mang+Xing&family=Space+Grotesk:wght@400;500;600;700&family=Nunito:wght@600;800&family=Quicksand:wght@500;700&family=Poppins:wght@400;600;700&family=Outfit:wght@400;600;700&family=Plus+Jakarta+Sans:wght@500;700&family=DM+Sans:wght@400;700&family=Figtree:wght@500;700&family=Manrope:wght@500;700&family=Fredoka:wght@400;600&family=Baloo+2:wght@500;700&display=swap');
        #bp, #bp * { font-family: var(--font-en, 'Space Grotesk'), var(--font-zh, 'ZCOOL XiaoWei'), system-ui, sans-serif; -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        #bp .disp { font-family: var(--font-zh, 'ZCOOL XiaoWei'), var(--font-en, 'Space Grotesk'), serif; letter-spacing: .01em; }
        @keyframes bpPop { 0%{transform:scale(.92);opacity:0} 60%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
        @keyframes bpShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes bpBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes bpRise { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes bpUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes bpFall { 0%{transform:translateY(-10vh) rotate(0)} 100%{transform:translateY(105vh) rotate(540deg)} }
        @keyframes bpSpin { to{transform:rotate(360deg)} }
        @keyframes bpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .bp-pop{animation:bpPop .28s cubic-bezier(.2,1.4,.4,1) both}
        .bp-shake{animation:bpShake .4s both}
        .bp-bounce{animation:bpBounce 1.4s ease-in-out infinite}
        .bp-rise{animation:bpRise .3s ease-out both}
        .bp-up{animation:bpUp .28s cubic-bezier(.2,.9,.3,1) both}
        .bp-float{animation:bpFloat 3s ease-in-out infinite}
        .bp-btn{transition:transform .07s ease, box-shadow .07s ease, filter .07s ease}
        .bp-btn:active{transform:translateY(4px)!important;box-shadow:0 0 0 transparent!important;filter:brightness(.97)}
        .stagger > * { animation: bpRise .35s ease-out both; }
        .stagger > *:nth-child(1){animation-delay:.02s}.stagger > *:nth-child(2){animation-delay:.06s}
        .stagger > *:nth-child(3){animation-delay:.1s}.stagger > *:nth-child(4){animation-delay:.14s}
        @media (prefers-reduced-motion: reduce){ *{animation:none!important} }

        /* arbitrary-value utilities, hand-compiled (no Tailwind JIT here) */
        .w-\\[52px\\]{width:52px}
        .h-\\[52px\\]{height:52px}
        .h-\\[28px\\]{height:28px}
        .h-\\[2px\\]{height:2px}
        .h-\\[46px\\]{height:46px}
        .h-\\[5px\\]{height:5px}
        .h-\\[76px\\]{height:76px}
        .h-\\[7px\\]{height:7px}
        .left-\\[-15px\\]{left:-15px}
        .left-\\[-26px\\]{left:-26px}
        .max-h-\\[88vh\\]{max-height:88vh}
        .pl-\\[26px\\]{padding-left:26px}
        .rounded-\\[22px\\]{border-radius:22px}
        .rounded-\\[24px\\]{border-radius:24px}
        .rounded-\\[26px\\]{border-radius:26px}
        .rounded-\\[28px\\]{border-radius:28px}
        .rounded-\\[30px\\]{border-radius:30px}
        .rounded-\\[32px\\]{border-radius:32px}
        .rounded-\\[34px\\]{border-radius:34px}
        .rounded-t-\\[30px\\]{border-top-left-radius:30px;border-top-right-radius:30px}
        .text-\\[10\\.5px\\]{font-size:10.5px}
        .text-\\[10px\\]{font-size:10px}
        .text-\\[11\\.5px\\]{font-size:11.5px}
        .text-\\[11px\\]{font-size:11px}
        .text-\\[12\\.5px\\]{font-size:12.5px}
        .text-\\[12px\\]{font-size:12px}
        .text-\\[13\\.5px\\]{font-size:13.5px}
        .text-\\[13px\\]{font-size:13px}
        .text-\\[14\\.5px\\]{font-size:14.5px}
        .text-\\[14px\\]{font-size:14px}
        .text-\\[15\\.5px\\]{font-size:15.5px}
        .text-\\[15px\\]{font-size:15px}
        .text-\\[16px\\]{font-size:16px}
        .text-\\[17px\\]{font-size:17px}
        .text-\\[18px\\]{font-size:18px}
        .text-\\[19px\\]{font-size:19px}
        .text-\\[21px\\]{font-size:21px}
        .text-\\[22px\\]{font-size:22px}
        .text-\\[24px\\]{font-size:24px}
        .text-\\[26px\\]{font-size:26px}
        .text-\\[27px\\]{font-size:27px}
        .text-\\[28px\\]{font-size:28px}
        .text-\\[32px\\]{font-size:32px}
        .text-\\[52px\\]{font-size:52px}
        .text-\\[9\\.5px\\]{font-size:9.5px}
        .text-\\[9px\\]{font-size:9px}
        .top-\\[14px\\]{top:14px}
        .tracking-\\[\\.12em\\]{letter-spacing:.12em}
        .tracking-\\[\\.14em\\]{letter-spacing:.14em}
        .tracking-\\[\\.15em\\]{letter-spacing:.15em}
        .tracking-\\[\\.16em\\]{letter-spacing:.16em}
        .w-\\[28px\\]{width:28px}
        .w-\\[46px\\]{width:46px}
        .w-\\[6px\\]{width:6px}
        .w-\\[76px\\]{width:76px}
        .z-\\[55\\]{z-index:55}
        .z-\\[60\\]{z-index:60}

      `}</style>

      <div id="bp" lang="zh-CN" className="max-w-md mx-auto pb-28 px-4"
        style={{ "--font-zh": `'${s.fontZh || "ZCOOL XiaoWei"}'`, "--font-en": `'${s.fontEn || "Space Grotesk"}'` }}>
        {banner && <Banner text={banner} onClose={() => setBanner(null)} />}

        {loading && <LoadingOverlay T={T} />}

        {screen === "signin" && (
          <SignIn T={T} dark={dark} firebaseReady={firebaseReady} onGoogle={doSignIn} />
        )}
        {screen === "home" && (
          <Home {...shared} allTopics={allTopics} onTopic={openTopic} onQuiz={startDailyQuiz} onDailyMix={buildDailyMix}
            onDeleteTopic={deleteTopic} onDict={openDict}
            onMatch={() => { click(s.sound); setScreen("match"); }}
            onHelp={() => { click(s.sound); setSheet("help"); }}
            onAdd={() => { click(s.sound); setSheet("add"); }} />
        )}
        {screen === "triage" && (
          <Triage {...shared} topic={activeTopic} queue={queue} qIndex={qIndex} setQIndex={setQIndex}
            markKnown={markKnown}
            onDone={() => {
              update((prev) => ({ ...prev, topics: { ...prev.topics, [activeTopic.id]: { ...(prev.topics[activeTopic.id] || {}), triaged: true } } }));
              setTimeout(() => buildSession(activeTopic), 80);
            }} />
        )}
        {screen === "session" && (
          <Session {...shared} topic={activeTopic} mode={mode} queue={queue} setQueue={setQueue}
            qIndex={qIndex} setQIndex={setQIndex} stats={sessionStats} setStats={setSessionStats}
            recordAnswer={recordAnswer} markKnown={markKnown} addCard={addCard} onFinish={() => setScreen("done")} />
        )}
        {screen === "done" && (
          <Done {...shared} topic={activeTopic} mode={mode} stats={sessionStats}
            onAgain={() => (mode === "quiz" ? startDailyQuiz() : mode === "mixed" ? buildDailyMix() : buildSession(activeTopic))} />
        )}
        {screen === "dict" && activeTopic && (
          <Dictionary {...shared} topic={activeTopic} toggleStar={toggleStar}
            onFlash={(deck, mode) => { if (deck.length) { setFlash({ deck, mode }); setScreen("flash"); } else setBanner("Learn a few of these first."); }} />
        )}
        {screen === "match" && <Match {...shared} recordAnswer={recordAnswer} />}
        {screen === "flash" && flash && (
          <Flashcards {...shared} deck={flash.deck} mode={flash.mode} />
        )}
        {screen === "glossary" && (
          <Glossary {...shared} toggleStar={toggleStar} removeCard={removeCard}
            onFlash={(deck, mode) => { setFlash({ deck, mode }); setScreen("flash"); }} />
        )}
        {screen === "notes" && (
          <NotesList {...shared} notes={state.notes || []}
            onOpen={(id) => { setActiveNoteId(id); setScreen("noteEditor"); }}
            onCreate={createNote} onTechStack={() => setSheet("techstack")} />
        )}
        {screen === "noteEditor" && (state.notes || []).some((n) => n.id === activeNoteId) && (
          <NoteEditor {...shared} note={(state.notes || []).find((n) => n.id === activeNoteId)}
            onBack={() => setScreen("notes")} onSaveNote={saveNote} onDeleteNote={deleteNote} />
        )}
        {screen === "settings" && (
          <SettingsScreen {...shared} onHelp={() => setSheet("help")} onSignOut={doSignOut} />
        )}
      </div>

      {sheet === "help" && (
        <HelpSheet T={T} onClose={() => { click(s.sound); setSheet(null); update((p) => ({ ...p, onboarded: true })); }} />
      )}
      {sheet === "add" && (
        <AddTopicSheet T={T} s={s} state={state} allTopics={allTopics} onClose={() => { click(s.sound); setSheet(null); }}
          onAdd={(t) => { addTopic(t); setSheet(null); }} />
      )}
      {sheet === "techstack" && (
        <TechStackSheet T={T} dark={dark} click={() => click(s.sound)} onClose={() => { click(s.sound); setSheet(null); }} />
      )}

      {["home", "glossary", "notes", "settings"].includes(screen) && (
        <NavBar screen={screen} setScreen={(v) => { click(s.sound); setScreen(v); }} T={T} />
      )}
    </div>
  );
}

/* ---------------- shared UI ---------------- */
/* Progress here is an honest estimate, not a real byte count — the AI
   returns everything in one go, so we pace a bar against the typical
   ~18s round trip and snap to 100% the moment the words land. */
/* ---------------- TOPIC DICTIONARY ---------------- */
function Dictionary({ topic, state, T, dark, s, click, setScreen, toggleStar, onFlash }) {
  const list = (state.curriculum || {})[topic.id] || [];
  const [openTier, setOpenTier] = useState({ 0: true, 1: true, 2: true });

  const statusOf = (hanzi) => {
    const c = state.cards[hanzi];
    if (!c) return null;
    if (c.known) return { label: "known", color: "#0CA678" };
    if (isMastered(c)) return { label: "mastered", color: "#0CA678" };
    if (isLeech(c)) return { label: "trouble", color: "#FF5A5F" };
    if (c.seen > 0) return { label: "learning", color: "#6FA3D8" };
    return { label: "queued", color: T.sub };
  };

  const doneCount = list.filter((w) => { const st = statusOf(w.hanzi); return st && (st.label === "mastered" || st.label === "known"); }).length;

  const TIERS = [
    { name: "Learn these first", note: "You'll use these constantly", color: topic.color },
    { name: "Core vocabulary", note: "Fills out the topic properly", color: "#7048E8" },
    { name: "Rounding out", note: "Useful once the basics stick", color: "#0CA678" },
  ];
  const per = Math.ceil(list.length / 3) || 1;

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => { click(); setScreen("home"); }} className="bp-btn p-2.5 rounded-xl"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
          <I n="back" size={19} color={T.sub} />
        </button>
        {list.length > 0 && (
          <button onClick={() => { click(); onFlash(list.filter((w) => state.cards[w.hanzi]), "hanzi"); }}
            className="bp-btn rounded-xl px-3 py-2 font-extrabold text-[12px] flex items-center gap-1.5"
            style={{ background: "#7048E81A", color: "#7048E8", border: "2px solid #7048E844" }}>
            <I n="cards" size={15} color="#7048E8" /> Flashcard learned
          </button>
        )}
      </div>

      {/* topic head */}
      <div className="rounded-[28px] p-5 mb-5" style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 6px 0 ${topic.color}40` }}>
        <div className="flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0" style={{ background: topic.color + "1E" }}>
            <I n={topic.icon} size={26} color={topic.color} sw={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="disp font-bold text-[19px] leading-tight">{topic.name}</div>
            <div className="text-[12px] font-bold mt-0.5" style={{ color: T.sub }}>
              {list.length ? `${doneCount} of ${list.length} mastered · full word list` : "Building your word list…"}
            </div>
          </div>
        </div>
        {list.length > 0 && (
          <div className="h-[7px] rounded-full mt-3.5 overflow-hidden" style={{ background: T.chip }}>
            <div className="h-full rounded-full" style={{ width: (doneCount / list.length) * 100 + "%", background: topic.color }} />
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-[26px] p-8 text-center" style={{ background: T.card, border: `2px solid ${T.line}` }}>
          <div className="flex justify-center mb-3 opacity-60"><Panda size={64} /></div>
          <div className="font-extrabold text-[13px]" style={{ color: T.sub }}>
            Couldn't load the word list. Go back and tap the dictionary again.
          </div>
        </div>
      ) : TIERS.map((tier, ti) => {
        const words = list.slice(ti * per, (ti + 1) * per);
        if (!words.length) return null;
        const shown = openTier[ti];
        return (
          <div key={tier.name} className="mb-4">
            <button onClick={() => { click(); setOpenTier((p) => ({ ...p, [ti]: !p[ti] })); }}
              className="w-full flex items-center gap-2.5 mb-2.5 text-left">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: tier.color + "1E", color: tier.color }}>
                <span className="disp font-bold text-[13px]">{ti + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="disp font-bold text-[16px] leading-none">{tier.name}</div>
                <div className="text-[11px] font-bold mt-1" style={{ color: T.sub }}>{tier.note}</div>
              </div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full"
                style={{ background: tier.color + "1E", color: tier.color }}>{words.length}</span>
              <I n="chevron" size={17} color={T.sub}
                style={{ transform: shown ? "rotate(90deg)" : "none", transition: "transform .18s" }} />
            </button>

            {shown && (
              <div className="flex flex-col gap-2">
                {words.map((w, wi) => {
                  const rank = ti * per + wi + 1;
                  const st = statusOf(w.hanzi);
                  const flagged = !!(state.flags || {})[w.hanzi] || !!(state.cards[w.hanzi] || {}).starred;
                  return (
                    <div key={w.hanzi + rank} className="rounded-[22px] p-3.5 flex items-start gap-3"
                      style={{
                        background: T.card,
                        border: `2px solid ${flagged ? "#FFB02088" : T.line}`,
                        boxShadow: `0 3px 0 ${flagged ? "#FFB02044" : T.line}`,
                      }}>
                      <div className="disp font-bold text-[13px] w-6 text-center shrink-0 pt-1" style={{ color: T.sub }}>
                        {rank}
                      </div>
                      <button onClick={() => { click(); speak(w.hanzi); }} className="text-left flex-1 min-w-0">
                        <Ruby zh={w.hanzi} pinyin={w.pinyin} size={21} pySize={10} color={topic.color} sub={T.text}
                          center={false} gapClass="gap-x-1 gap-y-0.5" />
                        <div className="text-[12.5px] font-bold mt-1" style={{ color: T.sub }}>{w.en}</div>
                        {w.why && (
                          <div className="text-[11px] font-bold mt-1 italic" style={{ color: topic.color, opacity: 0.85 }}>
                            {w.why}
                          </div>
                        )}
                      </button>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {st ? (
                          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: st.color + "1E", color: st.color }}>{st.label}</span>
                        ) : (
                          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: T.chip, color: T.sub }}>not yet</span>
                        )}
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => { click(); speak(w.hanzi); }} className="p-1">
                            <I n="volume" size={15} color={T.sub} />
                          </button>
                          <button onClick={() => { click(); toggleStar(w.hanzi); }} className="p-1">
                            <I n="star" size={16} color={flagged ? "#FFB020" : T.sub} fill={flagged ? "#FFB020" : "none"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <About T={T} dark={dark} />
    </div>
  );
}

/* ---------------- SIGN IN ---------------- */
function GoogleG({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.2-10.1 7.2-17.6z" />
      <path fill="#FBBC05" d="M10.3 28.3a14.5 14.5 0 010-8.6l-7.8-6.1a24 24 0 000 20.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.6-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.8-3.7-13.7-9.5l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function SignIn({ T, dark, firebaseReady, onGoogle }) {
  return (
    <div className="pt-16 pb-10">
      <div className="text-center mb-9">
        <img src={LOGO} alt="" className="mx-auto mb-4"
          style={{ width: 84, filter: dark ? "brightness(0) invert(1)" : "none", opacity: 0.9 }} />
        <div className="disp font-bold text-[27px] leading-tight">kuekachinese</div>
        <div className="text-[13px] font-bold mt-2 px-6" style={{ color: T.sub }}>
          Sign in to sync your words, streak and notes across every device.
        </div>
      </div>

      {firebaseReady ? (
        <button onClick={onGoogle}
          className="bp-btn w-full rounded-[26px] px-5 py-4 flex items-center justify-center gap-3 font-extrabold text-[15px]"
          style={{ background: T.card, color: T.text, border: `2px solid ${T.line}`, boxShadow: `0 5px 0 ${T.line}` }}>
          <GoogleG size={20} /> Continue with Google
        </button>
      ) : (
        <div className="rounded-[26px] p-4 text-center" style={{ background: T.card, border: `2px solid ${T.line}` }}>
          <div className="font-extrabold text-[14px]" style={{ color: T.text }}>Cloud sync isn't configured yet</div>
          <div className="text-[12.5px] font-bold mt-1.5" style={{ color: T.sub }}>
            Add your Firebase config to a .env file (see .env.example) and restart the dev server.
          </div>
        </div>
      )}

      <div className="text-[11px] font-bold text-center mt-6 px-6" style={{ color: T.sub }}>
        Your progress is tied to your Google account — sign in the same way on every device to keep it in sync.
      </div>
    </div>
  );
}

function LoadingOverlay({ T, expected = 18 }) {
  const [pct, setPct] = useState(4);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const el = (Date.now() - t0) / 1000;
      setSecs(Math.floor(el));
      // ease toward 95% and hold — never fake a finish
      setPct(Math.min(95, 100 * (1 - Math.exp(-el / (expected / 2.3)))));
    }, 200);
    return () => clearInterval(id);
  }, [expected]);

  const remaining = Math.max(0, Math.round(expected - secs));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-10" style={{ background: T.bg + "F7" }}>
      <Panda size={88} />
      <div className="disp font-bold text-[21px] mt-4 mb-1" style={{ color: T.text }}>Stocking up this topic…</div>
      <div className="text-[12px] font-bold text-center mb-6" style={{ color: T.sub }}>
        One wait, then this topic loads instantly from now on.
      </div>

      <div className="w-full max-w-xs">
        <div className="h-3 rounded-full overflow-hidden" style={{ background: T.line }}>
          <div className="h-full rounded-full"
            style={{ width: pct + "%", background: "linear-gradient(90deg,#6FA3D8,#7048E8)", transition: "width .25s linear" }} />
        </div>
        <div className="flex justify-between mt-2 text-[11px] font-extrabold" style={{ color: T.sub }}>
          <span>{Math.round(pct)}%</span>
          <span>{secs < 3 ? "starting…" : remaining > 0 ? `about ${remaining}s left` : "any moment now…"}</span>
        </div>
      </div>
    </div>
  );
}

function Banner({ text, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3400); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="bp-rise fixed top-3 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl font-extrabold text-sm shadow-xl flex items-center gap-2"
      style={{ background: "#2E4258", color: "#fff", maxWidth: "92vw" }}>
      <I n="sparkle" size={16} color="#FFB020" fill="#FFB020" /> {text}
    </div>
  );
}

function Chunky({ children, color = "#6FA3D8", onClick, full, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="bp-btn rounded-[22px] font-extrabold text-white px-5 py-4 disabled:opacity-50 text-[15px]"
      style={{ background: color, boxShadow: `0 5px 0 ${shade(color, -42)}`, width: full ? "100%" : undefined, ...style }}>
      {children}
    </button>
  );
}

function Ghost({ children, onClick, T, style }) {
  return (
    <button onClick={onClick} className="bp-btn rounded-[22px] font-extrabold px-4 py-4 text-[14px]"
      style={{ background: T.card, color: T.sub, boxShadow: `0 5px 0 ${T.line}`, border: `2px solid ${T.line}`, ...style }}>
      {children}
    </button>
  );
}

function SpeakBtn({ text, color, T, label = "Play", size = 16 }) {
  const [slow, setSlow] = useState(false);
  return (
    <button
      onClick={() => { speak(text, { slow }); setSlow((v) => !v); }}
      className="bp-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-extrabold text-[12px]"
      style={{ background: color + "18", color, border: `2px solid ${color}40` }}>
      <I n="volume" size={size} color={color} /> {slow ? "Slower" : label}
    </button>
  );
}

function NavBar({ screen, setScreen, T }) {
  const items = [["home", "home", "Learn"], ["glossary", "book", "Words"], ["notes", "pen", "Notes"], ["settings", "sliders", "Settings"]];
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-6">
      <div className="max-w-xs mx-auto flex rounded-3xl px-2 py-1.5"
        style={{ background: T.card, boxShadow: "0 8px 24px rgba(10,27,51,.18)", border: `2px solid ${T.line}` }}>
        {items.map(([id, icon, label]) => {
          const on = screen === id;
          return (
            <button key={id} onClick={() => setScreen(id)} className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl"
              style={{ background: on ? "#6FA3D816" : "transparent" }}>
              <I n={icon} size={21} color={on ? "#6FA3D8" : T.sub} sw={on ? 2.6 : 2} />
              <span className="text-[10.5px] font-extrabold" style={{ color: on ? "#6FA3D8" : T.sub }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GoalRing({ pct, done, goal, label = "TODAY", size = 86 }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.3)" strokeWidth="9" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .5s" }} />
      <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle" fill="#fff"
        style={{ fontFamily: "var(--font-zh)", fontWeight: 700, fontSize: 21 }}>{Math.min(done, goal)}/{goal}</text>
      <text x="50%" y="66%" dominantBaseline="middle" textAnchor="middle" fill="rgba(255,255,255,.85)"
        style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 9, letterSpacing: 1 }}>{label}</text>
    </svg>
  );
}

/* ---------------- HELP SHEET ---------------- */
function HelpSheet({ T, onClose }) {
  const steps = [
    { icon: "cards", color: "#6FA3D8", t: "Tap a topic", d: "Meet new words." },
    { icon: "target", color: "#7048E8", t: "It tests you", d: "Each answer = 1 card toward today's goal." },
    { icon: "timer", color: "#16C79A", t: "Mastered = 3 different days", d: "A word only counts as yours after you get it right on 3 separate days." },
    { icon: "flame", color: "#FF7A45", t: "Hit the goal daily", d: "Miss a day and the streak resets to 0." },
  ];
  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center" style={{ background: "rgba(6,16,34,.5)" }} onClick={onClose}>
      <div className="bp-up w-full max-w-md rounded-t-[30px] p-5 pb-8 max-h-[88vh] overflow-y-auto"
        style={{ background: T.bg }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1.5 rounded-full mx-auto mb-4" style={{ background: T.line }} />
        <div className="flex items-center gap-3 mb-4">
          <Panda size={40} />
          <div className="disp font-bold text-[22px] leading-none">How this works</div>
        </div>
        <div className="flex flex-col gap-2 mb-5">
          {steps.map((st) => (
            <div key={st.t} className="rounded-2xl p-3 flex gap-3 items-center"
              style={{ background: T.card, border: `2px solid ${T.line}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: st.color + "1E" }}>
                <I n={st.icon} size={19} color={st.color} fill={st.icon === "flame" ? st.color : "none"} />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-[13.5px] leading-tight">{st.t}</div>
                <div className="text-[12px] font-bold" style={{ color: T.sub }}>{st.d}</div>
              </div>
            </div>
          ))}
        </div>
        <Chunky full onClick={onClose}>Let's go</Chunky>
      </div>
    </div>
  );
}

/* ---------------- TECH STACK SHEET ---------------- */
/* color-coding key for every tech term across all 3 tiers — kept consistent
   with each card's own icon color, so the highlight scheme reads the same
   whether you're inside a card or cross-referencing it from elsewhere */
const TC = {
  lang: "#6FA3D8",    // languages / frameworks / build tool: React, JavaScript, JSX, TypeScript, Vite
  style: "#7048E8",   // Tailwind CSS
  content: "#16C79A", // Claude, the word bank
  api: "#FF7A45",     // Web Audio API, Web Speech API
  backend: "#E64980", // Firebase, Firebase Auth, Cloud Firestore, OAuth
  host: "#1098AD",    // GitHub, Vercel, CI/CD
  sync: "#0CA678",    // localStorage, onSnapshot, debouncing
};
const Hi = ({ c, children }) => <b style={{ color: c }}>{children}</b>;
const Bul = ({ items }) => (
  <ul className="mt-1.5 pl-4 space-y-1 list-disc">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);
const Num = ({ items }) => (
  <ol className="mt-1.5 pl-4 space-y-1 list-decimal">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ol>
);

const SIMPLE_CARDS = [
  { icon: "code", color: TC.lang, t: "Frontend — what you see and tap",
    d: <>The part of the app you interact with (screens, buttons, word cards) is called the frontend. It's written in <Hi c={TC.lang}>JavaScript</Hi>, using a tool called <Hi c={TC.lang}>React</Hi> that lets the app be built out of small, reusable pieces instead of one giant file for each screen.</> },
  { icon: "sparkle", color: TC.style, t: "Styling",
    d: <>The colors, spacing, and rounded shapes come from <Hi c={TC.style}>Tailwind CSS</Hi>, a styling toolkit with a large set of ready-made design rules, so I don't have to generate custom styling code for every single element.</> },
  { icon: "book", color: TC.content, t: "The Chinese content",
    d: <>The vocabulary, pinyin, and example sentences were generated with <Hi c={TC.content}>Claude's</Hi> help during development. The app itself doesn't call any AI while you're using it, though — that content is now permanently built into the app's code, so it works instantly without ever contacting an AI service.</> },
  { icon: "volume", color: TC.api, t: "Sound & voice",
    d: <>The correct/wrong sound effects are generated live by your browser itself — there are no actual sound files. The Chinese pronunciation you hear uses your phone or laptop's own built-in voice, the same system other apps on your device already use for text-to-speech.</> },
  { icon: "lock", color: TC.backend, t: "Backend — sign-in and storing your data",
    d: <>Instead of a custom server, the app uses <Hi c={TC.backend}>Firebase</Hi>, a backend service from Google. It handles two jobs:
      <Num items={["Letting you sign in with your Google account.", <>Storing your streak, words, and notes in a cloud database called <Hi c={TC.backend}>Firestore</Hi>, tied to your account.</>]} />
      <div className="mt-1.5">That's what lets your phone and laptop show the same progress.</div>
    </> },
  { icon: "globe", color: TC.host, t: "Where the code lives and how updates reach you",
    d: <>The code is stored on <Hi c={TC.host}>GitHub</Hi>, a platform for storing and tracking changes to code. A separate service called <Hi c={TC.host}>Vercel</Hi> is connected to it — every time the code changes, Vercel automatically rebuilds and publishes the live website, which is why updates show up without you doing anything.</> },
];

const STUDENT_CARDS = [
  { icon: "code", color: TC.lang, t: "Frontend",
    d: <>Built with <Hi c={TC.lang}>React 18</Hi> — function components and hooks only, no class components:
      <Bul items={[<Hi c={TC.lang}>useState</Hi>, <Hi c={TC.lang}>useEffect</Hi>, <Hi c={TC.lang}>useRef</Hi>, <Hi c={TC.lang}>useCallback</Hi>]} />
      <div className="mt-1.5">Written in JavaScript with <Hi c={TC.lang}>JSX</Hi> syntax, no <Hi c={TC.lang}>TypeScript</Hi>, so no static type-checking. <Hi c={TC.lang}>Vite</Hi> handles the dev server and build, via @vitejs/plugin-react.</div>
    </> },
  { icon: "sparkle", color: TC.style, t: "Styling",
    d: <><Hi c={TC.style}>Tailwind CSS</Hi>, loaded via a CDN &lt;script&gt; tag rather than a build-time PostCSS pipeline — it compiles utility classes at runtime in the browser (JIT), instead of being pre-generated and purged like a typical production Tailwind setup.</> },
  { icon: "book", color: TC.content, t: "Word bank",
    d: <>Every word, pinyin, and example sentence is hardcoded into a JS object (SEED), authored with <Hi c={TC.content}>Claude's</Hi> help — no external content API, no runtime AI calls. Spaced repetition uses a simple custom box/interval system, not a library.</> },
  { icon: "volume", color: TC.api, t: "Audio & speech",
    d: <>Sound effects are synthesized live with the <Hi c={TC.api}>Web Audio API</Hi> (oscillators + gain envelopes) — no audio files. Pronunciation uses the browser's native <Hi c={TC.api}>Web Speech API</Hi> (speechSynthesis), picking the best available Mandarin voice on the device.</> },
  { icon: "lock", color: TC.backend, t: "Backend & database",
    d: <><Hi c={TC.backend}>Firebase Authentication</Hi> (Google OAuth) handles sign-in. <Hi c={TC.backend}>Cloud Firestore</Hi>, a NoSQL document database, stores one document per user holding their entire app state as a JSON blob — not split across relational tables.</> },
  { icon: "shuffle", color: TC.sync, t: "Sync across devices",
    d: <><Hi c={TC.sync}>localStorage</Hi> caches state locally for instant load. Firestore's <Hi c={TC.sync}>onSnapshot</Hi> listener pushes real-time updates to every signed-in device, with writes debounced (400ms) to avoid excessive network calls.</> },
  { icon: "globe", color: TC.host, t: "Hosting & deployment",
    d: <>Code lives on <Hi c={TC.host}>GitHub</Hi>; <Hi c={TC.host}>Vercel</Hi> auto-builds and deploys on every push to main (a simple <Hi c={TC.host}>CI/CD</Hi> setup) as a static site — no custom always-on server.</> },
];

const STUDENT_FAQ = [
  { q: "What APIs does the app call?",
    a: <>
      <Num items={[<Hi c={TC.api}>Web Audio API</Hi>, <Hi c={TC.api}>Web Speech API</Hi>, <Hi c={TC.backend}>Firebase Authentication API</Hi>, <Hi c={TC.backend}>Cloud Firestore API</Hi>]} />
      <div className="mt-1.5">All client-side, no custom backend API of its own.</div>
    </> },
  { q: "How is app state managed?",
    a: <>No external state library (no Redux/Zustand/Context layers) — one state object at the top of the component tree, flowing down through props, updated through a single <Hi c={TC.lang}>update()</Hi> function that handles local state, <Hi c={TC.sync}>localStorage</Hi>, and the debounced Firestore write together.</> },
  { q: "How does the cross-device sync actually stay consistent?",
    a: <>Last-write-wins — the whole state blob gets overwritten on every save, no merge logic. A ref tracks the last payload this device pushed, so incoming snapshot updates matching it are ignored (avoiding reacting to your own writes).</> },
];

const DEV_SECTIONS = [
  { t: "The honest structural overview",
    d: <>This is intentionally a ~3,000-line single-file <Hi c={TC.lang}>React</Hi> app (src/App.jsx) — every screen, component, and helper function in one file, plus a small src/firebase.js for the <Hi c={TC.backend}>Firebase</Hi> SDK wiring. No folder-per-feature structure, no component library. That's a real trade-off (navigation within the file is heavier than it'd be split up), made because this app grew iteratively through many small conversational changes rather than an upfront architecture decision.</> },
  { t: "State management",
    d: <>No library. One state object in the root App component, mutated through a single update(fn) callback that does three things on every call:
      <Num items={["setState", <>localStorage.setItem</>, <>a debounced <Hi c={TC.backend}>Firestore</Hi> write</>]} />
      <div className="mt-1.5">Screen navigation is a plain string state machine (screen === "home" | "session" | "dict" | ...), no router.</div>
    </> },
  { t: "Styling",
    d: <><Hi c={TC.style}>Tailwind CSS</Hi> via the CDN runtime build (cdn.tailwindcss.com), not the CLI/PostCSS pipeline — so there's no purge/tree-shaking step; the full JIT compiler ships to the client and compiles on the fly. A handful of arbitrary-value utility classes are hand-written in a &lt;style&gt; block because they weren't reliably picked up by the CDN's class scanner.</> },
  { t: "Icons",
    d: <>A hand-rolled SVG path system — a PATHS object mapping name → array of SVG &lt;path d&gt; strings, rendered by a generic &lt;I n="..." /&gt; component. No icon library (Lucide/Heroicons/etc.) — kept dependency-free and small.</> },
  { t: "Audio",
    d: <>Fully synthesized, zero audio assets. Each sound effect is a small function building an oscillator/gain-envelope graph on a shared lazily-created AudioContext:
      <Bul items={["click", "chime", "buzz", "fanfare"]} />
      <div className="mt-1.5">AudioContext.resume() is called defensively on every play, since browsers auto-suspend idle contexts. Also notable — and unfixable from web code — iOS's hardware silent switch mutes all <Hi c={TC.api}>Web Audio</Hi>/HTML5 audio from any web content, including installed home-screen apps; there's no AVAudioSession-equivalent API exposed to the web.</div>
    </> },
  { t: "Persistence/sync model",
    d: <><Hi c={TC.backend}>Firestore</Hi> holds one document per user, users/{"{uid}"}, with a single field save containing the entire app state JSON-stringified — not normalized into subcollections. How it stays (roughly) consistent:
      <Num items={[
        "Last-write-wins — the whole state blob gets overwritten on every save, no merge logic.",
        <>Echo suppression: a ref tracks the last payload this device pushed, so incoming <Hi c={TC.sync}>onSnapshot</Hi> updates matching it are ignored.</>,
        <>Debounced 400ms, with an explicit flush on visibilitychange/pagehide so a quick app-close doesn't drop the last write — this was a real bug (streak increments silently lost) fixed mid-session.</>,
      ]} />
    </> },
  { t: "Auth",
    d: <><Hi c={TC.backend}>Firebase Auth</Hi>, Google provider only. Sign-in flow:
      <Num items={["Tries signInWithPopup first.", "Falls back to signInWithRedirect only on popup-blocked/operation-not-supported errors."]} />
      <div className="mt-1.5">Flipped from redirect-first after discovering signInWithRedirect doesn't reliably complete in iOS "Add to Home Screen" standalone contexts (a known WebKit quirk).</div>
    </> },
  { t: "Build/deploy",
    d: <><Hi c={TC.lang}>Vite 5</Hi> + @vitejs/plugin-react, zero custom config beyond the React plugin. <Hi c={TC.host}>Vercel's</Hi> Git integration auto-detects the Vite preset and deploys on push to main — no vercel.json, no CI YAML.</> },
  { t: "Dependencies",
    d: <>Deliberately minimal — package.json only lists <Hi c={TC.lang}>react</Hi>, <Hi c={TC.lang}>react-dom</Hi>, and <Hi c={TC.backend}>firebase</Hi> as runtime deps. Not included:
      <Bul items={["No date library", "No animation library (CSS keyframes only)", "No form library", "No testing framework currently set up"]} />
    </> },
  { t: "Notable removed piece",
    d: <>There used to be a /api/anthropic Vercel serverless function proxying <Hi c={TC.content}>Claude</Hi> API calls for AI-generated vocabulary. It's gone — the word bank is now fully static by design, a deliberate pivot away from AI-backed generation.</> },
];

function TechStackSheet({ T, dark, click, onClose }) {
  const [tab, setTab] = useState("simple"); // simple | student | dev
  const [openFaq, setOpenFaq] = useState({});

  const Cards = ({ items }) => (
    <div className="flex flex-col gap-2.5">
      {items.map((c) => (
        <div key={c.t} className="rounded-2xl p-3.5 flex gap-3 items-start"
          style={{ background: T.card, border: `2px solid ${T.line}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.color + "1E" }}>
            <I n={c.icon} size={18} color={c.color} />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-[13.5px] leading-tight mb-1">{c.t}</div>
            <div className="text-[12px] font-bold leading-relaxed" style={{ color: T.sub }}>{c.d}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center" style={{ background: "rgba(6,16,34,.5)" }} onClick={onClose}>
      <div className="bp-up w-full max-w-md rounded-t-[30px] p-5 pb-8 max-h-[88vh] overflow-y-auto"
        style={{ background: T.bg }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1.5 rounded-full mx-auto mb-4" style={{ background: T.line }} />
        <div className="flex items-center gap-3 mb-3">
          <Panda size={40} />
          <div className="disp font-bold text-[20px] leading-none">How this app is built</div>
        </div>
        <div className="rounded-2xl p-3 mb-4 text-[12px] font-bold leading-relaxed" style={{ background: T.chip, color: T.sub }}>
          Hi! Charlotte here. I can't code, so I built this webapp using Claude. Kept getting questions about its tech stack, so I decided to let the app speak for itself!
        </div>

        <div className="flex gap-2 mb-4">
          {[["simple", "Simple"], ["student", "CS Student"], ["dev", "Developer"]].map(([v, label]) => {
            const on = tab === v;
            return (
              <button key={v} onClick={() => { click(); setTab(v); }}
                className="bp-btn flex-1 rounded-xl py-2.5 font-extrabold text-[12.5px]"
                style={{
                  background: on ? "#6FA3D8" : T.card, color: on ? "#fff" : T.sub,
                  border: `2px solid ${on ? "#6FA3D8" : T.line}`, boxShadow: `0 3px 0 ${on ? "#3E6D9C" : T.line}`,
                }}>{label}</button>
            );
          })}
        </div>

        {tab === "simple" && <Cards items={SIMPLE_CARDS} />}

        {tab === "student" && (
          <>
            <Cards items={STUDENT_CARDS} />
            <div className="text-[10.5px] font-black tracking-[.12em] mt-5 mb-2.5" style={{ color: T.sub }}>
              A FEW MORE SPECIFICS
            </div>
            <div className="flex flex-col gap-2">
              {STUDENT_FAQ.map((f, i) => {
                const shown = openFaq[i];
                return (
                  <div key={f.q} className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `2px solid ${T.line}` }}>
                    <button onClick={() => { click(); setOpenFaq((p) => ({ ...p, [i]: !p[i] })); }}
                      className="w-full flex items-center gap-2.5 p-3 text-left">
                      <div className="flex-1 min-w-0 font-extrabold text-[12.5px]" style={{ color: T.text }}>{f.q}</div>
                      <I n="chevron" size={16} color={T.sub} style={{ transform: shown ? "rotate(90deg)" : "none", transition: "transform .18s" }} />
                    </button>
                    {shown && (
                      <div className="px-3 pb-3 text-[12px] font-bold leading-relaxed" style={{ color: T.sub }}>{f.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "dev" && (
          <div className="flex flex-col gap-4">
            {DEV_SECTIONS.map((s) => (
              <div key={s.t}>
                <div className="font-extrabold text-[13px] mb-1" style={{ color: T.text }}>{s.t}</div>
                <div className="text-[12px] font-bold leading-relaxed" style={{ color: T.sub }}>{s.d}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5"><Chunky full onClick={onClose}>Got it</Chunky></div>
      </div>
    </div>
  );
}

/* ---------------- ADD TOPIC SHEET ---------------- */
function AddTopicSheet({ T, s, allTopics, onClose, onAdd }) {
  const library = [...CORE_TOPICS, ...LIBRARY].filter((t) => !allTopics.some((x) => x.id === t.id));

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center" style={{ background: "rgba(6,16,34,.5)" }} onClick={onClose}>
      <div className="bp-up w-full max-w-md rounded-t-[30px] p-5 pb-8 max-h-[88vh] overflow-y-auto"
        style={{ background: T.bg }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1.5 rounded-full mx-auto mb-4" style={{ background: T.line }} />
        <div className="disp font-bold text-[22px]">Add a topic</div>
        <div className="text-[12.5px] font-bold mb-5" style={{ color: T.sub }}>
          {library.length ? "Pick a topic to add to your list" : "You've added every topic in the library!"}
        </div>

        {library.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {library.map((t) => (
              <button key={t.id} onClick={() => { click(s.sound); onAdd(t); }}
                className="bp-btn rounded-[24px] p-3 text-left"
                style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: t.color + "1E" }}>
                  <I n={t.icon} size={17} color={t.color} />
                </div>
                <div className="font-extrabold text-[12.5px] leading-tight">{t.name}</div>
                <div className="text-[10.5px] font-bold mt-0.5" style={{ color: t.color }}>{t.zh}</div>
              </button>
            ))}
          </div>
        )}

        <Ghost T={T} onClick={onClose} style={{ width: "100%" }}>Close</Ghost>
      </div>
    </div>
  );
}

/* ---------------- HOME ---------------- */
function Home({ state, T, dark, s, allTopics, onTopic, onQuiz, onMatch, onDailyMix, onHelp, onAdd, onDeleteTopic, onDict, click }) {
  const [editing, setEditing] = useState(false);
  const cards = Object.values(state.cards);
  const learned = cards.filter((c) => !c.known && c.seen > 0).length;
  const mastered = cards.filter(isMastered).length;
  const goalPct = Math.round((Math.min(state.todayCount, s.goal) / s.goal) * 100);
  const recent = state.recent || [];
  const acc = recent.length >= 10 ? recent.reduce((a, b) => a + b, 0) / recent.length : null;
  const d = dayNum();
  const dueCount = cards.filter((c) => !c.known && c.due <= d).length;
  const quizLocked = learned < 5;

  /* The progress bar tracks partial credit (how far each word has climbed
     through its SRS boxes) so it visibly moves as you practice — "mastered"
     itself stays a strict, 3-separate-days measure and is shown separately. */
  const statsFor = (id) => {
    const c = cards.filter((x) => x.topicId === id);
    const m = c.filter(isMastered).length;
    const progress = c.reduce((sum, card) => sum + Math.min(1, (card.box || 0) / MASTER_BOX), 0);
    return { seen: c.length, mastered: m, target: targetFor(id), pct: Math.min(100, Math.round((progress / targetFor(id)) * 100)) };
  };

  const focus = allTopics
    .map((t) => ({ t, ...statsFor(t.id) }))
    .filter((x) => x.pct < 100)
    .sort((a, b) => b.mastered - a.mastered)[0] || { t: allTopics[0], ...statsFor(allTopics[0].id) };

  return (
    <div className="pt-2">
      {/* Shenzhen countdown — a flat banner flush with the top of the screen, not a card */}
      <ShenzhenCard T={T} s={s} mastered={mastered} dark={dark} />

      <div className="flex items-center justify-between mb-4 mt-3">
        <div className="flex items-center gap-2.5">
          <Panda size={42} />
          <div className="disp font-bold text-[22px] leading-none tracking-tight">kuekachinese</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onHelp} className="bp-btn p-2.5 rounded-2xl"
            style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
            <I n="help" size={19} color={T.sub} />
          </button>
          <div className="flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-2xl"
            style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
            <I n="flame" size={20} color="#FF7A45" fill={state.streak > 0 ? "#FF7A45" : "none"} />
            <span className="disp font-bold text-[18px]" style={{ color: state.streak > 0 ? "#FF7A45" : T.sub }}>{state.streak}</span>
          </div>
        </div>
      </div>

      {/* hero */}
      <div className="rounded-[34px] p-5 mb-6 relative overflow-hidden bp-pop"
        style={{ background: T.hero, boxShadow: "0 12px 28px rgba(46,124,255,.4)" }}>
        <div className="disp absolute -right-3 -top-7 font-bold select-none" style={{ fontSize: 110, color: "rgba(255,255,255,.1)" }}>学</div>
        <div className="flex items-center gap-4 relative">
          <GoalRing pct={focus.pct} done={focus.mastered} goal={focus.target} label="MASTERED" />
          <div className="text-white min-w-0">
            <div className="text-[10px] font-black tracking-[.14em] opacity-80">CURRENTLY ON</div>
            <div className="disp font-bold text-[18px] leading-tight truncate">{focus.t.name}</div>
            <div className="text-[12.5px] font-bold opacity-90">
              {focus.pct >= 100 ? "Topic complete!"
                : focus.pct >= 75 ? `Almost there — ${focus.target - focus.mastered} words left`
                : `${focus.target - focus.mastered} more words to finish this topic`}
            </div>
            <div className="flex gap-4 mt-2.5">
              <div><div className="disp font-bold text-[17px] leading-none">{learned}</div><div className="text-[10px] font-bold opacity-85">words</div></div>
              <div><div className="disp font-bold text-[17px] leading-none">{mastered}</div><div className="text-[10px] font-bold opacity-85">mastered</div></div>
              <div><div className="disp font-bold text-[17px] leading-none">{acc === null ? "—" : Math.round(acc * 100) + "%"}</div><div className="text-[10px] font-bold opacity-85">accuracy</div></div>
            </div>
          </div>
        </div>
        {/* daily goal — thin bar, just enough to protect the streak */}
        <div className="mt-4 relative">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-extrabold text-white opacity-90">
              {goalPct >= 100 ? "Today's goal cleared — streak safe" : `${s.goal - state.todayCount} more cards today to keep the streak`}
            </span>
            <span className="text-[11px] font-black text-white opacity-90">{Math.min(state.todayCount, s.goal)}/{s.goal}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.3)" }}>
            <div className="h-full rounded-full" style={{ width: goalPct + "%", background: "#fff", transition: "width .4s" }} />
          </div>
        </div>
      </div>

      {/* quick path to today's goal — mixes every topic you've started so you don't have to pick one */}
      <button onClick={onDailyMix}
        className="bp-btn w-full rounded-[26px] p-4 mb-6 text-left flex items-center gap-3.5"
        style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: "0 5px 0 #3E6D9C" }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#6FA3D81E" }}>
          <I n="shuffle" size={22} color="#6FA3D8" sw={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[15px]" style={{ color: T.text }}>Practice a mixed set</div>
          <div className="text-[11.5px] font-bold mt-0.5" style={{ color: T.sub }}>
            {dueCount > 0 ? `${dueCount} due · every topic you've started` : "New + due words · every topic you've started"}
          </div>
        </div>
        <I n="chevron" size={18} color={T.sub} />
      </button>

      {/* STEP 1 */}
      <div className="flex items-start justify-between gap-2">
        <SectionTitle n="1" title="Learn new words" sub="Tap a topic to meet words you don't know yet" T={T} />
        <button onClick={() => { click(); setEditing(!editing); }}
          className="bp-btn rounded-xl px-3 py-1.5 font-extrabold text-[12px] shrink-0 mt-0.5"
          style={{
            background: editing ? "#FF5A5F14" : T.card, color: editing ? "#FF5A5F" : T.sub,
            border: `2px solid ${editing ? "#FF5A5F55" : T.line}`, boxShadow: `0 3px 0 ${T.line}`,
          }}>
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="relative pl-[26px] mb-3">
        {allTopics.map((t, i) => {
          const st = statsFor(t.id);
          const prevColor = i > 0 ? allTopics[i - 1].color : t.color;
          return (
            <div key={t.id} className="relative pb-3.5">
              {i > 0 && (
                <div className="absolute left-[-15px] w-[6px] rounded-full"
                  style={{ top: -18, height: 46, background: `linear-gradient(${prevColor}, ${t.color})` }} />
              )}
              <div className="absolute left-[-26px] top-[14px] w-[28px] h-[28px] rounded-full flex items-center justify-center"
                style={{ background: T.bg, border: `5px solid ${t.color}` }}>
                {st.pct >= 100 && st.seen > 0 && <I n="check" size={13} color={t.color} sw={3.4} />}
              </div>
              <button onClick={() => { if (!editing) onTopic(t); }}
                className={TOPIC_ROW_CLS}
                style={{ background: T.card, border: `2px solid ${editing ? "#FF5A5F44" : T.line}`, boxShadow: `0 5px 0 ${t.color}45` }}>
                <div className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center shrink-0" style={{ background: t.color + "1E" }}>
                  <I n={t.icon} size={24} color={t.color} sw={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[14.5px] leading-tight truncate">{t.name}</span>
                    {t.level > 1 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0" style={{ background: t.color + "22", color: t.color }}>L{t.level}</span>
                    )}
                  </div>
                  <div className="text-[11.5px] font-bold mt-0.5" style={{ color: T.sub }}>
                    {st.seen === 0 ? `${st.target} words loaded · not started yet`
                      : st.pct >= 100 ? `Complete — all ${st.target} mastered`
                      : `${st.mastered} / ${st.target} mastered · ${st.seen} seen`}
                  </div>
                  <div className="h-[7px] rounded-full mt-2 overflow-hidden" style={{ background: T.chip }}>
                    <div className="h-full rounded-full" style={{ width: st.pct + "%", background: t.color, transition: "width .4s" }} />
                  </div>
                </div>
                {!editing && (
                  <div
                    onClick={(e) => { e.stopPropagation(); onDict(t); }}
                    className="bp-btn w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
                    style={{ background: t.color + "16", border: `2px solid ${t.color}33` }}
                    title="See every word in this topic">
                    <I n="dict" size={17} color={t.color} />
                  </div>
                )}
                {editing
                  ? <div
                      onClick={(e) => {
                        e.stopPropagation(); click();
                        if (window.confirm(`Remove "${t.name}" from your line?\n\nWords you've already learned stay in your Word bank.`)) onDeleteTopic(t);
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                      style={{ background: "#FF5A5F1A", border: "2px solid #FF5A5F55" }}>
                      <I n="trash" size={17} color="#FF5A5F" />
                    </div>
                  : st.pct >= 100
                    ? <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: t.color }}>
                        <I n="check" size={15} color="#fff" sw={3.2} />
                      </div>
                    : <div className="disp font-bold text-[14px] shrink-0" style={{ color: t.color }}>{st.pct}%</div>}
              </button>
            </div>
          );
        })}

        {/* add topic node */}
        <div className="relative">
          <div className="absolute left-[-15px] w-[6px] rounded-full"
            style={{ top: -18, height: 46, background: `linear-gradient(${allTopics[allTopics.length - 1].color}, ${T.line})` }} />
          <div className="absolute left-[-26px] top-[14px] w-[28px] h-[28px] rounded-full flex items-center justify-center"
            style={{ background: T.bg, border: `5px dashed ${T.line}` }} />
          <button onClick={onAdd}
            className={TOPIC_ROW_CLS}
            style={{ background: T.chip, border: `2px dashed ${T.sub}66`, boxShadow: `0 5px 0 ${T.line}` }}>
            <div className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "#7048E81E" }}>
              <I n="plus" size={24} color="#7048E8" sw={2.6} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-[14.5px]">Add a topic</div>
              <div className="text-[11.5px] font-bold mt-0.5" style={{ color: T.sub }}>
                AI picks what to learn next, or go a level deeper
              </div>
            </div>
            <I n="sparkle" size={19} color="#7048E8" />
          </button>
        </div>
      </div>

      {/* STEP 2 */}
      <div className="mt-7">
        <SectionTitle n="2" title="Test yourself" sub="Practice words you've already met" T={T} />
      </div>
      <div className="grid grid-cols-2 gap-3 stagger">
        <button onClick={onQuiz}
          className="bp-btn rounded-[30px] p-4 text-left text-white relative overflow-hidden"
          style={{ background: quizLocked ? "#8E9CB5" : "linear-gradient(150deg,#7048E8,#8B5CF6)", boxShadow: `0 6px 0 ${quizLocked ? "#6B7A93" : "#4C2FA8"}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "rgba(255,255,255,.2)" }}>
            <I n={quizLocked ? "lock" : "target"} size={22} color="#fff" sw={2.3} />
          </div>
          <div className="disp font-bold text-[16px] leading-tight">Daily Quiz</div>
          <div className="text-[11.5px] font-bold opacity-90 mt-0.5">
            {quizLocked ? `Learn ${5 - learned} more word${5 - learned === 1 ? "" : "s"}` : "5 questions · topics mixed"}
          </div>
          {!quizLocked && dueCount > 0 && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10.5px] font-black"
              style={{ background: "#FFB020", color: "#5C3A00", transform: "rotate(3deg)" }}>{dueCount} due</div>
          )}
        </button>
        <button onClick={onMatch}
          className="bp-btn rounded-[30px] p-4 text-left text-white relative overflow-hidden"
          style={{ background: "linear-gradient(150deg,#0CA678,#16C79A)", boxShadow: "0 6px 0 #076B4E" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "rgba(255,255,255,.2)" }}>
            <I n="puzzle" size={22} color="#fff" sw={2.1} />
          </div>
          <div className="disp font-bold text-[16px] leading-tight">Match Sprint</div>
          <div className="text-[11.5px] font-bold opacity-90 mt-0.5">Pair words & meanings fast</div>
        </button>
      </div>

      <About T={T} dark={dark} />
    </div>
  );
}

function ShenzhenCard({ T, s, mastered, dark }) {
  const target = new Date((s.szDate || "2027-01-01") + "T00:00:00");
  const now = new Date();
  const ms = Math.max(0, target - now);
  const days = Math.floor(ms / 86400000);
  const hrs = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const GOAL = 500;
  const left = Math.max(0, GOAL - mastered);
  const perDay = days > 0 ? Math.round((left / days) * 10) / 10 : left;
  const pad = (n) => String(n).padStart(2, "0");

  const Unit = ({ v, l }) => (
    <div className="flex flex-col items-center">
      <div className="disp font-bold rounded-xl px-2.5 py-1 leading-none"
        style={{ background: T.chip, color: T.text, fontSize: 19, minWidth: 36, textAlign: "center", border: `2px solid ${T.line}` }}>
        {v}
      </div>
      <div className="text-[8.5px] font-black tracking-[.12em] mt-1" style={{ color: T.sub }}>{l}</div>
    </div>
  );

  /* No card, no bubble — just sits flush on the page background at the very
     top of the screen, bleeding past the app's usual side padding. */
  return (
    <div className="-mx-4 px-4 pt-4 pb-3">
      <div className="flex items-center gap-3">
        <img src={LOGO} alt="" style={{ width: 34, filter: dark ? "brightness(0) invert(1)" : "none", opacity: 0.9 }} />
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-black tracking-[.16em]" style={{ color: "#6FA3D8" }}>
            TOUCHDOWN IN SHENZHEN
          </div>
          <div className="text-[11px] font-bold mt-0.5" style={{ color: T.sub }}>
            {target.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Unit v={days} l="D" />
          <Unit v={pad(hrs)} l="H" />
          <Unit v={pad(mins)} l="M" />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2.5" style={{ borderTop: `1.5px dashed ${T.line}` }}>
        <I n="target" size={13} color="#6FA3D8" />
        <div className="text-[11px] font-bold" style={{ color: T.sub }}>
          {left === 0
            ? `${GOAL}-word goal smashed — 你准备好了!`
            : <>Master <b style={{ color: T.text }}>~{perDay}/day</b> to land with {GOAL} words ({mastered} done)</>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ABOUT / CREDITS ---------------- */
function About({ T, dark }) {
  const links = [
    { href: "https://www.linkedin.com/in/charlottekuek/", bg: "#0A66C2", label: "LinkedIn",
      svg: <><rect x="4" y="9" width="4" height="11" rx="1" fill="#fff" /><circle cx="6" cy="5.5" r="2.2" fill="#fff" /><path d="M11 20V9h4v1.6a3.6 3.6 0 016 2.7V20h-4v-6a1.8 1.8 0 00-3.6 0v6z" fill="#fff" /></> },
    { href: "https://t.me/charlottekuek", bg: "#29A9EB", label: "Telegram",
      svg: <path d="M21 4.5L2.8 11.4c-1 .4-1 1 .2 1.3l4.4 1.4 1.7 5.2c.2.6.5.7 1 .3l2.6-2.1 4.4 3.3c.8.4 1.4.2 1.6-.8l3-13.6c.3-1.2-.5-1.8-1.7-1.3z" fill="#fff" /> },
    { href: "https://www.instagram.com/charlottekuek/", bg: "linear-gradient(45deg,#F9CE34,#EE2A7B,#6228D7)", label: "Instagram",
      svg: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="#fff" strokeWidth="2" fill="none" /><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="2" fill="none" /><circle cx="17" cy="7" r="1.4" fill="#fff" /></> },
  ];
  return (
    <div className="pb-3 text-center" style={{ marginTop: 150 }}>
      <img src={LOGO} alt="kuekadoodledoo" className="mx-auto mb-2"
        style={{ width: 46, filter: dark ? "brightness(0) invert(1)" : "none", opacity: 0.55 }} />
      <div className="font-bold px-4" style={{ color: T.sub, fontSize: 10, lineHeight: 1.7, opacity: 0.85 }}>
        <div>made by the amazing Charlotte Kuek! got ideas or issues?</div>
        <div>text me @charlottekuek on tele, ig or linkedin —</div>
        <div>or just deal with it I guess… HAHAHA ENJOY!</div>
      </div>
      <div className="flex justify-center gap-2.5 mt-2.5">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" aria-label={l.label}
            className="bp-btn rounded-full flex items-center justify-center"
            style={{ background: l.bg, width: 26, height: 26, opacity: 0.8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24">{l.svg}</svg>
          </a>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ n, title, sub, T }) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "#6FA3D8", color: "#fff" }}>
        <span className="disp font-bold text-[13px]">{n}</span>
      </div>
      <div>
        <div className="disp font-bold text-[19px] leading-none">{title}</div>
        <div className="text-[12px] font-bold mt-1" style={{ color: T.sub }}>{sub}</div>
      </div>
    </div>
  );
}

/* ---------------- TRIAGE ---------------- */
function Triage({ topic, queue, qIndex, setQIndex, markKnown, onDone, T, click, setScreen }) {
  const item = queue[qIndex];
  if (!item) return null;
  const w = item.word;
  const left = queue.length - qIndex;

  const answer = (known) => {
    click();
    if (known) markKnown(w);
    if (qIndex + 1 >= queue.length) onDone(); else setQIndex(qIndex + 1);
  };

  return (
    <div className="pt-6 bp-rise">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => { click(); setScreen("home"); }} className="bp-btn p-2.5 rounded-xl"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
          <I n="back" size={19} color={T.sub} />
        </button>
        <div className="px-3 py-1.5 rounded-xl disp font-bold text-[14px]"
          style={{ background: topic.color + "1E", color: topic.color }}>{left} left</div>
      </div>

      <div className="text-center disp font-bold text-[22px] mb-1">Quick check first</div>
      <div className="text-center text-[13px] font-bold mb-8 px-4" style={{ color: T.sub }}>
        Tell me which of these you already know, so we skip them and only teach you what's new.
      </div>

      <div className="rounded-[34px] p-8 text-center mb-8 bp-pop relative overflow-hidden"
        style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 7px 0 ${topic.color}40` }}>
        <div className="absolute top-0 left-0 right-0 h-2" style={{ background: topic.color }} />
        <div className="pt-2 pb-3">
          <Ruby zh={w.hanzi} pinyin={w.pinyin} size={46} pySize={15} color={topic.color} sub={T.text} />
        </div>
        <SpeakBtn text={w.hanzi} color={topic.color} T={T} label="Hear it" />
      </div>

      <div className="flex gap-3">
        <Chunky color="#16C79A" full onClick={() => answer(true)}>I know this</Chunky>
        <Chunky color={topic.color} full onClick={() => answer(false)}>Teach me</Chunky>
      </div>
    </div>
  );
}

/* ---------------- SESSION ---------------- */
function Session({ topic, mode, queue, setQueue, qIndex, setQIndex, stats, setStats, recordAnswer, markKnown, addCard, onFinish, T, s, click, setScreen, state, topicById }) {
  const [picked, setPicked] = useState(null);
  const [showTrans, setShowTrans] = useState(false);
  const [answers, setAnswers] = useState({}); // qIndex -> chosen value / "learned"
  const [revealed, setRevealed] = useState(null); // answerField value of the option currently expanded for inspection
  const item = queue[qIndex];
  const accent = mode === "quiz" ? "#7048E8" : (topic?.color || "#6FA3D8");
  const wTopic = item ? topicById(item.word.topicId) : null;

  const options = React.useMemo(() => {
    if (!item || item.type !== "quiz") return [];
    const answerField = (item.variant === "zh2en" || item.variant === "audio") ? "en" : "hanzi";
    const learnedPool = Object.values(state.cards).filter((c) => c.seen > 0 && c[answerField]);
    const pool = [...learnedPool, ...seedFor(item.word.topicId).filter((c) => c[answerField])];
    const seen = new Set();
    const distinct = pool.filter((c) => {
      const k = c[answerField];
      if (seen.has(k) || k === item.word[answerField]) return false;
      seen.add(k); return true;
    });
    const sameTopic = distinct.filter((c) => c.topicId === item.word.topicId);
    /* Harder distractors: words sharing a character with the answer first,
       then same-topic words, then anything learned. */
    const chars = [...item.word.hanzi];
    const similar = distinct.filter((c) => c.hanzi !== item.word.hanzi && [...c.hanzi].some((ch) => chars.includes(ch)));
    const ranked = [...shuffle(similar), ...shuffle(sameTopic.filter((c) => !similar.includes(c))), ...shuffle(distinct)];
    const picks = [];
    for (const c of ranked) {
      if (picks.length >= 3) break;
      if (!picks.includes(c)) picks.push(c);
    }
    return shuffle([item.word, ...picks]);
  }, [qIndex, item]);

  useEffect(() => {
    setPicked(answers[qIndex] !== undefined && answers[qIndex] !== "learned" ? answers[qIndex] : null);
    setShowTrans(false);
    setRevealed(null);
    if (item && item.type === "quiz" && item.variant === "audio" && answers[qIndex] === undefined) {
      const t = setTimeout(() => speak(item.word.hanzi), 350);
      return () => clearTimeout(t);
    }
  }, [qIndex]);

  if (!item) return null;
  const left = queue.length - qIndex;
  const w = item.word;
  const variant = item.variant || "en2zh";

  const next = () => {
    click();
    if (qIndex + 1 >= queue.length) onFinish(); else setQIndex(qIndex + 1);
  };

  const choose = (opt) => {
    if (picked !== null || answers[qIndex] !== undefined) return;
    const answerField = (variant === "zh2en" || variant === "audio") ? "en" : "hanzi";
    const correct = opt[answerField] === w[answerField];
    /* Play the result sound before anything else — no state update or
       render work in front of it — so it fires the instant you tap. */
    correct ? chime(s.sound) : buzz(s.sound);
    setPicked(opt[answerField]);
    setAnswers((p) => ({ ...p, [qIndex]: opt[answerField] }));
    if (opt.hanzi) setTimeout(() => speak(opt.hanzi), 260);
    recordAnswer(w, correct);
    setStats((p) => ({ ...p, right: p.right + (correct ? 1 : 0), wrong: p.wrong + (correct ? 0 : 1) }));
    if (!correct && mode !== "quiz") {
      const q = [...queue];
      q.splice(Math.min(q.length, qIndex + 3), 0, { type: "quiz", word: w, variant: "en2zh" });
      setQueue(q);
    }
  };

  const header = (
    <div className="flex items-center justify-between mb-4 pt-6">
      <div className="flex items-center gap-2">
        <button onClick={() => { click(); setScreen("home"); }} className="bp-btn p-2.5 rounded-xl"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
          <I n="x" size={19} color={T.sub} />
        </button>
        <button onClick={() => { if (qIndex > 0) { click(); setQIndex(qIndex - 1); } }}
          className="bp-btn p-2.5 rounded-xl"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}`, opacity: qIndex > 0 ? 1 : 0.35 }}>
          <I n="back" size={19} color={T.sub} />
        </button>
      </div>
      <div className="flex-1 mx-3 h-2.5 rounded-full overflow-hidden" style={{ background: T.line }}>
        <div className="h-full rounded-full" style={{ width: `${(qIndex / queue.length) * 100}%`, background: accent, transition: "width .3s" }} />
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: accent + "1E" }}>
        <I n={mode === "quiz" ? "target" : "cards"} size={14} color={accent} />
        <span className="disp font-bold text-[13px]" style={{ color: accent }}>{left}</span>
      </div>
    </div>
  );

  /* --- LEARN CARD --- */
  if (item.type === "learn") {
    return (
      <div>
        {header}
        <div className="text-center mb-3 flex items-center justify-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-widest inline-block"
            style={{ background: accent + "1E", color: accent, transform: "rotate(-1.5deg)" }}>NEW WORD</span>
          {mode === "mixed" && wTopic && (
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black inline-flex items-center gap-1.5"
              style={{ background: wTopic.color + "1E", color: wTopic.color }}>
              <I n={wTopic.icon} size={12} color={wTopic.color} /> {wTopic.name}
            </span>
          )}
        </div>
        <div className="rounded-[34px] p-6 bp-pop relative overflow-hidden"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 7px 0 ${accent}40` }}>
          <div className="absolute top-0 left-0 right-0 h-2" style={{ background: accent }} />
          <div className="text-center pt-3">
            <Ruby zh={w.hanzi} pinyin={w.pinyin} size={46} pySize={15} color={accent} sub={T.text} />
            <div className="text-[16px] font-extrabold mt-3 mb-3" style={{ color: T.sub }}>{w.en}</div>
            <SpeakBtn text={w.hanzi} color={accent} T={T} label="Hear word" />
          </div>
          <div className="mt-6 pt-5" style={{ borderTop: `2px dashed ${T.line}` }}>
            <div className="text-[10px] font-black tracking-[.14em] mb-3" style={{ color: T.sub }}>USED IN CONTEXT</div>
            <Ruby zh={w.sZh} pinyin={w.sPy} size={24} pySize={11} color={accent} sub={T.text} center={false} />
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <SpeakBtn text={w.sZh} color={accent} T={T} label="Hear sentence" />
              {!showTrans && (
                <button onClick={() => { click(); setShowTrans(true); }}
                  className="bp-btn rounded-xl px-3 py-2 font-extrabold text-[12px]"
                  style={{ background: T.chip, color: T.sub, border: `2px solid ${T.line}` }}>
                  Show meaning
                </button>
              )}
            </div>
            {showTrans && <div className="text-[13px] font-bold mt-3 bp-rise" style={{ color: T.sub }}>{w.sEn}</div>}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          {answers[qIndex] === "learned" ? (
            <Chunky color={accent} full onClick={next}>Next</Chunky>
          ) : (
            <>
              <Ghost T={T} onClick={() => { click(); setAnswers((p) => ({ ...p, [qIndex]: "learned" })); markKnown(w); next(); }} style={{ flexShrink: 0 }}>Skip, I know it</Ghost>
              <Chunky color={accent} full onClick={() => {
                chime(s.sound);
                setAnswers((p) => ({ ...p, [qIndex]: "learned" }));
                addCard(w);
                setStats((p) => ({ ...p, learned: p.learned + 1 }));
                const q = [...queue];
                /* First test comes 3–5 cards later, not immediately —
                   the delay forces real retrieval instead of echo memory. */
                q.splice(Math.min(q.length, qIndex + 3 + Math.floor(Math.random() * 3)), 0,
                  { type: "quiz", word: w, variant: "en2zh" });
                /* Second, harder test lands at the very end of the session. */
                const hard = (w.sZh && w.sZh.includes(w.hanzi) && Math.random() < 0.5) ? "cloze" : "zh2en";
                q.push({ type: "quiz", word: w, variant: hard });
                setQueue(q);
                next();
              }}>Got it</Chunky>
            </>
          )}
        </div>
      </div>
    );
  }

  /* --- QUIZ CARD --- */
  const answerField = (variant === "zh2en" || variant === "audio") ? "en" : "hanzi";
  const correct = picked === w[answerField];
  const labels = {
    en2zh: "PICK THE CHINESE FOR", zh2en: "WHAT DOES THIS MEAN?",
    cloze: "FILL THE BLANK", audio: "WHAT DID YOU HEAR?",
  };

  const prompt = () => {
    if (variant === "en2zh") return <div className="disp font-bold text-[24px] leading-snug">{w.en}</div>;
    if (variant === "zh2en") return (
      <div className="flex flex-col items-center gap-3">
        <Ruby zh={w.hanzi} pinyin={w.pinyin} size={40} pySize={14} color={accent} sub={T.text} />
        <SpeakBtn text={w.hanzi} color={accent} T={T} label="Hear it" />
      </div>
    );
    if (variant === "audio") return (
      <button onClick={() => speak(w.hanzi)}
        className="bp-btn mx-auto w-[76px] h-[76px] rounded-full flex items-center justify-center"
        style={{ background: accent, boxShadow: `0 5px 0 ${shade(accent, -42)}` }}>
        <I n="volume" size={34} color="#fff" sw={2.3} />
      </button>
    );
    const gap = w.sZh.replace(w.hanzi, "＿＿");
    return (
      <div>
        <div className="disp font-bold text-[22px] leading-relaxed">{gap}</div>
        <div className="text-[12.5px] font-bold mt-2" style={{ color: T.sub }}>“{w.sEn}”</div>
      </div>
    );
  };

  return (
    <div>
      {header}
      {(mode === "quiz" || mode === "mixed") && wTopic && (
        <div className="flex justify-center mb-3">
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black inline-flex items-center gap-1.5"
            style={{ background: wTopic.color + "1E", color: wTopic.color }}>
            <I n={wTopic.icon} size={12} color={wTopic.color} /> {wTopic.name}
          </span>
        </div>
      )}
      <div className="rounded-[34px] p-6 mb-5 text-center bp-pop"
        style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 6px 0 ${T.line}` }}>
        <div className="text-[10.5px] font-black tracking-[.14em] mb-3" style={{ color: T.sub }}>{labels[variant]}</div>
        {prompt()}
      </div>

      <div className={((variant === "zh2en" || variant === "audio") ? "flex flex-col gap-2.5 " : "grid grid-cols-2 gap-3 ") + (picked && !correct ? "bp-shake" : "")}>
        {options.map((o) => {
          const val = o[answerField];
          const isRight = val === w[answerField];
          const isPicked = picked === val;
          let bg = T.card, bd = T.line, shadow = T.line;
          if (picked) {
            if (isRight) { bg = "#16C79A1F"; bd = "#16C79A"; shadow = "#16C79A66"; }
            else if (isPicked) { bg = "#FF5A5F1F"; bd = "#FF5A5F"; shadow = "#FF5A5F66"; }
          }
          return (
            <button key={val}
              onClick={() => {
                if (picked === null) { choose(o); return; }
                click();
                setRevealed((r) => (r === val ? null : val));
                if (o.hanzi) speak(o.hanzi);
              }}
              className="bp-btn rounded-[26px] py-3.5 px-3 flex items-center justify-center relative"
              style={{ background: bg, border: `2px solid ${bd}`, boxShadow: `0 5px 0 ${shadow}`, color: T.text, minHeight: 64 }}>
              {picked && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: T.chip }}>
                  <I n="help" size={10} color={T.sub} sw={2.6} />
                </div>
              )}
              {answerField === "hanzi"
                ? <Ruby zh={o.hanzi} pinyin={o.pinyin} size={24} pySize={10.5} color={T.sub} sub={T.text} gapClass="gap-x-0.5 gap-y-1" />
                : <div className="font-extrabold text-[14.5px]">{o.en}</div>}
            </button>
          );
        })}
      </div>

      {picked && revealed && (() => {
        const opt = options.find((o) => o[answerField] === revealed);
        if (!opt) return null;
        return (
          <div className="mt-3 rounded-[24px] p-4 bp-rise" style={{ background: T.chip, border: `2px solid ${T.line}` }}>
            <Ruby zh={opt.hanzi} pinyin={opt.pinyin} size={22} pySize={10} color={accent} sub={T.text} center={false} />
            <div className="text-[12.5px] font-bold mt-1" style={{ color: T.sub }}>{opt.en}</div>
            {opt.sZh && (
              <div className="mt-2.5 pt-2.5" style={{ borderTop: `2px dashed ${T.line}` }}>
                <Ruby zh={opt.sZh} pinyin={opt.sPy} size={16} pySize={9} color={accent} sub={T.text} center={false} />
                {opt.sEn && <div className="text-[11.5px] font-bold mt-1" style={{ color: T.sub }}>{opt.sEn}</div>}
              </div>
            )}
          </div>
        );
      })()}

      {picked && (
        <div className="mt-5 rounded-[30px] p-5 bp-rise"
          style={{ background: T.card, border: `2px solid ${correct ? "#16C79A66" : "#FF5A5F66"}`, boxShadow: `0 5px 0 ${T.line}` }}>
          <div className="flex items-center gap-2 font-black mb-1 text-[15px]" style={{ color: correct ? "#0CA678" : "#FF5A5F" }}>
            <I n={correct ? "check" : "x"} size={19} color={correct ? "#0CA678" : "#FF5A5F"} sw={3} />
            {correct ? "Correct" : "Not quite"}
          </div>
          {!correct && (
            <div className="mb-3 mt-2">
              <Ruby zh={w.hanzi} pinyin={w.pinyin} size={28} pySize={12} color={accent} sub={T.text} center={false} />
              <div className="text-[13px] font-extrabold mt-1.5" style={{ color: T.sub }}>{w.en}</div>
            </div>
          )}
          <div className="mt-3 pt-3" style={{ borderTop: `2px dashed ${T.line}` }}>
            <Ruby zh={w.sZh} pinyin={w.sPy} size={20} pySize={10} color={accent} sub={T.text} center={false} />
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <SpeakBtn text={w.sZh} color={accent} T={T} label="Hear sentence" />
              {!showTrans && (
                <button onClick={() => { click(); setShowTrans(true); }}
                  className="bp-btn rounded-xl px-3 py-2 font-extrabold text-[12px]"
                  style={{ background: T.chip, color: T.sub, border: `2px solid ${T.line}` }}>
                  Show meaning
                </button>
              )}
            </div>
            {showTrans && <div className="text-[13px] font-bold mt-2.5" style={{ color: T.sub }}>{w.sEn}</div>}
          </div>
          <div className="mt-4"><Chunky color={accent} full onClick={next}>Next</Chunky></div>
        </div>
      )}
    </div>
  );
}

/* ---------------- MATCH SPRINT ---------------- */
function Match({ state, T, s, click, setScreen, recordAnswer }) {
  const [pairs, setPairs] = useState(null);
  const [leftPick, setLeftPick] = useState(null);
  const [rightPick, setRightPick] = useState(null);
  const [solved, setSolved] = useState([]);
  const [misses, setMisses] = useState({});
  const [wrongFlash, setWrongFlash] = useState(null);
  const [startAt, setStartAt] = useState(Date.now());
  const [doneAt, setDoneAt] = useState(null);

  const deal = () => {
    const learned = Object.values(state.cards).filter((c) => !c.known && c.seen > 0);
    if (learned.length < 5) { setPairs({ locked: true, need: 5 - learned.length }); return; }
    const chosen = shuffle(learned).slice(0, 5);
    setPairs({ words: chosen, left: shuffle(chosen.map((c) => c.hanzi)), right: shuffle(chosen.map((c) => c.en)) });
    setSolved([]); setMisses({}); setDoneAt(null); setStartAt(Date.now());
    setLeftPick(null); setRightPick(null);
  };

  useEffect(() => { deal(); }, []);

  useEffect(() => {
    if (!leftPick || !rightPick || !pairs) return;
    const word = pairs.words.find((c) => c.hanzi === leftPick);
    if (word && word.en === rightPick) {
      chime(s.sound);
      speak(word.hanzi);
      const newSolved = [...solved, leftPick];
      setSolved(newSolved);
      recordAnswer(word, !misses[leftPick]);
      setLeftPick(null); setRightPick(null);
      if (newSolved.length === pairs.words.length) { setDoneAt(Date.now()); fanfare(s.sound); }
    } else {
      buzz(s.sound);
      setMisses((m) => ({ ...m, [leftPick]: true }));
      setWrongFlash(leftPick + rightPick);
      setTimeout(() => { setLeftPick(null); setRightPick(null); setWrongFlash(null); }, 450);
    }
  }, [leftPick, rightPick]);

  if (!pairs) return null;

  if (pairs.locked) {
    return (
      <div className="pt-16 text-center bp-rise">
        <div className="flex justify-center mb-5 opacity-70"><Panda size={96} /></div>
        <div className="disp font-bold text-[22px] mb-2">Not enough words yet</div>
        <div className="text-[13px] font-bold mb-8 px-6" style={{ color: T.sub }}>
          Learn {pairs.need} more word{pairs.need === 1 ? "" : "s"} and this game unlocks.
        </div>
        <Chunky color="#6FA3D8" full onClick={() => { click(); setScreen("home"); }}>Go learn some words</Chunky>
      </div>
    );
  }

  const secs = doneAt ? Math.round((doneAt - startAt) / 1000) : null;
  const missCount = Object.keys(misses).length;

  const tile = (val, side) => {
    const isSolved = side === "left"
      ? solved.includes(val)
      : solved.some((h) => pairs.words.find((w) => w.hanzi === h)?.en === val);
    const isPicked = side === "left" ? leftPick === val : rightPick === val;
    const flashing = wrongFlash && wrongFlash.includes(val);
    let bg = T.card, bd = T.line;
    if (isSolved) { bg = "#16C79A1A"; bd = "#16C79A55"; }
    else if (flashing) { bg = "#FF5A5F1F"; bd = "#FF5A5F"; }
    else if (isPicked) { bg = "#6FA3D81F"; bd = "#6FA3D8"; }
    const word = side === "left" ? pairs.words.find((w) => w.hanzi === val) : null;
    return (
      <button key={val} disabled={isSolved}
        onClick={() => { click(); side === "left" ? setLeftPick(val) : setRightPick(val); }}
        className={"bp-btn rounded-2xl py-3 px-2 w-full flex items-center justify-center " + (flashing ? "bp-shake" : "")}
        style={{ background: bg, border: `2px solid ${bd}`, boxShadow: isSolved ? "none" : `0 4px 0 ${bd === T.line ? T.line : bd + "66"}`, opacity: isSolved ? 0.5 : 1, minHeight: 62 }}>
        {side === "left"
          ? <Ruby zh={val} pinyin={word?.pinyin || ""} size={22} pySize={10} color={T.sub} sub={T.text} gapClass="gap-x-0.5 gap-y-1" />
          : <span className="font-extrabold text-[12.5px]">{val}</span>}
      </button>
    );
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => { click(); setScreen("home"); }} className="bp-btn p-2.5 rounded-xl"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
          <I n="x" size={19} color={T.sub} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "#16C79A1E" }}>
          <I n="puzzle" size={15} color="#0CA678" />
          <span className="disp font-bold text-[14px]" style={{ color: "#0CA678" }}>{solved.length}/{pairs.words.length}</span>
        </div>
      </div>

      {!doneAt ? (
        <>
          <div className="text-center disp font-bold text-[22px] mb-1">Match Sprint</div>
          <div className="text-center text-[13px] font-bold mb-6" style={{ color: T.sub }}>
            Tap a word on the left, then its meaning on the right.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2.5">{pairs.left.map((h) => tile(h, "left"))}</div>
            <div className="flex flex-col gap-2.5">{pairs.right.map((e) => tile(e, "right"))}</div>
          </div>
        </>
      ) : (
        <div className="text-center bp-rise pt-6">
          <div className="flex justify-center mb-5"><Panda size={110} /></div>
          <div className="disp font-bold text-[26px] mb-1">Board cleared!</div>
          <div className="grid grid-cols-2 gap-3 my-7">
            <div className="rounded-[26px] py-4" style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
              <div className="disp font-bold text-[22px] flex items-center justify-center gap-1.5">
                <I n="timer" size={19} color="#6FA3D8" />{secs}s
              </div>
              <div className="text-[11px] font-extrabold mt-0.5" style={{ color: T.sub }}>time</div>
            </div>
            <div className="rounded-[26px] py-4" style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
              <div className="disp font-bold text-[22px]">{5 - missCount}/5</div>
              <div className="text-[11px] font-extrabold mt-0.5" style={{ color: T.sub }}>clean matches</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Chunky color="#0CA678" full onClick={() => { click(); deal(); }}>New board</Chunky>
            <Ghost T={T} onClick={() => { click(); setScreen("home"); }}>Back home</Ghost>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- DONE ---------------- */
function Done({ stats, state, T, topic, mode, onAgain, setScreen, click, s }) {
  const total = stats.right + stats.wrong;
  const pct = total ? Math.round((stats.right / total) * 100) : 0;
  const goalHit = state.todayCount >= s.goal;
  const isQuiz = mode === "quiz";
  useEffect(() => { fanfare(s.sound); }, []);
  const confetti = React.useMemo(() =>
    Array.from({ length: 26 }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 0.7, dur: 2 + Math.random() * 1.6,
      color: [isQuiz ? "#7048E8" : (topic?.color || "#6FA3D8"), "#FFB020", "#16C79A", "#FF5A5F", "#6FA3D8"][i % 5],
      size: 6 + Math.random() * 6, round: Math.random() > 0.5,
    })), []);
  const grade = pct >= 90 ? "Brilliant!" : pct >= 70 ? "Solid work!" : pct >= 50 ? "Getting there" : "Tough round";

  return (
    <div className="pt-12 text-center bp-rise relative">
      {(goalHit || pct >= 80) && confetti.map((c, i) => (
        <div key={i} className="fixed pointer-events-none" style={{
          left: c.left + "%", top: 0, width: c.size, height: c.size * (c.round ? 1 : 1.6),
          background: c.color, borderRadius: c.round ? "50%" : 2,
          animation: `bpFall ${c.dur}s ${c.delay}s linear forwards`, zIndex: 30,
        }} />
      ))}
      <div className="flex justify-center mb-5"><Panda size={118} /></div>
      <div className="disp font-bold text-[28px] mb-1">{isQuiz ? grade : goalHit ? "Goal cleared!" : "Session complete"}</div>
      <div className="font-bold text-[13.5px] mb-7" style={{ color: T.sub }}>
        {isQuiz ? "Daily Quiz · topics mixed" : mode === "mixed" ? "Mixed practice · every topic" : topic?.name}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[["Score", pct + "%", null], [isQuiz ? "Correct" : "New words", isQuiz ? `${stats.right}/${total}` : stats.learned, null], ["Streak", state.streak, "flame"]].map(([l, v, ic]) => (
          <div key={l} className="rounded-[26px] py-4" style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
            <div className="disp font-bold text-[22px] flex items-center justify-center gap-1">
              {ic && <I n={ic} size={18} color="#FF7A45" fill="#FF7A45" />}{v}
            </div>
            <div className="text-[11px] font-extrabold mt-0.5" style={{ color: T.sub }}>{l}</div>
          </div>
        ))}
      </div>
      {goalHit && <div className="text-[13px] font-extrabold mb-4" style={{ color: T.sub }}>Goal's done for today. Another round anyway?</div>}
      <div className="flex flex-col gap-3">
        <Chunky color={isQuiz ? "#7048E8" : (topic?.color || "#6FA3D8")} full onClick={() => { click(); onAgain(); }}>
          {isQuiz ? "Another quiz" : "Keep going"}
        </Chunky>
        <Ghost T={T} onClick={() => { click(); setScreen("home"); }}>Back home</Ghost>
      </div>
    </div>
  );
}

/* ---------------- WORD BANK ---------------- */
function Glossary({ state, T, dark, s, toggleStar, removeCard, click, topicById, onFlash }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState("all");        // all | hanzi | pinyin | en
  const [statusF, setStatusF] = useState("all");  // all | learning | mastered | trouble | starred
  const [revealed, setRevealed] = useState({});
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState({});
  const [open, setOpen] = useState({});           // topicId -> bool (collapsed by default)

  const all = Object.values(state.cards);

  const statusOf = (c) =>
    c.known ? "known" : isLeech(c) ? "trouble" : isMastered(c) ? "mastered" : c.seen > 0 ? "learning" : "new";

  const counts = {
    all: all.length,
    learning: all.filter((c) => statusOf(c) === "learning" || statusOf(c) === "new").length,
    mastered: all.filter((c) => statusOf(c) === "mastered" || c.known).length,
    trouble: all.filter((c) => statusOf(c) === "trouble").length,
    starred: all.filter((c) => c.starred || (state.flags || {})[c.hanzi]).length,
  };

  const filtered = all.filter((c) => {
    const st = statusOf(c);
    if (statusF === "learning" && !(st === "learning" || st === "new")) return false;
    if (statusF === "mastered" && !(st === "mastered" || c.known)) return false;
    if (statusF === "trouble" && st !== "trouble") return false;
    if (statusF === "starred" && !(c.starred || (state.flags || {})[c.hanzi])) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return c.hanzi.includes(q) || (c.pinyin || "").toLowerCase().includes(t) || (c.en || "").toLowerCase().includes(t);
  });

  const searching = q.trim().length > 0;

  /* group + sort by pinyin so long lists are scannable */
  const groups = {};
  filtered.forEach((c) => { (groups[c.topicId] = groups[c.topicId] || []).push(c); });
  Object.values(groups).forEach((arr) => arr.sort((a, b) => (a.pinyin || "").localeCompare(b.pinyin || "")));
  const ids = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

  const anyOpen = ids.some((id) => open[id]);
  const isOpen = (id) => searching || statusF === "trouble" || !!open[id];

  const VIEWS = [["Everything", "all"], ["汉字", "hanzi"], ["Pīnyīn", "pinyin"], ["English", "en"]];
  const STATUS = [
    ["All", "all", T.sub], ["Learning", "learning", "#6FA3D8"], ["Mastered", "mastered", "#0CA678"],
    ["Trouble", "trouble", "#FF5A5F"], ["Starred", "starred", "#E8890C"],
  ];

  const selCount = Object.values(selected).filter(Boolean).length;
  const startFlash = () => {
    const deck = selCount > 0 ? filtered.filter((c) => selected[c.hanzi]) : filtered;
    if (deck.length === 0) return;
    onFlash(deck, view === "all" ? "hanzi" : view);
  };

  return (
    <div className="pt-6">
      <div className="disp font-bold text-[26px] mb-0.5">Word bank</div>
      <div className="text-[13px] font-bold mb-4" style={{ color: T.sub }}>
        {all.length} word{all.length === 1 ? "" : "s"} · your revision library
      </div>

      <div className="flex items-center gap-2.5 rounded-[22px] px-4 py-3 mb-3"
        style={{ background: T.card, border: `2px solid ${T.line}` }}>
        <I n="search" size={18} color={T.sub} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hanzi, pinyin or English"
          className="flex-1 font-bold outline-none bg-transparent text-[14px]" style={{ color: T.text }} />
        {q && (
          <button onClick={() => { click(); setQ(""); }}><I n="x" size={16} color={T.sub} /></button>
        )}
      </div>

      {/* status filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {STATUS.map(([label, v, col]) => {
          const on = statusF === v;
          return (
            <button key={v} onClick={() => { click(); setStatusF(v); }}
              className="bp-btn rounded-xl px-3 py-2 font-extrabold text-[12px]"
              style={{
                background: on ? col : T.card, color: on ? "#fff" : T.sub,
                border: `2px solid ${on ? col : T.line}`, boxShadow: `0 3px 0 ${on ? "rgba(0,0,0,.18)" : T.line}`,
              }}>
              {label} <span style={{ opacity: 0.75 }}>{counts[v]}</span>
            </button>
          );
        })}
      </div>

      {/* display + tools */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {VIEWS.map(([label, v]) => {
          const on = view === v;
          return (
            <button key={v} onClick={() => { click(); setView(v); setRevealed({}); }}
              className="bp-btn rounded-xl px-3 py-2 font-extrabold text-[12px]"
              style={{
                background: on ? "#2E4258" : T.card, color: on ? "#fff" : T.sub,
                border: `2px solid ${on ? "#2E4258" : T.line}`, boxShadow: `0 3px 0 ${T.line}`,
              }}>{label}</button>
          );
        })}
        <button onClick={() => { click(); setPicking(!picking); if (picking) setSelected({}); }}
          className="bp-btn rounded-xl px-3 py-2 font-extrabold text-[12px]"
          style={{
            background: picking ? "#7048E81F" : T.card, color: picking ? "#7048E8" : T.sub,
            border: `2px solid ${picking ? "#7048E866" : T.line}`, boxShadow: `0 3px 0 ${T.line}`,
          }}>
          {picking ? "Done" : "Pick"}
        </button>
        {ids.length > 1 && !searching && (
          <button onClick={() => {
            click();
            const next = {};
            if (!anyOpen) ids.forEach((id) => { next[id] = true; });
            setOpen(next);
          }}
            className="bp-btn rounded-xl px-3 py-2 font-extrabold text-[12px]"
            style={{ background: T.card, color: T.sub, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
            {anyOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {/* flashcard launcher */}
      {filtered.length > 0 && (
        <button onClick={() => { click(); startFlash(); }}
          className="bp-btn w-full rounded-[26px] p-4 mb-4 text-left text-white flex items-center gap-3"
          style={{ background: "linear-gradient(150deg,#7048E8,#8B5CF6)", boxShadow: "0 6px 0 #4C2FA8" }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.2)" }}>
            <I n="cards" size={23} color="#fff" sw={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="disp font-bold text-[16px] leading-tight">Flashcard me</div>
            <div className="text-[11.5px] font-bold opacity-90">
              {selCount > 0 ? `${selCount} picked` : `${filtered.length} shown`} · front:{" "}
              {view === "en" ? "English" : view === "pinyin" ? "pinyin" : "hanzi"}
            </div>
          </div>
          <I n="chevron" size={20} color="#fff" />
        </button>
      )}

      {(() => {
        const leeches = all.filter(isLeech);
        return statusF !== "trouble" && leeches.length > 0 && (
          <button onClick={() => { click(); setStatusF("trouble"); }}
            className="bp-btn w-full rounded-[26px] p-3.5 mb-4 text-left flex items-center gap-3"
            style={{ background: "#FF5A5F14", border: "2px solid #FF5A5F55", boxShadow: "0 5px 0 #FF5A5F33" }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#FF5A5F22" }}>
              <I n="bolt" size={20} color="#FF5A5F" fill="#FF5A5F" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="disp font-bold text-[15px] leading-tight" style={{ color: "#FF5A5F" }}>
                {leeches.length} trouble word{leeches.length === 1 ? "" : "s"}
              </div>
              <div className="text-[11.5px] font-bold" style={{ color: T.sub }}>You keep missing these — tap to focus on them.</div>
            </div>
            <I n="chevron" size={19} color="#FF5A5F" />
          </button>
        );
      })()}

      {filtered.length === 0 && (
        <div className="rounded-[26px] p-8 text-center" style={{ background: T.card, border: `2px solid ${T.line}` }}>
          <div className="flex justify-center mb-3 opacity-60"><Panda size={64} /></div>
          <div className="font-extrabold text-[13.5px]" style={{ color: T.sub }}>
            {all.length === 0 ? "Learn some words first — tap a topic on the Learn tab." : "Nothing matches these filters."}
          </div>
        </div>
      )}

      {/* topic folders */}
      {ids.map((id) => {
        const t = topicById(id);
        const words = groups[id];
        const done = words.filter((c) => isMastered(c)).length;
        const openNow = isOpen(id);
        return (
          <div key={id} className="mb-3 rounded-[26px] overflow-hidden"
            style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${openNow ? t.color + "40" : T.line}` }}>
            <button onClick={() => { click(); setOpen((p) => ({ ...p, [id]: !p[id] })); }}
              className="w-full flex items-center gap-3 p-4 text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.color + "1E" }}>
                <I n={t.icon} size={20} color={t.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="disp font-bold text-[16px] leading-tight truncate">{t.name}</div>
                <div className="text-[11.5px] font-bold mt-0.5" style={{ color: T.sub }}>
                  {words.length} word{words.length === 1 ? "" : "s"} · {done} mastered
                </div>
                <div className="h-[5px] rounded-full mt-1.5 overflow-hidden" style={{ background: T.chip }}>
                  <div className="h-full rounded-full" style={{ width: words.length ? (done / words.length) * 100 + "%" : 0, background: t.color }} />
                </div>
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); click(); onFlash(words, view === "all" ? "hanzi" : view); }}
                className="bp-btn w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
                style={{ background: "#7048E81A", border: "2px solid #7048E844" }}>
                <I n="cards" size={17} color="#7048E8" />
              </div>
              <I n="chevron" size={19} color={T.sub}
                style={{ transform: openNow ? "rotate(90deg)" : "none", transition: "transform .18s" }} />
            </button>

            {openNow && (
              <div className="flex flex-col gap-2.5 px-3 pb-3">
                {words.map((c) => {
                  const opened = view === "all" || revealed[c.hanzi];
                  const isSel = !!selected[c.hanzi];
                  return (
                    <div key={c.hanzi} className="rounded-[22px] p-3.5 flex items-center gap-3"
                      style={{
                        background: T.chip,
                        border: `2px solid ${isSel ? "#7048E8" : "transparent"}`,
                      }}>
                      {picking && (
                        <button onClick={() => { click(); setSelected((p) => ({ ...p, [c.hanzi]: !p[c.hanzi] })); }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: isSel ? "#7048E8" : T.card, border: `2px solid ${isSel ? "#7048E8" : T.line}` }}>
                          {isSel && <I n="check" size={13} color="#fff" sw={3.2} />}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          click();
                          if (view === "all") { speak(c.hanzi); return; }
                          setRevealed((p) => ({ ...p, [c.hanzi]: !p[c.hanzi] }));
                        }}
                        className="text-left flex-1 min-w-0">
                        {opened ? (
                          <>
                            <Ruby zh={c.hanzi} pinyin={c.pinyin} size={20} pySize={10} color={t.color} sub={T.text} center={false} gapClass="gap-x-1 gap-y-0.5" />
                            <div className="text-[12.5px] font-bold truncate mt-1" style={{ color: T.sub }}>{c.en}</div>
                          </>
                        ) : view === "hanzi" ? (
                          <div className="disp font-bold text-[21px]">{c.hanzi}</div>
                        ) : view === "pinyin" ? (
                          <div className="font-extrabold text-[16px]" style={{ color: t.color }}>{c.pinyin}</div>
                        ) : (
                          <div className="font-extrabold text-[15px]">{c.en}</div>
                        )}
                        <div className="flex items-center gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((b) => (
                            <div key={b} className="h-[5px] w-4 rounded-full" style={{ background: (c.known ? 5 : c.box) >= b ? t.color : T.card }} />
                          ))}
                          <span className="text-[10px] font-extrabold ml-1" style={{ color: T.sub }}>
                            {c.known ? "known"
                              : isMastered(c) ? "mastered"
                              : isLeech(c) ? "trouble"
                              : c.box >= MASTER_BOX ? `day ${(c.days || []).length}/${DAYS_TO_MASTER}`
                              : c.seen > 0 ? "learning" : "new"}
                          </span>
                        </div>
                      </button>
                      {view !== "all" && (
                        <button onClick={() => { click(); speak(c.hanzi); }} className="p-1.5">
                          <I n="volume" size={17} color={T.sub} />
                        </button>
                      )}
                      <button onClick={() => { click(); toggleStar(c.hanzi); }} className="p-1.5">
                        <I n="star" size={18} color={(c.starred || (state.flags || {})[c.hanzi]) ? "#FFB020" : T.sub} fill={(c.starred || (state.flags || {})[c.hanzi]) ? "#FFB020" : "none"} />
                      </button>
                      <button onClick={() => {
                        click();
                        if (window.confirm(`Remove ${c.hanzi} (${c.en})? It won't appear in quizzes again.`)) removeCard(c.hanzi);
                      }} className="p-1.5">
                        <I n="trash" size={17} color={T.sub} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <About T={T} dark={dark} />
    </div>
  );
}

/* ---------------- FLASHCARDS ---------------- */
function Flashcards({ deck, mode, T, s, click, setScreen, topicById, dark }) {
  const [order] = useState(() => shuffle(deck));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const c = order[i];
  useEffect(() => { setFlipped(false); }, [i]);
  useEffect(() => { if (done) fanfare(s.sound); }, [done]);

  if (!c) return null;
  const t = topicById(c.topicId);

  const advance = () => {
    if (i + 1 >= order.length) setDone(true); else setI(i + 1);
  };

  if (done) {
    return (
      <div className="pt-14 text-center bp-rise">
        <div className="flex justify-center mb-5"><Panda size={112} /></div>
        <div className="disp font-bold text-[27px] mb-1">Deck finished</div>
        <div className="font-bold text-[13px] mb-8" style={{ color: T.sub }}>
          {order.length} card{order.length === 1 ? "" : "s"} reviewed
        </div>
        <div className="flex flex-col gap-3">
          <Chunky color="#7048E8" full onClick={() => { click(); setI(0); setFlipped(false); setDone(false); }}>
            Run it again
          </Chunky>
          <Ghost T={T} onClick={() => { click(); setScreen("glossary"); }} style={{ width: "100%" }}>Back to word bank</Ghost>
        </div>
        <About T={T} dark={dark} />
      </div>
    );
  }

  const front = () => {
    if (mode === "hanzi") return <div className="disp font-bold text-[52px] tracking-wide">{c.hanzi}</div>;
    if (mode === "pinyin") return <div className="font-extrabold text-[32px]" style={{ color: t.color }}>{c.pinyin}</div>;
    return <div className="disp font-bold text-[27px] leading-snug px-2">{c.en}</div>;
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => { click(); setScreen("glossary"); }} className="bp-btn p-2.5 rounded-xl"
            style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
            <I n="x" size={19} color={T.sub} />
          </button>
          <button onClick={() => { if (i > 0) { click(); setI(i - 1); } }}
            className="bp-btn p-2.5 rounded-xl"
            style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}`, opacity: i > 0 ? 1 : 0.35 }}>
            <I n="back" size={19} color={T.sub} />
          </button>
        </div>
        <div className="flex-1 mx-3 h-2.5 rounded-full overflow-hidden" style={{ background: T.line }}>
          <div className="h-full rounded-full" style={{ width: `${(i / order.length) * 100}%`, background: "#7048E8", transition: "width .3s" }} />
        </div>
        <span className="disp font-bold text-[14px]" style={{ color: T.sub }}>{i + 1}/{order.length}</span>
      </div>

      <button
        onClick={() => {
          click();
          if (!flipped) { setFlipped(true); if (mode !== "en") speak(c.hanzi); }
          else advance();
        }}
        className="w-full rounded-[34px] p-7 mb-5 text-center bp-pop relative overflow-hidden"
        style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 7px 0 ${t.color}40`, minHeight: 260 }}>
        <div className="absolute top-0 left-0 right-0 h-2" style={{ background: t.color }} />
        <div className="flex flex-col items-center justify-center h-full gap-4 pt-4">
          {!flipped ? (
            <>
              {front()}
              <div className="text-[11.5px] font-extrabold mt-3" style={{ color: T.sub }}>tap to reveal</div>
            </>
          ) : (
            <div className="bp-rise w-full">
              <Ruby zh={c.hanzi} pinyin={c.pinyin} size={40} pySize={14} color={t.color} sub={T.text} />
              <div className="text-[16px] font-extrabold mt-3" style={{ color: T.sub }}>{c.en}</div>
              <div className="mt-5 pt-4" style={{ borderTop: `2px dashed ${T.line}` }}>
                <Ruby zh={c.sZh} pinyin={c.sPy} size={19} pySize={9.5} color={t.color} sub={T.text} />
                <div className="text-[12px] font-bold mt-2" style={{ color: T.sub }}>{c.sEn}</div>
              </div>
              <div className="text-[11.5px] font-extrabold mt-5" style={{ color: t.color }}>tap for next →</div>
            </div>
          )}
        </div>
      </button>

      <div className="flex justify-center gap-2">
        <SpeakBtn text={c.hanzi} color={t.color} T={T} label="Hear word" />
        {flipped && <SpeakBtn text={c.sZh} color={t.color} T={T} label="Hear sentence" />}
      </div>
    </div>
  );
}

/* ---------------- NOTES ---------------- */
function NotesList({ T, dark, click, notes, onOpen, onCreate, onTechStack }) {
  const sorted = [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-0.5">
        <div className="disp font-bold text-[26px]">Notes</div>
        <div className="flex items-center gap-2">
          <button onClick={() => { click(); onTechStack(); }} className="bp-btn px-3 py-2.5 rounded-xl flex items-center gap-1.5"
            style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
            <I n="code" size={15} color={T.sub} />
            <span className="font-extrabold text-[11.5px]" style={{ color: T.sub }}>How's this built?</span>
          </button>
          <button onClick={() => { click(); onCreate(); }} className="bp-btn p-2.5 rounded-xl"
            style={{ background: "#6FA3D8", boxShadow: "0 4px 0 #3E6D9C" }}>
            <I n="plus" size={19} color="#fff" />
          </button>
        </div>
      </div>
      <div className="text-[13px] font-bold mb-4" style={{ color: T.sub }}>
        {sorted.length} note{sorted.length === 1 ? "" : "s"} · 笔记
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-[26px] p-8 text-center" style={{ background: T.card, border: `2px solid ${T.line}` }}>
          <I n="pen" size={30} color={T.sub} />
          <div className="font-extrabold text-[14px] mt-3" style={{ color: T.text }}>No notes yet</div>
          <div className="text-[12.5px] font-bold mt-1" style={{ color: T.sub }}>Tap + to write your first note, in Chinese or English</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((n) => (
            <button key={n.id} onClick={() => { click(); onOpen(n.id); }}
              className="bp-btn w-full text-left rounded-[22px] p-4"
              style={{ background: T.card, border: `2px solid ${T.line}` }}>
              <div className="font-extrabold text-[15px] truncate" style={{ color: T.text }}>
                {n.title || "Untitled"}
              </div>
              <div className="text-[12.5px] font-bold mt-1 truncate" style={{ color: T.sub }}>
                {stripHtml(n.html) || "No additional text"}
              </div>
              <div className="text-[10.5px] font-bold mt-1.5" style={{ color: T.sub, opacity: 0.7 }}>
                {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteEditor({ note, T, dark, click, onBack, onSaveNote, onDeleteNote }) {
  const bodyRef = useRef(null);
  const saveTimer = useRef(null);
  const [title, setTitle] = useState(note.title || "");

  useEffect(() => {
    setTitle(note.title || "");
    if (bodyRef.current) bodyRef.current.innerHTML = note.html || "";
  }, [note.id]);

  const scheduleSave = (patch) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSaveNote(note.id, patch), 400);
  };

  const finish = () => {
    clearTimeout(saveTimer.current);
    onSaveNote(note.id, { title, html: bodyRef.current ? bodyRef.current.innerHTML : note.html });
    onBack();
  };

  const format = (cmd, value) => {
    if (!bodyRef.current) return;
    bodyRef.current.focus();
    document.execCommand(cmd, false, value);
    scheduleSave({ html: bodyRef.current.innerHTML });
  };

  const SIZES = [["Small", "2"], ["Normal", "3"], ["Large", "5"], ["Huge", "7"]];

  return (
    <div className="pt-6 pb-4">
      <style>{`#bp-note-body:empty:before{content:attr(data-placeholder);color:${T.sub}}`}</style>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { click(); finish(); }} className="bp-btn p-2.5 rounded-xl"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
          <I n="back" size={19} color={T.sub} />
        </button>
        <button onClick={() => { click(); if (window.confirm("Delete this note?")) onDeleteNote(note.id); }}
          className="bp-btn p-2.5 rounded-xl"
          style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 3px 0 ${T.line}` }}>
          <I n="trash" size={18} color="#FF5A5F" />
        </button>
      </div>

      <input value={title} onChange={(e) => { setTitle(e.target.value); scheduleSave({ title: e.target.value }); }}
        placeholder="Title" className="disp font-bold text-[22px] w-full bg-transparent outline-none mb-3"
        style={{ color: T.text }} />

      <div className="flex items-center gap-2 mb-3 flex-wrap rounded-2xl p-2"
        style={{ background: T.card, border: `2px solid ${T.line}` }}>
        <button onClick={() => format("bold")} className="bp-btn px-3.5 py-2 rounded-xl font-black text-[14px]"
          style={{ color: T.text, background: T.chip }}>B</button>
        <button onClick={() => format("italic")} className="bp-btn px-3.5 py-2 rounded-xl font-black italic text-[14px]"
          style={{ color: T.text, background: T.chip }}>I</button>
        <button onClick={() => format("underline")} className="bp-btn px-3.5 py-2 rounded-xl font-black underline text-[14px]"
          style={{ color: T.text, background: T.chip }}>U</button>
        <select onChange={(e) => format("fontSize", e.target.value)} defaultValue="3"
          className="bp-btn px-2.5 py-2 rounded-xl font-bold text-[12px] outline-none"
          style={{ color: T.text, background: T.chip }}>
          {SIZES.map(([label, v]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      <div id="bp-note-body" ref={bodyRef} contentEditable suppressContentEditableWarning
        onInput={() => scheduleSave({ html: bodyRef.current.innerHTML })}
        onBlur={() => scheduleSave({ html: bodyRef.current.innerHTML })}
        data-placeholder="Start typing in Chinese or English…"
        className="rounded-[22px] p-4 outline-none"
        style={{ background: T.card, border: `2px solid ${T.line}`, color: T.text, lineHeight: 1.7, minHeight: "50vh" }} />
    </div>
  );
}

/* ---------------- SETTINGS ---------------- */
function SettingsScreen({ state, update, T, dark, s, click, setBanner, onHelp, authUser, onSignOut }) {
  const set = (patch) => update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  const Seg = ({ options, value, onPick }) => (
    <div className="flex gap-2.5">
      {options.map(([label, v]) => {
        const on = value === v;
        return (
          <button key={String(label)} onClick={() => { click(); onPick(v); }}
            className="bp-btn flex-1 rounded-xl py-3 disp font-bold text-[15px]"
            style={{
              background: on ? "#6FA3D8" : T.card, color: on ? "#fff" : T.sub,
              border: `2px solid ${on ? "#6FA3D8" : T.line}`, boxShadow: `0 4px 0 ${on ? "#3E6D9C" : T.line}`,
            }}>{label}</button>
        );
      })}
    </div>
  );
  const Row = ({ label, hint, children }) => (
    <div className="rounded-[28px] p-4 mb-3.5" style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
      <div className="font-extrabold text-[14.5px] mb-3">{label}</div>
      {children}
      {hint && <div className="text-[11.5px] font-bold mt-2.5" style={{ color: T.sub }}>{hint}</div>}
    </div>
  );

  return (
    <div className="pt-6">
      <div className="disp font-bold text-[26px] mb-5">Settings</div>
      <Row label="Cards per session" hint="This is also your daily goal for the streak.">
        <div className="flex items-center gap-4">
          <input type="range" min={3} max={15} step={1} value={s.burst}
            onChange={(e) => { const v = Number(e.target.value); set({ burst: v, goal: v }); }}
            onPointerUp={() => click()}
            className="flex-1"
            style={{ accentColor: "#6FA3D8", height: 28 }} />
          <div className="disp font-bold text-[24px] w-12 text-center rounded-xl py-1"
            style={{ background: "#6FA3D814", color: "#6FA3D8" }}>{s.burst}</div>
        </div>
        <div className="flex justify-between text-[11px] font-extrabold mt-1 px-0.5" style={{ color: T.sub }}>
          <span>3 · quick hop</span><span>15 · deep dive</span>
        </div>
      </Row>
      <Row label="Appearance">
        <Seg options={[["Light", false], ["Dark", true]]} value={s.dark} onPick={(v) => set({ dark: v })} />
      </Row>
      <Row label="Sound">
        <Seg options={[["On", true], ["Off", false]]} value={s.sound} onPick={(v) => set({ sound: v })} />
      </Row>
      <Row label="Chinese font" hint="Used for all hanzi, headings and numbers. Every sample is drawn in its own font.">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ["ZCOOL XiaoWei", "elegant & slim"],
            ["ZCOOL KuaiLe", "bubbly & fun"],
            ["ZCOOL QingKe HuangYou", "bold & retro"],
            ["Noto Sans SC", "clean & neutral"],
            ["Noto Serif SC", "classic serif"],
            ["Ma Shan Zheng", "brush script"],
            ["Long Cang", "casual handwriting"],
            ["Liu Jian Mao Cao", "fast cursive"],
            ["Zhi Mang Xing", "flowing brush"],
          ].map(([f, note]) => {
            const on = (s.fontZh || "ZCOOL XiaoWei") === f;
            return (
              <button key={f} onClick={() => { click(); set({ fontZh: f }); }}
                className="bp-btn rounded-[22px] p-3 text-left"
                style={{
                  background: on ? "#6FA3D814" : T.chip,
                  border: `2px solid ${on ? "#6FA3D8" : T.line}`,
                  boxShadow: `0 3px 0 ${on ? "#6FA3D855" : T.line}`,
                }}>
                <div style={{ fontFamily: `'${f}'`, fontSize: 26, lineHeight: 1.15, color: T.text }}>学中文</div>
                <div style={{ fontFamily: `'${f}'`, fontSize: 13, color: on ? "#6FA3D8" : T.sub }}>面试 实习</div>
                <div className="text-[10.5px] font-bold mt-1.5" style={{ color: on ? "#6FA3D8" : T.sub }}>{note}</div>
              </button>
            );
          })}
        </div>
      </Row>
      <Row label="English font" hint="Used for labels, definitions and buttons.">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ["Space Grotesk", "quirky & techy"],
            ["Nunito", "rounded & friendly"],
            ["Quicksand", "soft & geometric"],
            ["Poppins", "modern & clean"],
            ["Outfit", "contemporary"],
            ["Plus Jakarta Sans", "polished"],
            ["DM Sans", "understated"],
            ["Figtree", "friendly-professional"],
            ["Manrope", "subtle character"],
            ["Fredoka", "playful & chunky"],
            ["Baloo 2", "big & bouncy"],
          ].map(([f, note]) => {
            const on = (s.fontEn || "Space Grotesk") === f;
            return (
              <button key={f} onClick={() => { click(); set({ fontEn: f }); }}
                className="bp-btn rounded-[22px] p-3 text-left"
                style={{
                  background: on ? "#6FA3D814" : T.chip,
                  border: `2px solid ${on ? "#6FA3D8" : T.line}`,
                  boxShadow: `0 3px 0 ${on ? "#6FA3D855" : T.line}`,
                }}>
                <div style={{ fontFamily: `'${f}'`, fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: T.text }}>Learn words</div>
                <div style={{ fontFamily: `'${f}'`, fontSize: 12, color: on ? "#6FA3D8" : T.sub }}>intern · mastered 12/30</div>
                <div className="text-[10.5px] font-bold mt-1.5" style={{ color: on ? "#6FA3D8" : T.sub }}>{note}</div>
              </button>
            );
          })}
        </div>
      </Row>
      <Row label="Shenzhen start date" hint="Powers the countdown and daily pace on your home screen.">
        <input type="date" value={s.szDate || "2027-01-01"} onChange={(e) => { click(); set({ szDate: e.target.value }); }}
          className="w-full rounded-xl px-4 py-3 font-extrabold text-[14px] outline-none"
          style={{ background: T.chip, color: T.text, border: `2px solid ${T.line}` }} />
      </Row>
      <Row label="Account" hint="Signed in with Google — your words, streak and notes sync automatically to every device you sign into.">
        <div className="flex items-center gap-3 mb-3">
          {authUser?.photo ? (
            <img src={authUser.photo} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#6FA3D81E", color: "#6FA3D8" }}>
              <span className="disp font-bold text-[16px]">{(authUser?.name || authUser?.email || "?").slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="font-extrabold text-[14px] truncate" style={{ color: T.text }}>{authUser?.name || "Signed in"}</div>
            <div className="text-[12px] font-bold truncate" style={{ color: T.sub }}>{authUser?.email}</div>
          </div>
        </div>
        <button onClick={() => { click(); onSignOut(); }}
          className="bp-btn rounded-xl py-3 px-4 font-extrabold w-full text-[14px]"
          style={{ background: T.chip, color: T.sub, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
          Sign out
        </button>
      </Row>
      <Row label="Help">
        <button onClick={() => { click(); onHelp(); }}
          className="bp-btn rounded-xl py-3 px-4 font-extrabold w-full text-[14px] flex items-center justify-center gap-2"
          style={{ background: T.chip, color: T.sub, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
          <I n="help" size={17} color={T.sub} /> How this app works
        </button>
      </Row>
      <Row label="Danger zone">
        <button onClick={() => {
          if (window.confirm("Erase all progress, streak and words?")) {
            update(() => ({
              streak: 0, lastDay: null, todayDate: todayStr(), todayCount: 0, cards: {}, topics: {},
              customTopics: [], pool: {}, curriculum: {}, flags: {}, hidden: [], onboarded: true, settings: s, recent: [],
            }));
            setBanner("Progress cleared.");
          }
        }}
          className="bp-btn rounded-xl py-3 px-4 font-extrabold w-full text-[14px]"
          style={{ background: "#FF5A5F14", color: "#FF5A5F", border: "2px solid #FF5A5F55", boxShadow: "0 4px 0 #FF5A5F33" }}>
          Clear all progress
        </button>
      </Row>
      <div className="text-center text-[11px] font-black tracking-[.15em] mt-7" style={{ color: T.sub }}>
        kuekachinese · test build
      </div>

      <About T={T} dark={dark} />
    </div>
  );
}
