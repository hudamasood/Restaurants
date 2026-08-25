import { z } from 'zod';

/** YYYY-MM-DD, and a real calendar date. */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'Not a real date');

export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM');

export const availabilityQuery = z.object({
  date: dateString,
  party: z.coerce.number().int().min(1).max(24),
});

/**
 * The booking payload. Validated here on the server as well as in the browser
 * — the client-side check is a courtesy to the guest, not a security control,
 * and anything can POST to this endpoint.
 */
export const createReservation = z.object({
  date: dateString,
  time: timeString,
  partySize: z.coerce.number().int().min(1).max(24),
  seatingArea: z.string().min(1).max(16),
  name: z.string().trim().min(2, 'Please enter a name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
  phone: z.string().trim().min(7, 'Please enter a contact number').max(40),
  occasion: z.string().trim().max(120).optional().default(''),
  dietaryNotes: z.string().trim().max(2000).optional().default(''),
  accessibilityNotes: z.string().trim().max(2000).optional().default(''),
});

export const referenceParam = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^MH-[A-Z0-9]{4}$/, 'Not a valid reference');

export type CreateReservation = z.infer<typeof createReservation>;

/**
 * Contact enquiry. `website` is a honeypot — hidden in the form, so anything
 * in it came from a bot. `startedAt` is when the form rendered, used to catch
 * submissions faster than a person can type.
 */
export const createEnquiry = z.object({
  name: z.string().trim().min(2, 'Please enter a name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
  subject: z.string().trim().min(1).max(120).optional().default('General enquiry'),
  message: z.string().trim().min(10, 'A little more detail, please').max(5000),
  website: z.string().max(200).optional().default(''),
  startedAt: z.coerce.number().int().nonnegative().optional(),
});

export type CreateEnquiry = z.infer<typeof createEnquiry>;
