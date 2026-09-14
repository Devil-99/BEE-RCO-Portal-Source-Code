// Dropdown options for Sector Type based on Obligated selection

export const sectorOptions = [
  { org_code: "ALM", org_name: "Aluminum", entity_type: 'INDUSTRY' },
  { org_code: "AUT", org_name: "Automobile Assembly Unit", entity_type: 'INDUSTRY' },
  { org_code: "BHT", org_name: "Commercial Building", entity_type: 'INDUSTRY' },
  { org_code: "CER", org_name: "Ceramic", entity_type: 'INDUSTRY' },
  { org_code: "CHE", org_name: "Chemicals", entity_type: 'INDUSTRY' },
  { org_code: "CMT", org_name: "Cement", entity_type: 'INDUSTRY' },
  { org_code: "CNA", org_name: "Chlor Alkali", entity_type: 'INDUSTRY' },
  { org_code: "COP", org_name: "Copper", entity_type: 'INDUSTRY' },
  { org_code: "DAI", org_name: "Dairy", entity_type: 'INDUSTRY' },
  { org_code: "DIS", org_name: "DISCOM", entity_type: 'DISCOM' },
  { org_code: "FND", org_name: "Foundry", entity_type: 'INDUSTRY' },
  { org_code: "FOR", org_name: "Forging", entity_type: 'INDUSTRY' },
  { org_code: "FTZ", org_name: "Fertilizers", entity_type: 'INDUSTRY' },
  { org_code: "GLS", org_name: "Glass", entity_type: 'INDUSTRY' },
  { org_code: "INS", org_name: "Iron and Steel", entity_type: 'INDUSTRY' },
  { org_code: "OTH", org_name: "Others", entity_type: 'NOBE' },
  { org_code: "PC", org_name: "Petrochemical", entity_type: 'INDUSTRY' },
  { org_code: "PNP", org_name: "Pulp and Paper", entity_type: 'INDUSTRY' },
  { org_code: "PRT", org_name: "Port Trust", entity_type: 'INDUSTRY' },
  { org_code: "REF", org_name: "Refinery", entity_type: 'INDUSTRY' },
  { org_code: "RFU", org_name: "Refractories Units", entity_type: 'INDUSTRY' },
  { org_code: "RLY", org_name: "Railways", entity_type: 'INDUSTRY' },
  { org_code: "SUG", org_name: "Sugar", entity_type: 'INDUSTRY' },
  { org_code: "TPP", org_name: "Thermal Power Stations", entity_type: 'INDUSTRY' },
  { org_code: "TXT", org_name: "Textile", entity_type: 'INDUSTRY' },
  { org_code: "TYR", org_name: "Tyre Manufacturer", entity_type: 'INDUSTRY' },
  { org_code: "ZNC", org_name: "Zinc", entity_type: 'INDUSTRY' },
  { org_code: "BEE", org_name: "BEE", entity_type: 'NOBE' },
  { org_code: "CEA", org_name: "CEA", entity_type: 'NOBE' },
  { org_code: "LDC", org_name: "LDC", entity_type: 'NOBE' },
  { org_code: "MOP", org_name: "MOP", entity_type: 'NOBE' },
  { org_code: "REC", org_name: "REC", entity_type: 'NOBE' },
  { org_code: "REG", org_name: "REG", entity_type: 'NOBE' },
  { org_code: "RLD", org_name: "RLD", entity_type: 'NOBE' },
  { org_code: "SRA", org_name: "SRA", entity_type: 'NOBE' },
  { org_code: "SRC", org_name: "SRC", entity_type: 'NOBE' },
];

export const organizationOptions = [
  {
    entity_type: "NOBE",
    state_code: "WB",
    organization_name: "WBSLDC",
    organization_code: "WBSL",
    sector_type: "LDC"
  },
  {
    entity_type: "NOBE",
    state_code: "WB",
    organization_name: "WBERC",
    organization_code: "WBER",
    sector_type: "SRC"
  },
  {
    entity_type: "NOBE",
    state_code: "WB",
    organization_name: "WBREDA",
    organization_code: "WBRE",
    sector_type: "SRA"
  },
  // -----------------------
  {
    entity_type: "DISCOM",
    state_code: "WB",
    organization_name: "WBSEDCL",
    organization_code: "WBSD",
    sector_type: "DIS"
  },
  {
    entity_type: "DISCOM",
    state_code: "WB",
    organization_name: "DPL Durgapur",
    organization_code: "DPLD",
    sector_type: "DIS"
  },
  {
    entity_type: "DISCOM",
    state_code: "WB",
    organization_name: "CESC Kolkata",
    organization_code: "CESK",
    sector_type: "DIS"
  },
  {
    entity_type: "NOBE",
    state_code: "OT",
    organization_name: "Northern Regional Load Dispatch Center",
    organization_code: "NRLD",
    sector_type: "RLD"
  },
];

export const stateOptions = [
  {
    "state_name": "Andhra Pradesh",
    "state_code": "AP"
  },
  {
    "state_name": "Assam",
    "state_code": "AS"
  },
  {
    "state_name": "Bihar",
    "state_code": "BR"
  },
  {
    "state_name": "Delhi",
    "state_code": "DL"
  },
  {
    "state_name": "Gujarat",
    "state_code": "GJ"
  },
  {
    "state_name": "Haryana",
    "state_code": "HR"
  },
  {
    "state_name": "Himachal Pradesh",
    "state_code": "HP"
  },
  {
    "state_name": "Jammu and Kashmir",
    "state_code": "JK"
  },
  {
    "state_name": "Karnataka",
    "state_code": "KA"
  },
  {
    "state_name": "Kerala",
    "state_code": "KL"
  },
  {
    "state_name": "Madhya Pradesh",
    "state_code": "MP"
  },
  {
    "state_name": "Maharashtra",
    "state_code": "MH"
  },
  {
    "state_name": "Odisha",
    "state_code": "OR"
  },
  {
    "state_name": "Punjab",
    "state_code": "PB"
  },
  {
    "state_name": "Rajasthan",
    "state_code": "RJ"
  },
  {
    "state_name": "Tamil Nadu",
    "state_code": "TN"
  },
  {
    "state_name": "Telangana",
    "state_code": "TG"
  },
  {
    "state_name": "Uttar Pradesh",
    "state_code": "UP"
  },
  {
    "state_name": "Uttarakhand",
    "state_code": "UK"
  },
  {
    "state_name": "West Bengal",
    "state_code": "WB"
  },
  {
    "state_name": "Others",
    "state_code": "OT"
  }
];

export const DEMO_DATA = {
  '9999999999': { otp: '123456', status: 'verified' },
  '8888888888': { otp: '123456', status: 'pending' },
  '7777777777': { otp: '123456', status: 'rejected' },
};

export const STATUS_MESSAGES = {
  400: "Bad Request. The server couldn't understand your request.",
  401: "Unauthorized. Please login to access this page.",
  403: "Forbidden. You don’t have permission to view this page.",
  404: "Page Not Found. The page you're looking for doesn’t exist.",
  500: "Internal Server Error. Something went wrong on our end.",
    503: "Service Unavailable. The server is not ready to handle the request.",
};
