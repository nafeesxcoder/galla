// ===========================================================================
// GST STATE CODES
// ---------------------------------------------------------------------------
// The first two digits of a GSTIN. This one field decides CGST+SGST versus
// IGST on every invoice the business raises, which is why the shop setup
// form will not let it be skipped.
//
// The backend has the same list and checks it again - this copy is only so
// the dropdown can be drawn without a round trip.
// ===========================================================================

export const STATES = [
  ["01", "Jammu and Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["04", "Chandigarh"], ["05", "Uttarakhand"], ["06", "Haryana"],
  ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"],
  ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"],
  ["19", "West Bengal"], ["20", "Jharkhand"], ["21", "Odisha"],
  ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["26", "Dadra and Nagar Haveli and Daman and Diu"], ["27", "Maharashtra"],
  ["29", "Karnataka"], ["30", "Goa"], ["31", "Lakshadweep"],
  ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"],
  ["35", "Andaman and Nicobar Islands"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["38", "Ladakh"], ["97", "Other Territory"],
];

export const INDUSTRIES = [
  ["grocery-store", "Grocery store"],
  ["supermarket", "Supermarket"],
  ["pharmacy", "Pharmacy"],
  ["jewellery-store", "Jewellery store"],
  ["cloth-and-garments", "Cloth and garments"],
  ["electronics-store", "Electronics store"],
  ["restaurant", "Restaurant or cafe"],
  ["hardware-and-paint", "Hardware and paint"],
  ["mobile-shop", "Mobile shop"],
  ["salon-and-spa", "Salon or spa"],
  ["wholesale-and-distribution", "Wholesale and distribution"],
  ["manufacturing", "Manufacturing"],
  ["other", "Something else"],
];
