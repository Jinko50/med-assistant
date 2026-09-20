// Build identifier shown in the interface so the family can confirm which
// download they are running. Stamped by tools/package-windows.ps1.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.4.0-dev';
