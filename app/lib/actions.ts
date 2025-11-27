'use server';
import { z } from 'zod';
// import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
// const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
      .number()
      .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
  });

   
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function deleteInvoice(id: string) {
    // await sql`DELETE FROM invoices WHERE id = ${id}`;
    await fetch(`http://localhost:5144/api/Invoice/${id}`, {
      method: "DELETE",
    });
    revalidatePath('/dashboard/invoices');
  }


export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
  values?: {
    customerId?: string | null;
    amount?: string | null;
    status?: string | null;
  };
};

export async function createInvoice(prevState: State, formData: FormData) {
    
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });
    if (!validatedFields.success) {
    return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',

        values: {
          customerId: String(formData.get("customerId") ?? ""),
          amount: String(formData.get("amount") ?? ""),
          status: String(formData.get("status") ?? ""),
          }
    };
    }    
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    // await sql`
    // INSERT INTO invoices (customer_id, amount, status, date)
    // VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    // `;
    const response = await fetch("http://localhost:5144/api/Invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        CustomerId: customerId,
        amount: amountInCents,  // 對應 DTO 的 Amount
        Status: status,
        Date: date,
      }),
    });
    if (!response.ok) {
      console.log(response)
      return {
        message: "Failed to create invoice from API",
      };
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

  }

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  
  const amountInCents = amount * 100;
  
  // await sql`
  //   UPDATE invoices
  //   SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
  //   WHERE id = ${id}
  // `;
  const response = await fetch(`http://localhost:5144/api/Invoice/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: customerId,
      amount: amountInCents,  // 對應 DTO 的 Amount
      status: status,
    }),
  });

  if (!response.ok) {
    return { message: "API failed to update invoice" };
  }
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}