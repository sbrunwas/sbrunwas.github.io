/* Clinical education only. Each numerical result retains its study population,
 * observation window and product. Chart values are percentages within one study. */
(function (root) {
  'use strict';

  const healthy = 'https://www.healthychildren.org/English/';
  const diseases = healthy + 'health-issues/vaccine-preventable-diseases/Pages/';
  const immunizations = healthy + 'safety-prevention/immunizations/Pages/';
  const aap = 'https://www.aap.org/en/patient-care/';
  const journals = 'https://publications.aap.org/pediatrics/article/';
  const label = id => 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=' + id;
  const pubmed = id => 'https://pubmed.ncbi.nlm.nih.gov/' + id + '/';
  const source = (title, url) => ({ title, url });
  const qa = (q, a) => ({ q, a });
  const study = (title, finding, context, citation, source, rates) =>
    ({ title, finding, context, citation, source, ...(rates ? { rates } : {}) });
  const rate = (label, value) => ({ label, value });
  const meningococcal = [
    source('AAP family guide to meningococcal infection', diseases + 'Meningococcal-Infections.aspx'),
    source('California Department of Public Health · meningococcal disease', 'https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/Immunization/meningococcal.aspx')
  ];
  const pertussis = source('AAP family guide to whooping cough', healthy + 'health-issues/conditions/chest-lungs/Pages/Whooping-Cough.aspx');
  const evidence = {
    hepb: {
      why: 'Hepatitis B can pass from a parent to a baby during delivery or through contact with infected blood later. About 9 in 10 babies infected around birth develop chronic infection, which can lead to cirrhosis and liver cancer years later.',
      faq: [
        qa('My prenatal test was negative. Why vaccinate at birth?', 'The birth dose protects against unrecognized infection, gaps in testing or reporting, and exposure to infected household members. The AAP recommends it for medically stable newborns weighing at least 2,000 g within 24 hours of birth.'),
        qa('What if the birth parent has hepatitis B?', 'A newborn exposed to a parent with a positive hepatitis B surface antigen test needs both hepatitis B vaccine and hepatitis B immune globulin within 12 hours of birth, then completion of the series and follow-up testing. Contact the birth team promptly if the result is positive or unknown.')
      ],
      studies: [
        study('Symptoms after pediatric hepatitis B vaccine', 'In the five days after an injection, 10.4% of doses were followed by a general symptom and 0.2% by a reported injection-site reaction. Irritability and fever were among the most frequent general symptoms.', 'Three Recombivax HB studies followed 147 healthy infants and children through age 10 after 434 injections. Percentages are per injection, across ages. No placebo rate was reported in this summary.', 'Recombivax HB prescribing information · section 6.1', label('b5bd99e4-569d-48d5-ba75-16e69f8c409a')),
        study('Childhood liver cancer after an infant vaccination program', 'In Taiwan, the average annual rate of a primary liver cancer in children ages 6–14 fell from 0.70 per 100,000 in 1981–1986 to 0.57 in 1986–1990 and 0.36 in 1990–1994.', 'National cancer registry study. Taiwan began infant hepatitis B vaccination in 1984. These are population trends in hepatocellular carcinoma, a long-term consequence of infection.', 'Chang et al. · New England Journal of Medicine, 1997', pubmed('9197213'))
      ],
      sources: [
        source('AAP family guide to the hepatitis B birth dose', immunizations + 'Hepatitis-B-Vaccine-What-You-Need-to-Know.aspx'),
        source('AAP clinician FAQ on hepatitis B vaccination', aap + 'hepatitis-b/hepatitis-b-vaccine-frequently-asked-questions/'),
        source('California Department of Public Health · hepatitis B', 'https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/Immunization/Hepatitis-B.aspx')
      ]
    },
    rsv: {
      why: 'RSV can inflame the small airways, making it hard for an infant to breathe or feed. Even babies born at term can need hospital care during their first RSV season.',
      faq: [
        qa('Is the infant RSV shot a vaccine?', 'Nirsevimab and clesrovimab give a baby ready-made antibodies. Protection begins without waiting for the baby’s immune system to make its own antibodies and declines over time. The studies below concern nirsevimab.'),
        qa('Does my baby need this if I was vaccinated during pregnancy?', 'Most infants whose birth parent received the recommended maternal RSV vaccine at least 14 days before delivery already have protection for their first RSV season. Ask the pediatrician about timing and exceptions, especially after preterm birth or with a condition that raises risk.')
      ],
      studies: [
        study('RSV hospitalization in the first season', '11 of 4,037 infants (0.3%) given nirsevimab and 60 of 4,021 (1.5%) receiving standard care were hospitalized for an RSV lower respiratory infection.', 'HARMONIE randomized infants entering their first RSV season in France, Germany and the UK. In this trial the absolute difference was about 12 fewer hospitalizations per 1,000 infants.', 'Drysdale et al. · New England Journal of Medicine, 2023', pubmed('38157500'), [rate('Nirsevimab', 0.3), rate('Standard care', 1.5)]),
        study('Rash after an RSV antibody dose', 'A rash within 14 days occurred in 0.9% with nirsevimab and 0.6% with placebo. A local reaction within seven days occurred in 0.3% and 0%, respectively.', 'Pooled infant safety population in two placebo-controlled trials, 2,570 given Beyfortus and 1,284 given placebo. The median age was two months.', 'Beyfortus prescribing information · table 3', label('2f08fa60-f674-432d-801b-1f9514bd9b39'), [rate('Nirsevimab · rash', 0.9), rate('Placebo · rash', 0.6)])
      ],
      sources: [source('AAP · infant RSV immunization questions', aap + 'respiratory-syncytial-virus-rsv-prevention/rsv-frequently-asked-questions/')]
    },
    dtap: {
      why: 'Whooping cough can cause pauses in breathing in a young infant before a typical cough appears. DTaP also protects against diphtheria, which can obstruct the airway, and tetanus, which causes painful muscle spasms.',
      faq: [
        qa('Why start before my baby is in daycare?', 'Pertussis can come from a household member with a mild cough. Young infants face the greatest risk of breathing problems, and it takes several doses to build protection.'),
        qa('Why can a vaccinated child still get whooping cough?', 'Protection against pertussis fades with time. The childhood doses and later Tdap booster renew protection. A clinician should still consider pertussis in a vaccinated child with compatible symptoms or an exposure.')
      ],
      studies: [
        study('Symptoms at the two-month visit', 'After dose one, 32% had pain at the DTaP injection site and 18% had redness. Fever of at least 38°C was recorded in 20%.', 'US study of Infanrix with four other routine vaccines given at separate sites, followed for four days. Local symptoms were assessed in 335 infants and temperature in 333. Fever could reflect any of the vaccines or a coinciding illness.', 'Infanrix prescribing information · table 1', label('de16dd6a-859b-4180-c6af-f930be14f26a')),
        study('Protection against whooping cough', 'Each of two acellular pertussis vaccines reduced the risk of confirmed pertussis with at least 21 days of spasmodic cough by 84% compared with a diphtheria–tetanus vaccine.', 'Randomized infant trial in Italy. Children received three doses at ages two, four and six months. This relative reduction reflects the products and case definition used in that study.', 'Greco et al. · New England Journal of Medicine, 1996', pubmed('8538704'))
      ],
      sources: [pertussis, source('AAP · diseases prevented by routine immunizations', immunizations + 'Vaccination-Protects-Against-These-Diseases.aspx')]
    },
    ipv: {
      why: 'Poliovirus can spread silently and injure the nerves that move the limbs or control breathing. Paralysis can be permanent.',
      faq: [
        qa('Can the US polio shot cause polio?', 'The injected vaccine contains inactivated virus. That virus cannot reproduce or cause polio. Vaccine-derived virus outbreaks are associated with weakened live oral vaccine strains used in some countries.'),
        qa('Why vaccinate here if polio is rare?', 'Virus can travel across borders and circulate unnoticed. In 2022, New York identified a paralytic case in an unvaccinated person and related poliovirus in wastewater.')
      ],
      studies: [
        study('Tenderness at the polio injection site', 'In 211 infants receiving IPOL at age two months, tenderness at the polio injection site was recorded in 29.4% at six hours, 8.5% at 24 hours and 2.8% at 48 hours.', 'Parents assessed the same injection site at each time point. These are separate measurements, so the percentages cannot be added. The infants also received a whole-cell DTP vaccine at another site.', 'IPOL prescribing information · table 2', label('34a647f5-8728-451b-b918-94c8acd15974')),
        study('Paralytic polio in the United States', 'National surveillance recorded 2,525 paralytic cases in 1960 and 61 in 1965, during the US rollout of polio vaccination.', 'These are reported annual paralytic cases across all ages. Both injected and oral vaccines were used during the vaccination era. The comparison describes a population trend.', 'CDC · historical national surveillance timeline', 'https://www.cdc.gov/about/pdf/resources/timelinefoldout.pdf')
      ],
      sources: [source('AAP family guide to polio', diseases + 'Polio.aspx'), source('New York Department of Health · 2022 investigation', 'https://www.health.ny.gov/press/releases/2022/2022-08-04_polio_detected_nys.htm')]
    },
    hib: {
      why: 'Hib bacteria can enter the blood or the lining around the brain. Even with antibiotics, Hib meningitis can cause hearing loss or other permanent injury.',
      faq: [
        qa('Is this the same as the flu shot?', 'Hib stands for Haemophilus influenzae type b, a bacterium. The seasonal flu shot protects against influenza viruses. Children need separate protection for each.'),
        qa('Can a vaccinated child still get meningitis?', 'Yes. Hib vaccine targets one cause of meningitis. Other bacteria and viruses can cause meningitis too. A sick child with symptoms of meningitis still needs urgent medical evaluation.')
      ],
      studies: [
        study('Invasive Hib infections in infancy', 'Before age 18 months, systemic Hib infection developed in 1 of 2,588 infants assigned vaccine and 22 of 2,602 assigned placebo. Estimated efficacy was 95% (95% confidence interval 72–99%).', 'Double-blind trial among Navajo infants, who faced a high baseline rate of invasive disease. The study tested an infant Hib conjugate vaccine.', 'Santosham et al. · New England Journal of Medicine, 1991', pubmed('1903846')),
        study('Redness and swelling at six hours', 'Six hours after a first dose, 2.2% had redness wider than 2.5 cm and 2.5% had swelling wider than 2.5 cm. Smaller local reactions and fussiness also occurred.', 'Liquid PedvaxHIB study in US infants ages two to six months. Local reactions were evaluated in 674 infants after dose one. Most also received DTP and oral polio vaccines.', 'PedvaxHIB prescribing information · table 5', label('9dff46c6-4b15-4d10-aca6-d5ef3735a530'))
      ],
      sources: [source('AAP family guide to Hib', diseases + 'Haemophilus-influenzae-type-b.aspx')]
    },
    pcv: {
      why: 'Pneumococcal bacteria can cause pneumonia, bloodstream infection and meningitis. The conjugate vaccine targets the bacterial types responsible for many severe infections in children.',
      faq: [
        qa('Does this prevent all pneumonia and ear infections?', 'Many viruses and bacteria cause these infections. PCV protects against selected types of pneumococcus, so a vaccinated child can still develop pneumonia or an ear infection.'),
        qa('What do the numbers in PCV15 and PCV20 mean?', 'They count the types of pneumococcus the vaccine targets. Product, age, earlier doses and certain medical conditions guide which pneumococcal doses a child needs.')
      ],
      studies: [
        study('Pain after the first pneumococcal dose', 'Within seven days of the first dose, caregivers reported injection-site pain in 49.1% of infants receiving PCV20 and 45.3% receiving PCV13.', 'Pediatric study 8, first dose at about two months. Safety diaries were available for 993 PCV20 and 974 PCV13 recipients. Both groups received a pneumococcal vaccine.', 'Prevnar 20 prescribing information · table 2', label('3a33a84f-166b-4698-90b9-d79265234ae7'), [rate('PCV20', 49.1), rate('PCV13', 45.3)]),
        study('Preventing invasive disease in Northern California', 'Among children who completed their assigned series, the trial found one case caused by a vaccine-covered strain in the pneumococcal vaccine group and 39 in the control group. Estimated efficacy was 97.4% (95% confidence interval 82.7–99.9%).', 'Randomized trial of 37,868 children. It studied the earlier seven-type pneumococcal vaccine against a meningococcal C control. The percentage applies to invasive disease from those seven types.', 'Black et al. · Pediatric Infectious Disease Journal, 2000', pubmed('10749457'))
      ],
      sources: [source('AAP · pneumococcal vaccines', aap + 'immunizations/pneumococcal-vaccines/'), source('AAP family guide to early childhood vaccines', immunizations + 'your-babys-first-vaccines.aspx')]
    },
    rv: {
      why: 'Rotavirus causes vomiting and watery diarrhea. In infants, dehydration can become severe enough to require emergency care or intravenous fluids.',
      faq: [
        qa('What should I watch for after the oral vaccine?', 'Some babies have temporary diarrhea or vomiting. Sudden repeated episodes of severe belly pain with crying, pulling up the legs, vomiting or bloody stool warrant immediate medical care. These can be signs of intussusception, a bowel blockage.'),
        qa('How uncommon is the bowel blockage?', 'A large US safety study estimated about one additional case per 100,000 first doses of RotaTeq in the following week. A prior intussusception is a contraindication to rotavirus vaccine. The age limits and product matter.')
      ],
      studies: [
        study('Mild diarrhea after the first dose', 'During the first week, 10.4% of RotaTeq recipients and 9.1% of placebo recipients had diarrhea. Vomiting was reported in 6.7% and 5.4%, respectively.', 'Infant trials with caregiver diaries after dose one. The diarrhea and vomiting analysis included 6,130 vaccine and 5,560 placebo recipients.', 'RotaTeq prescribing information · table 4', label('aaf3b24e-85fd-43ee-b657-2ee4df312ec3'), [rate('RotaTeq · diarrhea', 10.4), rate('Placebo · diarrhea', 9.1)]),
        study('Hospital and emergency visits', 'RotaTeq reduced hospitalizations and emergency visits from the four rotavirus types studied by 94.5% relative to placebo (95% confidence interval 91.2–96.6%).', 'Randomized REST infant trial. This endpoint counted visits from 14 days after dose three. The vaccine does not cover every cause of diarrhea.', 'Vesikari et al. · New England Journal of Medicine, 2006', pubmed('16394299')),
        study('A rare bowel complication after dose one', 'The estimate was 1.1 excess cases of intussusception per 100,000 first RotaTeq doses during the next seven days (95% confidence interval 0.3–2.7).', 'US postlicensure study comparing defined time windows within vaccinated infants. This estimate is excess risk above the background rate for this product and dose.', 'Yih et al. · New England Journal of Medicine, 2014', pubmed('24422676'))
      ],
      sources: [source('AAP family guide to rotavirus and its vaccine', diseases + 'Rotavirus.aspx')]
    },
    hepa: {
      why: 'Hepatitis A spreads through close contact or contaminated food and can inflame the liver. Young children can spread it even when they have few symptoms.',
      faq: [
        qa('Is this just a travel vaccine?', 'Hepatitis A also spreads within the US. A person can pass the virus to family members before anyone recognizes the illness.'),
        qa('Does hepatitis B vaccine protect against hepatitis A?', 'Hepatitis A and B are different viruses. A dose of single-antigen hepatitis B vaccine provides no hepatitis A protection.')
      ],
      studies: [
        study('Local reactions in toddlers', 'Within five days after the first dose of Vaqta given alone, caregivers reported pain or tenderness in 15.3%, redness in 11.7% and swelling in 9.5%.', 'Trial in children ages 12–23 months. These percentages describe 274 toddlers with local safety data in the group receiving the hepatitis A dose alone.', 'Vaqta prescribing information · table 1', label('89191ae9-7f2b-4206-8397-bf7fce3436ac')),
        study('Protection during a community outbreak', 'From day 50 after injection, there were no cases of clinical hepatitis A in the vaccine group and 25 in the placebo group.', 'Randomized trial in a New York community experiencing an outbreak. Of 1,037 children ages 2–16, 519 were assigned vaccine and 518 placebo. Mean follow-up was 103 days.', 'Werzberger et al. · New England Journal of Medicine, 1992', 'https://doi.org/10.1056/NEJM199208133270702')
      ],
      sources: [source('AAP family guide to hepatitis A', diseases + 'Hepatitis-A.aspx')]
    },
    mmr: {
      why: 'Measles can cause pneumonia or brain inflammation. Mumps can cause meningitis or hearing loss, and rubella during pregnancy can severely injure a developing baby. The AAP reports measles immunity in about 93% after one age-appropriate dose and 97% after two.',
      faq: [
        qa('Does MMR cause autism?', 'Large studies following children over time found no increase in autism after MMR. The Danish study below compared children who received MMR with those who had not received it, including children with an autistic sibling.'),
        qa('What about fever or a febrile seizure?', 'Fever can occur about a week after vaccination. For a first dose at ages 12–23 months, a large study found about four additional fever-related seizures per 10,000 doses with combined MMRV compared with separate MMR and varicella shots given at the same visit.')
      ],
      studies: [
        study('Soreness after a first MMR dose', 'Within four days, 25.9% of Priorix recipients and 28.1% of M-M-R II recipients had injection-site pain.', 'Randomized study in children ages 12–15 months. Caregivers reported local symptoms for 3,555 and 1,242 children, respectively. Both groups also received hepatitis A and varicella vaccines.', 'Priorix prescribing information · table 1', label('95c6fdb6-b587-4413-92f9-d592b9f7a23e'), [rate('Priorix', 25.9), rate('M-M-R II', 28.1)]),
        study('Autism diagnoses after MMR', 'Among 657,461 Danish children, the adjusted hazard ratio for autism in vaccinated versus unvaccinated children was 0.93 (95% confidence interval 0.85–1.02). A value of 1 means equal rates.', 'Nationwide observational cohort of children born in 1999–2010, with more than five million person-years of follow-up. The investigators found no increased risk, including in higher-risk subgroups.', 'Hviid et al. · Annals of Internal Medicine, 2019', pubmed('30831578')),
        study('Fever-related seizures after the combined shot', 'During days 7–10 after a first dose, MMRV was associated with 4.3 additional febrile seizures per 10,000 doses compared with same-day separate MMR and varicella vaccines (95% confidence interval 2.6–5.6).', 'US Vaccine Safety Datalink study of children ages 12–23 months. It compared 83,107 MMRV recipients with 376,354 recipients of separate shots.', 'Klein et al. · Pediatrics, 2010', journals + '126/1/e1/68346/Measles-Mumps-Rubella-Varicella-Combination')
      ],
      sources: [source('AAP · measles and immunization FAQ', aap + 'immunizations/aap-immunization-faq/'), source('AAP family guide to measles', immunizations + 'how-to-protect-your-children-during-a-measles-outbreak.aspx')]
    },
    varicella: {
      why: 'Chickenpox can lead to bacterial skin infections, pneumonia and hospitalization. The vaccine also lowers the chance that a child passes the virus to someone at high risk of severe infection.',
      faq: [
        qa('Why not let my child catch chickenpox?', 'Natural infection can cause complications even in previously healthy children. Two vaccine doses reduce the chance of chickenpox, and breakthrough cases are usually milder.'),
        qa('Can the shot cause a rash?', 'A small number of children develop a chickenpox-like rash, often with just a few spots. Contact the clinician if a rash develops, especially if there is contact with a pregnant person without immunity, a newborn, or someone with a weakened immune system.')
      ],
      studies: [
        study('Local symptoms and a chickenpox-like rash', 'After one Varivax dose, 19.3% had an injection-site symptom and 3.8% had a generalized chickenpox-like rash. Children who developed that rash had a median of five spots.', '8,916 healthy children ages 1–12 were monitored for up to 42 days. Generalized rashes peaked during days 5–26. This summary follows vaccine recipients and gives no placebo rate.', 'Varivax prescribing information · table 1', label('524cf052-e90e-4595-af0a-608edbe9bd31')),
        study('Chickenpox over ten years', 'Breakthrough chickenpox occurred in 2.2% of children assigned two doses and 7.3% assigned one dose.', 'Randomized trial in approximately 2,000 healthy children ages 12 months–12 years. Cases were counted more than 42 days after vaccination. The two-dose group received doses three months apart.', 'Kuter et al. · Pediatric Infectious Disease Journal, 2004', pubmed('14872179'), [rate('Two doses', 2.2), rate('One dose', 7.3)])
      ],
      sources: [source('AAP family guide to chickenpox', diseases + 'Varicella-ChickenPox.aspx')]
    },
    hpv: {
      why: 'HPV infections can lead to cervical, vaginal, vulvar, penile, anal and throat cancers. Vaccination before exposure helps prevent infections with cancer-causing HPV types.',
      faq: [
        qa('Why vaccinate a preteen who is not sexually active?', 'The vaccine works best before the first exposure. Starting early means protection is already in place later. The AAP supports starting at age nine.'),
        qa('Does it help boys too?', 'Yes. HPV can cause anal, penile and throat cancers as well as genital warts. Protecting against HPV matters for children of every gender.')
      ],
      studies: [
        study('A sore arm after HPV vaccination', 'In a study of 639 boys ages 9–15, 71.5% reported injection-site pain within five days of at least one dose. Severe pain that prevented usual activity occurred in 0.5%. Swelling occurred in 26.9%.', 'Gardasil 9 study 2, using a three-dose series. These are participant-level percentages after any dose in that series. Different groups, products or schedules can have different rates.', 'Gardasil 9 prescribing information · pediatric safety tables', label('a21f4f4b-b891-4f25-b747-cb9ec7d865d6')),
        study('Cervical cancer in a vaccinated population', 'The cumulative incidence of invasive cervical cancer was 47 per 100,000 in the vaccinated group and 94 per 100,000 in the unvaccinated group.', 'Swedish registry study of 1.67 million girls and women ages 10–30, followed during 2006–2017. It studied the quadrivalent vaccine. The comparison describes an association in routine care.', 'Lei et al. · New England Journal of Medicine, 2020', pubmed('32997908'))
      ],
      sources: [source('AAP · HPV vaccines', aap + 'immunizations/human-papillomavirus-vaccines/'), source('AAP family guide to HPV and cancer', immunizations + 'does-the-HPV-vaccine-prevent-oral-cancer.aspx')]
    },
    menacwy: {
      why: 'Meningococcal bacteria can cause meningitis or a bloodstream infection that becomes life-threatening within hours. MenACWY vaccines protect against groups A, C, W and Y.',
      faq: [
        qa('Is my teen covered for group B by this shot?', 'MenACWY covers four other groups. Group B protection requires a MenB-containing product. Look for the actual product or vaccine name on the record.'),
        qa('Why a booster at 16?', 'Protection after an earlier dose fades. A booster helps protect teens as they enter the age range when meningococcal disease becomes more common.')
      ],
      studies: [
        study('Arm pain with two MenACWY vaccines', 'Within seven days, 44% with Menveo and 53% with Menactra reported injection-site pain. Headache was reported by 29% and 28%, respectively.', 'Trial of ages 11–18 comparing two active vaccines. There were 1,631 Menveo and 539 Menactra recipients in the safety table. Menactra was the comparator used in this trial.', 'Menveo prescribing information · table 5', label('2dc730d5-55fd-4e98-8c8a-daa7d8f872b0'), [rate('Menveo · arm pain', 44), rate('Menactra · arm pain', 53)]),
        study('How protection changed after one dose', 'Estimated effectiveness against covered meningococcal disease was 79% in the first year (95% confidence interval 49–91%) and 61% at three to under eight years (25–79%).', 'US adolescent case-control study, 2006–2013, examining a single MenACWY-D dose. The estimates have wide intervals because invasive meningococcal disease is uncommon.', 'Cohn et al. · Pediatrics, 2017', journals + '139/2/e20162193/60323/Effectiveness-and-Duration-of-Protection-of-One')
      ],
      sources: meningococcal
    },
    tdap: {
      why: 'Protection against whooping cough declines after the childhood DTaP series. Tdap boosts protection during adolescence and renews protection against tetanus and diphtheria.',
      faq: [
        qa('Didn’t my child already get these vaccines?', 'DTaP builds protection in young children. Tdap is a booster formulation for older children and adults. Earlier childhood vaccination still leaves a role for the adolescent booster.'),
        qa('What is the difference between Td and Tdap?', 'Both include tetanus and diphtheria protection. Tdap also contains the pertussis component, which matters when a whooping cough booster is indicated.')
      ],
      studies: [
        study('Soreness after an adolescent booster', 'Arm pain occurred in 75% after Boostrix and 72% after Td. Pain that came on without touching the arm or prevented normal activity occurred in 4.6% and 4.0%, respectively.', 'US study in ages 10–18. Diaries covered vaccination day and the next 14 days. Safety data were available for 3,032 Tdap and 1,013 Td recipients.', 'Boostrix prescribing information · table 2 and accompanying text', label('cd98bff9-4602-4268-d68d-029a14a5513b'), [rate('Tdap · any arm pain', 75), rate('Td · any arm pain', 72)]),
        study('Protection during a pertussis epidemic', 'In the first year after Tdap, estimated protection against pertussis was 73% (95% confidence interval 60–82%).', 'Washington State case-control study during the 2012 epidemic. The analysis of adolescents who had received only acellular pertussis vaccines in childhood included 450 cases and 1,246 controls.', 'Acosta et al. · Pediatrics, 2015', journals + '135/6/981/75791/Tdap-Vaccine-Effectiveness-in-Adolescents-During')
      ],
      sources: [pertussis, source('AAP family fact sheets · Tdap', 'https://www.aap.org/IZFactSheets')]
    },
    menb: {
      why: 'Group B meningococcal disease is uncommon but can progress rapidly to meningitis or sepsis. Close living arrangements, outbreaks and certain medical conditions can change the potential benefit of vaccination.',
      faq: [
        qa('How should a healthy teen decide?', 'Discuss the teen’s risk, plans for residential college, timing and preferences. California recommends a shared decision for healthy people ages 16–23. People with specified high-risk conditions or an outbreak exposure have separate recommendations.'),
        qa('Can I finish the series with a different brand?', 'MenB products have different components. The same manufacturer’s MenB component is needed for a series. If the previous brand is unknown, have the clinician check the record before choosing the next dose.')
      ],
      studies: [
        study('Arm soreness after MenB vaccine', 'Within seven days, 92% reported injection-site pain after the first Bexsero dose in the two-dose arm, compared with 38% after Menveo. Severe pain occurred in 6% and 0%, respectively.', 'Study 1, ages 10–25. Safety data included 894 Bexsero and 178 Menveo recipients in these groups. Menveo was an active comparison vaccine that targets different meningococcal groups.', 'Bexsero prescribing information · table 2', label('f70cf2fc-6e6d-4a74-9f7a-db8fec072fd7'), [rate('Bexsero · any arm pain', 92), rate('Menveo · any arm pain', 38)]),
        study('MenB disease after a national vaccine program', 'England observed 63 group B cases in age groups fully eligible for infant vaccination over three years, compared with 253 expected. The estimated incidence reduction was 75%.', 'National surveillance compared observed cases with an expected count based on earlier incidence. This describes England’s infant program; direct effectiveness in US teens requires evidence in that age group.', 'Ladhani et al. · New England Journal of Medicine, 2020', 'https://doi.org/10.1056/NEJMoa1901229')
      ],
      sources: [...meningococcal, source('MenB product and manufacturer guidance', 'https://www.cdc.gov/vaccines/vpd/mening/hcp/administering-vaccine.html')]
    },
    covid19: {
      why: 'COVID-19 can send a child to urgent care or the hospital. Infants and children with certain health conditions face greater risk. Protection varies with age, prior immunity, circulating variants and time since a dose.',
      faq: [
        qa('How often does myocarditis happen?', 'It is rare and has been seen most often in adolescent and young adult males after mRNA vaccination. US data for the 2023–24 formulation found about 27 cases of myocarditis or pericarditis per million doses in males ages 12–24 in days 1–7. This counts diagnoses in that window, including background cases.'),
        qa('Which symptoms after vaccination need attention?', 'Chest pain, shortness of breath or an unusually fast or pounding heartbeat after vaccination warrant prompt medical evaluation. Soreness, fatigue or fussiness are much more common.')
      ],
      studies: [
        study('Injection-site pain in a pediatric mRNA trial', 'After dose one, 36.5% of vaccine recipients and 29.7% of saline placebo recipients had injection-site pain. Irritability or crying occurred in 67.3% and 62.5%, respectively.', 'Study 4 of the original monovalent Moderna 25-microgram vaccine, age stratum 6–23 months. Seven-day diaries after dose one included 1,982 vaccine and 661 placebo recipients. The formulation and schedule were those used in this study.', 'Spikevax prescribing information · study 4, infant safety table', label('f96b315c-fa57-4876-a7e5-a9b584d8e6e6'), [rate('Vaccine · pain', 36.5), rate('Saline · pain', 29.7)]),
        study('Emergency department and urgent care visits', 'Estimated effectiveness against a COVID-19 emergency or urgent care visit was 76% in ages 9 months–4 years (95% confidence interval 58–87%) and 56% in ages 5–17 (35–70%).', 'US VISION network, nine states. This observational analysis compared receipt of a 2024–25 vaccine 7–179 days earlier with no 2024–25 dose in immunocompetent children. Ages 9 months–4 years with an incomplete initial series were excluded. Future seasons may differ.', 'VISION network · original analysis in MMWR, 2025', 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7440a1.htm'),
        study('Heart inflammation in postmarketing monitoring', 'For the 2023–24 mRNA vaccines, the unadjusted rate of myocarditis or pericarditis diagnoses during days 1–7 was about 8 per million doses in ages 6 months–64 years and 27 per million in males ages 12–24.', 'FDA analysis of commercial inpatient and outpatient claims. This unadjusted measure includes cases that would occur in the background. The younger male group is part of the overall group.', 'FDA · myocarditis and pericarditis label update, 2025', 'https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/fda-approves-required-updated-warning-labeling-mrna-covid-19-vaccines-regarding-myocarditis-and')
      ],
      sources: [source('AAP · COVID vaccination for children', healthy + 'health-issues/conditions/COVID-19/Pages/when-can-kids-get-the-COVID-vaccine-or-booster.aspx'), source('AAP · answers about myocarditis', healthy + 'tips-tools/ask-the-pediatrician/Pages/Does-the-COVID-19-vaccine-cause-myocarditis-in-teens-and-young-people.aspx')]
    },
    flu: {
      why: 'Influenza can cause pneumonia, worsen asthma and lead to hospitalization. Young children can become seriously ill even when they were healthy before infection.',
      faq: [
        qa('Can the flu shot give a child influenza?', 'Injected inactivated flu vaccine cannot cause influenza. A sore arm or a short fever can occur as the immune system responds. Other respiratory viruses circulate during flu season, too.'),
        qa('Why get it again every year?', 'Influenza viruses change and immune protection declines. The seasonal vaccine is selected for circulating strains. How well it works varies by season and by the outcome measured.')
      ],
      studies: [
        study('Soreness after the first flu dose', 'Within seven days of the first injection, 17% of children given a quadrivalent flu vaccine had injection-site pain, compared with 18% after a non-influenza comparison vaccine.', 'Fluarix Quadrivalent trial in ages 6–35 months. Local diaries covered 5,899 flu and 5,896 comparison recipients. Comparators for dose one were pneumococcal or hepatitis A vaccine according to age. This was an earlier seasonal formulation.', 'Fluarix prescribing information · table 5', label('61d4995d-92be-4678-74b9-79b3e12e5e30'), [rate('Influenza vaccine', 17), rate('Comparison vaccine', 18)]),
        study('Laboratory-confirmed influenza in young children', 'PCR-confirmed influenza occurred in 356 of 6,006 children (6%) receiving quadrivalent flu vaccine and 693 of 6,012 (12%) receiving a non-flu vaccine.', 'Randomized trial of healthy children ages 6–35 months in 13 countries, with five cohorts enrolled in different influenza seasons. These historical results show how protection was measured.', 'Claeys et al. · Lancet Child & Adolescent Health, 2018', pubmed('30169267'), [rate('Influenza vaccine', 6), rate('Comparison vaccine', 12)])
      ],
      sources: [source('AAP family guide to flu vaccines', healthy + 'health-issues/conditions/flu/Pages/which-flu-vaccine-should-my-child-get-this-year.aspx')]
    }
  };

  root.VaccineEvidence = evidence;
  if (typeof module !== 'undefined' && module.exports) module.exports = evidence;
})(typeof globalThis !== 'undefined' ? globalThis : this);
