from typing import Dict, Any, List, Optional

CYP_DEFINITIONS = {
    "CYP1A2": {
        "name": "Cytochrome P450 1A2",
        "description": "Responsible for ~13% of hepatic drug clearance including methylxanthines (caffeine), theophylline, clozapine, and tacrine. Modulated strongly by polycyclic aromatic hydrocarbons and brassica vegetables."
    },
    "CYP2C9": {
        "name": "Cytochrome P450 2C9",
        "description": "Primary clearance isoform for narrow therapeutic index drugs including S-warfarin, phenytoin, glipizide, and NSAIDs. Susceptible to serious bleeding risks when inhibited."
    },
    "CYP2C19": {
        "name": "Cytochrome P450 2C19",
        "description": "Crucial polymorphic enzyme required for bioactivation of clopidogrel prodrug into active platelet inhibitor, as well as clearance of proton pump inhibitors (omeprazole) and diazepam."
    },
    "CYP2D6": {
        "name": "Cytochrome P450 2D6",
        "description": "Metabolizes ~25% of all clinical drugs (beta-blockers, antiarrhythmics, codeine bioactivation, tricyclic antidepressants). Non-inducible enzyme with marked genetic polymorphism."
    },
    "CYP3A4": {
        "name": "Cytochrome P450 3A4",
        "description": "The predominant human hepatic and intestinal metabolic enzyme, handling >50% of prescription pharmaceuticals including statins (simvastatin, atorvastatin), calcium channel blockers, and immunosuppressants. Mechanism-based inactivation by dietary furanocoumarins produces severe bioavailability spikes."
    },
    "CYP2E1": {
        "name": "Cytochrome P450 2E1",
        "description": "Bioactivates acetaminophen into hepatotoxic NAPQI; clears ethanol and volatile halogenated anesthetics. Induced chronically by ethanol and fasting, inhibited by watercress isothiocyanates and garlic organosulfurs."
    },
    "CYP2B6": {
        "name": "Cytochrome P450 2B6",
        "description": "Metabolizes ~4-8% of clinical drugs, critically including bupropion, efavirenz, methadone, ketamine, and cyclophosphamide. Induced via CAR nuclear receptor activation by St. John's Wort."
    }
}

CYP_DETAILED_CATALOG = {
    "CYP3A4": {
        "symbol": "CYP3A4",
        "name": "Cytochrome P450 Family 3 Subfamily A Member 4",
        "category": "Cytochrome P450 Monooxygenase",
        "clearance_percentage": 50,
        "gene": "CYP3A4 (Chromosome 7q22.1)",
        "primary_tissue": "Hepatic endoplasmic reticulum & upper small intestine enterocytes",
        "pdb_id": "1TQN",
        "description": "Dominant human drug-metabolizing enzyme responsible for Phase I oxidation of more than 50% of marketed therapeutic agents. Highly susceptible to mechanism-based irreversible suicide inhibition by dietary furanocoumarins and transcriptional upregulation by PXR ligands.",
        "clinical_significance": "Intestinal first-pass clearance creates a major barrier for orally administered drugs. Inactivation or saturation leads to exponential (up to 12-fold) spikes in systemic bioaccumulation, risking fatal rhabdomyolysis (statins), severe hypotension (calcium channel blockers), or acute nephrotoxicity (calcineurin inhibitors).",
        "substrates": [
            {"name": "Simvastatin", "class_name": "HMG-CoA Reductase Inhibitor", "metabolism_fraction": ">85%", "therapeutic_use": "Hypercholesterolemia / Dyslipidemia"},
            {"name": "Atorvastatin", "class_name": "HMG-CoA Reductase Inhibitor", "metabolism_fraction": "~70%", "therapeutic_use": "Cardiovascular risk reduction"},
            {"name": "Amlodipine", "class_name": "Dihydropyridine Calcium Channel Blocker", "metabolism_fraction": "~90%", "therapeutic_use": "Essential Hypertension & Angina"},
            {"name": "Cyclosporine", "class_name": "Calcineurin Inhibitor / Immunosuppressant", "metabolism_fraction": ">95%", "therapeutic_use": "Organ transplant rejection prophylaxis"},
            {"name": "Tacrolimus", "class_name": "Macrolide Calcineurin Inhibitor", "metabolism_fraction": ">95%", "therapeutic_use": "Solid organ transplantation"},
            {"name": "Midazolam", "class_name": "Benzodiazepine (Golden Standard Probe)", "metabolism_fraction": ">95%", "therapeutic_use": "Procedural sedation & anesthesia"},
            {"name": "Apixaban", "class_name": "Direct Oral Factor Xa Inhibitor (DOAC)", "metabolism_fraction": "~25% CYP / P-gp", "therapeutic_use": "Stroke prevention in atrial fibrillation"},
            {"name": "Sildenafil", "class_name": "PDE5 Inhibitor", "metabolism_fraction": "~80%", "therapeutic_use": "Erectile dysfunction & Pulmonary hypertension"}
        ],
        "inhibitors": [
            {"compound": "Bergamottin & 6',7'-DHB", "food_source": "Grapefruit, Pomelo, Seville oranges", "potency": "Strong (Suicide / Mechanism-Based)", "mechanism": "Covalent binding to heme-iron moiety destroying intestinal CYP3A4 enzyme with >48h recovery half-life"},
            {"compound": "Piperine", "food_source": "Black Pepper (Piper nigrum)", "potency": "Moderate to Strong", "mechanism": "Concurrent competitive inhibition of CYP3A4 and P-glycoprotein efflux pump"},
            {"compound": "Curcumin", "food_source": "Turmeric root (Curcuma longa)", "potency": "Moderate", "mechanism": "Mixed competitive / non-competitive inhibition of active site heme access"},
            {"compound": "Quercetin", "food_source": "Capers, Red Onions, Apples, Berries", "potency": "Moderate", "mechanism": "Competitive ligand binding to CYP3A4 substrate recognition pocket"},
            {"compound": "Resveratrol", "food_source": "Red Wine, Grape skin, Peanuts", "potency": "Moderate", "mechanism": "Irreversible mechanism-based inactivation during catalytic turnover"}
        ],
        "inducers": [
            {"compound": "Hyperforin", "food_source": "St. John's Wort (Hypericum perforatum)", "potency": "Potent Transcriptional Inducer", "mechanism": "High-affinity binding to Pregnane X Receptor (PXR), driving massive transcription of CYP3A4 & ABCB1 genes"},
            {"compound": "Polycyclic Aromatic Hydrocarbons", "food_source": "Charbroiled / Heavily grilled meats", "potency": "Mild to Moderate", "mechanism": "AhR / nuclear translocation mediated enzyme synthesis"}
        ],
        "polymorphisms": [
            {"phenotype": "Normal Metabolizer (*1/*1)", "allele_examples": "CYP3A4*1", "frequency_notes": ">90% of global population", "clinical_impact": "Standard therapeutic clearance"},
            {"phenotype": "Intermediate / Poor Metabolizer (*22 carriers)", "allele_examples": "CYP3A4*22 (intron 6 SNP)", "frequency_notes": "5-8% in Caucasians", "clinical_impact": "Reduced hepatic CYP3A4 expression; requires reduced doses of statins and immunosuppressants to prevent toxicity"}
        ],
        "clinical_guidance": [
            "Strictly avoid grapefruit juice, pomelos, and Seville marmalade when taking simvastatin, lovastatin, or oral calcineurin inhibitors (cyclosporine/tacrolimus).",
            "Separate ingestion of piperine or high-dose black pepper supplements from critical medications by at least 4 to 6 hours.",
            "Never co-prescribe or consume St. John's Wort supplements with oral contraceptives, antiretrovirals, or immunosuppressants due to acute clearance acceleration and loss of efficacy.",
            "Consider Rosuvastatin or Pravastatin as safe non-CYP3A4 cleared alternatives for patients who cannot discontinue citrus fruit intake."
        ]
    },
    "CYP2D6": {
        "symbol": "CYP2D6",
        "name": "Cytochrome P450 Family 2 Subfamily D Member 6",
        "category": "Cytochrome P450 Monooxygenase",
        "clearance_percentage": 25,
        "gene": "CYP2D6 (Chromosome 22q13.2)",
        "primary_tissue": "Liver parenchyma (central venule hepatocytes) & central nervous system",
        "pdb_id": "2F9Q",
        "description": "Critical polymorphic enzyme metabolizing approximately 25% of all prescription drugs despite accounting for less than 4% of total hepatic CYP protein content. Highly specific for basic lipophilic amines and completely non-inducible by environmental chemicals.",
        "clinical_significance": "Displays profound genetic polymorphism ranging from complete absence of enzymatic activity (Poor Metabolizers, 7-10% of Caucasians) to gene duplications causing ultra-rapid metabolism (up to 29% in North African populations). Required for prodrug bioactivation of codeine into morphine and tamoxifen into active endoxifen.",
        "substrates": [
            {"name": "Metoprolol", "class_name": "Cardioselective Beta-1 Adrenergic Blocker", "metabolism_fraction": "~80%", "therapeutic_use": "Heart failure, Hypertension, Post-MI"},
            {"name": "Codeine", "class_name": "Opioid Analgesic Prodrug", "metabolism_fraction": "Bioactivated into Morphine", "therapeutic_use": "Pain management & antitussive"},
            {"name": "Tramadol", "class_name": "Centrally Acting Synthetic Opioid", "metabolism_fraction": "Bioactivated to O-desmethyltramadol", "therapeutic_use": "Moderate to severe pain"},
            {"name": "Tamoxifen", "class_name": "Selective Estrogen Receptor Modulator (SERM)", "metabolism_fraction": "Bioactivated to 4-OH-tamoxifen & Endoxifen", "therapeutic_use": "ER+ Breast Cancer oncology"},
            {"name": "Fluoxetine", "class_name": "Selective Serotonin Reuptake Inhibitor (SSRI)", "metabolism_fraction": "~70% (also potent inhibitor)", "therapeutic_use": "Major Depressive Disorder, OCD"},
            {"name": "Dextromethorphan", "class_name": "Antitussive NMDA Antagonist (Probe)", "metabolism_fraction": ">90%", "therapeutic_use": "Cough suppression"}
        ],
        "inhibitors": [
            {"compound": "Berberine & Hydrastine", "food_source": "Goldenseal (Hydrastis canadensis), Barberry", "potency": "Strong", "mechanism": "Potent competitive inhibition binding to the hydrophobic active site cleft"},
            {"compound": "Epigallocatechin gallate (EGCG)", "food_source": "Green tea extracts (Camellia sinensis)", "potency": "Moderate", "mechanism": "Direct catalytic pocket binding at high polyphenol concentrations"},
            {"compound": "Curcumin", "food_source": "Turmeric", "potency": "Weak to Moderate", "mechanism": "Allosteric site hindrance"}
        ],
        "inducers": [
            {"compound": "None Identified (Non-Inducible)", "food_source": "N/A", "potency": "N/A", "mechanism": "CYP2D6 gene lacks classical xenobiotic response elements (XRE/PPRE); activity cannot be enhanced by diet or drugs"}
        ],
        "polymorphisms": [
            {"phenotype": "Poor Metabolizer (PM, *3, *4, *5, *6)", "allele_examples": "CYP2D6*4, *5 (null alleles)", "frequency_notes": "7-10% of Caucasians, 1-2% Asians", "clinical_impact": "Failure to convert codeine into analgesic morphine (lack of pain relief); metoprolol systemic accumulation risking severe bradycardia"},
            {"phenotype": "Ultra-Rapid Metabolizer (UM, gene duplication)", "allele_examples": "CYP2D6*1xN, *2xN", "frequency_notes": "1-2% Northern Europeans, 10-29% North Africans/Middle East", "clinical_impact": "Accelerated morphine conversion from codeine precipitating fatal respiratory depression at standard doses"}
        ],
        "clinical_guidance": [
            "Patients on metoprolol or carvedilol should avoid high-dose Goldenseal dietary supplements to avoid uncontrolled bradycardia and hypotension.",
            "Avoid green tea concentrated weight-loss extracts in patients taking narrow-window CYP2D6 antiarrhythmics (flecainide, propafenone).",
            "Screen for pharmacogenomic CYP2D6 status before prescribing codeine or tramadol in pediatric and nursing mother populations."
        ]
    },
    "CYP2C9": {
        "symbol": "CYP2C9",
        "name": "Cytochrome P450 Family 2 Subfamily C Member 9",
        "category": "Cytochrome P450 Monooxygenase",
        "clearance_percentage": 15,
        "gene": "CYP2C9 (Chromosome 10q24.2)",
        "primary_tissue": "Liver parenchyma (constitutes ~20% of total hepatic CYP content)",
        "pdb_id": "1OG5",
        "description": "Primary metabolic clearance enzyme for weakly acidic, lipophilic pharmaceuticals with narrow therapeutic indices, notably S-warfarin, phenytoin, glipizide, and celecoxib.",
        "clinical_significance": "Because S-warfarin is 3-5 times more potent as an anticoagulant than R-warfarin and relies strictly on CYP2C9 for 7-hydroxylation, any dietary modulation of this enzyme directly alters International Normalized Ratio (INR), escalating risk of hemorrhagic stroke or fatal thrombosis.",
        "substrates": [
            {"name": "Warfarin (S-enantiomer)", "class_name": "Vitamin K Epoxide Reductase Antagonist", "metabolism_fraction": ">85% of S-isomer", "therapeutic_use": "Thromboembolism, Deep Vein Thrombosis, Atrial Fibrillation"},
            {"name": "Phenytoin", "class_name": "Hydantoin Anticonvulsant", "metabolism_fraction": ">90%", "therapeutic_use": "Tonic-clonic seizures, Status epilepticus"},
            {"name": "Glipizide & Glyburide", "class_name": "Second-generation Sulfonylureas", "metabolism_fraction": "~80%", "therapeutic_use": "Type 2 Diabetes Mellitus"},
            {"name": "Celecoxib", "class_name": "COX-2 Selective NSAID", "metabolism_fraction": "~75%", "therapeutic_use": "Osteoarthritis, Rheumatoid Arthritis"},
            {"name": "Losartan", "class_name": "Angiotensin II Receptor Blocker (ARB)", "metabolism_fraction": "Bioactivated to EXP3174 active metabolite", "therapeutic_use": "Hypertension & Diabetic Nephropathy"}
        ],
        "inhibitors": [
            {"compound": "Flavonoids & Proanthocyanidins", "food_source": "Cranberry juice / extracts (Vaccinium macrocarpon)", "potency": "Moderate to Strong In Vivo", "mechanism": "Competitive inhibition of S-warfarin 7-hydroxylation in hepatic microsomes"},
            {"compound": "Curcumin", "food_source": "Turmeric (Curcuma longa)", "potency": "Moderate", "mechanism": "Competitive active cleft binding"},
            {"compound": "Quercetin", "food_source": "Onions, Apples, Ginkgo Biloba", "potency": "Moderate", "mechanism": "Inhibition of substrate pocket access"},
            {"compound": "Sulfur-containing Allium active compounds", "food_source": "Garlic supplements (Allium sativum)", "potency": "Weak to Moderate", "mechanism": "Reversible enzyme complexation"}
        ],
        "inducers": [
            {"compound": "Hyperforin", "food_source": "St. John's Wort", "potency": "Moderate Inducer", "mechanism": "Transcriptional activation via PXR cross-talk with CAR"},
            {"compound": "Ginsenosides", "food_source": "Panax Ginseng", "potency": "Mild", "mechanism": "Accelerated hepatic enzyme clearance induction"}
        ],
        "polymorphisms": [
            {"phenotype": "CYP2C9*1/*1 (Extensive)", "allele_examples": "Wild-type", "frequency_notes": "65-75% of Caucasians", "clinical_impact": "Standard baseline clearance"},
            {"phenotype": "CYP2C9*2 & *3 (Reduced Function)", "allele_examples": "Arg144Cys (*2), Ile359Leu (*3)", "frequency_notes": "*2 (~11%), *3 (~7%) in Caucasians", "clinical_impact": "Markedly diminished clearance (~80% reduction for *3/*3); requires 50-80% lower warfarin maintenance doses to prevent severe bleeding"}
        ],
        "clinical_guidance": [
            "Patients on warfarin must maintain steady, consistent dietary intake and avoid high-volume cranberry juice consumption or concentrated cranberry pills.",
            "Avoid combining turmeric/curcumin extracts with sulfonylureas (glipizide) to prevent refractory hypoglycemia.",
            "Regular INR monitoring is mandatory if any new herbal supplement (St. John's Wort, Ginkgo, Garlic) is initiated or discontinued."
        ]
    },
    "CYP1A2": {
        "symbol": "CYP1A2",
        "name": "Cytochrome P450 Family 1 Subfamily A Member 2",
        "category": "Cytochrome P450 Monooxygenase",
        "clearance_percentage": 13,
        "gene": "CYP1A2 (Chromosome 15q24.1)",
        "primary_tissue": "Exclusively localized in human liver parenchyma",
        "pdb_id": "2HI4",
        "description": "Sole human hepatic enzyme catalyzing the bioactivation and clearance of methylxanthines, planar aromatic heterocyclic compounds, and pro-carcinogens. Governed by the Aryl Hydrocarbon Receptor (AhR) and highly sensitive to dietary cruciferous indoles and charbroiled foods.",
        "clinical_significance": "Clearance of caffeine, theophylline, clozapine, and olanzapine depends heavily on CYP1A2. Strong dietary induction decreases drug exposure, while co-ingestion of inhibitors causes caffeine toxicity (arrhythmia, tremor, panic attacks) and elevated clozapine toxicity.",
        "substrates": [
            {"name": "Caffeine", "class_name": "Methylxanthine CNS Stimulant (Golden Probe)", "metabolism_fraction": ">95% N3-demethylation to paraxanthine", "therapeutic_use": "Alertness, Apnea of prematurity"},
            {"name": "Theophylline", "class_name": "Phosphodiesterase Inhibitor / Bronchodilator", "metabolism_fraction": "~80%", "therapeutic_use": "COPD & severe persistent Asthma"},
            {"name": "Clozapine", "class_name": "Atypical Antipsychotic (Narrow Index)", "metabolism_fraction": "~70%", "therapeutic_use": "Treatment-resistant Schizophrenia"},
            {"name": "Olanzapine", "class_name": "Thienobenzodiazepine Antipsychotic", "metabolism_fraction": "~40%", "therapeutic_use": "Bipolar disorder & Schizophrenia"},
            {"name": "Tacrine & Tizanidine", "class_name": "Centrally Acting Muscle Relaxant", "metabolism_fraction": ">90%", "therapeutic_use": "Spasticity & neurodegenerative symptoms"}
        ],
        "inhibitors": [
            {"compound": "Ciprofloxacin & Enoxacin", "food_source": "Fluoroquinolone antibiotics (Clinical inhibitor)", "potency": "Potent Clinical Inhibitor", "mechanism": "Competitive inhibition extending caffeine half-life from 4 hours to over 15 hours"},
            {"compound": "Naringenin & Hesperetin", "food_source": "Grapefruit, Bitter Orange, Lemons", "potency": "Moderate", "mechanism": "Direct active site obstruction"},
            {"compound": "Curcumin & Quercetin", "food_source": "Turmeric, Onions", "potency": "Moderate", "mechanism": "Allosteric and active cleft inhibition"}
        ],
        "inducers": [
            {"compound": "Indole-3-carbinol & Sulforaphane", "food_source": "Cruciferous vegetables (Broccoli, Brussels sprouts, Cabbage, Kale)", "potency": "Strong Dietary Inducer", "mechanism": "High affinity activation of Aryl Hydrocarbon Receptor (AhR), causing CYP1A1/CYP1A2 transcriptional surge up to 2.5-fold"},
            {"compound": "Polycyclic Aromatic Hydrocarbons (PAHs)", "food_source": "Charbroiled, smoked, or barbecue meats", "potency": "Potent AhR Inducer", "mechanism": "Direct AhR binding and nuclear xenobiotic response element (XRE) transactivation"}
        ],
        "polymorphisms": [
            {"phenotype": "CYP1A2*1F (Inducible / Fast Metabolizer)", "allele_examples": "-163C>A polymorphism", "frequency_notes": "~45% of Caucasians", "clinical_impact": "Hyper-inducible upon exposure to coffee, smoking, or cruciferous foods; rapid caffeine clearance"},
            {"phenotype": "CYP1A2*1K / *1C (Slow Metabolizer)", "allele_examples": "-729C>T, -3860G>A", "frequency_notes": "2-5% of populations", "clinical_impact": "Diminished basal clearance; prone to caffeine jitteriness, tachycardia, and clozapine-induced seizures"}
        ],
        "clinical_guidance": [
            "Patients on theophylline or clozapine must avoid sudden shifts in cruciferous vegetable consumption or charcoal-grilled meats to prevent subtherapeutic relapse.",
            "Co-administration of ciprofloxacin with caffeinated energy drinks or coffee can produce severe palpitations, insomnia, and adrenergic surges.",
            "Smokers who quit smoking experience a dramatic 30-50% drop in CYP1A2 activity, requiring clozapine dose reductions to prevent toxicity."
        ]
    },
    "CYP2C19": {
        "symbol": "CYP2C19",
        "name": "Cytochrome P450 Family 2 Subfamily C Member 19",
        "category": "Cytochrome P450 Monooxygenase",
        "clearance_percentage": 8,
        "gene": "CYP2C19 (Chromosome 10q24.2)",
        "primary_tissue": "Liver parenchyma & gastrointestinal mucosa",
        "pdb_id": "4GQS",
        "description": "Essential polymorphic enzyme critical for the two-step bioactivation of the antiplatelet prodrug clopidogrel and clearance of proton pump inhibitors (PPIs) and benzodiazepines.",
        "clinical_significance": "Poor metabolizers or patients taking competitive inhibitors (omeprazole, high-dose flavonoids) fail to generate the active thiol metabolite of clopidogrel, elevating risk of recurrent myocardial infarction and stent thrombosis.",
        "substrates": [
            {"name": "Clopidogrel", "class_name": "Thienopyridine Antiplatelet Prodrug", "metabolism_fraction": "Required 2-step Bioactivation (~85%)", "therapeutic_use": "Prevention of vascular stent thrombosis & stroke"},
            {"name": "Omeprazole & Esomeprazole", "class_name": "Proton Pump Inhibitor (PPI)", "metabolism_fraction": ">80% (also competitive inhibitor)", "therapeutic_use": "GERD, Peptic Ulcer Disease"},
            {"name": "Diazepam", "class_name": "Long-acting Benzodiazepine", "metabolism_fraction": "~60%", "therapeutic_use": "Anxiety, Status epilepticus, Muscle spasms"},
            {"name": "Voriconazole", "class_name": "Triazole Antifungal", "metabolism_fraction": ">70%", "therapeutic_use": "Invasive aspergillosis"},
            {"name": "Citalopram / Escitalopram", "class_name": "Selective Serotonin Reuptake Inhibitor (SSRI)", "metabolism_fraction": "~40%", "therapeutic_use": "Major Depression & Anxiety"}
        ],
        "inhibitors": [
            {"compound": "Omeprazole", "food_source": "Medication (Common Over-The-Counter PPI)", "potency": "Strong Clinical Inhibitor", "mechanism": "Competitive saturation of CYP2C19 active site blocking clopidogrel bioactivation"},
            {"compound": "Curcuminoids", "food_source": "Turmeric extract", "potency": "Moderate", "mechanism": "Reversible substrate pocket occupation"},
            {"compound": "Ginkgolic acids", "food_source": "Ginkgo Biloba leaf extracts", "potency": "Moderate", "mechanism": "Direct enzyme catalytic hindrance"}
        ],
        "inducers": [
            {"compound": "Hyperforin", "food_source": "St. John's Wort", "potency": "Moderate Inducer", "mechanism": "PXR-mediated gene upregulation"},
            {"compound": "Artemisinin", "food_source": "Sweet Wormwood (Artemisia annua)", "potency": "Mild to Moderate", "mechanism": "Nuclear receptor activation"}
        ],
        "polymorphisms": [
            {"phenotype": "CYP2C19*2 and *3 (Loss of Function / Poor Metabolizer)", "allele_examples": "Aberrant splice site (*2), stop codon (*3)", "frequency_notes": "15-25% of East Asians, 2-5% of Caucasians", "clinical_impact": "Severely impaired clopidogrel conversion; FDA Boxed Warning recommending alternative antiplatelets (ticagrelor, prasugrel)"},
            {"phenotype": "CYP2C19*17 (Gain of Function / Ultra-Rapid)", "allele_examples": "-806C>T promoter mutation", "frequency_notes": "18-20% of Caucasians & Africans", "clinical_impact": "Rapid omeprazole clearance reducing ulcer healing rates; heightened active clopidogrel bleeding risk"}
        ],
        "clinical_guidance": [
            "Avoid combining omeprazole or esomeprazole with clopidogrel; prefer pantoprazole or famotidine as alternative gastroprotective agents.",
            "Pharmacogenomic testing for CYP2C19 loss-of-function alleles is strongly recommended prior to coronary stenting.",
            "Exercise caution with high-dose turmeric and ginkgo supplements in patients maintained on clopidogrel or voriconazole."
        ]
    },
    "CYP2E1": {
        "symbol": "CYP2E1",
        "name": "Cytochrome P450 Family 2 Subfamily E Member 1",
        "category": "Cytochrome P450 Monooxygenase",
        "clearance_percentage": 5,
        "gene": "CYP2E1 (Chromosome 10q26.3)",
        "primary_tissue": "Centrilobular hepatocytes, lung Clara cells, kidney proximal tubules",
        "pdb_id": "3E4E",
        "description": "Specialized ethanol-inducible monooxygenase responsible for bioactivating low-molecular-weight xenobiotics, volatile anesthetics, and acetaminophen into reactive electrophilic toxins (NAPQI).",
        "clinical_significance": "Chronic ethanol consumption massively induces CYP2E1. When combined with acetaminophen, rapid generation of NAPQI depletes protective hepatic glutathione, causing acute centrilobular liver necrosis.",
        "substrates": [
            {"name": "Acetaminophen (Paracetamol)", "class_name": "Analgesic & Antipyretic", "metabolism_fraction": "~10% shunt to toxic NAPQI", "therapeutic_use": "Pain and fever management"},
            {"name": "Ethanol", "class_name": "Alcoholic beverages / solvents", "metabolism_fraction": "Microsomal Ethanol Oxidizing System (MEOS)", "therapeutic_use": "Social beverage & clinical solvent"},
            {"name": "Halothane & Isoflurane", "class_name": "Volatile Inhalation Anesthetics", "metabolism_fraction": "Hepatic defluorination pathway", "therapeutic_use": "General surgical anesthesia"},
            {"name": "Theophylline", "class_name": "Methylxanthine (Secondary pathway)", "metabolism_fraction": "~15%", "therapeutic_use": "Respiratory bronchospasm"}
        ],
        "inhibitors": [
            {"compound": "Phenethyl isothiocyanate (PEITC)", "food_source": "Watercress, Horseradish, Wasabi", "potency": "Potent Mechanism-Based", "mechanism": "Suicide inactivation and active site binding inhibiting pro-carcinogen activation"},
            {"compound": "Diallyl sulfide & Allicin", "food_source": "Garlic (Allium sativum), Onions", "potency": "Strong Dietary Inhibitor", "mechanism": "Competitive inhibition of ethanol and acetaminophen bioactivation"},
            {"compound": "Disulfiram", "food_source": "Pharmacological inhibitor", "potency": "Potent", "mechanism": "Direct active site destruction"}
        ],
        "inducers": [
            {"compound": "Ethanol (Chronic ingestion)", "food_source": "Beer, Wine, Spirits, Fermented beverages", "potency": "Potent Substrate Stabilizer & Inducer", "mechanism": "Post-translational protein stabilization against ubiquitin-proteasome degradation"},
            {"compound": "Ketone bodies (Acetoacetate, Acetone)", "food_source": "Prolonged fasting, Strict Ketogenic diet", "potency": "Moderate", "mechanism": "Stabilization of enzyme tertiary structure"}
        ],
        "polymorphisms": [
            {"phenotype": "CYP2E1*1D / *5B (RsaI / PstI polymorphism)", "allele_examples": "Promoter mutations", "frequency_notes": "15-30% of East Asians, 5% Caucasians", "clinical_impact": "Enhanced transcriptional rate linked to higher alcoholic liver disease susceptibility"}
        ],
        "clinical_guidance": [
            "Never consume therapeutic or supratherapeutic doses of acetaminophen alongside chronic heavy alcohol intake due to explosive NAPQI hepatotoxicity.",
            "Watercress consumption has demonstrated protective chemopreventive inhibition of tobacco nitrosamine activation mediated by CYP2E1.",
            "Strict ketogenic diets and extended fasting states induce CYP2E1, altering sensitivity to volatile solvents and acetaminophen."
        ]
    },
    "CYP2B6": {
        "symbol": "CYP2B6",
        "name": "Cytochrome P450 Family 2 Subfamily B Member 6",
        "category": "Cytochrome P450 Monooxygenase",
        "clearance_percentage": 4,
        "gene": "CYP2B6 (Chromosome 19q13.2)",
        "primary_tissue": "Liver (representing 2-10% of hepatic CYP pool) and human brain",
        "pdb_id": "3QOA",
        "description": "Inducible monooxygenase clearing several critical central nervous system agents, anesthetics, and prodrug antineoplastics (cyclophosphamide). Under control of the Constitutive Androstane Receptor (CAR).",
        "clinical_significance": "Primary clearance enzyme for the antiretroviral efavirenz and antidepressant bupropion. Genetically impaired metabolizers suffer severe efavirenz CNS toxicities (hallucinations, neuropsychiatric disturbance), while inducer co-ingestion risks HIV treatment failure.",
        "substrates": [
            {"name": "Bupropion", "class_name": "NDRI Antidepressant & Smoking Cessation", "metabolism_fraction": ">80% to Hydroxybupropion", "therapeutic_use": "Major Depression, Seasonal Affective Disorder"},
            {"name": "Efavirenz", "class_name": "Non-Nucleoside Reverse Transcriptase Inhibitor", "metabolism_fraction": ">90%", "therapeutic_use": "HIV-1 antiretroviral therapy"},
            {"name": "Ketamine", "class_name": "Dissociative Anesthetic & Rapid Antidepressant", "metabolism_fraction": "~70% to Norketamine", "therapeutic_use": "Anesthesia & Treatment-resistant depression"},
            {"name": "Methadone", "class_name": "Synthetic Opioid Analgesic", "metabolism_fraction": "~40% (alongside CYP3A4)", "therapeutic_use": "Opioid dependence maintenance & chronic pain"},
            {"name": "Cyclophosphamide", "class_name": "Oxazaphosphorine Alkylating Prodrug", "metabolism_fraction": "Bioactivated to 4-hydroxycyclophosphamide", "therapeutic_use": "Lymphoma, Leukemia, Solid tumors"}
        ],
        "inhibitors": [
            {"compound": "Ticlopidine & Clopidogrel", "food_source": "Pharmacological inhibitors", "potency": "Potent Mechanism-Based", "mechanism": "Selective irreversible inactivation of CYP2B6 catalytic activity"},
            {"compound": "Curcuminoids", "food_source": "Turmeric extract", "potency": "Moderate", "mechanism": "Direct competitive binding to active pocket"}
        ],
        "inducers": [
            {"compound": "Hyperforin", "food_source": "St. John's Wort", "potency": "Strong Inducer", "mechanism": "CAR / PXR cross-activation leading to enhanced gene expression"},
            {"compound": "Artemisinin", "food_source": "Sweet Wormwood (Artemisia annua)", "potency": "Moderate", "mechanism": "Direct CAR receptor binding"}
        ],
        "polymorphisms": [
            {"phenotype": "CYP2B6*6 (516G>T, 785A>G)", "allele_examples": "Q172H / K262R substitutions", "frequency_notes": "Up to 50% in African ancestry, 20% in Caucasians", "clinical_impact": "Significantly reduced protein expression; 3-fold higher plasma efavirenz levels causing severe neurotoxicity and sleep disturbances"}
        ],
        "clinical_guidance": [
            "Patients starting efavirenz should undergo CYP2B6 genotyping where feasible to guide personalized dosing and avert CNS toxicity.",
            "Avoid St. John's Wort during bupropion therapy or methadone maintenance to prevent sudden withdrawal or depression relapse.",
            "Monitor cyclophosphamide oncologic efficacy when co-administered with CYP2B6-modulating herbal preparations."
        ]
    }
}


class EnzymeService:
    @staticmethod
    def get_all_enzymes() -> List[Dict[str, Any]]:
        """Returns summarized overview of all documented CYP enzymes."""
        summaries = []
        for symbol, data in CYP_DETAILED_CATALOG.items():
            primary_drugs = [s["name"] for s in data.get("substrates", [])[:4]]
            primary_foods = list(dict.fromkeys([
                inh["food_source"].split("(")[0].strip() for inh in data.get("inhibitors", [])[:3]
            ] + [
                ind["food_source"].split("(")[0].strip() for ind in data.get("inducers", [])[:2] if ind.get("food_source") != "N/A"
            ]))[:4]

            summaries.append({
                "symbol": symbol,
                "name": data["name"],
                "clearance_percentage": data["clearance_percentage"],
                "gene": data["gene"],
                "primary_tissue": data["primary_tissue"],
                "pdb_id": data["pdb_id"],
                "description": data["description"],
                "substrate_count": len(data.get("substrates", [])),
                "inhibitor_count": len(data.get("inhibitors", [])),
                "inducer_count": len(data.get("inducers", [])),
                "primary_drugs": primary_drugs,
                "primary_foods": primary_foods
            })
        # Sort by clearance percentage descending (CYP3A4, CYP2D6, CYP2C9, etc.)
        summaries.sort(key=lambda x: x["clearance_percentage"], reverse=True)
        return summaries

    @staticmethod
    def get_enzyme_detail(symbol: str) -> Optional[Dict[str, Any]]:
        """Returns deep profile for a specific CYP enzyme."""
        sym_clean = symbol.upper().strip()
        return CYP_DETAILED_CATALOG.get(sym_clean)

    @staticmethod
    def evaluate_cyp_pathways(drug_name: str, food_name: str) -> Dict[str, Dict[str, Any]]:
        """Evaluates CYP enzyme interactions between a drug and dietary compound."""
        d = drug_name.lower().strip()
        f = food_name.lower().strip()

        # Specific profiles based on pharmacological evidence
        is_statin = any(s in d for s in ["simvastatin", "atorvastatin", "lovastatin"])
        is_grapefruit = any(g in f for g in ["grapefruit", "naringin", "bergamottin", "pomelo"])
        is_warfarin = "warfarin" in d
        is_vit_k = "vitamin k" in f or "phylloquinone" in f
        is_caffeine = "caffeine" in d or "caffeine" in f
        is_st_johns = any(s in f for s in ["st. john", "hyperforin", "hypericum"])
        is_curcumin = "curcumin" in f or "turmeric" in f
        is_quercetin = "quercetin" in f
        is_clopidogrel = "clopidogrel" in d
        is_omeprazole = "omeprazole" in d or "omeprazole" in f
        is_cipro = "ciprofloxacin" in d
        is_alcohol = any(a in f for a in ["alcohol", "ethanol", "wine", "beer", "liquor"]) or any(a in d for a in ["alcohol", "ethanol"])
        is_acetaminophen = any(p in d for p in ["acetaminophen", "paracetamol", "tylenol"])
        is_bupropion = "bupropion" in d or "wellbutrin" in d
        is_efavirenz = "efavirenz" in d
        is_metoprolol = any(m in d for m in ["metoprolol", "carvedilol", "propranolol"])
        is_codeine = any(c in d for c in ["codeine", "tramadol", "hydrocodone", "oxycodone"])
        is_goldenseal = "goldenseal" in f or "berberine" in f or "barberry" in f
        is_pepper = "piperine" in f or "black pepper" in f
        is_green_tea = "green tea" in f or "egcg" in f
        is_cranberry = "cranberry" in f

        matrix = {}

        # 1. CYP1A2
        cyp1a2_sub = is_caffeine or "theophylline" in d or "clozapine" in d or "olanzapine" in d or "tizanidine" in d
        cyp1a2_inh = is_cipro or is_curcumin or is_quercetin or "fluvoxamine" in d or is_grapefruit
        cyp1a2_ind = "cruciferous" in f or "broccoli" in f or "tobacco" in f or "cabbage" in f or "brussels" in f or "barbecue" in f or "grilled" in f
        matrix["CYP1A2"] = {
            "drug_substrate": cyp1a2_sub,
            "food_inhibitor": cyp1a2_inh,
            "food_inducer": cyp1a2_ind,
            "clash": (cyp1a2_sub and (cyp1a2_inh or cyp1a2_ind)),
            "relevance": "High" if (cyp1a2_sub and (cyp1a2_inh or cyp1a2_ind)) else "Low",
            "relevant_class": "High" if (cyp1a2_sub and (cyp1a2_inh or cyp1a2_ind)) else "Low",
            "clinical_mechanism": "Inhibition slows substrate clearance, risking tremors/toxicity; AhR induction accelerates clearance."
        }

        # 2. CYP2C9
        cyp2c9_sub = is_warfarin or "phenytoin" in d or "glipizide" in d or "celecoxib" in d or "losartan" in d
        cyp2c9_inh = is_curcumin or is_quercetin or is_cranberry or "fluconazole" in d
        cyp2c9_ind = is_st_johns
        matrix["CYP2C9"] = {
            "drug_substrate": cyp2c9_sub,
            "food_inhibitor": cyp2c9_inh,
            "food_inducer": cyp2c9_ind,
            "clash": (cyp2c9_sub and (cyp2c9_inh or cyp2c9_ind)),
            "relevance": "High" if cyp2c9_sub else "Medium" if cyp2c9_inh else "Low",
            "relevant_class": "High" if cyp2c9_sub else "Medium" if cyp2c9_inh else "Low",
            "clinical_mechanism": "CYP2C9 is the rate-limiting clearance pathway for S-warfarin. Inhibition precipitates supratherapeutic INR and hemorrhage."
        }

        # 3. CYP2C19
        cyp2c19_sub = is_clopidogrel or is_omeprazole or "diazepam" in d or "voriconazole" in d or "citalopram" in d
        cyp2c19_inh = is_omeprazole or is_curcumin or "ginkgo" in f
        cyp2c19_ind = is_st_johns
        matrix["CYP2C19"] = {
            "drug_substrate": cyp2c19_sub,
            "food_inhibitor": cyp2c19_inh,
            "food_inducer": cyp2c19_ind,
            "clash": (cyp2c19_sub and (cyp2c19_inh or cyp2c19_ind)),
            "relevance": "High" if (is_clopidogrel and cyp2c19_inh) else "Medium" if cyp2c19_sub else "Low",
            "relevant_class": "High" if (is_clopidogrel and cyp2c19_inh) else "Medium" if cyp2c19_sub else "Low",
            "clinical_mechanism": "Competitive CYP2C19 inhibition prevents prodrug activation (e.g., Clopidogrel), elevating recurrent thrombotic risk."
        }

        # 4. CYP2D6
        cyp2d6_sub = is_metoprolol or is_codeine or "tamoxifen" in d or "fluoxetine" in d or "dextromethorphan" in d
        cyp2d6_inh = is_goldenseal or is_green_tea or "fluoxetine" in d or "quinidine" in d
        cyp2d6_ind = False  # CYP2D6 is classical non-inducible
        matrix["CYP2D6"] = {
            "drug_substrate": cyp2d6_sub,
            "food_inhibitor": cyp2d6_inh,
            "food_inducer": cyp2d6_ind,
            "clash": (cyp2d6_sub and cyp2d6_inh),
            "relevance": "High" if (cyp2d6_sub and cyp2d6_inh) else "Low",
            "relevant_class": "High" if (cyp2d6_sub and cyp2d6_inh) else "Low",
            "clinical_mechanism": "Non-inducible enzyme governing cardiovascular and analgesic conversions; competitive dietary ligands alter steady-state plasma levels."
        }

        # 5. CYP3A4
        cyp3a4_sub = is_statin or "amlodipine" in d or "cyclosporine" in d or "tacrolimus" in d or "sildenafil" in d or "apixaban" in d or "midazolam" in d
        cyp3a4_inh = is_grapefruit or is_quercetin or is_curcumin or is_pepper or "resveratrol" in f or is_goldenseal
        cyp3a4_ind = is_st_johns
        clash_3a4 = (cyp3a4_sub and (cyp3a4_inh or cyp3a4_ind)) or (is_statin and is_grapefruit)

        matrix["CYP3A4"] = {
            "drug_substrate": cyp3a4_sub,
            "food_inhibitor": cyp3a4_inh,
            "food_inducer": cyp3a4_ind,
            "clash": clash_3a4,
            "relevance": "High" if clash_3a4 else "Medium" if (cyp3a4_sub or cyp3a4_inh) else "Low",
            "relevant_class": "High" if clash_3a4 else "Medium" if (cyp3a4_sub or cyp3a4_inh) else "Low",
            "clinical_mechanism": "Intestinal and hepatic CYP3A4 clearance inhibition markedly elevates systemic AUC, elevating toxic exposure (e.g. rhabdomyolysis for statins)."
        }

        # 6. CYP2E1
        cyp2e1_sub = is_acetaminophen or is_alcohol or "theophylline" in d
        cyp2e1_inh = "watercress" in f or "garlic" in f or "wasabi" in f
        cyp2e1_ind = is_alcohol or "fasting" in f or "keto" in f
        clash_2e1 = (is_acetaminophen and is_alcohol) or (cyp2e1_sub and (cyp2e1_inh or cyp2e1_ind))
        matrix["CYP2E1"] = {
            "drug_substrate": cyp2e1_sub,
            "food_inhibitor": cyp2e1_inh,
            "food_inducer": cyp2e1_ind,
            "clash": clash_2e1,
            "relevance": "High" if clash_2e1 else "Medium" if cyp2e1_sub else "Low",
            "relevant_class": "High" if clash_2e1 else "Medium" if cyp2e1_sub else "Low",
            "clinical_mechanism": "Alcohol-mediated CYP2E1 induction diverts acetaminophen metabolism to hepatotoxic NAPQI, risking acute liver failure."
        }

        # 7. CYP2B6
        cyp2b6_sub = is_bupropion or is_efavirenz or "ketamine" in d or "methadone" in d
        cyp2b6_inh = is_curcumin or "ticlopidine" in d
        cyp2b6_ind = is_st_johns or "artemisia" in f or "wormwood" in f
        clash_2b6 = (cyp2b6_sub and (cyp2b6_inh or cyp2b6_ind))
        matrix["CYP2B6"] = {
            "drug_substrate": cyp2b6_sub,
            "food_inhibitor": cyp2b6_inh,
            "food_inducer": cyp2b6_ind,
            "clash": clash_2b6,
            "relevance": "High" if clash_2b6 else "Medium" if cyp2b6_sub else "Low",
            "relevant_class": "High" if clash_2b6 else "Medium" if cyp2b6_sub else "Low",
            "clinical_mechanism": "CYP2B6 governs bupropion and efavirenz clearance; modulation alters neuropsychiatric risk profile."
        }

        return matrix

    @staticmethod
    def simulate_clash(drug_name: str, food_name: str) -> Dict[str, Any]:
        """Provides a complete simulation report between two compounds for CYP bottlenecks."""
        d = drug_name.strip()
        f = food_name.strip()
        pathways = EnzymeService.evaluate_cyp_pathways(d, f)

        clashing_enzymes = [sym for sym, data in pathways.items() if data.get("clash")]
        overall_clash = len(clashing_enzymes) > 0

        # Severity determination
        if any(pathways[sym]["relevance"] == "High" and pathways[sym]["clash"] for sym in clashing_enzymes):
            highest_severity = "High"
        elif overall_clash:
            highest_severity = "Medium"
        elif any(pathways[sym]["drug_substrate"] or pathways[sym]["food_inhibitor"] for sym in pathways):
            highest_severity = "Low"
        else:
            highest_severity = "None"

        # Construct clinical summary & recommendations
        recommendations = []
        if "CYP3A4" in clashing_enzymes:
            recommendations.append("Severe CYP3A4 clearance collision detected: withhold dietary inhibitor or consult prescriber for dose adjustment.")
        if "CYP2C9" in clashing_enzymes:
            recommendations.append("CYP2C9 clearance bottleneck: perform urgent therapeutic drug monitoring (e.g. INR for warfarin).")
        if "CYP2E1" in clashing_enzymes:
            recommendations.append("Toxic metabolic bioactivation risk: avoid concurrent alcohol consumption during analgesic therapy.")
        if "CYP2C19" in clashing_enzymes:
            recommendations.append("Prodrug activation failure risk: evaluate active antiplatelet efficacy or select non-CYP2C19 PPI.")
        if not recommendations:
            if highest_severity == "Low":
                recommendations.append("Minor substrate/ligand overlap observed with low risk of clinically overt pharmacokinetic collision.")
            else:
                recommendations.append("No significant CYP450 metabolic clash identified under standard dietary intake.")

        summary_text = (
            f"Analysis of '{d}' + '{f}' reveals metabolic bottleneck on {', '.join(clashing_enzymes)}."
            if clashing_enzymes
            else f"No critical CYP450 isoenzyme collisions detected for '{d}' and '{f}'."
        )

        return {
            "drug": d,
            "food": f,
            "overall_clash": overall_clash,
            "highest_severity": highest_severity,
            "affected_enzymes": clashing_enzymes,
            "pathway_details": pathways,
            "clinical_summary": summary_text,
            "recommendations": recommendations
        }


enzyme_service = EnzymeService()
