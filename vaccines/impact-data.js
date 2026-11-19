/* Published observations used by the evidence page. Each series links to its source. */
window.VaccineImpactData = {
  studies: {
    "hepb": {
      topic: "Hepatitis B",
      design: "U.S. surveillance over time",
      title: "Acute hepatitis B in children and teens",
      population: "United States · ages 0–19 · selected years",
      finding: "In 2023, health departments reported 2,159 fewer cases of acute hepatitis B in this age group than in 1990, a 99% decline.",
      measure: "Reported acute cases per year",
      max: 2200,
      rows: [
        ["1990", 2180],
        ["2010", 48],
        ["2015", 19],
        ["2019", 13],
        ["2020", 20],
        ["2021", 20],
        ["2022", 14],
        ["2023", 21]
      ],
      context: "Routine infant vaccination began in 1991 alongside prenatal screening and protection for exposed newborns. By 2002, the reported rate had already fallen from 3.03 to 0.34 cases per 100,000 children and teens. Many childhood infections cause few symptoms and escape this count. Infection in infancy can persist and cause liver cancer years later.",
      sources: [
        ["AAP family guide to hepatitis B", "https://www.healthychildren.org/English/health-issues/vaccine-preventable-diseases/Pages/Hepatitis-B.aspx"],
        ["1990 count · Bixler et al., national surveillance analysis", "https://doi.org/10.1177/00333549231175548"],
        ["1990–2002 rates · CDC surveillance study", "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5343a4.htm"],
        ["2010 count · national viral hepatitis data, Appendix B", "https://www.hhs.gov/sites/default/files/National%20Viral%20Hepatitis%20Action%20Plan%202017-2020.pdf"],
        ["2015 count · national surveillance, Table 2.2", "https://archive.cdc.gov/www_cdc_gov/hepatitis/statistics/2019surveillance/Table2.2.htm"],
        ["2019–2023 counts · national surveillance, Table 2.2", "https://www.cdc.gov/hepatitis-surveillance-2023/hepatitis-b/table-2-2.html"]
      ],
    },
    "varicella": {
      topic: "Chickenpox",
      design: "National hospital discharge study",
      title: "Hospital admissions for chickenpox",
      population: "United States · ages 0–19",
      finding: "Before routine vaccination, hospitals admitted an estimated 8,574 children and teens with chickenpox each year. By 2018–2019, that annual average was 285.",
      measure: "Estimated admissions per year",
      max: 9000,
      rows: [
        ["1993–1995", 8574],
        ["2005–2006", 1204],
        ["2018–2019", 285]
      ],
      context: "Investigators weighted hospital discharge records to estimate national totals. The corresponding annual admission rates were 11.3, 1.5 and 0.3 per 100,000 children and teens. These periods cover the baseline, the established one-dose program and the established two-dose program.",
      sources: [
        ["Marin et al. · national hospital study", "https://pubmed.ncbi.nlm.nih.gov/36265852/"],
        ["Original counts and rates · Table 1, under age 20", "https://academic.oup.com/view-large/377587716"]
      ],
    },
    "pcv": {
      topic: "Pneumococcal disease",
      design: "Before and after PCV13 introduction",
      title: "Invasive pneumococcal infections in Northern California",
      population: "Kaiser Permanente Northern California · ages 6 weeks to under 6 years",
      finding: "After the 13-valent pneumococcal vaccine (PCV13) replaced the 7-valent vaccine (PCV7), the rate of invasive infection fell by 65% in this health system.",
      measure: "Annual cases per 100,000 members in this age group",
      max: 12,
      rows: [
        ["2008–2010", 11.57],
        ["2011–2018", 4.09]
      ],
      context: "Investigators tracked infections in normally sterile sites, such as blood, from all pneumococcal types. They compared May 2008–April 2010 with May 2011–April 2018 and excluded the transition year. The rate ratio was 0.35 (95% confidence interval, 0.25–0.50). This comparison describes local disease rates across the two vaccine eras.",
      sources: [
        ["Northern California surveillance study", "https://pubmed.ncbi.nlm.nih.gov/32415771/"],
        ["Original incidence rates · Table 2", "https://academic.oup.com/view-large/233100251"]
      ],
    },
    "rv": {
      topic: "Rotavirus",
      design: "Hospital surveillance across vaccine eras",
      title: "Rotavirus among children hospitalized with gastroenteritis",
      population: "Cincinnati, Nashville and Rochester · children under age 3",
      finding: "Before widespread vaccination, about half of children hospitalized with gastroenteritis tested positive for rotavirus. During 2008–2016, about one in ten did.",
      measure: "Percent of enrolled gastroenteritis admissions positive for rotavirus",
      max: 100,
      suffix: "%",
      rows: [
        ["2006–2007", 49],
        ["2008–2016", 10]
      ],
      context: "Researchers tested stool samples from 2,187 hospitalized children across both periods. Each percentage is the share of enrolled gastroenteritis admissions in its period that tested positive for rotavirus.",
      sources: [
        ["Three-site pediatric surveillance study", "https://pubmed.ncbi.nlm.nih.gov/32060546/"],
        ["AAP Pediatrics · subsequent U.S. effectiveness study", "https://doi.org/10.1542/peds.2024-066879"]
      ],
    },
    "tdap": {
      topic: "Tdap during pregnancy or after delivery",
      design: "Cohort comparison during the same period",
      title: "Whooping cough in the first eight weeks of life",
      population: "California · infants born in 2013–2014",
      finding: "Infants whose mothers received Tdap during pregnancy had fewer cases of whooping cough before eight weeks of age than infants whose mothers received Tdap shortly after delivery.",
      measure: "Reported cases before age 8 weeks per 10,000 infants",
      max: 6,
      rows: [
        ["After delivery", 5.4],
        ["During pregnancy", 1.9]
      ],
      context: "The bars show the unadjusted rates calculated from 17 cases among 31,534 infants after maternal Tdap within 14 days after delivery, and 8 among 42,908 after maternal Tdap at any point in pregnancy. A separate adjusted analysis comparing vaccination at 27–36 weeks of pregnancy with postpartum vaccination estimated an 85% lower risk (95% confidence interval, 33%–98%).",
      sources: [
        ["Winter et al. · California Department of Public Health study, Tables 1 and 5", "https://doi.org/10.1093/cid/ciw634"],
        ["Original cohort counts · Chapter 2, Table 1", "https://escholarship.org/uc/item/29b651qt"]
      ],
    },
    "pertussis": {
      topic: "Whooping cough in all ages",
      design: "U.S. surveillance over time",
      title: "A century of reported whooping cough",
      population: "United States · all ages · selected years",
      finding: "The U.S. averaged 147,271 reported cases a year in 1922–1925. Reports fell to 1,010 in 1976 and later rose again, reaching 48,277 during the 2012 epidemic.",
      measure: "Reported pertussis cases per year",
      max: 150000,
      rows: [
        ["1922–1925 average", 147271],
        ["1950", 120718],
        ["1960", 14809],
        ["1976", 1010],
        ["1990", 4570],
        ["2012", 48277],
        ["2019", 18617],
        ["2023", 7063]
      ],
      context: "Whole-cell pertussis vaccine came into widespread use in the 1940s. The U.S. later introduced acellular childhood vaccines and adolescent and adult boosters. Epidemic cycles, waning protection, and changes in testing and reporting all affect these counts. The trend spans several vaccines and age groups.",
      sources: [
        ["National surveillance · pre-vaccine average, Table 2", "https://www.cdc.gov/mmwr/preview/mmwrhtml/00056803.htm"],
        ["U.S. pertussis surveillance · annual case counts", "https://www.cdc.gov/pertussis/php/surveillance/index.html"]
      ],
    },
    "tetanus": {
      topic: "Tetanus",
      design: "Historical estimate and U.S. surveillance",
      title: "Tetanus before and after routine vaccination",
      population: "United States · all ages · selected years",
      finding: "Before tetanus vaccine, researchers estimate that about 1,314 people developed tetanus each year. National surveillance recorded 560 cases in 1947 and 18 in 2023.",
      measure: "Tetanus cases per year · estimated before 1927, reported from 1947",
      max: 1400,
      rows: [
        ["1922–1926 estimate", 1314],
        ["1947", 560],
        ["1960", 368],
        ["1980", 95],
        ["2000", 35],
        ["2019", 26],
        ["2023", 18]
      ],
      context: "The first estimate uses deaths recorded in 1922–1926 and assumes 90% of cases were fatal. Routine childhood vaccination began in the 1940s. National case reporting started in 1947. Better wound care and wider use of tetanus immune globulin also contributed to the decline.",
      sources: [
        ["Historical baseline · estimation method, Table 2", "https://www.cdc.gov/mmwr/preview/mmwrhtml/00056803.htm"],
        ["U.S. tetanus surveillance · annual case counts", "https://www.cdc.gov/tetanus/php/surveillance/index.html"]
      ],
    },
    "mumps": {
      topic: "Mumps",
      design: "U.S. surveillance since vaccine licensure",
      title: "Mumps after the first U.S. vaccine",
      population: "United States · all ages · selected years",
      finding: "The U.S. recorded 152,209 cases in 1968, the first year of national reporting, and 231 in 2003. Later outbreaks caused thousands of cases in some years.",
      measure: "Reported mumps cases per year",
      max: 160000,
      rows: [
        ["1968", 152209],
        ["2003", 231],
        ["2006", 6584],
        ["2016", 6369],
        ["2023", 433]
      ],
      context: "National reporting began one year after the first mumps vaccine was licensed in 1967. The earliest bar therefore represents the start of the vaccine era. The two-dose MMR recommendation followed in 1989. Outbreaks can still occur, particularly where people are in prolonged close contact.",
      sources: [
        ["U.S. mumps surveillance · annual counts and outbreaks", "https://www.cdc.gov/mumps/outbreaks/index.html"],
        ["CDC Pink Book · history of mumps vaccination", "https://www.cdc.gov/pinkbook/hcp/table-of-contents/chapter-15-mumps.html"]
      ],
    },
    "rubella": {
      topic: "Rubella",
      design: "U.S. surveillance over time",
      title: "Rubella before and after the U.S. vaccine program",
      population: "United States · all ages · selected years",
      finding: "Before vaccine licensure in 1969, the U.S. averaged 47,745 reported rubella cases per year. In 2004, the year experts confirmed that sustained U.S. transmission had ended, there were nine.",
      measure: "Reported rubella cases per year",
      max: 60000,
      rows: [
        ["1966–1968 average", 47745],
        ["1969", 57686],
        ["1976", 12491],
        ["1981", 2077],
        ["1988", 225],
        ["1990", 1125],
        ["2004", 9]
      ],
      context: "The first bar averages the three years before licensure. Each later bar covers one year. Preventing rubella during pregnancy protects babies from congenital rubella syndrome, which can cause hearing loss, cataracts and heart defects. Cases introduced from abroad can still occur.",
      sources: [
        ["National surveillance · pre-vaccine baseline, Table 2", "https://www.cdc.gov/mmwr/preview/mmwrhtml/00056803.htm"],
        ["U.S. rubella and congenital rubella surveillance, 1969–2004", "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5411a5.htm"]
      ],
    },
    "dtap": {
      topic: "Diphtheria",
      design: "U.S. surveillance over time",
      title: "Reported diphtheria in the United States",
      population: "United States · all ages",
      finding: "Before diphtheria vaccine, the U.S. averaged 175,885 reported cases each year. During 1996–2018, the country recorded 14 cases in 23 years.",
      measure: "Reported cases per year",
      max: 180000,
      rows: [
        ["1920–22 average", 175885],
        ["1945 (approx.)", 19000],
        ["1980", 2],
        ["1996–2018 average", 0.61]
      ],
      context: "Routine childhood vaccination expanded in the late 1940s. The 1945 count is rounded in the historical record. The final bar shows the annual average of 14 cases over 23 years. Reporting criteria and testing changed over this period.",
      sources: [
        ["National surveillance · Historical baseline, Table 2", "https://www.cdc.gov/mmwr/preview/mmwrhtml/00056803.htm"],
        ["CDC Pink Book · U.S. diphtheria trends", "https://www.cdc.gov/pinkbook/hcp/table-of-contents/chapter-7-diphtheria.html"],
        ["Otshudiema et al. · U.S. surveillance, 1996–2018", "https://pubmed.ncbi.nlm.nih.gov/32818967/"],
        ["Chen et al. · U.S. case surveillance, 1971–1981", "https://pubmed.ncbi.nlm.nih.gov/4061710/"]
      ],
    },
    "ipv": {
      topic: "Paralytic polio",
      design: "U.S. surveillance over time",
      title: "Paralytic polio before and after U.S. vaccination began",
      population: "United States · all ages",
      finding: "An average of 16,316 people developed reported paralytic polio each year in 1951–1954. By 1965, the U.S. reported 61 cases in one year.",
      measure: "Reported paralytic polio cases per year",
      max: 17000,
      rows: [
        ["1951–54 average", 16316],
        ["1960", 2525],
        ["1965", 61],
        ["1980–99 average", 8.1]
      ],
      context: "The inactivated vaccine entered use in 1955 and the oral vaccine in 1961. The last U.S. outbreak of locally acquired wild polio occurred in 1979. The final bar includes all 162 confirmed paralytic cases over 20 years, including 154 associated with the older oral vaccine.",
      sources: [
        ["National surveillance · Pre-vaccine paralytic polio", "https://www.cdc.gov/mmwr/preview/mmwrhtml/00056803.htm"],
        ["CDC Pink Book · U.S. polio trends and surveillance", "https://www.cdc.gov/pinkbook/hcp/table-of-contents/chapter-18-poliomyelitis.html"]
      ],
    },
    "hib": {
      topic: "Invasive Hib disease",
      design: "California surveillance during rollout",
      title: "Invasive Hib disease during California’s infant vaccine rollout",
      population: "California · children younger than 5 years",
      finding: "California recorded 346 invasive Hib cases in children under 5 in 1990 and four in 1996. The annual rate fell from 13.9 to 0.1 per 100,000 children.",
      measure: "Reported invasive Hib cases per 100,000 children under 5",
      max: 15,
      rows: [
        ["1990", 13.9],
        ["1991", 5.8],
        ["1992", 2.1],
        ["1993", 0.6],
        ["1994", 0.5],
        ["1995", 0.3],
        ["1996", 0.1]
      ],
      context: "Infant vaccination began in 1990. A vaccine for older children was already available. These rates include infections in which type b bacteria were identified in a normally sterile site, such as blood or spinal fluid. In 26% of invasive H. influenzae cases during the study, the bacterial type was unknown.",
      sources: [
        ["California Department of Health Services and CDC · State surveillance, Table 1", "https://www.cdc.gov/mmwr/PDF/wk/mm4735.pdf#page=6"]
      ],
    },
    "hepa": {
      topic: "Hepatitis A",
      design: "U.S. surveillance over time",
      title: "Reported hepatitis A before and after vaccine introduction",
      population: "United States · all ages",
      finding: "The rate was 10.3 per 100,000 in 1994, the year before vaccine licensure, and 0.4 in 2011. It rose again during outbreaks before falling to 0.5 in 2023.",
      measure: "Reported acute hepatitis A cases per 100,000 people",
      max: 12,
      rows: [
        ["1994", 10.3],
        ["1996", 11.7],
        ["2003", 2.6],
        ["2006", 1.2],
        ["2011", 0.4],
        ["2019", 5.7],
        ["2023", 0.5]
      ],
      context: "Vaccination began in selected communities in the 1990s and became routine nationwide for young children in 2006. Person-to-person outbreaks, largely among adults, drove the later rise. Surveillance misses infections that cause no symptoms or never reach medical care.",
      sources: [
        ["Wasley et al. · U.S. annual surveillance, Table 2", "https://www.cdc.gov/mmwr/preview/mmwrhtml/ss5702a1.htm"],
        ["National surveillance · Childhood vaccination and the 2011 rate", "https://www.cdc.gov/mmwr/volumes/65/su/su6501a6.htm"],
        ["National surveillance · 2019 outbreak and rate", "https://archive.cdc.gov/www_cdc_gov/hepatitis/statistics/2019surveillance/Table1.1.htm"],
        ["National surveillance · 2023 report, Table 1.1", "https://www.cdc.gov/hepatitis-surveillance-2023/hepatitis-a/table-1-1.html"]
      ],
    },
    "mmr": {
      topic: "Measles",
      design: "U.S. surveillance over time",
      title: "Reported measles cases before and after vaccine introduction",
      population: "United States · all ages · selected completed years",
      finding: "Before the first measles vaccine, the United States averaged 530,217 reported cases a year. In 2006 there were 55. Later outbreaks brought the count back into the thousands in some years.",
      measure: "Reported measles cases per year",
      max: 550000,
      rows: [
        ["1953–1962 average", 530217],
        ["2006", 55],
        ["2019", 1274],
        ["2024", 285],
        ["2025", 2289]
      ],
      context: "The first U.S. measles vaccine was licensed in 1963 and the combined MMR vaccine in 1971. The first bar averages ten years to smooth the large epidemics of the pre-vaccine era. The later bars are individual years. Reporting practices changed over time, and outbreaks still occur where susceptible people are exposed. This chart tracks the measles component of MMR.",
      sources: [
        ["Roush and Murphy · historical U.S. surveillance, Table 1", "https://jamanetwork.com/journals/jama/fullarticle/209448"],
        ["CDC · confirmed U.S. measles cases and outbreaks", "https://www.cdc.gov/measles/data-research/index.html"],
        ["CDC Pink Book · measles vaccine history", "https://www.cdc.gov/pinkbook/hcp/table-of-contents/chapter-13-measles.html"]
      ],
    },
    "hpv": {
      topic: "Vaccine-type HPV infection",
      design: "National survey across vaccine eras",
      title: "HPV infections in U.S. teens after vaccination began",
      population: "United States · females ages 14–19 · national health survey",
      finding: "The share testing positive for at least one of four vaccine-targeted HPV types fell from 11.5% in 2003–2006 to 1.1% in 2015–2018.",
      measure: "Percent with detectable HPV type 6, 11, 16 or 18",
      max: 15,
      suffix: "%",
      rows: [
        ["2003–2006", 11.5],
        ["2007–2010", 5],
        ["2011–2014", 3.3],
        ["2015–2018", 1.1]
      ],
      context: "The U.S. recommended routine HPV vaccination for girls in 2006. Researchers tested swabs from a nationally representative sample in each period, including vaccinated and unvaccinated teens. Changes in exposure and indirect protection can both influence this measure. The final estimate was less precise (95% confidence interval 0.5%–2.4%). The outcome is current infection with these four types.",
      sources: [
        ["Rosenblum et al. · original NHANES study and corrected Table 1", "https://www.cdc.gov/mmwr/volumes/70/wr/mm7012a2.htm"]
      ],
    },
    "menacwy": {
      topic: "MenACWY · Invasive disease",
      design: "U.S. surveillance across vaccine eras",
      title: "Invasive meningococcal disease in adolescents and young adults",
      population: "United States · ages 16–22 · meningococcal groups C, W and Y",
      finding: "The estimated annual rate fell from 0.60 cases per 100,000 before the adolescent vaccination program to 0.31 after the first-dose recommendation and 0.07 after the booster recommendation.",
      measure: "Average annual invasive C, W or Y cases per 100,000 people ages 16–22",
      max: 0.65,
      rows: [
        ["2000–2005", 0.6],
        ["2006–2010", 0.31],
        ["2011–2017", 0.07]
      ],
      context: "U.S. adolescents were recommended a routine MenACWY dose at ages 11–12 in 2005 and a booster at age 16 in 2010. National surveillance already showed falling disease rates before vaccination. The decline accelerated in this age group after the booster recommendation. Investigators estimated the bacterial group where it was missing from reports.",
      sources: [
        ["Mbaeyi et al. · original JAMA Pediatrics surveillance study, supplement eTable 1", "https://jamanetwork.com/journals/jamapediatrics/fullarticle/2768552"]
      ],
    },
    "menb": {
      topic: "Infant cases in England",
      design: "Birth cohorts before and after rollout",
      title: "Meningococcal B disease after England introduced infant vaccination",
      population: "England · comparable infant birth cohorts · ten-month observation windows",
      finding: "England recorded 37 laboratory-confirmed MenB cases in eligible infants during the first ten months of its vaccine program. Comparable infant cohorts had averaged 74 cases over the same months in the previous four years.",
      measure: "Laboratory-confirmed invasive MenB cases per ten-month observation window",
      max: 80,
      rows: [
        ["Before · four-season mean", 74],
        ["Sep 2015–Jun 2016", 37]
      ],
      context: "Public Health England compared equivalent birth cohorts regardless of whether individual infants received the 4CMenB (Bexsero) vaccine. The incidence rate ratio was 0.50 (95% confidence interval 0.36–0.71). These data describe England’s infant program. U.S. adolescents have a different baseline risk and vaccination schedule.",
      sources: [
        ["Parikh et al. · Public Health England study of the first ten months", "https://doi.org/10.1016/S0140-6736(16)31921-3"],
        ["Ladhani et al. · three-year follow-up of England’s infant program", "https://pubmed.ncbi.nlm.nih.gov/31971676/"]
      ],
    },
    "flu": {
      topic: "Influenza",
      design: "Hospitalizations before and after program expansion",
      title: "Flu hospitalizations in young children",
      population: "Ontario, Canada · children under 5",
      finding: "Ontario expanded free flu vaccination to everyone aged 6 months and older in fall 2000. The estimated annual hospitalization rate for flu in children under 5 fell from 44.5 to 23.6 per 100,000.",
      measure: "Estimated flu-associated hospitalizations per 100,000 children per year",
      max: 50,
      rows: [
        ["1997–98 to 1999–2000", 44.5],
        ["2000–01 to 2003–04", 23.6]
      ],
      context: "In the other nine provinces, which continued targeted vaccination programs, the rate rose from 44.3 to 59.9 over the same seasons. Researchers estimated flu’s contribution from seasonal patterns in pneumonia and influenza admissions. Flu severity varies by season, and these population averages include infants too young for vaccination.",
      sources: [
        ["Kwong et al. · PLOS Medicine, Table 3", "https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.0050211"]
      ],
    },
    "covid19": {
      topic: "Hospitalizations by vaccination status",
      design: "Cohort comparison during the same wave",
      title: "COVID-19 hospitalizations during early Omicron",
      population: "COVID-NET sites in 11 U.S. states · children aged 5–11",
      finding: "During the same early Omicron wave, there were 19.1 hospitalizations per 100,000 unvaccinated children and 9.2 per 100,000 children who had received two Pfizer doses.",
      measure: "COVID-19-associated hospitalizations per 100,000 children in each group",
      max: 20,
      rows: [
        ["Unvaccinated", 19.1],
        ["Two Pfizer doses", 9.2]
      ],
      context: "These are cumulative rates from December 2021 through February 2022. Vaccinated children had completed the original two-dose series at least 14 days before their positive test. Surveillance included children who tested positive during admission or in the prior 14 days, including those admitted for other reasons. Variants and vaccine formulations have changed since this wave.",
      sources: [
        ["Shi et al. · COVID-NET hospitalization study", "https://www.cdc.gov/mmwr/volumes/71/wr/mm7116e1.htm"]
      ],
    },
    "mis-c": {
      topic: "MIS-C over time",
      design: "U.S. surveillance across pandemic waves",
      title: "A serious complication of COVID-19 became rarer",
      population: "United States · people under 21",
      finding: "Reported multisystem inflammatory syndrome in children (MIS-C), a serious illness that can follow COVID-19, fell from 6.79 cases per million people per month in the pre-Delta period to 0.11 in 2023.",
      measure: "Reported MIS-C cases per million people under 21 per month",
      max: 7,
      rows: [
        ["Oct 2020–Apr 2021 · pre-Delta", 6.79],
        ["Jul–Dec 2021 · Delta", 4.9],
        ["Jan–Apr 2022 · early Omicron", 4.21],
        ["Apr–Dec 2022 · later Omicron", 0.56],
        ["Jan–Dec 2023", 0.11]
      ],
      context: "These surveillance periods span the expansion of pediatric vaccination. Circulating variants, prior infections and vaccine uptake all changed. Reporting was incomplete in 2023, when the case definition also changed. This time series cannot quantify the share of the decline due to vaccination.",
      sources: [
        ["Yousaf et al. · U.S. national MIS-C surveillance", "https://www.cdc.gov/mmwr/volumes/73/wr/mm7310a2.htm"]
      ],
    },
    "rsv": {
      topic: "RSV",
      design: "Hospital surveillance before and after rollout",
      title: "Infant RSV hospitalizations before and after rollout",
      population: "U.S. RSV-NET sites · infants aged 0–7 months",
      finding: "After maternal RSV vaccination and the infant antibody nirsevimab became widely available, RSV hospitalization rates were 43% lower than in the two comparison seasons (95% confidence interval, 40%–46%).",
      measure: "RSV-associated hospitalizations per 1,000 infants, October through February 28",
      max: 16,
      rows: [
        ["2018–19 and 2019–20 pooled", 15],
        ["2024–25", 8.5]
      ],
      context: "Hospitals in the RSV-NET surveillance area recorded admissions for the same months in each season. Researchers adjusted the rates for missed infections and test sensitivity. The comparison captures both prevention options together. RSV circulation and other seasonal differences can also affect these rates.",
      sources: [
        ["Patton et al. · RSV-NET and New Vaccine Surveillance Network, Table", "https://www.cdc.gov/mmwr/volumes/74/wr/mm7416a1.htm"]
      ],
    },
    "maternal-trend": {
      topic: "Infant cases before and after maternal Tdap",
      design: "U.S. surveillance before and after maternal Tdap",
      title: "Whooping cough in the first two months of life",
      population: "United States · infants younger than 2 months",
      finding: "Reported whooping cough averaged 165.3 cases per 100,000 infants per year before the U.S. recommended Tdap during pregnancy, and 121.8 in the years after the recommendation.",
      measure: "Mean annual reported pertussis cases per 100,000 infants younger than 2 months",
      max: 180,
      rows: [
        ["2000–2010 · before recommendation", 165.3],
        ["2012–2019 · after recommendation", 121.8]
      ],
      context: "Researchers excluded the transition year, 2011. As maternal vaccination increased, incidence fell from 205.4 in 2012 to 75.4 in 2016 and averaged 80.9 in 2017–2019. The change in trend was significant for infants under 2 months. Infants aged 6–11 months had no significant change in trend. Individual mothers’ vaccination status was unavailable in this surveillance study.",
      sources: [
        ["Skoff et al. · JAMA Pediatrics, U.S. infant pertussis surveillance", "https://jamanetwork.com/journals/jamapediatrics/fullarticle/2801085"]
      ],
    },
    "cervical-cancer": {
      topic: "Invasive cervical cancer",
      design: "Population registry cohort study",
      title: "Cervical cancer by age 30 in Sweden",
      population: "Sweden · 1.67 million girls and women ages 10–30 · 2006–2017",
      finding: "By age 30, there were 94 cervical cancer diagnoses per 100,000 among unvaccinated women and 47 per 100,000 among vaccinated women.",
      measure: "Cumulative invasive cervical cancer cases per 100,000 by age 30",
      max: 100,
      rows: [
        ["Unvaccinated", 94],
        ["Received quadrivalent HPV vaccine", 47]
      ],
      context: "The bars compare unadjusted cumulative incidence by vaccination status during the same period. In a separate analysis accounting for age, calendar year, residence and parental characteristics, the incidence rate ratio was 0.37 (95% CI 0.21–0.57).",
      sources: [
        ["Lei et al., New England Journal of Medicine (2020), Figure 2 and Table 2", "https://doi.org/10.1056/NEJMoa1917338"]
      ],
    },
    "adolescent-menb": {
      topic: "Adolescent cases in South Australia",
      design: "Adolescent surveillance before and after rollout",
      title: "Invasive MenB disease in South Australian adolescents",
      population: "South Australia · Ages 15–18 years",
      finding: "Among 15- to 18-year-olds, the annual rate of invasive meningococcal B disease fell from 4.846 to 1.460 cases per 100,000 after the state started funding adolescent 4CMenB vaccination.",
      measure: "Annual invasive MenB cases per 100,000 adolescents ages 15–18",
      max: 5,
      rows: [
        ["Feb 2011–Jan 2019", 4.846],
        ["Feb 2019–Jan 2024", 1.46]
      ],
      context: "The state recorded an average of 4 cases per year before the funded program and 1.2 per year afterward. These population rates include vaccinated and unvaccinated adolescents. Some schools offered the vaccine in an earlier trial, and the later period included COVID-19 distancing.",
      sources: [
        ["Wang et al. · Five-year adolescent program results, Table 2", "https://academic.oup.com/cid/article/81/4/e202/8196832"],
        ["Wang et al. · Program introduction and COVID-19 distancing", "https://digital.library.adelaide.edu.au/items/3e8be296-e458-418a-a527-e0d9b946a454/full"]
      ],
    },
  },
  // By default the study key matches the immunization ID in schedule.js.
  outcomes: {
    menb: ["adolescent-menb", "menb"],
    dtap: ["dtap", "tetanus", "pertussis"],
    mmr: ["mmr", "mumps", "rubella"],
    tdap: ["maternal-trend", "tdap", "pertussis", "tetanus", "dtap"],
    covid19: ["covid19", "mis-c"],
    hpv: ["hpv", "cervical-cancer"]
  }
};
