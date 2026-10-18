-- ============================================================
-- MoveTalk — thư viện tài liệu
--
-- Một bucket riêng tư ('materials') cộng với bảng mô tả từng tệp.
-- Giáo viên tải lên và xoá; học viên đã được duyệt đọc và tải về.
-- Tệp không công khai: trình duyệt lấy signed URL 1 giờ.
--
-- Phần storage được bọc trong một khối kiểm tra schema, vì
-- `npm run test:sql` chạy trên một Postgres tạm không có schema
-- storage. Ở đó migration vẫn áp dụng được, chỉ bỏ phần bucket.
-- Idempotent.
-- ============================================================

create table if not exists public.materials (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(trim(title)) between 1 and 140),
  track        text,
  lesson_no    int,
  storage_path text not null unique,
  mime         text,
  size_bytes   bigint,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now()
);

create index if not exists materials_track_idx on public.materials(track, lesson_no);
create index if not exists materials_created_idx on public.materials(created_at desc);

alter table public.materials enable row level security;
grant select, insert, update, delete on public.materials to authenticated;

drop policy if exists mat_read on public.materials;
create policy mat_read on public.materials for select using (
  public.my_role() = 'teacher'
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student' and p.status = 'active'
  )
);

-- Only the teacher writes rows. The client never decides this.
drop policy if exists mat_write on public.materials;
create policy mat_write on public.materials for all
  using (public.my_role() = 'teacher')
  with check (public.my_role() = 'teacher' and created_by = auth.uid());

do $migration$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('materials', 'materials', false, 10485760)
    on conflict (id) do update set public = false, file_size_limit = 10485760;

    execute 'drop policy if exists mat_obj_read on storage.objects';
    execute $pol$create policy mat_obj_read on storage.objects for select using (
      bucket_id = 'materials' and (
        public.my_role() = 'teacher'
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'student' and p.status = 'active'
        )
      )
    )$pol$;

    execute 'drop policy if exists mat_obj_write on storage.objects';
    execute $pol$create policy mat_obj_write on storage.objects for all
      using (bucket_id = 'materials' and public.my_role() = 'teacher')
      with check (bucket_id = 'materials' and public.my_role() = 'teacher')$pol$;
  end if;
end
$migration$;
