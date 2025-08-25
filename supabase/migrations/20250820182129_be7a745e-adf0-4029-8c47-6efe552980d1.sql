-- Add RLS policies for user_roles table so users can read their own roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own roles
CREATE POLICY "Users can read their own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- Allow admins to read all roles
CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));