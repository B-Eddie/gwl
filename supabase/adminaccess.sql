DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;

-- Create a policy allowing your admin to read all attendance records
CREATE POLICY "Admins can view all attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  -- Replace with your actual admin email
  -- Or checking a role if you have roles in your database
  (auth.jwt() ->> 'email') = 'email'
);