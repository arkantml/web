create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  link text not null check (link ~ '^https://'),
  kategori text not null default '',
  tanggal date,
  tipe text not null check (tipe in ('foto', 'video', 'campuran')),
  jumlah text not null default '',
  deskripsi text not null default '',
  created_at timestamptz not null default now()
);

alter table public.albums enable row level security;

drop policy if exists "Public can read albums" on public.albums;
create policy "Public can read albums"
  on public.albums
  for select
  to anon, authenticated
  using (true);

grant select on public.albums to anon, authenticated;
