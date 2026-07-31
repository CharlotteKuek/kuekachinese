import React, { useState, useEffect, useCallback, useRef } from "react";

/* ============================================================
   kuekachinese · v5
   Fixes: learn cards now save + count. One topic list. Ruby pinyin.
   Sentence audio. Onboarding + help. AI "Add topic".
   ============================================================ */

const LEGACY_KEY = "bluepanda_v1";           // pre-profiles save
const PROFILES_KEY = "bp_profiles";           // { list: [names], active: name }
const keyFor = (name) => "bp_save__" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

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
  { id: "interview", name: "Interview & recruitment", zh: "面试求职", color: "#EC4899", icon: "briefcase" },
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

const PALETTE = ["#EC4899", "#7048E8", "#16C79A", "#FF7A45", "#E64980", "#0CA678", "#845EF7", "#1098AD", "#F0663A", "#3B5BDB"];

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
  ],
  work: [
    ["开会","kāihuì","to have a meeting","我们十点开会。","Wǒmen shí diǎn kāihuì.","We have a meeting at ten."],
    ["汇报","huìbào","to report to someone","我每周汇报一次。","Wǒ měi zhōu huìbào yí cì.","I report once a week."],
    ["项目","xiàngmù","project","这个项目很赶。","Zhège xiàngmù hěn gǎn.","This project is rushed."],
    ["截止","jiézhǐ","deadline / to be due","截止时间是周五。","Jiézhǐ shíjiān shì zhōuwǔ.","The deadline is Friday."],
    ["加班","jiābān","to work overtime","今天要加班。","Jīntiān yào jiābān.","I have to work overtime today."],
  ],
  pay: [
    ["扫码","sǎomǎ","to scan a QR code","扫码支付就行。","Sǎomǎ zhīfù jiù xíng.","Just scan the code to pay."],
    ["转账","zhuǎnzhàng","to transfer money","我给你转账。","Wǒ gěi nǐ zhuǎnzhàng.","I'll transfer it to you."],
    ["余额","yú'é","balance","我余额不够。","Wǒ yú'é bú gòu.","My balance isn't enough."],
    ["实名认证","shímíng rènzhèng","identity verification","要先做实名认证。","Yào xiān zuò shímíng rènzhèng.","You need to verify your identity first."],
  ],
  food: [
    ["点餐","diǎncān","to order food","我们先点餐吧。","Wǒmen xiān diǎncān ba.","Let's order first."],
    ["外卖","wàimài","food delivery","我叫了外卖。","Wǒ jiào le wàimài.","I ordered delivery."],
    ["买单","mǎidān","to pay the bill","我来买单。","Wǒ lái mǎidān.","I'll pay the bill."],
    ["微辣","wēilà","mildly spicy","要微辣，谢谢。","Yào wēilà, xièxie.","Mildly spicy please."],
  ],
  transit: [
    ["地铁","dìtiě","metro / subway","坐地铁比较快。","Zuò dìtiě bǐjiào kuài.","The metro is faster."],
    ["打车","dǎchē","to hail a ride","下雨了，我们打车吧。","Xià yǔ le, wǒmen dǎchē ba.","It's raining, let's get a ride."],
    ["导航","dǎoháng","navigation","我用手机导航。","Wǒ yòng shǒujī dǎoháng.","I'll navigate with my phone."],
    ["换乘","huànchéng","to transfer (lines)","在这一站换乘。","Zài zhè yí zhàn huànchéng.","Transfer at this station."],
  ],
  housing: [
    ["租房","zūfáng","to rent a place","我在找租房。","Wǒ zài zhǎo zūfáng.","I'm looking for a place to rent."],
    ["押金","yājīn","deposit","押金是一个月房租。","Yājīn shì yí gè yuè fángzū.","The deposit is one month's rent."],
    ["房东","fángdōng","landlord","房东人很好。","Fángdōng rén hěn hǎo.","The landlord is nice."],
    ["水电费","shuǐdiànfèi","utilities","水电费另算。","Shuǐdiànfèi lìng suàn.","Utilities are charged separately."],
  ],
  people: [
    ["同事","tóngshì","colleague","我的同事都很友好。","Wǒ de tóngshì dōu hěn yǒuhǎo.","My colleagues are all friendly."],
    ["领导","lǐngdǎo","boss / leadership","这个要问领导。","Zhège yào wèn lǐngdǎo.","We need to ask the boss about this."],
    ["部门","bùmén","department","我在技术部门。","Wǒ zài jìshù bùmén.","I'm in the tech department."],
    ["团队","tuánduì","team","我们团队有八个人。","Wǒmen tuánduì yǒu bā gè rén.","Our team has eight people."],
  ],
  comms: [
    ["沟通","gōutōng","to communicate","我们需要多沟通。","Wǒmen xūyào duō gōutōng.","We need to communicate more."],
    ["反馈","fǎnkuì","feedback","谢谢你的反馈。","Xièxie nǐ de fǎnkuì.","Thanks for your feedback."],
    ["确认","quèrèn","to confirm","请确认一下时间。","Qǐng quèrèn yíxià shíjiān.","Please confirm the time."],
    ["跟进","gēnjìn","to follow up","这件事我来跟进。","Zhè jiàn shì wǒ lái gēnjìn.","I'll follow up on this."],
  ],
  meetings: [
    ["讨论","tǎolùn","to discuss","这个我们再讨论。","Zhège wǒmen zài tǎolùn.","Let's discuss this further."],
    ["方案","fāng'àn","proposal / plan","我准备了两个方案。","Wǒ zhǔnbèi le liǎng gè fāng'àn.","I prepared two proposals."],
    ["目标","mùbiāo","goal","这个季度的目标是什么？","Zhège jìdù de mùbiāo shì shénme?","What's this quarter's goal?"],
    ["决定","juédìng","to decide","还没决定。","Hái méi juédìng.","It hasn't been decided yet."],
  ],
  commercial: [
    ["客户","kèhù","client / customer","客户很满意。","Kèhù hěn mǎnyì.","The client is satisfied."],
    ["市场","shìchǎng","market","中国市场很大。","Zhōngguó shìchǎng hěn dà.","The Chinese market is huge."],
    ["合作","hézuò","to cooperate","期待和你们合作。","Qīdài hé nǐmen hézuò.","Looking forward to working with you."],
    ["合同","hétong","contract","合同还没签。","Hétong hái méi qiān.","The contract isn't signed yet."],
  ],
  social: [
    ["请客","qǐngkè","to treat someone","今天我请客。","Jīntiān wǒ qǐngkè.","It's on me today."],
    ["客气","kèqì","polite / formal","别客气。","Bié kèqì.","Don't be so polite."],
    ["麻烦","máfan","to trouble someone","麻烦你了。","Máfan nǐ le.","Sorry to trouble you."],
    ["关系","guānxi","connections / relationship","他们关系很好。","Tāmen guānxi hěn hǎo.","They have a good relationship."],
  ],
};

const seedFor = (topicId) =>
  (SEED[topicId] || []).map((w) => ({
    hanzi: w[0], pinyin: w[1], en: w[2], sZh: w[3], sPy: w[4], sEn: w[5], topicId,
  }));

/* ---------------- helpers ---------------- */
const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const todayStr = () => new Date().toISOString().slice(0, 10);
const dayNum = () => Math.floor(Date.now() / 86400000);
const INTERVALS = [0, 1, 2, 4, 8, 16];
const MASTER_BOX = 4;
const TOPIC_ROW_CLS = "bp-btn w-full text-left rounded-[22px] p-4 flex items-center gap-3.5";
const TOPIC_TARGET = 30; // words mastered before a topic counts as done

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
  const n = parseInt((hex || "#EC4899").replace("#", ""), 16);
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
      <ellipse cx="26" cy="30" rx="14" ry="14" fill="#4A1030" />
      <ellipse cx="94" cy="30" rx="14" ry="14" fill="#4A1030" />
      <ellipse cx="26" cy="30" rx="7" ry="7" fill="#EC4899" opacity=".5" />
      <ellipse cx="94" cy="30" rx="7" ry="7" fill="#EC4899" opacity=".5" />
      <ellipse cx="60" cy="62" rx="42" ry="38" fill="#FDE6F1" />
      <ellipse cx="38" cy="55" rx="13" ry="15" fill="#EC4899" transform="rotate(-12 38 55)" />
      <ellipse cx="82" cy="55" rx="13" ry="15" fill="#EC4899" transform="rotate(12 82 55)" />
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
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const profileRef = useRef(null);
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

  const loadProfile = async (name) => {
    profileRef.current = name;
    setProfile(name);
    try {
      const _sv = localStorage.getItem(keyFor(name)); const r = _sv ? { value: _sv } : null;
      if (r && r.value) {
        const saved = applySave(JSON.parse(r.value));
        if (!saved.onboarded) setSheet("help");
      } else {
        applySave({});
        setSheet("help");
      }
    } catch (e) { applySave({}); setSheet("help"); }
    setScreen("home");
    try {
      const _pm = localStorage.getItem(PROFILES_KEY); const meta = _pm ? { value: _pm } : null;
      const m = meta && meta.value ? JSON.parse(meta.value) : { list: [], active: null };
      m.active = name;
      if (!m.list.includes(name)) m.list.push(name);
      setProfiles(m.list);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(m));
    } catch (e) {}
  };

  useEffect(() => {
    (async () => {
      let meta = null;
      try {
        const _pv = localStorage.getItem(PROFILES_KEY); const r = _pv ? { value: _pv } : null;
        if (r && r.value) meta = JSON.parse(r.value);
      } catch (e) {}

      if (!meta || !meta.list || meta.list.length === 0) {
        // first run on this device — carry over any pre-profiles save
        let legacy = null;
        try {
          const _lv = localStorage.getItem(LEGACY_KEY); const old = _lv ? { value: _lv } : null;
          if (old && old.value) legacy = JSON.parse(old.value);
        } catch (e) {}
        if (legacy) {
          const name = "Me";
          localStorage.setItem(keyFor(name), JSON.stringify(legacy));
          localStorage.setItem(PROFILES_KEY, JSON.stringify({ list: [name], active: name }));
          setProfiles([name]);
          await loadProfile(name);
        } else {
          setProfiles([]);
          setScreen("profile");   // ask who's using it
        }
      } else {
        setProfiles(meta.list);
        await loadProfile(meta.active || meta.list[0]);
      }
      setReady(true);
      pickVoice();
    })();
  }, []);

  /* functional update — avoids stale-state bugs on rapid taps */
  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev);
      stateRef.current = next;
      if (profileRef.current) { try { localStorage.setItem(keyFor(profileRef.current), JSON.stringify(next)); } catch(e) {} }
      return next;
    });
  }, []);

  const allTopics = [
    ...CORE_TOPICS.filter((t) => !(state.hidden || []).includes(t.id)),
    ...(state.customTopics || []),
  ];
  const topicById = (id) => allTopics.find((t) => t.id === id) || [...LIBRARY, ...CORE_TOPICS].find((t) => t.id === id) || CORE_TOPICS[0];

  const generateWords = async (topic, count, known, level) => {
    const prompt = `Generate ${count} Mandarin Chinese vocabulary items for this learner.

LEARNER: Singaporean NUS year-3 BUSINESS student. Speaks fluent conversational Mandarin but has weak vocabulary and struggles to hold a conversation past a minute. Starts a 6-month internship in Shenzhen in January at a technology company (software or hardware), likely in product management, product specialist, business development or marketing. So prioritise commercial, client-facing and cross-functional language; include the technical terms a non-engineer genuinely needs to follow engineers and talk about a product, but do NOT go deep into coding jargon. Wants to reach polished business Chinese.

Topic: "${topic.name}" (${topic.zh || ""})
Difficulty level: ${level} (1 = everyday basic, 5 = polished business register).
Do NOT include: ${known.slice(0, 60).join(", ") || "(none)"}

Use ONLY Simplified Chinese characters (简体字, zh-CN) everywhere — NEVER traditional (繁体字). The example sentence MUST contain the word exactly as written. Pinyin must use tone marks and have exactly one syllable per Chinese character, syllables separated by spaces where words break.

Respond with ONLY a JSON array:
[{"hanzi":"实习","pinyin":"shí xí","en":"internship","sZh":"我在深圳实习。","sPy":"Wǒ zài Shēn zhèn shí xí.","sEn":"I'm interning in Shenzhen."}]`;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim()).map((w) => ({ ...w, topicId: topic.id }));
  };

  /* ---------- word pool ----------
     One big AI call stocks ~24 words for a topic, cached to storage.
     Sessions then start instantly; the pool tops itself up in the
     background while you study, so you rarely see a loading screen. */
  const POOL_SIZE = 24;
  const fetching = useRef({});

  const availableWords = (topicId) => {
    const st = stateRef.current;
    const seen = new Set(Object.values(st.cards).filter((c) => c.topicId === topicId).map((c) => c.hanzi));
    const seeds = seedFor(topicId).filter((w) => !seen.has(w.hanzi));
    const pooled = ((st.pool || {})[topicId] || []).filter((w) => !seen.has(w.hanzi));
    return [...seeds, ...pooled];
  };

  const fetchIntoPool = async (topic, count) => {
    const st = stateRef.current;
    const exclude = [
      ...Object.values(st.cards).filter((c) => c.topicId === topic.id).map((c) => c.hanzi),
      ...((st.pool || {})[topic.id] || []).map((w) => w.hanzi),
      ...seedFor(topic.id).map((w) => w.hanzi),
    ];
    const mastered = Object.values(st.cards).filter((c) => c.topicId === topic.id && c.box >= MASTER_BOX).length;
    const level = Math.min(5, (topic.level || 1) + Math.floor(mastered / 12));
    const gen = await generateWords(topic, count, exclude, level);
    const fresh = gen.filter((g) => g && g.hanzi && !exclude.includes(g.hanzi));
    update((prev) => ({
      ...prev,
      pool: { ...(prev.pool || {}), [topic.id]: [...((prev.pool || {})[topic.id] || []), ...fresh] },
    }));
    return fresh;
  };

  /* background top-up — never blocks the UI */
  const prefetch = (topic) => {
    if (fetching.current[topic.id]) return;
    if (availableWords(topic.id).length >= 12) return;
    fetching.current[topic.id] = true;
    fetchIntoPool(topic, POOL_SIZE)
      .catch(() => {})
      .finally(() => { fetching.current[topic.id] = false; });
  };

  /* The full syllabus for a topic: exactly TOPIC_TARGET words, ranked by
     how much they'd help in a Shenzhen software internship. Cached per
     topic; new words also feed the teaching pool so the app teaches
     exactly what the dictionary promises. */
  const fetchCurriculum = async (topic) => {
    const st = stateRef.current;
    const existing = [
      ...seedFor(topic.id).map((w) => w.hanzi),
      ...Object.values(st.cards).filter((c) => c.topicId === topic.id).map((c) => c.hanzi),
      ...((st.pool || {})[topic.id] || []).map((w) => w.hanzi),
    ];
    const prompt = `Build the definitive ${TOPIC_TARGET}-word vocabulary syllabus for one topic, for this learner:

LEARNER: Singaporean NUS year-3 BUSINESS student. Speaks fluent conversational Mandarin but has weak vocabulary and struggles to hold a conversation past a minute. Starts a 6-month internship in Shenzhen in January at a technology company (software or hardware), likely in product management, product specialist, business development or marketing. So prioritise commercial, client-facing and cross-functional language; include the technical terms a non-engineer genuinely needs to follow engineers and talk about a product, but do NOT go deep into coding jargon. Wants to reach polished business Chinese.

TOPIC: "${topic.name}" (${topic.zh || ""})
Already in their materials (include these in the ${TOPIC_TARGET} and rank them properly, do not invent duplicates): ${existing.slice(0, 40).join(", ") || "(none)"}

Return EXACTLY ${TOPIC_TARGET} words ordered from MOST important to least important for this learner. Every word must be genuinely useful — "least important" still means worth knowing. Rank by: how often they'd hear or need it in meetings, client calls and day-to-day office life at a Shenzhen tech company in a business-side role; how badly they'd struggle without it; and how much it unlocks other language.

Use ONLY Simplified Chinese (简体字), never traditional. Pinyin uses tone marks, one syllable per character, syllables space-separated. The example sentence must contain the word exactly as written.

Give each word a "why" of at most 8 words saying when they'd use it.

Respond with ONLY a JSON array, ordered, no markdown:
[{"hanzi":"面试","pinyin":"miàn shì","en":"job interview","sZh":"我明天有一个面试。","sPy":"Wǒ míng tiān yǒu yí gè miàn shì.","sEn":"I have an interview tomorrow.","why":"Every application starts here"}]`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 6000, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const list = JSON.parse(text.replace(/```json|```/g, "").trim())
      .filter((w) => w && w.hanzi)
      .map((w) => ({ ...w, topicId: topic.id }));

    update((prev) => {
      const known = new Set(Object.values(prev.cards).filter((c) => c.topicId === topic.id).map((c) => c.hanzi));
      const pooled = (prev.pool || {})[topic.id] || [];
      const pooledSet = new Set([...pooled.map((w) => w.hanzi), ...seedFor(topic.id).map((w) => w.hanzi)]);
      const additions = list.filter((w) => !known.has(w.hanzi) && !pooledSet.has(w.hanzi));
      return {
        ...prev,
        curriculum: { ...(prev.curriculum || {}), [topic.id]: list },
        pool: { ...(prev.pool || {}), [topic.id]: [...pooled, ...additions] },
      };
    });
    return list;
  };

  const openDict = async (topic) => {
    click(s.sound);
    setActiveTopic(topic);
    setScreen("dict");
    if (!((stateRef.current.curriculum || {})[topic.id] || []).length) {
      setLoading(true);
      try { await fetchCurriculum(topic); }
      catch (e) { setBanner("Couldn't build the word list — check your connection."); }
      setLoading(false);
    }
  };

  const openTopic = async (topic) => {
    click(s.sound);
    setActiveTopic(topic);
    setMode("learn");
    const tState = stateRef.current.topics[topic.id] || {};
    if (!tState.triaged) {
      let words = availableWords(topic.id).slice(0, 10);
      if (words.length < 6) {
        setLoading(true);
        try { await fetchIntoPool(topic, POOL_SIZE); } catch (e) {}
        setLoading(false);
        words = availableWords(topic.id).slice(0, 10);
      }
      if (!words.length) { setBanner("Couldn't load words. Check your connection and retry."); setActiveTopic(null); return; }
      setQueue(words.map((w) => ({ type: "triage", word: w })));
      setQIndex(0);
      setScreen("triage");
      prefetch(topic);
    } else {
      buildSession(topic);
    }
  };

  const buildSession = async (topic) => {
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
      let fresh = availableWords(topic.id).slice(0, newNeeded);
      if (fresh.length === 0) {
        setLoading(true);
        try { await fetchIntoPool(topic, POOL_SIZE); } catch (e) {}
        setLoading(false);
        fresh = availableWords(topic.id).slice(0, newNeeded);
      }
      fresh.forEach((w) => items.push({ type: "learn", word: w }));
    }

    if (!items.length) { setBanner("All caught up here! Try the Daily Quiz or another topic."); setActiveTopic(null); return; }
    setMode("learn");
    setQueue(shuffle(items));
    setQIndex(0);
    setSessionStats({ right: 0, wrong: 0, learned: 0 });
    setScreen("session");
    prefetch(topic);
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
    ? { bg: "#1A0B14", card: "#2B1220", text: "#FDE6F1", sub: "#C88CA6", line: "#4A1F35", chip: "#33132A", hero: "linear-gradient(140deg,#BE185D,#EC4899 60%,#F472B6)" }
    : { bg: "#FFF0F7", card: "#FFFFFF", text: "#3D1230", sub: "#9C5C79", line: "#F7C6E0", chip: "#FDE6F1", hero: "linear-gradient(140deg,#EC4899,#F472B6 60%,#F9A8D4)" };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF0F7" }}>
        <div style={{ width: 38, height: 38, border: "4px solid #F7C6E0", borderTopColor: "#EC4899", borderRadius: "50%", animation: "bpSpin .8s linear infinite" }} />
        <style>{`@keyframes bpSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const switchProfile = async (name) => { click(s.sound); await loadProfile(name); setBanner(`Switched to ${name}`); };

  const createProfile = async (name) => {
    const clean = name.trim().slice(0, 20);
    if (!clean) return;
    if (profiles.some((p) => p.toLowerCase() === clean.toLowerCase())) { setBanner("That name's taken."); return; }
    click(s.sound);
    await loadProfile(clean);
  };

  const deleteProfile = async (name) => {
    try {
      localStorage.removeItem(keyFor(name));
      const rest = profiles.filter((p) => p !== name);
      setProfiles(rest);
      localStorage.setItem(PROFILES_KEY, JSON.stringify({ list: rest, active: rest[0] || null }));
      if (rest.length) await loadProfile(rest[0]); else { setProfile(null); profileRef.current = null; setScreen("profile"); }
      setBanner(`${name} deleted`);
    } catch (e) { setBanner("Couldn't delete that profile."); }
  };

  const shared = { state, update, T, dark, s, click: () => click(s.sound), setScreen, setBanner, topicById };

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

        {screen === "profile" && (
          <ProfileGate T={T} dark={dark} profiles={profiles} onPick={switchProfile} onCreate={createProfile}
            canCancel={!!profile} onCancel={() => setScreen("settings")} />
        )}
        {screen === "home" && (
          <Home {...shared} allTopics={allTopics} onTopic={openTopic} onQuiz={startDailyQuiz}
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
            onAgain={() => (mode === "quiz" ? startDailyQuiz() : buildSession(activeTopic))} />
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
            onCreate={createNote} />
        )}
        {screen === "noteEditor" && (state.notes || []).some((n) => n.id === activeNoteId) && (
          <NoteEditor {...shared} note={(state.notes || []).find((n) => n.id === activeNoteId)}
            onBack={() => setScreen("notes")} onSaveNote={saveNote} onDeleteNote={deleteNote} />
        )}
        {screen === "settings" && (
          <SettingsScreen {...shared} onHelp={() => setSheet("help")}
            profiles={profiles} profile={profile}
            onSwitchProfile={switchProfile} onDeleteProfile={deleteProfile}
            onAddProfile={() => setScreen("profile")} />
        )}
      </div>

      {sheet === "help" && (
        <HelpSheet T={T} onClose={() => { click(s.sound); setSheet(null); update((p) => ({ ...p, onboarded: true })); }} />
      )}
      {sheet === "add" && (
        <AddTopicSheet T={T} s={s} state={state} allTopics={allTopics} onClose={() => { click(s.sound); setSheet(null); }}
          onAdd={(t) => { addTopic(t); setSheet(null); }} />
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
    if (c.seen > 0) return { label: "learning", color: "#EC4899" };
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

/* ---------------- WHO'S STUDYING ---------------- */
function ProfileGate({ T, dark, profiles, onPick, onCreate, canCancel, onCancel }) {
  const [name, setName] = useState("");
  return (
    <div className="pt-16 pb-10">
      <div className="text-center mb-7">
        <img src={LOGO} alt="" className="mx-auto mb-4"
          style={{ width: 84, filter: dark ? "brightness(0) invert(1)" : "none", opacity: 0.9 }} />
        <div className="disp font-bold text-[27px] leading-tight">kuekachinese</div>
        <div className="text-[13px] font-bold mt-2 px-6" style={{ color: T.sub }}>
          {profiles.length ? "Who's studying?" : "What should I call you? Your words and streak are saved under this name."}
        </div>
      </div>

      {profiles.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-6">
          {profiles.map((p) => (
            <button key={p} onClick={() => onPick(p)}
              className="bp-btn rounded-[26px] px-5 py-4 text-left font-extrabold text-[15px] flex items-center gap-3"
              style={{ background: T.card, color: T.text, border: `2px solid ${T.line}`, boxShadow: `0 5px 0 ${T.line}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#EC48991E", color: "#EC4899" }}>
                <span className="disp font-bold text-[16px]">{p.slice(0, 1).toUpperCase()}</span>
              </div>
              {p}
              <div className="flex-1" />
              <I n="chevron" size={18} color={T.sub} />
            </button>
          ))}
        </div>
      )}

      <div className="rounded-[26px] p-4" style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 5px 0 ${T.line}` }}>
        <div className="text-[10.5px] font-black tracking-[.12em] mb-2.5" style={{ color: T.sub }}>
          {profiles.length ? "NEW PERSON" : "YOUR NAME"}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onCreate(name); }}
          placeholder="e.g. Charlotte" maxLength={20}
          className="w-full rounded-[22px] px-4 py-3 font-bold outline-none text-[15px] mb-3"
          style={{ background: T.chip, color: T.text, border: `2px solid ${T.line}` }} />
        <Chunky full color="#EC4899" disabled={!name.trim()} onClick={() => onCreate(name)}>
          Start learning
        </Chunky>
      </div>

      {canCancel && (
        <button onClick={onCancel} className="w-full mt-4 font-extrabold text-[13px]" style={{ color: T.sub }}>
          Cancel
        </button>
      )}

      <div className="text-[11px] font-bold text-center mt-6 px-6" style={{ color: T.sub }}>
        Sharing this app? Everyone adds their own name — progress never mixes.
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
            style={{ width: pct + "%", background: "linear-gradient(90deg,#EC4899,#7048E8)", transition: "width .25s linear" }} />
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
      style={{ background: "#3D1230", color: "#fff", maxWidth: "92vw" }}>
      <I n="sparkle" size={16} color="#FFB020" fill="#FFB020" /> {text}
    </div>
  );
}

function Chunky({ children, color = "#EC4899", onClick, full, style, disabled }) {
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
              style={{ background: on ? "#EC489916" : "transparent" }}>
              <I n={icon} size={21} color={on ? "#EC4899" : T.sub} sw={on ? 2.6 : 2} />
              <span className="text-[10.5px] font-extrabold" style={{ color: on ? "#EC4899" : T.sub }}>{label}</span>
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
    { icon: "cards", color: "#EC4899", t: "Tap a topic", d: "Meet new words." },
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

/* ---------------- ADD TOPIC SHEET ---------------- */
function AddTopicSheet({ T, s, state, allTopics, onClose, onAdd }) {
  const [ideas, setIdeas] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [custom, setCustom] = useState("");

  const existing = allTopics.map((t) => t.name);
  const cards = Object.values(state.cards);

  const suggest = async () => {
    setBusy(true); setErr(null);
    try {
      const mastered = allTopics.map((t) => {
        const c = cards.filter((x) => x.topicId === t.id);
        const m = c.filter(isMastered).length;
        return `${t.name}: ${c.length} words, ${c.length ? Math.round((m / c.length) * 100) : 0}% mastered`;
      }).join("; ");

      const prompt = `Singaporean NUS year-3 BUSINESS student. Speaks fluent conversational Mandarin but has weak vocabulary and struggles to hold a conversation past a minute. Starts a 6-month internship in Shenzhen in January at a technology company (software or hardware), likely in product management, product specialist, business development or marketing. So prioritise commercial, client-facing and cross-functional language; include the technical terms a non-engineer genuinely needs to follow engineers and talk about a product, but do NOT go deep into coding jargon. Wants to reach polished business Chinese.

Their current topics and progress: ${mastered || "none yet"}
Topics already on their list (do NOT repeat): ${existing.join(", ")}

Suggest 4 NEW vocabulary topics to study next. All Chinese text must be Simplified Chinese (简体字), never traditional. Include at least one "level 2" deeper version of a topic they've largely mastered (e.g. "Product & tech · advanced" covering specs, roadmaps and talking with engineers). Order them by what would help them most, soonest.

Pick each icon from EXACTLY this list: briefcase, home, train, qr, bowl, people, clipboard, code, chat, calendar, chart, martini, pen, bank, mail, med, bottle, cart, plane, trend, hash, key, book, globe, target, sparkle.

Respond with ONLY a JSON array:
[{"name":"Product roadmap & specs","zh":"产品规划","icon":"chart","level":2,"why":"You know the basics — this is how PMs actually talk."}]`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const arr = JSON.parse(text.replace(/```json|```/g, "").trim());
      setIdeas(arr.map((t, i) => ({
        ...t,
        id: "ai_" + t.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24),
        color: PALETTE[(allTopics.length + i) % PALETTE.length],
        icon: PATHS[t.icon] ? t.icon : "sparkle",
      })));
    } catch (e) {
      setErr("Couldn't reach the AI just now. Pick from the library below, or try again.");
    }
    setBusy(false);
  };

  useEffect(() => { suggest(); }, []);

  const library = [...CORE_TOPICS, ...LIBRARY].filter((t) => !allTopics.some((x) => x.id === t.id));

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center" style={{ background: "rgba(6,16,34,.5)" }} onClick={onClose}>
      <div className="bp-up w-full max-w-md rounded-t-[30px] p-5 pb-8 max-h-[88vh] overflow-y-auto"
        style={{ background: T.bg }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1.5 rounded-full mx-auto mb-4" style={{ background: T.line }} />
        <div className="disp font-bold text-[22px]">Add a topic</div>
        <div className="text-[12.5px] font-bold mb-5" style={{ color: T.sub }}>
          Picked for your Shenzhen internship and where you're at now
        </div>

        <div className="flex items-center gap-2 mb-3">
          <I n="sparkle" size={16} color="#7048E8" />
          <span className="font-extrabold text-[13px]" style={{ color: "#7048E8" }}>Suggested for you</span>
        </div>

        {busy && (
          <div className="rounded-[26px] p-6 flex flex-col items-center gap-3 mb-5" style={{ background: T.card, border: `2px solid ${T.line}` }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${T.line}`, borderTopColor: "#7048E8", borderRadius: "50%", animation: "bpSpin .8s linear infinite" }} />
            <div className="font-extrabold text-[12.5px]" style={{ color: T.sub }}>Thinking about what you need next…</div>
          </div>
        )}

        {err && <div className="rounded-2xl p-3 mb-4 font-bold text-[12.5px]" style={{ background: "#FF5A5F14", color: "#FF5A5F" }}>{err}</div>}

        {ideas && (
          <div className="flex flex-col gap-2.5 mb-5 stagger">
            {ideas.map((t) => (
              <button key={t.id} onClick={() => { click(s.sound); onAdd(t); }}
                className="bp-btn rounded-[26px] p-4 text-left flex gap-3 items-start"
                style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${t.color}40` }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: t.color + "1E" }}>
                  <I n={t.icon} size={22} color={t.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-[14px]">{t.name}</span>
                    {t.level > 1 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black" style={{ background: t.color + "22", color: t.color }}>
                        LEVEL {t.level}
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] font-bold" style={{ color: t.color }}>{t.zh}</div>
                  <div className="text-[12px] font-bold mt-1 leading-relaxed" style={{ color: T.sub }}>{t.why}</div>
                </div>
                <I n="plus" size={18} color={t.color} sw={2.6} />
              </button>
            ))}
          </div>
        )}

        {!busy && (
          <button onClick={() => { click(s.sound); suggest(); }}
            className="bp-btn w-full rounded-2xl py-3 font-extrabold text-[13px] mb-6"
            style={{ background: T.card, color: T.sub, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
            Suggest different topics
          </button>
        )}

        {library.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <I n="book" size={16} color={T.sub} />
              <span className="font-extrabold text-[13px]" style={{ color: T.sub }}>From the library</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {library.map((t) => (
                <button key={t.id} onClick={() => { click(s.sound); onAdd(t); }}
                  className="bp-btn rounded-[24px] p-3 text-left"
                  style={{ background: T.card, border: `2px solid ${T.line}`, boxShadow: `0 4px 0 ${T.line}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: t.color + "1E" }}>
                    <I n={t.icon} size={17} color={t.color} />
                  </div>
                  <div className="font-extrabold text-[12.5px] leading-tight">{t.name}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center gap-2 mb-2">
          <I n="pen" size={15} color={T.sub} />
          <span className="font-extrabold text-[13px]" style={{ color: T.sub }}>Or name your own</span>
        </div>
        <div className="flex gap-2.5 mb-4">
          <input value={custom} onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. talking to my landlord"
            className="flex-1 rounded-2xl px-4 py-3 font-bold outline-none text-[13.5px]"
            style={{ background: T.card, color: T.text, border: `2px solid ${T.line}` }} />
          <Chunky color="#EC4899" disabled={!custom.trim()}
            onClick={() => {
              const name = custom.trim();
              onAdd({
                id: "my_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 20),
                name, zh: "", icon: "sparkle", level: 1,
                color: PALETTE[allTopics.length % PALETTE.length],
              });
            }}>Add</Chunky>
        </div>
        <Ghost T={T} onClick={onClose} style={{ width: "100%" }}>Close</Ghost>
      </div>
    </div>
  );
}

/* ---------------- HOME ---------------- */
function Home({ state, T, dark, s, allTopics, onTopic, onQuiz, onMatch, onHelp, onAdd, onDeleteTopic, onDict, click }) {
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

  const statsFor = (id) => {
    const c = cards.filter((x) => x.topicId === id);
    const m = c.filter(isMastered).length;
    return { seen: c.length, mastered: m, pct: Math.min(100, Math.round((m / TOPIC_TARGET) * 100)) };
  };

  const focus = allTopics
    .map((t) => ({ t, ...statsFor(t.id) }))
    .filter((x) => x.pct < 100)
    .sort((a, b) => b.mastered - a.mastered)[0] || { t: allTopics[0], ...statsFor(allTopics[0].id) };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-4">
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
          <GoalRing pct={focus.pct} done={focus.mastered} goal={TOPIC_TARGET} label="MASTERED" />
          <div className="text-white min-w-0">
            <div className="text-[10px] font-black tracking-[.14em] opacity-80">CURRENTLY ON</div>
            <div className="disp font-bold text-[18px] leading-tight truncate">{focus.t.name}</div>
            <div className="text-[12.5px] font-bold opacity-90">
              {focus.pct >= 100 ? "Topic complete!"
                : focus.pct >= 75 ? `Almost there — ${TOPIC_TARGET - focus.mastered} words left`
                : `${TOPIC_TARGET - focus.mastered} more words to finish this topic`}
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

      {/* Shenzhen countdown */}
      <ShenzhenCard T={T} s={s} mastered={mastered} dark={dark} />

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
                    {st.seen === 0 ? "Not started yet"
                      : st.pct >= 100 ? "Complete — all 30 mastered"
                      : `${st.mastered} / ${TOPIC_TARGET} mastered · ${st.seen} seen`}
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
        style={{ background: "rgba(255,255,255,.14)", color: "#fff", fontSize: 26, minWidth: 46, textAlign: "center" }}>
        {v}
      </div>
      <div className="text-[9px] font-black tracking-[.12em] mt-1" style={{ color: "rgba(255,255,255,.6)" }}>{l}</div>
    </div>
  );

  return (
    <div className="rounded-[32px] p-5 mb-6 relative overflow-hidden"
      style={{ background: "linear-gradient(140deg,#0E1E3C,#1B3A6B 60%,#245089)", boxShadow: "0 10px 24px rgba(10,27,51,.4)" }}>
      {/* stars */}
      {[[12, 18], [58, 12], [88, 30], [30, 8], [72, 46]].map(([x, y], i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: x + "%", top: y, width: 3, height: 3, background: "#fff", opacity: 0.35,
        }} />
      ))}

      {/* logo + clock, no bouncing */}
      <div className="relative flex items-center gap-3 mb-4">
        <img src={LOGO} alt="" style={{ width: 54, filter: "brightness(0) invert(1)", opacity: 0.95 }} />
        <div className="flex-1">
          <div className="text-[9.5px] font-black tracking-[.16em]" style={{ color: "#F9A8D4" }}>
            TOUCHDOWN IN SHENZHEN
          </div>
          <div className="text-[11.5px] font-bold mt-0.5" style={{ color: "rgba(255,255,255,.6)" }}>
            {target.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,.12)" }}>
          <I n="clock" size={24} color="#F9A8D4" sw={2} />
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Unit v={days} l="DAYS" />
            <span className="disp font-bold text-white opacity-40 pb-4">:</span>
            <Unit v={pad(hrs)} l="HRS" />
            <span className="disp font-bold text-white opacity-40 pb-4">:</span>
            <Unit v={pad(mins)} l="MIN" />
          </div>
        </div>
      </div>

      <div className="relative mt-3.5 pt-3 flex items-center gap-2" style={{ borderTop: "1.5px dashed rgba(255,255,255,.2)" }}>
        <I n="target" size={15} color="#F9A8D4" />
        <div className="text-[11.5px] font-bold" style={{ color: "rgba(255,255,255,.8)" }}>
          {left === 0
            ? `${GOAL}-word goal smashed — 你准备好了!`
            : <>Master <b style={{ color: "#fff" }}>~{perDay}/day</b> to land with {GOAL} words ({mastered} done)</>}
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
        style={{ background: "#EC4899", color: "#fff" }}>
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
  const item = queue[qIndex];
  const accent = mode === "quiz" ? "#7048E8" : (topic?.color || "#EC4899");
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
    setPicked(opt[answerField]);
    setAnswers((p) => ({ ...p, [qIndex]: opt[answerField] }));
    correct ? ding(s.sound) : buzz(s.sound);
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
        <div className="text-center mb-3">
          <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-widest inline-block"
            style={{ background: accent + "1E", color: accent, transform: "rotate(-1.5deg)" }}>NEW WORD</span>
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
      {mode === "quiz" && wTopic && (
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
            <button key={val} onClick={() => choose(o)}
              className="bp-btn rounded-[26px] py-3.5 px-3 flex items-center justify-center"
              style={{ background: bg, border: `2px solid ${bd}`, boxShadow: `0 5px 0 ${shadow}`, color: T.text, minHeight: 64 }}>
              {answerField === "hanzi"
                ? <Ruby zh={o.hanzi} pinyin={o.pinyin} size={24} pySize={10.5} color={T.sub} sub={T.text} gapClass="gap-x-0.5 gap-y-1" />
                : <div className="font-extrabold text-[14.5px]">{o.en}</div>}
            </button>
          );
        })}
      </div>

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
      ding(s.sound);
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
        <Chunky color="#EC4899" full onClick={() => { click(); setScreen("home"); }}>Go learn some words</Chunky>
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
    else if (isPicked) { bg = "#EC48991F"; bd = "#EC4899"; }
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
                <I n="timer" size={19} color="#EC4899" />{secs}s
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
      color: [isQuiz ? "#7048E8" : (topic?.color || "#EC4899"), "#FFB020", "#16C79A", "#FF5A5F", "#EC4899"][i % 5],
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
        {isQuiz ? "Daily Quiz · topics mixed" : topic?.name}
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
        <Chunky color={isQuiz ? "#7048E8" : (topic?.color || "#EC4899")} full onClick={onAgain}>
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
    ["All", "all", T.sub], ["Learning", "learning", "#EC4899"], ["Mastered", "mastered", "#0CA678"],
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
                background: on ? "#3D1230" : T.card, color: on ? "#fff" : T.sub,
                border: `2px solid ${on ? "#3D1230" : T.line}`, boxShadow: `0 3px 0 ${T.line}`,
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
function NotesList({ T, dark, click, notes, onOpen, onCreate }) {
  const sorted = [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-0.5">
        <div className="disp font-bold text-[26px]">Notes</div>
        <button onClick={() => { click(); onCreate(); }} className="bp-btn p-2.5 rounded-xl"
          style={{ background: "#EC4899", boxShadow: "0 4px 0 #BE185D" }}>
          <I n="plus" size={19} color="#fff" />
        </button>
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
function SettingsScreen({ state, update, T, dark, s, click, setBanner, onHelp, profiles, profile, onSwitchProfile, onDeleteProfile, onAddProfile }) {
  const set = (patch) => update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  const Seg = ({ options, value, onPick }) => (
    <div className="flex gap-2.5">
      {options.map(([label, v]) => {
        const on = value === v;
        return (
          <button key={String(label)} onClick={() => { click(); onPick(v); }}
            className="bp-btn flex-1 rounded-xl py-3 disp font-bold text-[15px]"
            style={{
              background: on ? "#EC4899" : T.card, color: on ? "#fff" : T.sub,
              border: `2px solid ${on ? "#EC4899" : T.line}`, boxShadow: `0 4px 0 ${on ? "#BE185D" : T.line}`,
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
            style={{ accentColor: "#EC4899", height: 28 }} />
          <div className="disp font-bold text-[24px] w-12 text-center rounded-xl py-1"
            style={{ background: "#EC489914", color: "#EC4899" }}>{s.burst}</div>
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
                  background: on ? "#EC489914" : T.chip,
                  border: `2px solid ${on ? "#EC4899" : T.line}`,
                  boxShadow: `0 3px 0 ${on ? "#EC489955" : T.line}`,
                }}>
                <div style={{ fontFamily: `'${f}'`, fontSize: 26, lineHeight: 1.15, color: T.text }}>学中文</div>
                <div style={{ fontFamily: `'${f}'`, fontSize: 13, color: on ? "#EC4899" : T.sub }}>面试 实习</div>
                <div className="text-[10.5px] font-bold mt-1.5" style={{ color: on ? "#EC4899" : T.sub }}>{note}</div>
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
                  background: on ? "#EC489914" : T.chip,
                  border: `2px solid ${on ? "#EC4899" : T.line}`,
                  boxShadow: `0 3px 0 ${on ? "#EC489955" : T.line}`,
                }}>
                <div style={{ fontFamily: `'${f}'`, fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: T.text }}>Learn words</div>
                <div style={{ fontFamily: `'${f}'`, fontSize: 12, color: on ? "#EC4899" : T.sub }}>intern · mastered 12/30</div>
                <div className="text-[10.5px] font-bold mt-1.5" style={{ color: on ? "#EC4899" : T.sub }}>{note}</div>
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
      <Row label="Who's studying" hint="Each name keeps its own words, streak and progress on this device.">
        <div className="flex flex-col gap-2">
          {profiles.map((p) => {
            const on = p === profile;
            return (
              <div key={p} className="flex items-center gap-2">
                <button onClick={() => { if (!on) onSwitchProfile(p); }}
                  className="bp-btn flex-1 rounded-[22px] px-4 py-3 text-left font-extrabold text-[14px]"
                  style={{
                    background: on ? "#EC489914" : T.chip, color: on ? "#EC4899" : T.sub,
                    border: `2px solid ${on ? "#EC4899" : T.line}`, boxShadow: `0 3px 0 ${on ? "#EC489944" : T.line}`,
                  }}>
                  {p} {on && <span className="text-[11px]">· active</span>}
                </button>
                {profiles.length > 1 && (
                  <button onClick={() => {
                    click();
                    if (window.confirm(`Delete profile "${p}" and all of its progress? This can't be undone.`)) onDeleteProfile(p);
                  }} className="p-2.5 rounded-xl" style={{ background: "#FF5A5F14", border: "2px solid #FF5A5F44" }}>
                    <I n="trash" size={16} color="#FF5A5F" />
                  </button>
                )}
              </div>
            );
          })}
          <button onClick={() => { click(); onAddProfile(); }}
            className="bp-btn rounded-[22px] px-4 py-3 font-extrabold text-[13px] flex items-center justify-center gap-2"
            style={{ background: T.card, color: T.sub, border: `2px dashed ${T.sub}66`, boxShadow: `0 3px 0 ${T.line}` }}>
            <I n="plus" size={16} color={T.sub} sw={2.6} /> Add another person
          </button>
        </div>
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
