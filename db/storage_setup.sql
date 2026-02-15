-- Create the "drinks" bucket
insert into storage.buckets (id, name, public)
values ('drinks', 'drinks', true)
on conflict (id) do nothing;

-- Create policy to allow public access to images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'drinks' );

-- Create policy to allow authenticated users to upload images
create policy "Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'drinks' );

-- Create policy to allow authenticated users to update images
create policy "Authenticated Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'drinks' );
