export const CUSTOMERS = [
  { id: 1, name: "Maya Chen", task: "Review 2026 beneficiary update and prep annual policy check-in notes", avatar: "MC", accent: "#3bd4cb", status: "Action needed", email: "maya.chen@example.com" },
  { id: 2, name: "Devine Okafor", task: "Flag cash-flow sensitivity in trust distributions; generate follow-up script", avatar: "DO", accent: "#317cff", status: "Scheduled", email: "devine.okafor@example.com" },
  { id: 3, name: "Priya Nair", task: "Prepare succession file checklist and risk memo before board review", avatar: "PN", accent: "#ec5d40", status: "Action needed", email: "priya.nair@example.com" },
  { id: 4, name: "Tom Becker", task: "Confirm auto-pay authorizations and propose tax-optimization revision", avatar: "TB", accent: "#4991e5", status: "Monitoring", email: "tom.becker@example.com" },
  { id: 5, name: "Lena Fischer", task: "Queue claim documentation follow-up and alert for policy expiry", avatar: "LF", accent: "#9b69ff", status: "Action needed", email: "lena.fischer@example.com" },
  { id: 6, name: "Ray Mwangi", task: "Cross-check family trust liabilities and prepare 30-day outreach plan", avatar: "RM", accent: "#f5a524", status: "Monitoring", email: "ray.mwangi@example.com" },
  { id: 7, name: "Iris Tanaka", task: "Draft re-engagement note for stalled investment review", avatar: "IT", accent: "#22b8cf", status: "Action needed", email: "iris.tanaka@example.com" },
  { id: 8, name: "Marcus Hale", task: "Validate new beneficiary nominee and produce KYC completion checklist", avatar: "MH", accent: "#2f9e44", status: "Monitoring", email: "marcus.hale@example.com" },
  { id: 9, name: "Sofia Ruiz", task: "Surface dormant policy changes and prepare advisor talking points", avatar: "SR", accent: "#e64980", status: "Action needed", email: "sofia.ruiz@example.com" },
  { id: 10, name: "Aiden Park", task: "Compile renewal readiness summary and schedule review call", avatar: "AP", accent: "#7048e8", status: "Scheduled", email: "aiden.park@example.com" },
  { id: 11, name: "Grace Liu", task: "Review inheritance timeline and confirm guardian contact details", avatar: "GL", accent: "#fd7e14", status: "Monitoring", email: "grace.liu@example.com" },
  { id: 12, name: "Noah Schmidt", task: "Draft life-event check-in and capture updated emergency contact tree", avatar: "NS", accent: "#15aabf", status: "Action needed", email: "noah.schmidt@example.com" },
  { id: 13, name: "Yuki Sato", task: "Run sensitivity scan before proposal and lock communication constraints", avatar: "YS", accent: "#4263eb", status: "Monitoring", email: "yuki.sato@example.com" },
  { id: 14, name: "Omar Haddad", task: "Prepare quarterly retention review and next-meeting action list", avatar: "OH", accent: "#868e96", status: "Scheduled", email: "omar.haddad@example.com" },
];

export function getCustomerById(id) {
  return CUSTOMERS.find((customer) => String(customer.id) === String(id));
}
