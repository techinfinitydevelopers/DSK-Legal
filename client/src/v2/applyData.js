// Application forms for /careers/internship and /careers/apply — fields, options and required flags copied from dsklegal.com/Internship and /job (scraped 2026-11-06).
// Differences from the source: free-text answers are textareas, dates use a date input, hidden duplicate "University/Board" boxes are dropped, and the practice-area fields only show for "Legal" applicants.
// `showIf: { id, eq }` = visible when that field equals `eq`; `{ id, any: true }` = visible when that field is filled.

export const INTERN_FORM = {
 "sections": [
  {
   "title": "College details",
   "fields": [
    {
     "id": "field_college",
     "label": "Name of College",
     "type": "text",
     "required": true,
     "placeholder": "Name of College"
    },
    {
     "id": "field_d374fea",
     "label": "Course Enrolled",
     "type": "select",
     "required": true,
     "options": [
      "5 year LLB",
      "3 year LLB",
      "LLM"
     ]
    },
    {
     "id": "field_fd9ecff",
     "label": "Year of Study",
     "type": "select",
     "required": true,
     "options": [
      "4th Year (5 Year LLB)",
      "5th Year (5 Year LLB)"
     ],
     "showIf": {
      "id": "field_d374fea",
      "eq": "5 year LLB"
     }
    },
    {
     "id": "field_f3906b0",
     "label": "Year of Study",
     "type": "select",
     "required": true,
     "options": [
      "2nd Year (3 Year LLB)",
      "3rd Year (3 Year LLB)"
     ],
     "showIf": {
      "id": "field_d374fea",
      "eq": "3 year LLB"
     }
    },
    {
     "id": "field_eb2ff09",
     "label": "CGPA/Percentage",
     "type": "number",
     "required": true,
     "placeholder": "Number must be between 60 to 100",
     "min": 60,
     "max": 100
    },
    {
     "id": "field_dd58894",
     "label": "Preferred Office Location",
     "type": "select",
     "required": true,
     "options": [
      "Mumbai",
      "New Delhi",
      "Bengaluru",
      "Pune",
      "Chennai"
     ]
    },
    {
     "id": "field_4df0e51",
     "label": "Preferred Practice Area",
     "type": "select",
     "required": true,
     "options": [
      "Litigation",
      "Non Litigation"
     ]
    }
   ]
  },
  {
   "title": "Personal details",
   "fields": [
    {
     "id": "field_34dadb4",
     "label": "Full Name",
     "type": "text",
     "required": true
    },
    {
     "id": "field_24e17ab",
     "label": "Date of Birth",
     "type": "date",
     "required": true
    },
    {
     "id": "field_2ac0f87",
     "label": "Email Address",
     "type": "email",
     "required": true
    },
    {
     "id": "field_11fb863",
     "label": "Contact Number (do not enter +91)",
     "type": "tel",
     "required": true
    },
    {
     "id": "field_fc54b58",
     "label": "Address",
     "type": "text",
     "required": true
    }
   ]
  },
  {
   "title": "Internship",
   "fields": [
    {
     "id": "field_6c2ef5a",
     "label": "Applying for",
     "type": "select",
     "required": true,
     "options": [
      "1 Month Internship"
     ]
    },
    {
     "id": "field_8005375",
     "label": "Month of Internship",
     "type": "select",
     "required": true,
     "options": [
      "January 2027",
      "February 2027",
      "March 2027"
     ]
    }
   ]
  },
  {
   "title": "Moot court",
   "fields": [
    {
     "id": "field_f5d3524",
     "label": "Highest Level of Moot Court Representation",
     "type": "select",
     "required": true,
     "options": [
      "University",
      "State",
      "National",
      "International",
      "None"
     ]
    },
    {
     "id": "field_c5c51ce",
     "label": "Your Role in moot court representation",
     "type": "select",
     "required": true,
     "options": [
      "Speaker",
      "Researcher",
      "None"
     ]
    },
    {
     "id": "field_b140a1a",
     "label": "Details of Moot Court Representation",
     "type": "select",
     "required": true,
     "options": [
      "Winner",
      "First Runner Up",
      "Second Runner Up",
      "Participant",
      "None"
     ]
    },
    {
     "id": "field_c8adf9f",
     "label": "Details of any other Moot Court Representation",
     "type": "text",
     "required": false,
     "placeholder": "Please mention Name of Moot, Level, Your Role & Result ( Ex. XYZ Moot, International, Speaker & Winner)"
    }
   ]
  },
  {
   "title": "Publications & activities",
   "fields": [
    {
     "id": "field_0e53249",
     "label": "Number of Papers Published/Presented at National Level",
     "type": "number",
     "required": true
    },
    {
     "id": "field_f2ec3ac",
     "label": "Number of Papers Published/Presented at International Level",
     "type": "number",
     "required": true
    },
    {
     "id": "field_365dcb9",
     "label": "Publication/Presentation Details",
     "type": "text",
     "required": false,
     "placeholder": "(name of journal/conference, year, Publication Link, etc.)"
    },
    {
     "id": "field_5afcbec",
     "label": "Other Co-Curricular Activities",
     "type": "text",
     "required": false,
     "placeholder": "Details (name of the activity, level of participation, year, achievements)"
    }
   ]
  },
  {
   "title": "About you",
   "fields": [
    {
     "id": "field_7f8eea5",
     "label": "Why are you interested in this internship?",
     "type": "textarea",
     "required": true
    },
    {
     "id": "field_ebc3e92",
     "label": "What skills and experiences do you bring to our law firm?",
     "type": "textarea",
     "required": true
    },
    {
     "id": "field_7b6c8dd",
     "label": "What are your career aspirations in the field of law?",
     "type": "textarea",
     "required": true
    },
    {
     "id": "field_172f410",
     "label": "Any other relevant information or experiences you would like to share",
     "type": "textarea",
     "required": true
    }
   ]
  },
  {
   "title": "Documents",
   "fields": [
    {
     "id": "field_467890a",
     "label": "Upload Your CV",
     "type": "file",
     "required": true
    }
   ]
  }
 ],
 "confirm": {
  "id": "field_2995068",
  "label": "I confirm that all information provided is accurate to the best of my knowledge. Any misrepresentation may result in disqualification of my application.",
  "required": true
 }
};

export const JOB_FORM = {
 "sections": [
  {
   "title": "Personal details",
   "fields": [
    {
     "id": "field_a05e675",
     "label": "Full Name",
     "type": "text",
     "required": true,
     "placeholder": "Enter Your Full Name"
    },
    {
     "id": "field_24e17ab",
     "label": "Date of Birth",
     "type": "date",
     "required": true,
     "placeholder": "Date of Birth"
    },
    {
     "id": "field_215107f",
     "label": "Address",
     "type": "text",
     "required": true,
     "placeholder": "Enter Your Address"
    },
    {
     "id": "field_2ac0f87",
     "label": "Email Address",
     "type": "email",
     "required": true
    },
    {
     "id": "field_950b1da",
     "label": "Mobile Number (do not enter +91)",
     "type": "tel",
     "required": true
    },
    {
     "id": "field_4605093",
     "label": "Job ID",
     "type": "text",
     "required": false,
     "placeholder": "Applicable only If applying against any available vacancy posted on our career page (If Not enter N/A)"
    }
   ]
  },
  {
   "title": "SSLC / SSC",
   "fields": [
    {
     "id": "field_3bf37c8",
     "label": "Board",
     "type": "select",
     "required": true,
     "options": [
      "BSE Odisha - Board of Secondary Education, Odisha",
      "BSEAP - Board of Secondary Education, Andhra Pradesh",
      "BSEB - Bihar School Examination Board",
      "BSEM - Board of Secondary Education, Manipur",
      "BSER - Board of Secondary Education, Rajasthan",
      "CBSE - Central Board of Secondary Education",
      "CGBSE - Chhattisgarh Board of Secondary Education",
      "DSEAP - Directorate of School Education, Arunachal Pradesh",
      "GBSHSE - Goa Board of Secondary & Higher Secondary Education",
      "GSEB - Gujarat Secondary and Higher Secondary Education Board",
      "HBSE - Haryana Board of School Education",
      "HPBOSE - Himachal Pradesh Board of School Education",
      "IB MYP - International Baccalaureate Middle Years Programme",
      "ICSE - Indian Certificate of Secondary Education (CISCE)",
      "IGCSE - International General Certificate of Secondary Education (Cambridge)",
      "JAC - Jharkhand Academic Council",
      "KBPE - Kerala Board of Public Examinations",
      "KSEEB - Karnataka Secondary Education Examination Board",
      "MBOSE - Meghalaya Board of School Education",
      "MBSE - Mizoram Board of School Education",
      "MPBSE - Madhya Pradesh Board of Secondary Education",
      "MSBSHSE - Maharashtra State Board of Secondary and Higher Secondary Education",
      "NBSE - Nagaland Board of School Education",
      "NIOS - National Institute of Open Schooling",
      "PSEB - Punjab School Education Board",
      "SBSE - Sikkim Board of Secondary Education",
      "SEBA - Board of Secondary Education, Assam",
      "TBSE - Telangana Board of Secondary Education",
      "TBSE - Tripura Board of Secondary Education",
      "TNBSE - Tamil Nadu State Board",
      "UBSE - Uttarakhand Board of School Education",
      "UPMSP - Uttar Pradesh Board of High School and Intermediate Education",
      "WBBSE - West Bengal Board of Secondary Education",
      "Other"
     ]
    },
    {
     "id": "field_648571c",
     "label": "Institute",
     "type": "text",
     "required": true,
     "placeholder": "SSL/SSC"
    },
    {
     "id": "field_c9c81d6",
     "label": "Year of Passing",
     "type": "text",
     "required": true
    },
    {
     "id": "field_9bf14de",
     "label": "Percentage/CGPA",
     "type": "text",
     "required": true
    },
    {
     "id": "field_e03e116",
     "label": "Out of",
     "type": "text",
     "required": true
    }
   ]
  },
  {
   "title": "HSC",
   "fields": [
    {
     "id": "field_d3137c9",
     "label": "University/Board",
     "type": "select",
     "required": true,
     "options": [
      "BSE Odisha - Board of Secondary Education, Odisha",
      "BSEAP - Board of Secondary Education, Andhra Pradesh",
      "BSEB - Bihar School Examination Board",
      "BSEM - Board of Secondary Education, Manipur",
      "BSER - Board of Secondary Education, Rajasthan",
      "CBSE - Central Board of Secondary Education",
      "CGBSE - Chhattisgarh Board of Secondary Education",
      "DSEAP - Directorate of School Education, Arunachal Pradesh",
      "GBSHSE - Goa Board of Secondary & Higher Secondary Education",
      "GSEB - Gujarat Secondary and Higher Secondary Education Board",
      "HBSE - Haryana Board of School Education",
      "HPBOSE - Himachal Pradesh Board of School Education",
      "IB MYP - International Baccalaureate Middle Years Programme",
      "ICSE - Indian Certificate of Secondary Education (CISCE)",
      "IGCSE - International General Certificate of Secondary Education (Cambridge)",
      "JAC - Jharkhand Academic Council",
      "KBPE - Kerala Board of Public Examinations",
      "KSEEB - Karnataka Secondary Education Examination Board",
      "MBOSE - Meghalaya Board of School Education",
      "MBSE - Mizoram Board of School Education",
      "MPBSE - Madhya Pradesh Board of Secondary Education",
      "MSBSHSE - Maharashtra State Board of Secondary and Higher Secondary Education",
      "NBSE - Nagaland Board of School Education",
      "NIOS - National Institute of Open Schooling",
      "PSEB - Punjab School Education Board",
      "SBSE - Sikkim Board of Secondary Education",
      "SEBA - Board of Secondary Education, Assam",
      "TBSE - Telangana Board of Secondary Education",
      "TBSE - Tripura Board of Secondary Education",
      "TNBSE - Tamil Nadu State Board",
      "UBSE - Uttarakhand Board of School Education",
      "UPMSP - Uttar Pradesh Board of High School and Intermediate Education",
      "WBBSE - West Bengal Board of Secondary Education",
      "Other"
     ]
    },
    {
     "id": "field_a02da44",
     "label": "Institute",
     "type": "text",
     "required": true,
     "placeholder": "SSL/SSC"
    },
    {
     "id": "field_7d373a4",
     "label": "Year of Passing",
     "type": "text",
     "required": true
    },
    {
     "id": "field_7fd03f1",
     "label": "Percentage/CGPA",
     "type": "text",
     "required": true
    },
    {
     "id": "field_a462bf4",
     "label": "Out of",
     "type": "text",
     "required": true
    }
   ]
  },
  {
   "title": "Graduation",
   "fields": [
    {
     "id": "field_455f987e",
     "label": "Qualification",
     "type": "select",
     "required": true,
     "options": [
      "3 Year LLB Program",
      "5 Year Integrated LLB Program",
      "Bachelor of Arts (Economics)",
      "Bachelor of Arts (English)",
      "Bachelor of Arts (General)",
      "Bachelor of Arts (Geography)",
      "Bachelor of Arts (History)",
      "Bachelor of Arts (Philosophy)",
      "Bachelor of Arts (Political Science)",
      "Bachelor of Arts (Psychology)",
      "Bachelor of Arts (Sociology)",
      "Bachelor of Business Administration (Entrepreneurship)",
      "Bachelor of Business Administration (Finance)",
      "Bachelor of Business Administration (General)",
      "Bachelor of Business Administration (Human Resource Management)",
      "Bachelor of Business Administration (Marketing)",
      "Bachelor of Business Economics (BBE)",
      "Bachelor of Commerce (Accounting and Finance)",
      "Bachelor of Commerce (Computer Applications)",
      "Bachelor of Commerce (General)",
      "Bachelor of Commerce (International Business)",
      "Bachelor of Dental Surgery (BDS)",
      "Bachelor of Design (BDes)",
      "Bachelor of Design (BDes) Fashion Design",
      "Bachelor of Design (BDes) Graphic Design",
      "Bachelor of Design (BDes) Interior Design",
      "Bachelor of Education (BEd)",
      "Bachelor of Engineering (BE)",
      "Bachelor of Engineering (BE) Biotechnology",
      "Bachelor of Engineering (BE) Chemical Engineering",
      "Bachelor of Engineering (BE) Civil Engineering",
      "Bachelor of Engineering (BE) Computer Science",
      "Bachelor of Engineering (BE) Electrical Engineering",
      "Bachelor of Engineering (BE) Electronics and Communication",
      "Bachelor of Engineering (BE) Mechanical Engineering",
      "Bachelor of Events Management (BEM)",
      "Bachelor of Fine Arts (BFA)",
      "Bachelor of Hotel Management (BHM)",
      "Bachelor of Journalism and Mass Communication (BJMC)",
      "Bachelor of Management Studies (Entrepreneurship)",
      "Bachelor of Management Studies (Finance)",
      "Bachelor of Management Studies (General)",
      "Bachelor of Management Studies (Human Resource Management)",
      "Bachelor of Management Studies (Marketing)",
      "Bachelor of Mass Media (BMM)",
      "Bachelor of Medicine, Bachelor of Surgery (MBBS)",
      "Bachelor of Pharmacy (BPharm)",
      "Bachelor of Physiotherapy (BPT)",
      "Bachelor of Science (Biology)",
      "Bachelor of Science (BSc)",
      "Bachelor of Science (Chemistry)",
      "Bachelor of Science (Computer Science)",
      "Bachelor of Science (Environmental Science)",
      "Bachelor of Science (Mathematics)",
      "Bachelor of Science (Physics)",
      "Bachelor of Science in Agriculture (BSc Agriculture)",
      "Bachelor of Science in Nursing (BSc Nursing)",
      "Bachelor of Social Work (BSW)",
      "Bachelor of Technology (BTech)",
      "Bachelor of Technology (BTech) Biotechnology",
      "Bachelor of Technology (BTech) Chemical Engineering",
      "Bachelor of Technology (BTech) Civil Engineering",
      "Bachelor of Technology (BTech) Computer Science",
      "Bachelor of Technology (BTech) Electrical Engineering",
      "Bachelor of Technology (BTech) Electronics and Communication",
      "Bachelor of Technology (BTech) Mechanical Engineering",
      "Bachelor of Tourism Management (BTM)",
      "Other"
     ]
    },
    {
     "id": "field_308de39",
     "label": "If Any Other",
     "type": "text",
     "required": false,
     "placeholder": "Qualification",
     "showIf": {
      "id": "field_455f987e",
      "eq": "Other"
     }
    },
    {
     "id": "field_b886693",
     "label": "Institute",
     "type": "text",
     "required": true,
     "placeholder": "Please Enter Full Name"
    },
    {
     "id": "field_43c4836",
     "label": "Year of Passing",
     "type": "text",
     "required": true
    },
    {
     "id": "field_ff02572",
     "label": "%/CGPA",
     "type": "text",
     "required": true
    },
    {
     "id": "field_f06bd09",
     "label": "Out of",
     "type": "text",
     "required": true
    }
   ]
  },
  {
   "title": "Post graduation (optional)",
   "fields": [
    {
     "id": "field_64c009e",
     "label": "Qualification",
     "type": "select",
     "required": false,
     "options": [
      "Master of Arts (Creative Writing)",
      "Master of Arts (Economics)",
      "Master of Arts (English)",
      "Master of Arts (Geography)",
      "Master of Arts (History)",
      "Master of Arts (MA)",
      "Master of Arts (Media Studies)",
      "Master of Arts (Philosophy)",
      "Master of Arts (Political Science)",
      "Master of Arts (Psychology)",
      "Master of Arts (Sociology)",
      "Master of Business Administration (MBA)",
      "Master of Business Administration (MBA) Business Analytics",
      "Master of Business Administration (MBA) Entrepreneurship",
      "Master of Business Administration (MBA) Finance",
      "Master of Business Administration (MBA) General Management",
      "Master of Business Administration (MBA) Human Resource Management",
      "Master of Business Administration (MBA) Information Technology Management",
      "Master of Business Administration (MBA) Marketing",
      "Master of Business Administration (MBA) Operations",
      "Master of Business Administration (MBA) Supply Chain Management",
      "Master of Business Economics (MBE)",
      "Master of Commerce (MCom) Accounting and Finance",
      "Master of Commerce (MCom) General",
      "Master of Commerce (MCom) International Business",
      "Master of Dental Surgery (MDS)",
      "Master of Design (MDes)",
      "Master of Design (MDes) Fashion Design",
      "Master of Design (MDes) Graphic Design",
      "Master of Design (MDes) Industrial Design",
      "Master of Design (MDes) Interior Design",
      "Master of Education (MEd)",
      "Master of Engineering (ME)",
      "Master of Engineering (ME) Biotechnology",
      "Master of Engineering (ME) Chemical Engineering",
      "Master of Engineering (ME) Civil Engineering",
      "Master of Engineering (ME) Computer Science",
      "Master of Engineering (ME) Electrical Engineering",
      "Master of Engineering (ME) Electronics and Communication",
      "Master of Engineering (ME) Mechanical Engineering",
      "Master of Events Management (MEM)",
      "Master of Fine Arts (MFA)",
      "Master of Hotel Management (MHM)",
      "Master of Journalism and Mass Communication (MJMC)",
      "Master of Laws (LLM)",
      "Master of Mass Media (MMM)",
      "Master of Medicine (MD) General Medicine",
      "Master of Medicine (MD) Obstetrics and Gynecology",
      "Master of Medicine (MD) Pediatrics",
      "Master of Medicine (MD) Surgery",
      "Master of Pharmacy (MPharm)",
      "Master of Physiotherapy (MPT)",
      "Master of Public Administration (MPA)",
      "Master of Science (MSc)",
      "Master of Science (MSc) Biology",
      "Master of Science (MSc) Biotechnology",
      "Master of Science (MSc) Chemistry",
      "Master of Science (MSc) Computer Science",
      "Master of Science (MSc) Environmental Science",
      "Master of Science (MSc) Mathematics",
      "Master of Science (MSc) Microbiology",
      "Master of Science (MSc) Physics",
      "Master of Science in Agriculture (MSc Agriculture)",
      "Master of Science in Nursing (MSc Nursing)",
      "Master of Social Work (MSW)",
      "Master of Surgery (MS)",
      "Master of Technology (MTech)",
      "Master of Technology (MTech) Biotechnology",
      "Master of Technology (MTech) Chemical Engineering",
      "Master of Technology (MTech) Civil Engineering",
      "Master of Technology (MTech) Computer Science",
      "Master of Technology (MTech) Electrical Engineering",
      "Master of Technology (MTech) Electronics and Communication",
      "Master of Technology (MTech) Mechanical Engineering",
      "Master of Tourism Management (MTM)",
      "Post Graduate Diploma in Management (PGDM)",
      "Other"
     ]
    },
    {
     "id": "field_c53eaf5",
     "label": "If Any Other",
     "type": "text",
     "required": false,
     "placeholder": "Qualification",
     "showIf": {
      "id": "field_64c009e",
      "eq": "Other"
     }
    },
    {
     "id": "field_5e31f8d",
     "label": "Institute",
     "type": "text",
     "required": false,
     "placeholder": "Please Enter Full Name"
    },
    {
     "id": "field_d6152af",
     "label": "Year of Passing",
     "type": "text",
     "required": false
    },
    {
     "id": "field_14657b3",
     "label": "%/CGPA",
     "type": "text",
     "required": false
    },
    {
     "id": "field_eb96345",
     "label": "Out of",
     "type": "text",
     "required": false
    }
   ]
  },
  {
   "title": "Ph.D (optional)",
   "fields": [
    {
     "id": "field_cd6dbf7",
     "label": "Qualification",
     "type": "select",
     "required": false,
     "options": [
      "PhD in Law",
      "PhD in Biology",
      "PhD in Biotechnology",
      "PhD in Business Economics",
      "PhD in Chemistry",
      "PhD in Commerce",
      "PhD in Computer Science",
      "PhD in Design",
      "PhD in Economics",
      "PhD in Education",
      "PhD in Engineering (Biotechnology)",
      "PhD in Engineering (Chemical Engineering)",
      "PhD in Engineering (Civil Engineering)",
      "PhD in Engineering (Computer Science)",
      "PhD in Engineering (Electrical Engineering)",
      "PhD in Engineering (Electronics and Communication)",
      "PhD in Engineering (Mechanical Engineering)",
      "PhD in English",
      "PhD in Environmental Science",
      "PhD in Events Management",
      "PhD in Fine Arts",
      "PhD in Geography",
      "PhD in History",
      "PhD in Hospitality Management",
      "PhD in Management (Business Analytics)",
      "PhD in Management (Entrepreneurship)",
      "PhD in Management (Finance)",
      "PhD in Management (General Management)",
      "PhD in Management (Human Resource Management)",
      "PhD in Management (Marketing)",
      "PhD in Management (Operations)",
      "PhD in Mass Communication",
      "PhD in Mathematics",
      "PhD in Media Studies",
      "PhD in Medical Science",
      "PhD in Microbiology",
      "PhD in Nursing",
      "PhD in Philosophy",
      "PhD in Physics",
      "PhD in Political Science",
      "PhD in Psychology",
      "PhD in Public Administration",
      "PhD in Public Health",
      "PhD in Social Work",
      "PhD in Sociology",
      "PhD in Technology",
      "Other"
     ]
    },
    {
     "id": "field_3762792",
     "label": "If Any Other",
     "type": "text",
     "required": false,
     "placeholder": "Qualification",
     "showIf": {
      "id": "field_cd6dbf7",
      "eq": "Other"
     }
    },
    {
     "id": "field_61dc0ea",
     "label": "Institute",
     "type": "text",
     "required": false,
     "placeholder": "Please Enter Full Name"
    },
    {
     "id": "field_bb2e4b0",
     "label": "Year of Passing",
     "type": "text",
     "required": false
    },
    {
     "id": "field_1ee4f58",
     "label": "%/CGPA",
     "type": "text",
     "required": false
    },
    {
     "id": "field_3ca3613",
     "label": "Out of",
     "type": "text",
     "required": false
    }
   ]
  },
  {
   "title": "Certification (optional)",
   "fields": [
    {
     "id": "field_8f0dd5b",
     "label": "Qualification",
     "type": "select",
     "required": false,
     "options": [
      "Microsoft Certified Professional (MCP)",
      "Microsoft Certified Systems Administrator (MCSA)",
      "Certified Novell Engineer",
      "Cerified Energy Auditor",
      "Cerified Boiler Operation",
      "IBM",
      "SAP",
      "Project Management Professional-PMP",
      "Cisco Certified Network Associate",
      "Certification from IIBF",
      "BRS",
      "Chartered Financial Analyst (CFA)",
      "Company Secretaries",
      "Company Secretary (CS)",
      "Entreprenership and Economics (Business)",
      "Executive MBA",
      "F.Y.B.COM",
      "FY B.Sc.",
      "Graduate Diploma in Business Administration",
      "HDSM",
      "ICWA",
      "Lean Six Sigma Green Belt",
      "PH.D",
      "S.Y.B.COM",
      "SAP FICO",
      "Certification from CCFA",
      "Diploma in Pharm",
      "Diploma in Taxation Management",
      "Solicitor",
      "Other"
     ]
    },
    {
     "id": "field_fa8c862",
     "label": "If Any Other",
     "type": "text",
     "required": false,
     "placeholder": "Qualification",
     "showIf": {
      "id": "field_8f0dd5b",
      "eq": "Other"
     }
    },
    {
     "id": "field_c6f0cd2",
     "label": "Institute",
     "type": "text",
     "required": false,
     "placeholder": "Please Enter Full Name"
    },
    {
     "id": "field_d2fccdd",
     "label": "Year of Passing",
     "type": "text",
     "required": false
    },
    {
     "id": "field_f84a13d",
     "label": "%/CGPA",
     "type": "text",
     "required": false
    },
    {
     "id": "field_5dca10e",
     "label": "Out of",
     "type": "text",
     "required": false
    }
   ]
  },
  {
   "title": "Role you are applying for",
   "fields": [
    {
     "id": "field_d374fea",
     "label": "Applying For",
     "type": "select",
     "required": true,
     "options": [
      "Legal",
      "Support Function"
     ]
    },
    {
     "id": "field_9f4cdcf",
     "label": "Function Applying for",
     "type": "select",
     "required": true,
     "options": [
      "Accounts",
      "Human Resource",
      "Executive Assistant",
      "Administration",
      "Front Office Executive",
      "IT Department",
      "Business Development",
      "Knowledge Management",
      "Corporate Communication",
      "Clerk"
     ],
     "showIf": {
      "id": "field_d374fea",
      "eq": "Support Function"
     }
    },
    {
     "id": "field_bc3c285",
     "label": "Position for which you're applying",
     "type": "select",
     "required": true,
     "options": [
      "Associate Level 0 (Fresher)",
      "Associate",
      "Senior Associate",
      "Principal Associate",
      "Associate Partner",
      "Partner"
     ]
    },
    {
     "id": "field_4df0e51",
     "label": "Primary Practice Area",
     "type": "select",
     "required": true,
     "options": [
      "Antitrust and Competition",
      "Capital Markets",
      "Dispute Resolution -Arbitration & Litigation",
      "Banking and Finance",
      "Corporate and M&A",
      "International Trade",
      "Labour and Employment",
      "Pharmaceutical, Life Sciences and Healthcare",
      "Private Equity and Venture Capital",
      "Projects, Infrastructure and Energy",
      "Real Estate and Construction",
      "Restructuring and Insolvency",
      "Media and Entertainment",
      "Sports and Gaming",
      "Fintech and Financial Services Regulatory",
      "Data Protection",
      "White Collar Crime",
      "Intellectual Property Rights"
     ],
     "showIf": {
      "id": "field_d374fea",
      "eq": "Legal"
     }
    },
    {
     "id": "field_dfc2789",
     "label": "Other practice areas (if any)",
     "type": "text",
     "required": false,
     "placeholder": "Please Enter Only Name of Practice Area",
     "showIf": {
      "id": "field_d374fea",
      "eq": "Legal"
     }
    }
   ]
  },
  {
   "title": "Experience & compensation",
   "fields": [
    {
     "id": "field_fd9ecff",
     "label": "Name of current organization",
     "type": "text",
     "required": false
    },
    {
     "id": "field_f3906b0",
     "label": "Current Designation",
     "type": "text",
     "required": false
    },
    {
     "id": "field_f6b9f9f",
     "label": "Total Years Of Experience",
     "type": "text",
     "required": true,
     "placeholder": "Ex: 3 Years and 6 months ",
     "showIf": {
      "id": "field_d374fea",
      "any": true
     }
    },
    {
     "id": "field_863f58f",
     "label": "Joining Date of current Organization",
     "type": "date",
     "required": false
    },
    {
     "id": "field_c65f452",
     "label": "Name of Previous organization",
     "type": "text",
     "required": false
    },
    {
     "id": "field_07328d2",
     "label": "Joining Date of Previous organization",
     "type": "date",
     "required": false
    },
    {
     "id": "field_132c2f5",
     "label": "Exit Date of Previous organization",
     "type": "date",
     "required": false
    },
    {
     "id": "field_bff1b8c",
     "label": "Career break (if any) — from",
     "type": "text",
     "required": false,
     "placeholder": "From "
    },
    {
     "id": "field_1c077df",
     "label": "Career break (if any) — till",
     "type": "text",
     "required": false,
     "placeholder": "Till"
    },
    {
     "id": "field_3922270",
     "label": "Nature of current employment",
     "type": "select",
     "required": false,
     "options": [
      "Retainer",
      "Employee"
     ]
    },
    {
     "id": "field_02fd264",
     "label": "Fixed Component of your current annual CTC",
     "type": "number",
     "required": false,
     "placeholder": "(Ex. 1 Lakh 50 Thousand will be written as 150000)"
    },
    {
     "id": "field_dea8e9c",
     "label": "Variable component of your current annual CTC",
     "type": "number",
     "required": false,
     "placeholder": "(Ex. 1 Lakh 50 Thousand will be written as 150000)"
    }
   ]
  },
  {
   "title": "Documents",
   "fields": [
    {
     "id": "field_a48074f",
     "label": "Upload your CV",
     "type": "file",
     "required": true
    }
   ]
  }
 ],
 "confirm": {
  "id": "field_51c20b1",
  "label": "I confirm that all information provided is accurate to the best of my knowledge. I consent to processing my data for recruitment purposes. Any misrepresentation may result in disqualification or termination of employment.",
  "required": true
 }
};
