// One primary path per question: patient group -> unit -> chapter. Scored from the correct answer and explanation first,
// then the lead-in, then the stem, so incidental history or distractors do not decide the chapter.
export const TX_VERSION = 'tax-2';
export const txR = (u, ch) => ch.map(([n, re]) => ({ unit: u, chapter: n, re: new RegExp(re, 'i') }));
export const TX_SYS = [
 ...txR('Cardiovascular', [['Acute coronary syndromes','myocardial infarction|\\bACS\\b|STEMI|troponin|angina|thrombolysis for MI'],['Heart failure','heart failure|cardiomyopathy|ejection fraction|pulmonary oedema'],['Arrhythmias','atrial fibrillation|tachycardia|bradycardia|heart block|supraventricular|Wolff|long QT|palpitation|cardioversion'],['Hypertension','hypertens'],['Valves, infection and congenital heart','murmur|stenosis|regurgitation|endocarditis|aortic dissection|congenital heart|ventricular septal|ductus|Kawasaki|rheumatic'],['Peripheral and venous disease','deep vein|\\bDVT\\b|peripheral arter|claudication|aneurysm|varicose|ischaemic limb'],['Lipids and risk prevention','cholesterol|statin|cardiovascular risk|lipid']]),
 ...txR('Respiratory', [['Asthma','asthma|wheez|salbutamol'],['COPD and smoking','COPD|emphysema|smoking cessation|chronic bronchitis'],['Pneumonia and respiratory infection','pneumonia|bronchiolitis|croup|tuberculosis|whooping|pertussis|epiglottitis'],['Pulmonary embolism','pulmonary embol|\\bCTPA\\b|\\bV/Q\\b'],['Pleural disease','pneumothorax|pleural effusion|empyema|chest drain'],['Lung cancer, ILD and occupational lung disease','lung cancer|interstitial lung|sarcoid|mesothelioma|asbestos|pulmonary fibrosis|bronchiectasis'],['Sleep, cystic fibrosis and cough','sleep apnoea|cystic fibrosis|chronic cough|haemoptysis|spirometry']]),
 ...txR('Gastroenterology and hepatology', [['Upper GI and oesophagus','oesophag|dyspepsia|peptic ulcer|haematemesis|\\bGORD\\b|reflux|achalasia|Barrett|pylori|dysphagia|gastric|Mallory'],['Liver, biliary and pancreas','cirrhosis|hepatitis|jaundice|cholecyst|biliary|cholangitis|pancreatitis|ascites|haemochromatosis|liver|gallstone'],['Bowel, IBD and coeliac','Crohn|ulcerative colitis|coeliac|irritable bowel|diverticul|colorectal|constipation|diarrhoea|gastroenteritis|faecal|bowel cancer|intussusception']]),
 ...txR('Renal and electrolytes', [['Electrolytes and acid-base','hyponatraemia|hyperkalaemia|hypokalaemia|hypernatraemia|acidosis|alkalosis|SIADH|hypercalcaemia|hypocalcaemia|dehydration'],['Acute kidney injury and CKD','acute kidney|chronic kidney|\\beGFR\\b|dialysis|nephrotic|nephritic|glomerul|haemolytic uraemic'],['Urinary tract and stones','urinary tract infection|pyelonephritis|renal colic|kidney stone|urolith|cystitis|enuresis|vesicoureteric']]),
 ...txR('Endocrine and diabetes', [['Diabetes','diabet|insulin|HbA1c|ketoacidosis|hypoglycaemi|metformin'],['Thyroid','thyroid|Graves|goitre|thyroxine|thyrotox'],['Adrenal and pituitary','Cushing|Addison|adrenal|pituitary|acromegaly|prolactin|hyperaldosteron|phaeochromocytoma|congenital adrenal'],['Bone and calcium','osteoporosis|parathyroid|vitamin D|Paget|rickets|osteomalacia']]),
 ...txR('Neurology', [['Febrile seizures','febrile convuls|febrile seizure'],['Epilepsy and non-febrile seizures','epilep|seizure|status epilepticus|anticonvuls|tonic-clonic|absence seizure|absence epilep'],['Stroke and TIA','stroke|\\bTIA\\b|transient ischaemic|carotid|thrombolysis|hemipar|dysphasia'],['Headache and neurological emergencies','migraine|headache|cluster|subarachnoid|giant cell|temporal arteritis|raised intracranial'],['Movement disorders','Parkinson|tremor|Huntington|dystonia|\\btics?\\b|chorea'],['Demyelinating and neuromuscular','multiple sclerosis|Guillain|myasthenia|motor neuron|neuropathy|Bell.?s palsy|muscular dystrophy|cerebral palsy'],['Spinal cord and nerve entrapment','cord compression|cauda equina|radiculopathy|carpal tunnel|sciatica|\\bnerve injury'],['Head injury','head injury|extradural|subdural|intracranial haem|\\bGCS\\b|concussion']]),
 ...txR('Haematology and oncology', [['Anaemia','anaemia|iron deficiency|B12|folate|thalassaem|sickle|haemolytic|ferritin'],['Bleeding, clotting and anticoagulation','warfarin|anticoag|heparin|thrombocytop|haemophilia|von Willebrand|\\bDIC\\b|bleeding disorder|\\bITP\\b|apixaban|rivaroxaban'],['Malignancy and chemotherapy','leukaemia|lymphoma|myeloma|cancer|carcinoma|tumour|chemotherapy|neutropen|metast|oncolog'],['Transfusion','transfusion|blood product']]),
 ...txR('Infectious diseases', [['Sepsis and serious bacterial infection','sepsis|meningitis|encephalitis|osteomyelitis|septic arthritis|cellulitis|necrotising|abscess|toxic shock'],['HIV and sexually transmitted infection','\\bHIV\\b|syphilis|chlamydia|gonorrh|\\bSTI\\b|hepatitis B|hepatitis C|herpes simplex|pelvic inflammatory'],['Travel and tropical medicine','malaria|dengue|travel|typhoid|tropical|Ross River|leptospir'],['Childhood infection and immunisation','measles|mumps|rubella|varicella|chickenpox|immunis|vaccin|hand, foot|slapped cheek|scarlet|glandular fever|mononucleosis'],['Antimicrobial choice','antibiotic|\\bMRSA\\b|resistan|flucloxacillin|ceftriaxone|amoxicillin']]),
 ...txR('Rheumatology and musculoskeletal', [['Inflammatory arthritis and connective tissue disease','rheumatoid|gout|psoriatic arthr|ankylosing|lupus|vasculitis|Sj.gren|scleroderma|systemic sclerosis|polymyalgia|juvenile idiopathic|Henoch'],['Osteoarthritis, back and chronic pain','osteoarthritis|back pain|chronic pain|fibromyalgia|bursitis|tendinopathy|plantar fasci']]),
 ...txR('Dermatology', [['Eczema, psoriasis and acne','eczema|dermatitis|psoriasis|acne|rosacea|urticaria|seborrh|lichen'],['Skin cancer and lesions','melanoma|basal cell|squamous cell carcinoma|naevus|actinic|keratos|dermoscop|skin cancer'],['Skin infection and infestation','impetigo|scabies|tinea|herpes zoster|shingles|wart|molluscum|head lice|fungal nail|onych'],['Blistering and drug rash','pemphig|Stevens|erythema multiforme|drug rash|DRESS|erythema nodosum']]),
 ...txR('Toxicology and emergency', [['Overdose and poisoning','overdose|poison|paracetamol|toxic|antidote|snake|envenom|carbon monoxide|organophosph|serotonin syndrome|tricyclic'],['Resuscitation, shock and anaphylaxis','cardiac arrest|resuscitation|anaphylaxis|shock|hypothermia|drowning|heat stroke|burns resus|airway obstruction']]),
 ...txR('Geriatrics and palliative care', [['Falls, frailty and polypharmacy','falls|frailty|polypharmacy|deprescrib|pressure injur|incontinence in older'],['Palliative care','palliative|end of life|terminal|syringe driver|advance care']]),
];
export const TX_SURG = [
 ...txR('General and gastrointestinal surgery', [['Acute abdomen','appendic|bowel obstruction|perforat|peritonit|volvulus|ischaemic bowel|strangulat'],['Hernia and anorectal','hernia|haemorrhoid|anal fissure|fistula|pilonidal|rectal prolapse'],['Burns, wounds and soft tissue','burn|wound|laceration|bite|foreign body|soft tissue|suturing']]),
 ...txR('Trauma and orthopaedics', [['Major trauma','trauma|ATLS|haemorrhagic shock|stab|blunt abdominal|splenic|spinal injury|pelvic fracture|tension pneumothorax'],['Fractures and joint injury','fracture|dislocation|sprain|cruciate|menisc|rotator cuff|Achilles|compartment syndrome|hip fracture|femoral neck'],['Paediatric orthopaedics','developmental dysplasia|slipped capital|Perthes|Osgood|limp|clubfoot|buckle']]),
 ...txR('Urology', [['Prostate and testis','prostate|\\bPSA\\b|testicular|torsion|epididymitis|scrot|hydrocele|\\bBPH\\b|urinary retention|phimosis|hypospadias|haematuria']]),
 ...txR('ENT', [['Ear','otitis|hearing loss|tinnitus|vertigo|Meniere|cholesteatoma|tympanic|otosclerosis'],['Nose, throat and neck','sinusitis|epistaxis|tonsill|quinsy|laryngeal|voice|thyroid nodule|neck lump|obstructive sleep']]),
 ...txR('Ophthalmology', [['Eye','red eye|glaucoma|cataract|retinal|uveitis|conjunctivitis|visual loss|macular|optic neuritis|corneal|diabetic retinopathy|orbital cellulitis']]),
 ...txR('Perioperative care and anaesthesia', [['Perioperative management','postoperative|perioperative|anaesthe|malignant hyperthermia|fasting|preoperative|PONV|wound infection']]),
];
export const TX_WOMEN = [
 ...txR('Early pregnancy', [['Ectopic pregnancy and miscarriage','ectopic|miscarriage|molar|first trimester|threatened|missed abortion|hyperemesis']]),
 ...txR('Antenatal care', [['Antenatal screening and complications','antenatal|gestational diabetes|pre-?eclampsia|rhesus|anti-D|fetal growth|placenta praevia|abruption|growth restriction|screening.*pregnan|oligohydramnios|twin|cholestasis|morphology scan']]),
 ...txR('Labour and birth', [['Labour, delivery and PPH','labour|\\bCTG\\b|induction|caesarean|shoulder dystocia|cord prolapse|partograph|postpartum haemorrhage|\\bPPH\\b|forceps|breech|preterm labour|membranes']]),
 ...txR('Postnatal care', [['Postnatal and breastfeeding','postnatal|puerperal|mastitis|lactation|breastfe|postpartum depression|postpartum thyroid']]),
 ...txR('Gynaecology', [['Menstrual and pelvic disorders','menorrhagia|heavy menstrual|amenorrh|endometriosis|fibroid|\\bPCOS\\b|polycystic|prolapse|pelvic pain|vaginal discharge|dysmenorrh|menopause|\\bHRT\\b|bacterial vaginosis|candid']]),
 ...txR('Contraception and fertility', [['Contraception and infertility','contracept|\\bIUD\\b|infertil|\\bIVF\\b|emergency contracept|implant|sterilis']]),
 ...txR('Gynaecological cancer and screening', [['Cervical screening and gynaecological cancer','cervical|\\bHPV\\b|ovarian cancer|endometrial cancer|colposcopy|\\bPap\\b|vulval']]),
 ...txR('Breast', [['Breast lump and cancer','breast lump|breast cancer|mastectomy|mammogra|nipple discharge|fibroadenoma']]),
];
export const TX_MENTAL = [
 ...txR('Mood disorders and suicide risk', [['Depression, bipolar and suicide','depress|bipolar|mania|suicid|self-harm|lithium|antidepressant|electroconvulsive|\\bECT\\b']]),
 ...txR('Anxiety and trauma', [['Anxiety, OCD and PTSD','anxiety|panic|\\bPTSD\\b|\\bOCD\\b|phobia|obsessive|adjustment|somatic|conversion|dissociat']]),
 ...txR('Psychosis', [['Schizophrenia and antipsychotics','schizo|psychos|psychotic|antipsychotic|hallucinat|clozapine|neuroleptic malignant|tardive']]),
 ...txR('Substance use', [['Alcohol and drug use','alcohol|opioid|methadone|benzodiazepine|cannabis|methamphet|withdrawal|Wernicke|naltrexone|nicotine|delirium tremens']]),
 ...txR('Cognitive disorders', [['Dementia and delirium','dementia|delirium|Alzheimer|Lewy|frontotemporal|cognitive impairment|\\bMMSE\\b']]),
 ...txR('Eating, personality and neurodevelopment', [['Eating disorders, personality and ADHD','anorexia nervosa|bulimia|personality|borderline|\\bADHD\\b|autism|conduct|oppositional']]),
 ...txR('Mental health law and capacity', [['Mental Health Act and capacity','mental health act|involuntary|compulsory treatment|capacity assessment|guardianship']]),
];
export const TX_POP = [
 ...txR('Ethics, consent and professional practice', [['Consent, capacity and confidentiality','consent|confidential|capacity|mandatory report|duty of care|disclos|medicolegal|complaint|conflict of interest|professional boundary|interpreter|open disclosure|incident']]),
 ...txR('Screening and prevention', [['Screening and prevention programs','screening|prevention|immunisation schedule|BreastScreen|bowel cancer screening|health check|lifestyle|smoking|obesity']]),
 ...txR('Epidemiology and statistics', [['Study design and measures','sensitivity|specificity|odds ratio|relative risk|number needed|cohort|case-control|randomised|\\bbias\\b|p-value|incidence|prevalence|study design|confidence interval|predictive value']]),
 ...txR('Indigenous, rural and public health', [['Aboriginal and rural health','Aboriginal|Torres Strait|Indigenous|rural|remote|notifiable|public health|outbreak|occupational|workplace|noise']]),
];
export const TX_CHILD_X = [
 ...txR('Neonatology', [['Neonatal jaundice, prematurity and distress','neonat|newborn|jaundice|prematur|respiratory distress|necrotising enterocolitis|apgar|hypoglycaemia in newborn|kernicterus|congenital']]),
 ...txR('Growth, development and nutrition', [['Growth, development and feeding','growth|developmental|milestone|failure to thrive|feeding|speech delay|toilet|vitamin|iron supplement|weaning']]),
 ...txR('Child protection', [['Safeguarding and abuse','non-accidental|child abuse|safeguard|neglect|shaken|mandatory report.*child|child protection']]),
];

TX_SYS.push(...txR('Rheumatology and musculoskeletal',[['Soft tissue and overuse injury','epicondylitis|tendin|osteitis pubis|ganglion|trigger finger|De Quervain|enthes']]),
 ...txR('Haematology and oncology',[['Haemolysis and blood film','haemoly|schistocyt|spherocyt|macroangiopathic|blood film']]),
 ...txR('Gastroenterology and hepatology',[['Structural and autoimmune bowel and liver disease','Hirschsprung|dumping|pyloric|malrotation|enterography|small bowel|mitochondrial|primary biliary|autoimmune hepatitis|stoma']]),
 ...txR('Infectious diseases',[['Parasitic and tropical infection','filaria|toxoplasm|hydatid|strongyloid|schistosom|helminth|giardia'],['HIV and sexually transmitted infection','NAAT|test of cure']]),
 ...txR('Toxicology and emergency',[['Toxidromes','toxidrome|anticholinergic|cholinergic|sympathomimetic|Jimson|mushroom'],['Resuscitation, shock and anaphylaxis','defibrillat|code blue|advanced life support|\\bALS\\b']]),
 ...txR('Renal and electrolytes',[['Urinary tract and stones','midstream urine|nitrofurantoin|trimethoprim|urine leak|incontinence']]));
TX_SURG.push(...txR('Ophthalmology',[['Eye','optic|vitreous|retinal|pupil|visual|\\beye\\b|ptic neuritis']]),
 ...txR('Perioperative care and anaesthesia',[['Perioperative management','\\bASA\\b|American Society of Anaesthesiologists']]),
 ...txR('Trauma and orthopaedics',[['Fractures and joint injury','splint|spica|arthroplasty|osteotomy|joint replacement']]));
TX_CHILD_X.push(...txR('Neonatology',[['Neonatal jaundice, prematurity and distress','indomethacin|patent ductus|neonate']]));
TX_MENTAL.push(...txR('Mood disorders and suicide risk',[['Depression, bipolar and suicide','sertraline|\\bSSRI\\b|antidepress']]),...txR('Psychosis',[['Schizophrenia and antipsychotics','thought pattern|loosening of associations|thought disorder|formal thought']]),...txR('Substance use',[['Alcohol and drug use','harm minimisation']]));
TX_WOMEN.push(...txR('Antenatal care',[['Antenatal screening and complications','imaging.*pregnan|radiation.*pregnan|congenital anomal']]));
export const TX_GROUP_UNIT_SURG = new Set(TX_SURG.map(r => r.unit));
export const txPreg = /\b(pregnan\w*|gestation\w*|antenatal|trimester|labour|postpartum|postnatal|breastfe\w*|lactat\w*|miscarriage|ectopic|menstrual|contracept\w*|vagin\w*|cervical screening|ovar\w*|endometri\w*|menopaus\w*|uterine|amenorrh\w*|fibroid)/i;
export function txChild(text) {
  const m = text.match(/\b(\d{1,2})[- ]years?[- ]old\b/i); if (m) return +m[1] < 18;
  if (/\b\d+[- ](month|week|day)s?[- ]old\b/i.test(text)) return true;
  if (/\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen)[- ]year[- ]old\b/i.test(text)) return true;
  return /\b(infant|toddler|newborn|neonate|schoolchild|paediatric)\b/i.test(text);
}
export function txScore(rows, ans, lead, stem) {
  let best = null;
  for (const r of rows) { const s = (r.re.test(ans) ? 3 : 0) + (r.re.test(lead) ? 2 : 0) + (r.re.test(stem) ? 1 : 0); if (s && (!best || s > best.s)) best = { ...r, s }; }
  return best;
}
export function tagQuestion(q) {
  const stem = String(q.question || ''), sent = stem.split(/(?<=[.?!])\s+/), lead = sent.slice(-2).join(' ');
  const ans = (q.options && q.answerIndex != null ? q.options[q.answerIndex] || '' : '') + ' ' + String(q.explanation || '').split(/(?<=[.!?])\s+/)[0].slice(0, 220);
  const child = txChild(stem), preg = txPreg.test(stem + ' ' + ans) && !(child && /\b\d+[- ](month|week|day)s?[- ]old|infant|toddler/i.test(stem));
  const cand = [];
  const add = (rows, group, force) => { const b = txScore(rows, ans, lead, stem); if (b) cand.push({ ...b, group: force || group }); };
  if (preg) add(TX_WOMEN, 'Women’s Health - O&G');
  else if (child) { add(TX_SYS, 'Child Health'); add(TX_SURG, 'Child Health'); add(TX_CHILD_X, 'Child Health'); add(TX_MENTAL, 'Child Health'); add(TX_POP, 'Population Health & Ethics'); }
  else { add(TX_SYS, 'Adult Health - Medicine'); const sg = txScore(TX_SURG, ans, lead, stem); if (sg) cand.push({ ...sg, group: 'Adult Health - Surgery' }); add(TX_MENTAL, 'Mental Health'); add(TX_POP, 'Population Health & Ethics'); if (txPreg.test(stem + ' ' + ans)) add(TX_WOMEN, 'Women’s Health - O&G'); }
  cand.sort((a, b) => b.s - a.s);
  const top = cand[0];
  const rival = !!top && cand.some(c => c !== top && c.unit !== top.unit);
  if (!top || top.s < 2) return { ...q, group: preg ? 'Women’s Health - O&G' : child ? 'Child Health' : 'Adult Health - Medicine', subject: preg ? 'Women’s Health - O&G' : child ? 'Child Health' : 'Adult Health - Medicine', unit: 'Unclassified', chapter: 'Needs classification', topic: 'Unclassified', classificationUncertain: true, taxVersion: TX_VERSION };
  let group = top.group; if (group === 'Adult Health - Medicine' && TX_GROUP_UNIT_SURG.has(top.unit)) group = 'Adult Health - Surgery';
  return { ...q, group, subject: group, unit: top.unit, chapter: top.chapter, topic: top.unit, classificationUncertain: !!(cand[1] && cand[1].s === top.s && cand[1].unit !== top.unit), taxVersion: TX_VERSION };
}
export function buildTree(questions, seen = new Set()) {
  const groups = new Map();
  for (const q of questions) {
    const g = q.group || 'Unclassified', u = q.unit || 'Unclassified', c = q.chapter || 'Needs classification';
    if (!groups.has(g)) groups.set(g, new Map()); const um = groups.get(g); if (!um.has(u)) um.set(u, new Map()); const cm = um.get(u);
    const e = cm.get(c) || { total: 0, unseen: 0 }; e.total++; if (!seen.has(q.id)) e.unseen++; cm.set(c, e);
  }
  const sum = (it) => it.reduce((a, x) => ({ total: a.total + x.total, unseen: a.unseen + x.unseen }), { total: 0, unseen: 0 });
  return [...groups].sort((a, b) => a[0].localeCompare(b[0])).map(([g, um]) => {
    const units = [...um].sort((a, b) => (a[0] === 'Unclassified') - (b[0] === 'Unclassified') || a[0].localeCompare(b[0])).map(([u, cm]) => {
      const chapters = [...cm].sort((a, b) => a[0].localeCompare(b[0])).map(([c, e]) => ({ name: c, key: g + '|' + u + '|' + c, ...e }));
      return { name: u, ...sum(chapters), chapters };
    });
    return { name: g, ...sum(units), units };
  });
}

export const txIsSelected = (paths, key) => paths.some(p => key === p || key.startsWith(p + '|'));
export const isSelected = txIsSelected;
export function txChildren(tree, key) {
  const parts = key.split('|');
  const g = tree.find(x => x.name === parts[0]); if (!g) return [];
  if (parts.length === 1) return g.units.map(u => g.name + '|' + u.name);
  const u = g.units.find(x => x.name === parts[1]); if (!u) return [];
  return parts.length === 2 ? u.chapters.map(c => c.key) : [];
}
export function toggleKey(tree, paths, key) {
  if (paths.includes(key)) return paths.filter(p => p !== key);
  const anc = paths.find(p => key.startsWith(p + '|'));
  if (anc) { // un-tick one child of a ticked parent: keep every other child ticked
    let out = paths.filter(p => p !== anc), cur = anc;
    while (cur !== key) { const kids = txChildren(tree, cur), next = kids.find(k => key === k || key.startsWith(k + '|')); out.push(...kids.filter(k => k !== next)); cur = next; }
    return out;
  }
  return [...paths.filter(p => !p.startsWith(key + '|')), key];
}
export function countSelected(tree, paths) {
  let n = 0; for (const g of tree) for (const u of g.units) for (const c of u.chapters) if (txIsSelected(paths, c.key)) n += c.total; return n;
}

