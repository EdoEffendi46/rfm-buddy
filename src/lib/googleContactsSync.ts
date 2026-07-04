// PLACEHOLDER: Ganti dengan real Google People API call setelah OAuth app terverifikasi.
// Real implementation nanti butuh:
//   1. OAuth 2.0 consent flow dengan scope https://www.googleapis.com/auth/contacts
//   2. POST ke https://people.googleapis.com/v1/people:createContact
//   3. Body berisi names, phoneNumbers sesuai format Person resource People API
// Scope ini "sensitive" — perlu Google verification sebelum dipakai banyak user.

export interface GoogleContactPayload {
  customerId: string;
  name: string;
  phone: string;
  branchName?: string;
}

export async function syncContactToGoogle(
  payload: GoogleContactPayload,
): Promise<{ success: boolean; contactId: string }> {
  // eslint-disable-next-line no-console
  console.log("[Google Contacts Placeholder] Would sync:", payload);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { success: true, contactId: `gc-${Date.now()}` };
}